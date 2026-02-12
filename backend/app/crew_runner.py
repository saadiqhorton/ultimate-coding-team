"""Runs the Ultimate Coding Team CrewAI crew and updates workflow state."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime
from pathlib import Path

from app.config import settings
from app.models import WorkflowStatus
from app.store import WorkflowRun, store


def _generate_workflow_id() -> str:
    now = datetime.utcnow()
    date_part = now.strftime("%Y%m%d")
    # Simple sequence: same day same prefix
    existing = [k for k in store._runs if k.startswith(f"wf_{date_part}_")]
    n = len(existing) + 1
    return f"wf_{date_part}_{n:03d}"


def _write_workflow_state(run: WorkflowRun) -> None:
    """Persist current run to data/shared/workflow_state.json."""
    state = {
        "workflow_id": run.workflow_id,
        "project_name": run.project_name,
        "feature_name": None,
        "status": run.status,
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "final_score": run.final_score,
        "current_agent": run.current_agent,
        "completed_agents": run.completed_agents,
        "pending_agents": run.pending_agents,
        "loop_counts": run.loop_counts,
        "max_loops": getattr(settings, "max_loops", 3),
        "quality_scores": run.quality_scores,
        "human_review_required": run.human_review_required,
        "escalation_reason": run.error if run.status == WorkflowStatus.FAILED else None,
        "error": run.error,
        "metadata": {},
    }
    path = settings.shared_dir / "workflow_state.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def _run_workflow_gate(mode: str = "autofix") -> tuple[bool, str]:
    """Run scripts/workflow_gate.sh; return (success, message)."""
    script = settings.scripts_dir / "workflow_gate.sh"
    if not script.exists():
        return True, "workflow_gate.sh not found; skipping."
    try:
        out = subprocess.run(
            [str(script), mode],
            cwd=str(settings.workspace_root),
            capture_output=True,
            text=True,
            timeout=120,
        )
        if out.returncode == 0:
            return True, out.stdout or "Gate passed."
        return False, out.stderr or out.stdout or f"Exit code {out.returncode}"
    except subprocess.TimeoutExpired:
        return False, "Workflow gate timed out."
    except Exception as e:
        return False, str(e)


def run_workflow(workflow_id: str, request: str, project_name: str | None) -> None:
    """
    Execute the coding crew for the given request. Runs in the caller's thread.
    Updates the stored WorkflowRun and writes workflow_state.json.
    """
    run = store.get(workflow_id)
    if not run:
        return
    run.status = WorkflowStatus.IN_PROGRESS
    run.started_at = datetime.utcnow()
    run.pending_agents = [
        "project-planner",
        "code-architect",
        "implementation-agent",
        "code-reviewer",
        "testing-agent",
        "documentation-agent",
        "cleanup-agent",
        "git-agent",
        "retrospective-agent",
    ]
    run.completed_agents = []
    _write_workflow_state(run)

    try:
        from app.telemetry import setup_phoenix_if_configured
        setup_phoenix_if_configured()

        from app.crew.definition import get_coding_crew

        crew = get_coding_crew()
        inputs = {"request": request, "project_name": project_name or "default"}
        result = crew.kickoff(inputs=inputs)
        run.raw_result = result

        # Map CrewAI result back to our state
        if hasattr(result, "output") and result.output:
            run.output_summary = str(result.output) if not isinstance(result.output, str) else result.output
        run.completed_agents = run.pending_agents[:]
        run.pending_agents = []
        run.current_agent = None
        run.final_score = 90.0  # Placeholder; derive from result if available
        run.completed_at = datetime.utcnow()
        run.status = WorkflowStatus.COMPLETED

        # Run workflow gate
        gate_ok, gate_msg = _run_workflow_gate("autofix")
        if not gate_ok:
            run.status = WorkflowStatus.FAILED
            run.error = f"Workflow gate failed: {gate_msg}"
    except Exception as e:
        run.status = WorkflowStatus.FAILED
        run.completed_at = datetime.utcnow()
        run.error = str(e)
        _log_workflow_error(workflow_id, e)
    finally:
        _write_workflow_state(run)


def _log_workflow_error(workflow_id: str, exc: Exception) -> None:
    """Write failure details to logs/errors/ for debugging."""
    err_dir = settings.logs_dir / "errors"
    err_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    path = err_dir / f"{ts}-{workflow_id}-error.md"
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"# Workflow error: {workflow_id}\n\n")
        f.write(f"**Time:** {ts}\n\n")
        f.write(f"**Exception:** {type(exc).__name__}\n\n")
        f.write("```\n")
        f.write(str(exc))
        f.write("\n```\n")
    try:
        import traceback
        with open(path, "a", encoding="utf-8") as f:
            f.write("\n## Traceback\n\n```\n")
            traceback.print_exc(file=f)
            f.write("```\n")
    except Exception:
        pass


def start_workflow_background(request: str, project_name: str | None) -> str:
    """Create a run and start execution in a background thread. Returns workflow_id."""
    workflow_id = _generate_workflow_id()
    run = WorkflowRun(workflow_id=workflow_id, project_name=project_name, request=request)
    store.put(run)

    import threading

    thread = threading.Thread(target=run_workflow, args=(workflow_id, request, project_name), daemon=True)
    thread.start()
    return workflow_id
