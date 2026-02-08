# AGENTS.md - Agent Usage Rules

This file documents when and how to use each agent in the Ultimate AI Coding Team.

---

## Quick Reference

| Agent | Use When | Skip When |
|-------|----------|-----------|
| **System Orchestrator** | Complex coding tasks | Simple fixes, explanations |
| **Project Planner** | New projects, features | Architecture already exists |
| **Code Architect** | System design needed | Simple implementations |
| **Implementation Agent** | Writing production code | Just reviewing code |
| **Code Reviewer** | Code written, needs review | Code not yet written |
| **Testing Agent** | Code reviewed, needs tests | Tests already exist |
| **Documentation Agent** | Code complete, needs docs | Docs already current |
| **Git Agent** | Changes ready to commit | No changes made |
| **Cleanup Agent** | Workflow complete/stage end | Active work in progress |
| **Retrospective Agent** | Workflow complete | Workflow still running |

---

## Full Workflow Required

**Use the complete 10-agent workflow when:**

- Building new features (any size)
- Making changes affecting multiple files
- Refactoring existing code
- Changing system architecture
- Developing or modifying APIs
- Changing database schemas
- Making security-related changes
- Adding tests for existing code
- Pull requests with >50 lines changed

**Entry Point:** `skills/system-orchestrator/SKILL.md`

---

## Simple Mode (Skip Orchestrator)

**Handle directly without full workflow when:**

- Fixing single-line typos
- Renaming variables in a single file
- Documentation-only updates (no code changes)
- Adding a single comment
- Minor configuration tweaks
- Reading or explaining existing code
- Checking git status

---

## Agent Details

### 1. System Orchestrator

**Location:** `skills/system-orchestrator/SKILL.md`

**Purpose:** Entry point with smart detection. Coordinates all other agents.

**REQUIRED when:**
- Any task that needs multiple agents
- Uncertain about complexity
- Building something new

**SKIP when:**
- Simple, single-file tasks
- Documentation-only changes
- Just explaining code

### 2. Project Planner

**Location:** `skills/project-planner/SKILL.md`

**Purpose:** Breaks projects into atomic tasks with dependencies.

**REQUIRED when:**
- Starting a new project
- Adding a major feature
- Need to research best practices (uses Context7)

**SKIP when:**
- Architecture already designed
- Single-task implementation
- Bug fixes with clear scope

### 3. Code Architect

**Location:** `skills/code-architect/SKILL.md`

**Purpose:** Designs architecture, selects tech stack, creates ADRs.

**REQUIRED when:**
- New system design needed
- Major architectural changes
- Tech stack decisions required

**SKIP when:**
- Architecture already exists
- Simple feature additions
- Bug fixes

### 4. Implementation Agent

**Location:** `skills/implementation-agent/SKILL.md`

**Purpose:** Writes production-quality code.

**REQUIRED when:**
- New code needs to be written
- Architecture is complete
- Fixing issues from code review (correction loop)

**SKIP when:**
- Just reviewing existing code
- Only writing documentation
- Only running tests

### 5. Code Reviewer

**Location:** `skills/code-reviewer/SKILL.md`

**Purpose:** Reviews code for quality, security, and standards.

**REQUIRED when:**
- Implementation complete
- Code needs quality verification

**SKIP when:**
- No new code written
- Code already reviewed and approved

**Note:** Can send back to Implementation Agent up to 3 times.

### 6. Testing Agent

**Location:** `skills/testing-agent/SKILL.md`

**Purpose:** Writes and runs tests.

**REQUIRED when:**
- Code review passed
- Tests need to be written

**SKIP when:**
- Tests already comprehensive
- No testable code changes

**Note:** Can send back to Implementation Agent up to 3 times.

### 7. Documentation Agent

**Location:** `skills/documentation-agent/SKILL.md`

**Purpose:** Writes documentation in simple language.

**REQUIRED when:**
- Testing passed
- Documentation needs creation/update

**SKIP when:**
- Documentation already current
- No user-facing changes

**Note:** Uses simple language guidelines. No jargon. No analogies.

### 8. Git Agent

**Location:** `skills/git-agent/SKILL.md`

**Purpose:** Handles version control operations.

**REQUIRED when:**
- Changes ready to commit
- Branches need management
- PRs need creation

**SKIP when:**
- No changes made
- Just reading/exploring 

**Note:** NEVER include the workflow ID or the AI Agent as the Co Author in the git commit messages

### 9. Cleanup Agent

**Location:** `skills/cleanup-agent/SKILL.md`

**Purpose:** Cleans temp files, archives completed work.

**REQUIRED when:**
- Stage complete (light cleanup)
- Workflow complete (full cleanup)

**SKIP when:**
- Work still in progress
- Active files being used

**WARNING:** Cannot touch `/projects/`, `/output/`, `/tasks/active/`, `/data/knowledge_base/`

### 10. Retrospective Agent

**Location:** `skills/retrospective-agent/SKILL.md`

**Purpose:** Analyzes workflow and updates knowledge base.

**REQUIRED when:**
- Workflow complete
- Learning should be captured

**SKIP when:**
- Workflow still running
- Simple task (nothing to learn)

---

## Workflow Sequence

```
User Request
    │
    ▼
┌─────────────────────┐
│ System Orchestrator │ ◄── Smart Detection
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Project Planner    │ ◄── Uses Context7
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   Code Architect    │ ◄── Uses Context7
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│Implementation Agent │ ◄── Uses Context7
└─────────────────────┘
    │
    ▼
┌─────────────────────┐     ┌───────────────┐
│   Code Reviewer     │────►│ Loop back if  │
└─────────────────────┘     │ score < 85    │
    │                       │ (max 3 times) │
    ▼                       └───────────────┘
┌─────────────────────┐     ┌───────────────┐
│   Testing Agent     │────►│ Loop back if  │
└─────────────────────┘     │ tests fail    │
    │                       │ (max 3 times) │
    ▼                       └───────────────┘
┌─────────────────────┐
│Documentation Agent  │ ◄── Simple Language
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   Cleanup Agent     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│     Git Agent       │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│Retrospective Agent  │ ◄── Updates Knowledge Base
└─────────────────────┘
    │
    ▼
   Done
```

---

## Quality Gates

| Gate | Threshold | Failure Action |
|------|-----------|----------------|
| Planning | >= 85 | Return to Planner |
| Architecture | >= 90 | Return to Architect |
| Code Quality | >= 85 | Loop to Implementation (max 3) |
| Testing | 100% pass, 80% coverage | Loop to Implementation (max 3) |
| Documentation | >= 80 | Return to Documentation |
| Final | >= 90 | Human Review |

---

## Human Escalation

Escalate to human review when:
- Max loops (3) exceeded
- Confidence < 0.7
- Security concerns
- Architecture decisions (major)
- Database schema changes
- Breaking API changes

---

## File Locations

| File | Purpose |
|------|---------|
| `/data/shared/workflow_state.json` | Current workflow state |
| `/data/knowledge_base/*.md` | Shared learning |
| `/tasks/active/` | Current work |
| `/tasks/review/` | Human review items |
| `/config/quality_gates.md` | Gate thresholds |
