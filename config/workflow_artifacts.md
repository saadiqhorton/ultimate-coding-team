# Canonical Workflow Artifacts (Required)

All agents MUST write only to these paths. OVERWRITE existing files. Do NOT create versioned, suffixed, or alternate filenames (e.g. *_phase2.md, *_wf_*.md).

## Task Artifacts (in /tasks/active/)

| Artifact | Canonical Path | Agent |
|----------|----------------|-------|
| Project plan | /tasks/active/project_plan.md | Project Planner |
| Implementation summary | /tasks/active/implementation_summary.md | Implementation Agent |
| Review report | /tasks/active/review_report.md | Code Reviewer |
| Review feedback | /tasks/active/review_feedback.md | Code Reviewer |
| Test feedback | /tasks/active/test_feedback.md | Testing Agent |

## Shared Data

| Artifact | Canonical Path | Agent |
|----------|----------------|-------|
| Architecture | /data/shared/architecture.md | Code Architect |

## Output Reports

| Artifact | Canonical Path | Agent |
|----------|----------------|-------|
| Test report | /output/reports/[project-name]/test_report.md | Testing Agent |
| Documentation report | /output/reports/[project-name]/documentation_report.md | Documentation Agent |
| Cleanup report | /output/reports/[project-name]/cleanup_report.md | Cleanup Agent |
| Git summary | /output/reports/[project-name]/git_summary.md | Git Agent |
| Retrospective report | /output/reports/[project-name]/retrospective_report.md | Retrospective Agent |

## Logs

| Artifact | Canonical Path | Agent | When to Use |
|----------|----------------|-------|-------------|
| Agent metrics | /logs/agent_metrics.json | Retrospective, Orchestrator | After each workflow/agent completion |
| Errors | /logs/errors/ | Any agent | Tool failures, retries, escalations, exceptions |
| Traces | /logs/traces/ | Orchestrator, agents | Workflow steps, routing decisions, transitions |
| Archives | /logs/archives/ | Cleanup, Orchestrator | Older logs rotated from traces/ or errors/ |

**REQUIRED:** When an error occurs (tool failure, retry, escalation, exception), write to `/logs/errors/[timestamp]-[agent]-[brief-description].md` or `.json`. When transitioning between agents or making routing decisions, append to `/logs/traces/`.

## Architecture Decisions

| Artifact | Canonical Path | Agent |
|----------|----------------|-------|
| ADRs | /output/architecture/[project-name]/decisions/[decision-name].md | Code Architect |

## Human Review Escalation

| Artifact | Canonical Path | Agent |
|----------|----------------|-------|
| Review required | /tasks/review/REVIEW_REQUIRED.md | Retrospective Agent |

## Commit Message Rules (Required)

Git Agent MUST follow these rules. Workflow metadata belongs in workflow_state.json and git_summary.md, NOT in git history.

**NEVER include in commit messages:**
- Workflow ID (wf_*, Workflow:, Workflow ID:)
- Co-Authored-By or AI agent attribution

**Validation:** Before committing, verify the message excludes workflow ID and Co-Authored-By.
