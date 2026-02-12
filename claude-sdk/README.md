# Ultimate AI Coding Team — Claude Agent SDK Orchestrator

Programmatic orchestration of 10 specialized AI agents via the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript). Unlike the `.claude/agents/` markdown definitions (which rely on Claude Code's built-in subagent routing), this orchestrator gives you full control over agent lifecycle, quality gates, and workflow state through TypeScript.

## When to Use This vs `.claude/agents/`

| | `.claude/agents/` (markdown) | This SDK orchestrator |
|---|---|---|
| **Invocation** | Auto-routing inside Claude Code | Standalone CLI / embedded in apps |
| **Quality gates** | Hook scripts (exit code 2) | MCP server with score validation |
| **Workflow state** | JSON file, manual management | MCP server with typed API |
| **Feedback loops** | Agent self-manages | `request_rework` with loop counting |
| **Session mgmt** | Claude Code handles it | Resume, fork, checkpoint |
| **Structured output** | Text responses | JSON schema-validated reports |
| **Best for** | Interactive Claude Code sessions | CI/CD, automation, embedding |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI / Your Application                     │
├─────────────────────────────────────────────────────────────┤
│                   orchestrator.ts (main)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   Hooks      │  │  canUseTool  │  │ Structured Output  │  │
│  │  (12 events) │  │ (permissions)│  │ (ProjectReport)    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│               System Orchestrator (main agent)               │
│                         delegates to:                         │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────┤
│Plan  │Arch  │Impl  │Review│Test  │Docs  │Git   │Clean │Retro│
│      │      │      │ ◄──► │ ◄──► │      │      │      │     │
│sonnet│sonnet│sonnet│sonnet│sonnet│sonnet│haiku │haiku │haiku│
└──────┴──────┴──────┴──┬───┴──┬───┴──────┴──────┴──────┴─────┘
                        │      │
                   max 3 loops each
                   back to Impl
├─────────────────────────────────────────────────────────────┤
│                      MCP Servers                             │
│  ┌─────────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ workflow-state   │  │ quality-gates │  │   Context7    │  │
│  │ (state machine)  │  │ (validation)  │  │ (lib research)│  │
│  └─────────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Prerequisites
npm install -g @anthropic-ai/claude-code    # SDK requires Claude Code CLI
export ANTHROPIC_API_KEY="sk-ant-..."

# Install
cd claude-sdk
npm install

# Run
npx tsx src/orchestrator.ts "Build a REST API for task management with SQLite"
```

## Usage

### New Project

```bash
npx tsx src/orchestrator.ts "Build a CLI tool that converts CSV files to JSON"
```

### Resume Session

```bash
npx tsx src/orchestrator.ts --resume abc123 "Continue with testing"
```

### Fork Session (explore alternatives)

```bash
npx tsx src/orchestrator.ts --fork --resume abc123 "Try a different database"
```

## Agent Pipeline

Each agent runs in order. The code-reviewer and testing-agent can loop back to the implementation-agent up to 3 times before forcing advancement.

| # | Agent | Model | Tools | Quality Gate |
|---|-------|-------|-------|-------------|
| 1 | project-planner | sonnet | R/W/E + Context7 | ≥ 85 |
| 2 | code-architect | sonnet | R/W/E + Context7 | ≥ 85 |
| 3 | implementation-agent | sonnet | R/W/E + Context7 | ≥ 80 |
| 4 | code-reviewer | sonnet | Read-only | ≥ 85 |
| 5 | testing-agent | sonnet | R/W/E + Bash | ≥ 80 |
| 6 | documentation-agent | sonnet | R/W/E | ≥ 80 |
| 7 | git-agent | haiku | Read + Bash | ≥ 90 |
| 8 | cleanup-agent | haiku | Read + Bash | ≥ 85 |
| 9 | retrospective-agent | haiku | R/W/E | ≥ 75 |

## Custom MCP Servers

### workflow-state

Manages the shared state file at `data/shared/workflow_state.json`:

| Tool | Description |
|------|-------------|
| `get_state` | Read current workflow state |
| `init_project` | Initialize for a new project |
| `advance_agent` | Complete current agent, move to next |
| `request_rework` | Send back to previous agent (with loop limit) |
| `set_context` | Store shared data for other agents |
| `add_blocker` | Record a blocking issue |

### quality-gates

Validates agent outputs against score thresholds and required artifacts:

| Tool | Description |
|------|-------------|
| `validate_gate` | Check if agent passes its quality gate |
| `get_gate_requirements` | Get threshold and required artifacts |
| `pipeline_summary` | Overview of all gates and pass/fail status |

## Hooks

The orchestrator uses 5 of the SDK's 12 hook events:

| Hook | Purpose |
|------|---------|
| `PreToolUse` | Block destructive bash commands |
| `PostToolUse` | Log workflow state changes |
| `SubagentStart` | Track which agents run, log timing |
| `SubagentStop` | Log completion timing |
| `Stop` | Print final session summary |
| `Error` | Log errors |

## Permission Control

The `canUseTool` callback enforces team policy:

- **Blocked**: `git push --force`, destructive bash commands, production deploys
- **Allowed**: Everything else (within each agent's tool restrictions)

Each agent also has its own tool allowlist — for example, the code-reviewer can only Read/Grep (no editing), and the git-agent can only Read/Bash (no file writes).

## Structured Output

The orchestrator requests a `ProjectReport` JSON schema as its final output:

```typescript
{
  project_name: string;
  status: "success" | "partial" | "failed";
  agents_completed: string[];
  quality_scores: Record<string, number>;
  files_created: string[];
  files_modified: string[];
  blockers: string[];
  total_duration_seconds: number;
  summary: string;
}
```

## Configuration

Edit the `CONFIG` object in `orchestrator.ts`:

```typescript
const CONFIG = {
  model: "claude-sonnet-4-5",     // Main orchestrator model
  workingDirectory: process.cwd(), // Project root
  maxSessionMinutes: 80,           // Rotate before 90-min limit
  context7Enabled: true,           // Context7 MCP for lib research
};
```

### Model Selection per Agent

Agents use different models based on task complexity:

- **Sonnet**: Planning, architecture, implementation, review, testing, docs (complex reasoning)
- **Haiku**: Git, cleanup, retrospective (fast, cost-effective for simpler tasks)

Override in `buildAgents()` by changing `model: "sonnet"` to `"opus"`, `"haiku"`, or `"inherit"`.

## File Structure

```
claude-sdk/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── orchestrator.ts          # Main entry — agents, hooks, streaming
    └── tools/
        ├── workflow-state.ts    # MCP server: state machine
        └── quality-gates.ts     # MCP server: gate validation
```

## Extending

### Add a New Agent

1. Add the agent definition in `buildAgents()` in `orchestrator.ts`
2. Add its quality gate in `QUALITY_GATES` in `quality-gates.ts`
3. Add it to `AGENT_PIPELINE` and `PHASE_MAP` in `workflow-state.ts`
4. Update the system prompt's pipeline description

### Add a Custom MCP Server

```typescript
// In buildMcpServers():
servers["my-server"] = createSdkMcpServer({
  name: "my-server",
  version: "1.0.0",
  tools: [
    tool("my_tool", "Description", { input: z.string() }, async (args) => {
      return { content: [{ type: "text", text: "result" }] };
    }),
  ],
});

// Then add to agent tool lists:
"mcp__my-server__my_tool"
```

### Use with External MCP Servers

```typescript
servers["my-api"] = {
  url: "https://api.example.com/mcp",
  type: "http",
  headers: { Authorization: "Bearer ..." },
};
```

## Relationship to Other Adapters

This SDK orchestrator is one of three platform adapters:

| Adapter | Location | Purpose |
|---------|----------|---------|
| `.claude/agents/` | Markdown subagent defs | Interactive Claude Code sessions |
| `claude-sdk/` | **This orchestrator** | Programmatic / CI/CD / embedding |
| `.opencode/` | OpenCode agent configs | OpenCode CLI sessions |
