# GEMINI.md - Gemini CLI Instructions

Instructions for Gemini CLI when working in the Ultimate AI Coding Team workspace.

---

## About This Workspace

This is a production-grade AI coding team system with 10 specialized agents. The system uses file-based coordination, making it compatible with any AI tool including Gemini CLI.

---

## Quick Start

### Step 1: Determine Task Complexity

**Use Full Workflow When:**
- Building new features
- Making multi-file changes
- Refactoring code
- API development
- Database changes
- Security-related work

**Skip Full Workflow When:**
- Single-line typo fixes
- Simple renames
- Documentation-only updates
- Explaining code
- Git status checks

### Step 2: For Complex Tasks

1. **Read the orchestrator**:
   ```
   cat skills/system-orchestrator/SKILL.md
   ```

2. **Check current workflow state**:
   ```
   cat data/shared/workflow_state.json
   ```

3. **Read knowledge base**:
   ```
   cat data/knowledge_base/lessons_learned.md
   cat data/knowledge_base/coding_standards.md
   cat data/knowledge_base/common_mistakes.md
   ```

4. **Initialize workflow** by updating state file

5. **Follow agent sequence** in order

---

## Agent Sequence

Execute agents in this order:

```
1. Project Planner     → Read skills/project-planner/SKILL.md
2. Code Architect      → Read skills/code-architect/SKILL.md
3. Implementation      → Read skills/implementation-agent/SKILL.md
4. Code Reviewer       → Read skills/code-reviewer/SKILL.md
5. Testing Agent       → Read skills/testing-agent/SKILL.md
6. Documentation       → Read skills/documentation-agent/SKILL.md
7. Git Agent           → Read skills/git-agent/SKILL.md
8. Cleanup Agent       → Read skills/cleanup-agent/SKILL.md
9. Retrospective       → Read skills/retrospective-agent/SKILL.md
```

---

## Key Files

| File | Description | Command |
|------|-------------|---------|
| Orchestrator | Main entry point | `cat skills/system-orchestrator/SKILL.md` |
| Workflow State | Current status | `cat data/shared/workflow_state.json` |
| Quality Gates | Thresholds | `cat config/quality_gates.md` |
| Agent Rules | Usage guide | `cat AGENTS.md` |

---

## Self-Correction Loops

### Code Review Loop
If Code Reviewer scores < 85:
1. Create feedback file: `tasks/active/review_feedback.md`
2. Return to Implementation Agent
3. Implementation fixes issues
4. Return to Code Reviewer
5. Maximum 3 iterations

### Testing Loop
If tests fail or coverage < 80%:
1. Create feedback file: `tasks/active/test_feedback.md`
2. Return to Implementation Agent
3. Implementation fixes issues
4. Return to Testing Agent
5. Maximum 3 iterations

### After 3 Failures
Create escalation file: `tasks/review/REVIEW_REQUIRED_[timestamp].md`

---

## Workflow State Management

### Initialize New Workflow

Update `data/shared/workflow_state.json`:

```json
{
  "workflow_id": "wf_YYYYMMDD_001",
  "project_name": "my-project",
  "status": "in_progress",
  "started_at": "2026-01-21T10:00:00Z",
  "current_agent": "project-planner",
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
  "quality_scores": {},
  "human_review_required": false,
  "escalation_reason": null
}
```

### After Each Agent

1. Move agent from `pending_agents` to `completed_agents`
2. Update `current_agent` to next agent
3. Add quality score to `quality_scores`
4. Update `status` if needed

---

## Quality Gates

| Stage | Threshold | What Happens if Fail |
|-------|-----------|----------------------|
| Planning | >= 85 | Return to Planner |
| Architecture | >= 90 | Return to Architect |
| Code Quality | >= 85 | Loop to Implementation (max 3) |
| Testing | 100% pass, 80% coverage | Loop to Implementation (max 3) |
| Documentation | >= 80 | Return to Documentation |
| Final | >= 90 | Human Review |

---

## Project Structure

Projects are created in `/projects/[project-name]/`:

```
projects/my-project/
├── src/               # Source code
├── tests/             # Test files
├── docs/              # Documentation
│   ├── features/      # Feature docs
│   ├── api/           # API docs
│   └── architecture/  # ADRs
├── README.md
└── CHANGELOG.md
```

---

## Directory Overview

```
ultimate-coding-team/
├── skills/              # Agent definitions (read these!)
├── projects/            # Your projects go here
├── tasks/
│   ├── active/         # Current work files
│   ├── completed/      # Archived work
│   └── review/         # Needs human review
├── data/
│   ├── knowledge_base/ # Learning from past projects
│   └── shared/         # Workflow state
├── output/             # Reports and deliverables
├── logs/               # Traces and metrics
└── config/             # Configuration
```

---

## Documentation Rules

When acting as Documentation Agent, follow these rules:

1. **Simple Language** - High schooler should understand
2. **No Jargon** - Or explain terms simply
3. **No Analogies** - Describe what things DO, not what they're "like"
4. **Short Sentences** - Average < 20 words
5. **Clear Structure** - What → Why → How → Details

---

## Common Operations

### View an Agent's Instructions
```bash
cat skills/[agent-name]/SKILL.md
```

### Check Workflow Status
```bash
cat data/shared/workflow_state.json | jq '.status, .current_agent'
```

### List Active Tasks
```bash
ls tasks/active/
```

### View Knowledge Base
```bash
ls data/knowledge_base/
cat data/knowledge_base/lessons_learned.md
```

### Check Quality Gates
```bash
cat config/quality_gates.md
```

---

## Tips for Gemini CLI

1. **Read SKILL.md files** - Each agent has detailed instructions
2. **Follow the sequence** - Don't skip agents
3. **Update state file** - Keep it current
4. **Use knowledge base** - Learn from past projects
5. **Create proper outputs** - Save to correct directories
6. **NEVER include the workflow ID or the AI Agent as the Co Author in the git commit messages**
7. **Respect boundaries** - Each agent has specific responsibilities

---

## Escalation

Create `/tasks/review/REVIEW_REQUIRED_[timestamp].md` when:
- Max loops exceeded (3)
- Low confidence (< 0.7)
- Security concerns
- Major architecture decisions
- Database schema changes

Include:
- Workflow ID
- Current agent
- Reason for escalation
- What was tried
- Recommended action
