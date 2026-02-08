# Workflow Configuration

This document defines the workflow configuration for the Ultimate AI Coding Team.

## Workflow Sequence

```
1. System Orchestrator (Entry Point)
   ├── Smart Detection
   └── Workflow Initialization
       ↓
2. Project Planner
   ├── Requirement Analysis
   ├── Context7 Research
   └── Task Breakdown
       ↓
3. Code Architect
   ├── Plan Review (Gate 1)
   ├── Architecture Design
   └── Tech Stack Selection
       ↓
4. Implementation Agent
   ├── Architecture Review (Gate 2)
   └── Code Writing
       ↓
5. Code Reviewer ←──────────────┐
   ├── Quality Analysis         │
   └── Gate 3 Check ────────────┤ Loop (max 3)
       ↓ (if pass)              │
6. Testing Agent ←──────────────┤
   ├── Test Writing             │
   └── Gate 4 Check ────────────┘ Loop (max 3)
       ↓ (if pass)
7. Documentation Agent
   ├── Doc Writing
   └── Gate 5 Check
       ↓
8. Cleanup Agent
   └── File Organization
       ↓
9. Git Agent
   └── Version Control
       ↓
10. Retrospective Agent
    ├── Analysis
    ├── Knowledge Base Update
    └── Gate 6 (Final)
        ↓
    ✅ Complete
```

## Workflow State Schema

Location: `/data/shared/workflow_state.json`

```json
{
  "workflow_id": "string (wf_YYYYMMDD_NNN)",
  "project_name": "string",
  "status": "pending | in_progress | paused | completed | failed",
  "started_at": "ISO timestamp",
  "completed_at": "ISO timestamp | null",
  "current_agent": "string (agent name)",
  "completed_agents": ["array of agent names"],
  "pending_agents": ["array of agent names"],
  "loop_counts": {
    "reviewer_implementation": "number (0-3)",
    "testing_implementation": "number (0-3)"
  },
  "max_loops": "number (default: 3)",
  "quality_scores": {
    "planning": "number | null",
    "architecture": "number | null",
    "implementation": "number | null",
    "code_review": "number | null",
    "testing": "number | null",
    "documentation": "number | null",
    "git": "number | null",
    "final": "number | null"
  },
  "human_review_required": "boolean",
  "escalation_reason": "string | null",
  "metadata": {
    "tech_stack": "object | null",
    "task_count": "number",
    "file_count": "number"
  }
}
```

## Initial State Template

```json
{
  "workflow_id": "wf_YYYYMMDD_001",
  "project_name": "",
  "status": "pending",
  "started_at": null,
  "completed_at": null,
  "current_agent": null,
  "completed_agents": [],
  "pending_agents": [
    "project-planner",
    "code-architect",
    "implementation-agent",
    "code-reviewer",
    "testing-agent",
    "documentation-agent",
    "git-agent",
    "cleanup-agent",
    "retrospective-agent"
  ],
  "loop_counts": {
    "reviewer_implementation": 0,
    "testing_implementation": 0
  },
  "max_loops": 3,
  "quality_scores": {
    "planning": null,
    "architecture": null,
    "implementation": null,
    "code_review": null,
    "testing": null,
    "documentation": null,
    "git": null,
    "final": null
  },
  "human_review_required": false,
  "escalation_reason": null,
  "metadata": {}
}
```

## Agent Transitions

### Normal Flow
| From | To | Condition |
|------|----|-----------|
| orchestrator | project-planner | Complex request detected |
| project-planner | code-architect | Plan created |
| code-architect | implementation-agent | Gate 1 passed |
| implementation-agent | code-reviewer | Code written |
| code-reviewer | testing-agent | Gate 3 passed |
| testing-agent | documentation-agent | Gate 4 passed |
| documentation-agent | cleanup-agent | Gate 5 passed |
| cleanup-agent | git-agent | Cleanup complete |
| git-agent | retrospective-agent | Changes committed |
| retrospective-agent | complete | Gate 6 passed |

### Loop Transitions
| From | To | Condition |
|------|----|-----------|
| code-reviewer | implementation-agent | Gate 3 failed, loops < 3 |
| testing-agent | implementation-agent | Gate 4 failed, loops < 3 |

### Escalation Transitions
| From | To | Condition |
|------|----|-----------|
| code-reviewer | human-review | Gate 3 failed, loops >= 3 |
| testing-agent | human-review | Gate 4 failed, loops >= 3 |
| any-agent | human-review | Confidence < 0.7 |

## Timing Configuration

### Cleanup Agent
Run Cleanup Agent after:
- Documentation Agent completes (before Git Agent)

## Workflow Gate (Required for Completion)

The **workflow gate** is the only way to mark work as complete. The agent runner MUST call:

```bash
./scripts/workflow_gate.sh strict   # or autofix
```

before accepting "done". If exit != 0, completion is refused.

| Mode | Action |
|------|--------|
| `strict` | Validate only (fail if non-canonical artifacts) |
| `autofix` | Remediate, then validate (self-correct first) |
| `dry-run-fix` | Remediation dry-run, then validate |

## Error Handling

### Log Paths (Required)
- **Errors** → `/logs/errors/[timestamp]-[agent]-[description].md` or `.json`
- **Traces** → `/logs/traces/` (append workflow steps, routing decisions)
- **Archives** → `/logs/archives/` (older logs rotated from traces/ or errors/)

### Recoverable Errors
- Network timeouts → Retry with backoff; log to `/logs/errors/` if retry fails
- Tool failures → Retry once, then log to `/logs/errors/` and continue
- Partial file writes → Detect and rewrite; log to `/logs/errors/` if unrecoverable

### Non-Recoverable Errors
- Missing dependencies → Escalate to human; write error to `/logs/errors/`
- Permission errors → Escalate to human; write error to `/logs/errors/`
- Corrupted state → Reset to last checkpoint; write trace to `/logs/traces/`, error to `/logs/errors/`

## Workflow ID Generation

Format: `wf_YYYYMMDD_NNN`

- `YYYY` - Year (4 digits)
- `MM` - Month (2 digits)
- `DD` - Day (2 digits)
- `NNN` - Sequential number (3 digits, resets daily)

Example: `wf_YYYYMMDD_NNN` (e.g. `wf_20260121_001` for first workflow of that day)

## State Persistence

### Save Points
State is saved after:
- Workflow initialization
- Each agent completion
- Each loop iteration
- Each gate evaluation
- Workflow completion

### State File
- Location: `/data/shared/workflow_state.json`
- Format: JSON
- Encoding: UTF-8

## Parallel Operations

### Allowed Parallel
- None currently (sequential workflow)

### Future Consideration
- Multiple independent tasks within a stage
- Parallel test execution
- Concurrent documentation generation

## Timeout Configuration

| Stage | Default Timeout | Extended Timeout |
|-------|-----------------|------------------|
| Planning | 5 minutes | 15 minutes |
| Architecture | 5 minutes | 15 minutes |
| Implementation | 30 minutes | 60 minutes |
| Code Review | 10 minutes | 30 minutes |
| Testing | 15 minutes | 45 minutes |
| Documentation | 10 minutes | 20 minutes |
| Git Operations | 5 minutes | 10 minutes |
| Cleanup | 5 minutes | 10 minutes |
| Retrospective | 5 minutes | 10 minutes |

Note: Timeouts are soft limits. Agents should self-monitor and request extensions if needed.
