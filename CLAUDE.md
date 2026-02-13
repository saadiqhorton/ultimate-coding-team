# CLAUDE.md - Claude Code Instructions

Instructions for Claude Code when working in the Ultimate AI Coding Team workspace.

---

## About This Workspace

This is a production-grade AI coding team system with 10 specialized agents that work together to deliver high-quality software. The system features:

- **Smart Detection** - Automatically determines if full workflow is needed
- **Self-Correction Loops** - Agents iterate until quality standards are met
- **Knowledge Base** - Continuous learning from completed projects
- **File-Based Coordination** - Universal compatibility with any AI tool

---

## Quick Start

### For Complex Tasks (New Features, Multi-File Changes)

1. Read the orchestrator skill:
   ```
   skills/system-orchestrator/SKILL.md
   ```

2. Initialize workflow state in:
   ```
   data/shared/workflow_state.json
   ```

3. Read knowledge base for context:
   ```
   data/knowledge_base/lessons_learned.md
   data/knowledge_base/common_mistakes.md
   data/knowledge_base/coding_standards.md
   ```

4. Follow the agent sequence in order.

### For Simple Tasks (Typos, Single Renames)

Handle directly without the full workflow. Just make the change.

---

## Agent Locations

| Agent | SKILL.md Location |
|-------|-------------------|
| System Orchestrator | `skills/system-orchestrator/SKILL.md` |
| Project Planner | `skills/project-planner/SKILL.md` |
| Code Architect | `skills/code-architect/SKILL.md` |
| Implementation Agent | `skills/implementation-agent/SKILL.md` |
| Code Reviewer | `skills/code-reviewer/SKILL.md` |
| Testing Agent | `skills/testing-agent/SKILL.md` |
| Documentation Agent | `skills/documentation-agent/SKILL.md` |
| Git Agent | `skills/git-agent/SKILL.md` |
| Cleanup Agent | `skills/cleanup-agent/SKILL.md` |
| Retrospective Agent | `skills/retrospective-agent/SKILL.md` |

---

## Using Context7 MCP

The Project Planner, Code Architect, Implementation Agent, and Testing Agent all use Context7 for documentation lookup.

### How to Use

1. First resolve the library ID:
   ```
   mcp__plugin_context7_context7__resolve-library-id
   - libraryName: "express"
   - query: "authentication middleware"
   ```

2. Then query the docs:
   ```
   mcp__plugin_context7_context7__query-docs
   - libraryId: "/expressjs/express"
   - query: "how to set up JWT authentication"
   ```

See `config/mcp_servers.json` for common library IDs.

---

## Directory Structure

```
ultimate-coding-team/
├── skills/              # Agent SKILL.md files (detailed instructions)
├── .claude/agents/      # Claude Code agent definitions (one .md per agent)
├── .opencode/agents/    # OpenCode agent definitions (one .md per agent)
├── .codex/              # Codex hooks
├── claude-sdk/          # Claude Agent SDK orchestrator (TypeScript)
│   └── src/
│       ├── orchestrator.ts
│       └── tools/       # SDK MCP servers (workflow-state, quality-gates)
├── projects/            # Created projects go here
├── tasks/
│   ├── inbox/          # Incoming work
│   ├── active/         # Current work
│   ├── completed/      # Archived (by date)
│   ├── failed/         # Failed tasks
│   └── review/         # Needs human review
├── data/
│   ├── knowledge_base/ # Learning data
│   ├── shared/         # Workflow state
│   └── templates/      # Reusable templates
├── output/             # Agent outputs
├── logs/               # Traces, metrics, errors
│   ├── agent_metrics.json
│   ├── errors/         # Tool failures, escalations, exceptions
│   ├── traces/         # Workflow steps, routing decisions
│   └── archives/       # Older logs
├── config/             # Configuration files
└── tmp/                # Temp files (auto-cleaned)
```

---

## Workflow State

The current workflow state is tracked in:
```
data/shared/workflow_state.json
```

Key fields:
- `workflow_id` - Unique ID (format: wf_YYYYMMDD_NNN)
- `status` - idle | in_progress | paused | completed | failed
- `current_agent` - Which agent is active
- `loop_counts` - Self-correction iteration counts
- `quality_scores` - Scores from each stage

---

## Quality Gates

See `config/quality_gates.md` for details.

| Gate | Threshold |
|------|-----------|
| Planning | >= 85 |
| Architecture | >= 90 |
| Code Quality | >= 85 |
| Testing | 100% pass, 80% coverage |
| Documentation | >= 80 |
| Final | >= 90 |

---

## Self-Correction Loops

The Code Reviewer and Testing Agent can send work back to the Implementation Agent:

- Maximum 3 iterations per loop
- After 3 failures → Escalate to human review
- Create escalation file in `/tasks/review/`

---

## Documentation Guidelines

The Documentation Agent follows strict simple language rules:

- Professional tone, but understandable by a high schooler
- NO jargon (or explain it simply)
- NO analogies (unless absolutely necessary)
- Short sentences (average < 20 words)
- Target: Flesch reading ease >= 60

---

## Important Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Agent usage rules |
| `CHANGELOG.md` | Version history and changes |
| `config/quality_gates.md` | Quality thresholds |
| `config/workflow_config.md` | Workflow sequence |
| `config/routing_table.md` | Smart detection logic |
| `data/shared/workflow_state.json` | Current state |
| `claude-sdk/README.md` | Claude Agent SDK orchestrator docs |
| `logs/agent_metrics.json` | Performance metrics |
| `logs/errors/` | Error reports (tool failures, escalations) |
| `logs/traces/` | Workflow steps, routing decisions |
| `logs/archives/` | Older rotated logs |

---

## Workflow Gate (Required for Completion)

Before marking a workflow complete, run:

```bash
./scripts/workflow_gate.sh autofix
```

Completion is only valid when the gate exits 0. If it fails, remediate and re-run until it passes.

## Best Practices

1. **Always read the knowledge base first** - Learn from past projects
2. **Update workflow state** - Keep state current after each agent
3. **Follow quality gates** - Don't skip quality checks
4. **Use extended thinking** - For complex 
5. **NEVER include the workflow ID or the AI Agent as the Co Author in the git commit messages**
6. **Document learnings** - Via Retrospective Agent

---

## Common Commands

### Start a New Workflow
1. Read `skills/system-orchestrator/SKILL.md`
2. Create workflow ID in state file
3. Set `status: "in_progress"`
4. Begin with Project Planner

### Check Current State
Read `data/shared/workflow_state.json`

### View Quality Standards
Read `config/quality_gates.md`

### Access Knowledge Base
Read files in `data/knowledge_base/`

---

## Hooks

The smart detector hook (`.claude/hooks/smart-detector.sh`) analyzes requests to suggest whether to use the full workflow.

Settings are in `.claude/settings.json`.
