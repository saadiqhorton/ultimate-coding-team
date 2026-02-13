# Ultimate AI Coding Team

A production-grade, autonomous AI coding team system with 10 specialized agents, self-correction loops, comprehensive documentation, intelligent cleanup, and continuous self-improvement.

**Use this repo as a template:** Click "Use this template" on GitHub to create your own copy. No personal projects or workflow history are included—just the starter setup.

## What This Does

This system coordinates multiple AI agents to build software projects from start to finish. Each agent has a specific role, and they work together in sequence to ensure high-quality output.

The system includes:
- **Smart Detection** - Automatically determines if a task needs the full workflow or can be handled directly
- **Self-Correction** - Agents iterate on their work until quality standards are met
- **Knowledge Base** - The team learns from every project and improves over time
- **File-Based Coordination** - Works with any AI tool (Claude, Gemini, Codex, etc.)

## The 10 Agents

| Agent | What It Does |
|-------|--------------|
| **System Orchestrator** | Entry point. Coordinates all other agents. |
| **Project Planner** | Breaks projects into tasks. Researches best practices. |
| **Code Architect** | Designs system architecture. Selects technologies. |
| **Implementation Agent** | Writes production-quality code. |
| **Code Reviewer** | Checks code quality and security. |
| **Testing Agent** | Writes and runs tests. |
| **Documentation Agent** | Creates docs in simple language. |
| **Git Agent** | Handles version control. |
| **Cleanup Agent** | Organizes files and removes temp data. |
| **Retrospective Agent** | Analyzes what happened and updates knowledge base. |

## Getting Started

### For Complex Tasks

1. Read the orchestrator instructions:
   ```
   skills/system-orchestrator/SKILL.md
   ```

2. The orchestrator will guide you through the workflow.

### For Simple Tasks

Handle directly. No need for the full workflow for:
- Typo fixes
- Single-file renames
- Adding comments
- Configuration tweaks
- Explaining code

## Directory Structure

```
ultimate-coding-team/
├── skills/                    # Agent SKILL.md files (detailed instructions)
│   ├── system-orchestrator/   # Entry point
│   ├── project-planner/
│   ├── code-architect/
│   ├── implementation-agent/
│   ├── code-reviewer/
│   ├── testing-agent/
│   ├── documentation-agent/
│   ├── git-agent/
│   ├── cleanup-agent/
│   └── retrospective-agent/
├── .claude/agents/            # Claude Code agent definitions (one per agent)
├── .opencode/agents/          # OpenCode agent definitions (one per agent)
├── .codex/                    # Codex hooks
├── claude-sdk/                # Claude Agent SDK orchestrator (TypeScript)
│   └── src/
│       ├── orchestrator.ts    # Main entry point
│       └── tools/             # SDK MCP servers (workflow-state, quality-gates)
├── projects/                  # Your projects go here
├── tasks/                     # Task management
│   ├── inbox/                 # Incoming requests
│   ├── active/                # Current work
│   ├── completed/             # Archived work
│   ├── failed/                # Failed tasks
│   └── review/                # Needs human review
├── data/
│   ├── knowledge_base/        # Learning storage
│   ├── shared/                # Workflow state
│   └── templates/             # Reusable templates
├── output/                    # Agent outputs
│   ├── architecture/
│   ├── plans/
│   └── reports/
├── docs/                      # Documentation templates and guides
├── logs/                      # Logs and metrics
├── config/                    # Configuration files
└── tmp/                       # Temporary files
```

## How It Works

### Workflow Sequence

```
User Request
    │
    ▼
[Smart Detection] ─── Simple? ──► Handle directly
    │
    │ Complex
    ▼
[Project Planner] ──► Task breakdown
    │
    ▼
[Code Architect] ──► System design
    │
    ▼
[Implementation] ──► Write code
    │
    ▼
[Code Reviewer] ◄──► Loop if issues (max 3)
    │
    ▼
[Testing Agent] ◄──► Loop if failures (max 3)
    │
    ▼
[Documentation] ──► Simple language docs
    │
    ▼
[Cleanup Agent] ──► Organize files
    │
    ▼
[Git Agent] ──► Commit changes
    │
    ▼
[Retrospective] ──► Learn and improve
    │
    ▼
   Done
```

### Quality Gates

Each stage has quality requirements:

| Stage | Threshold | What Happens if Not Met |
|-------|-----------|-------------------------|
| Planning | >= 85/100 | Return to Planner |
| Architecture | >= 90/100 | Return to Architect |
| Code Quality | >= 85/100 | Loop to Implementation (max 3) |
| Testing | 100% pass, 80% coverage | Loop to Implementation (max 3) |
| Documentation | >= 80/100 | Return to Documentation |
| Final | >= 90/100 | Human review required |

### Self-Correction Loops

If code doesn't pass review or tests fail, the system sends work back for fixes. This happens automatically up to 3 times. After that, a human needs to review.

## Key Files

| File | What It Contains |
|------|------------------|
| `AGENTS.md` | When to use each agent |
| `CLAUDE.md` | Instructions for Claude Code |
| `GEMINI.md` | Instructions for Gemini CLI |
| `config/quality_gates.md` | Quality thresholds |
| `config/workflow_config.md` | Workflow settings |
| `data/shared/workflow_state.json` | Current workflow status |
| `claude-sdk/README.md` | Claude Agent SDK orchestrator docs |
| `CHANGELOG.md` | Version history and changes |

## Knowledge Base

The system learns from every project:

- `data/knowledge_base/lessons_learned.md` - What worked and what didn't
- `data/knowledge_base/common_mistakes.md` - Mistakes to avoid
- `data/knowledge_base/coding_standards.md` - How to write code
- `data/knowledge_base/performance_tips.md` - How to make things fast

All agents read these files before starting work.

## Using Context7 MCP

Several agents use Context7 for documentation lookup:
- Project Planner (research)
- Code Architect (tech validation)
- Implementation Agent (API docs)
- Testing Agent (testing frameworks)

See `config/mcp_servers.json` for configuration.

## Documentation Standards

The Documentation Agent writes in simple language:
- No jargon (or explains it simply)
- No analogies
- Short sentences (< 20 words average)
- Clear structure: What → Why → How

## Platform Support

This system works with any AI tool that can read and write files.

| Platform | Configuration | Agent Definitions |
|----------|--------------|-------------------|
| **Claude Code** | `CLAUDE.md`, `.claude/settings.json` | `.claude/agents/` |
| **Claude Agent SDK** | `claude-sdk/README.md` | Built into `claude-sdk/src/orchestrator.ts` |
| **Gemini CLI** | `GEMINI.md` | Uses `skills/` SKILL.md files |
| **OpenCode** | `opencode.json` | `.opencode/agents/` |
| **Codex** | `.codex/` | Uses `skills/` SKILL.md files |
| **Any other tool** | Read `AGENTS.md` | Read `skills/*/SKILL.md` |

## Human Review

The system escalates to human review when:
- Maximum loops (3) exceeded
- Low confidence on a decision
- Security concerns
- Major architecture decisions
- Database schema changes

Human review items are placed in `/tasks/review/`.

## Logs and Metrics

- `logs/traces/` - Last 10 workflow runs
- `logs/errors/` - Error logs
- `logs/archives/` - Older logs
- `logs/agent_metrics.json` - Performance data

## Getting Help

1. Read `AGENTS.md` for agent usage rules
2. Read the specific agent's SKILL.md for detailed instructions
3. Check the knowledge base for lessons learned
4. Review `config/` files for configuration options

## License

MIT License. See [LICENSE](LICENSE) for details.
