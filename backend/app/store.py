"""In-memory workflow run store. One active run at a time for simplicity; extend for multi-run."""
from __future__ import annotations

import threading
from datetime import datetime
from typing import Any

from app.models import WorkflowStatus


class WorkflowRun:
    """Single workflow run state."""

    def __init__(self, workflow_id: str, project_name: str | None, request: str):
        self.workflow_id = workflow_id
        self.project_name = project_name or ""
        self.request = request
        self.status = WorkflowStatus.PENDING
        self.started_at: datetime | None = None
        self.completed_at: datetime | None = None
        self.current_agent: str | None = None
        self.completed_agents: list[str] = []
        self.pending_agents: list[str] = []
        self.quality_scores: dict[str, Any] = {}
        self.loop_counts: dict[str, int] = {"reviewer_implementation": 0, "testing_implementation": 0}
        self.human_review_required = False
        self.final_score: float | None = None
        self.output_summary: str | None = None
        self.error: str | None = None
        self.raw_result: Any = None

    def to_status_dict(self) -> dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "status": self.status,
            "project_name": self.project_name or None,
            "current_agent": self.current_agent,
            "completed_agents": self.completed_agents,
            "pending_agents": self.pending_agents,
            "quality_scores": self.quality_scores,
            "loop_counts": self.loop_counts,
            "human_review_required": self.human_review_required,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "error": self.error,
        }

    def to_result_dict(self) -> dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "status": self.status,
            "final_score": self.final_score,
            "output_summary": self.output_summary,
            "completed_at": self.completed_at,
            "error": self.error,
        }


class WorkflowStore:
    """Thread-safe store for workflow runs."""

    def __init__(self) -> None:
        self._runs: dict[str, WorkflowRun] = {}
        self._lock = threading.Lock()

    def put(self, run: WorkflowRun) -> None:
        with self._lock:
            self._runs[run.workflow_id] = run

    def get(self, workflow_id: str) -> WorkflowRun | None:
        with self._lock:
            return self._runs.get(workflow_id)

    def get_or_404(self, workflow_id: str) -> WorkflowRun:
        run = self.get(workflow_id)
        if run is None:
            raise LookupError(f"Workflow {workflow_id} not found")
        return run


store = WorkflowStore()
