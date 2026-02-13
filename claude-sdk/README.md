# Ultimate AI Coding Team — Claude Agent SDK Orchestrator

Programmatic orchestration of 10 specialized AI agents via the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript). Unlike the `.claude/agents/` markdown definitions (which rely on Claude Code's built-in subagent routing), this orchestrator gives you full control over agent lifecycle, quality gates, and workflow state through TypeScript.

## When to Use This vs `.claude/agents/`

| | `.claude/agents/` (markdown) | This SDK orchestrator |
|---|---|---|
| **Invocation** | Auto-routing inside Claude Code | Standalone CLI / embedded in apps |
| **Quality gates** | Hook scripts (exit code 2) | SDK MCP server with score validation |
| **Workflow state** | JSON file, manual management | SDK MCP server with typed API |
| **Feedback loops** | Agent self-manages | `request_rework` with loop counting |
| **Session mgmt** | Claude Code handles it | Resume, fork, checkpoint |
| **Structured output** | Text responses | JSON schema-validated reports |
| **Hooks** | `.claude/settings.json` commands | In-process `HookCallbackMatcher[]` |
| **Permissions** | Interactive approval | `canUseTool` + `permissionMode` |
| **Best for** | Interactive Claude Code sessions | CI/CD, automation, embedding |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI / Your Application                     │
├─────────────────────────────────────────────────────────────┤
│                   orchestrator.ts (main)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │    Hooks     │  │  canUseTool  │  │ Structured Output  │  │
│  │ (Matcher[]) │  │ (CanUseTool) │  │ (ProjectReport)    │  │
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
│  │ (SDK MCP)       │  │ (SDK MCP)     │  │ (stdio ext.)  │  │
│  └─────────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Prerequisites
export ANTHROPIC_API_KEY="sk-ant-..."

# Install
cd claude-sdk
npm install

# Run
npx tsx src/orchestrator.ts "Build a REST API for task management with SQLite"
```

> The SDK bundles Claude Code CLI automatically — no separate install needed.

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

## SDK API Mapping

This orchestrator uses the following Claude Agent SDK features:

### `query()` — Main Entry Point

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: "Build a REST API",
  options: {
    model: "sonnet",
    cwd: process.cwd(),
    systemPrompt: SYSTEM_PROMPT,
    agents: buildAgents(),          // Record<string, AgentDefinition>
    mcpServers: buildMcpServers(),  // Record<string, McpServerConfig>
    hooks,                          // Partial<Record<HookEvent, HookCallbackMatcher[]>>
    canUseTool,                     // CanUseTool function
    permissionMode: "acceptEdits",
    settingSources: ["project"],
    enableFileCheckpointing: true,
    maxTurns: 200,
    maxBudgetUsd: 25,
    betas: ["context-1m-2025-08-07"],
    outputFormat: {
      type: "json_schema",
      schema: z.toJSONSchema(ProjectReportSchema),
    },
  },
});

for await (const message of response) { /* SDKMessage stream */ }
```

### `AgentDefinition` — Subagent Configuration

```typescript
type AgentDefinition = {
  description: string;                            // When to invoke
  prompt: string;                                 // Agent system prompt
  tools?: string[];                               // Allowed tool names
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit'; // Model override
}
```

> Note: `maxTurns` is NOT per-agent — it's set on the top-level `Options`.

### `HookCallbackMatcher[]` — Hook Configuration

```typescript
// Hooks config: Partial<Record<HookEvent, HookCallbackMatcher[]>>
const hooks = {
  PreToolUse: [
    {
      matcher: "Bash",  // Only trigger for Bash tool calls
      hooks: [async (input, toolUseID, { signal }) => {
        // Return {} to allow, or { hookSpecificOutput: { ... } } to deny
        return {};
      }],
    },
  ],
  SubagentStart: [{ hooks: [trackAgent] }],
  Stop: [{ hooks: [printSummary] }],
};
```

### `CanUseTool` — Permission Control

```typescript
async function canUseTool(
  toolName: string,
  input: ToolInput,
  options: { signal: AbortSignal; suggestions?: PermissionUpdate[] }
): Promise<
  | { behavior: "allow"; updatedInput: ToolInput }
  | { behavior: "deny"; message: string }
> {
  // ...
}
```

### `createSdkMcpServer()` / `tool()` — In-Process MCP

```typescript
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";

const server = createSdkMcpServer({
  name: "workflow-state",
  version: "1.0.0",
  tools: [
    tool("get_state", "Read workflow state", {}, async () => ({
      content: [{ type: "text", text: JSON.stringify(state) }],
    })),
  ],
});
```

## MCP Servers

| Server | Type | Purpose |
|--------|------|---------|
| `workflow-state` | SDK MCP (in-process) | State machine tracking agent handoffs, quality scores, loop counts |
| `quality-gates` | SDK MCP (in-process) | Score thresholds, artifact validation, pipeline summary |
| `context7` | External (stdio) | Library documentation lookup for framework research |

## Hooks

| Event | Purpose |
|-------|---------|
| `PreToolUse` | Block destructive bash commands, log all tool calls |
| `PostToolUse` | Log workflow state changes |
| `SubagentStart` | Track which agents are invoked |
| `SubagentStop` | Log agent completion time |
| `Stop` | Print session summary |
| `SessionStart` | Inject orchestration context |

## File Structure

```
claude-sdk/
├── src/
│   ├── orchestrator.ts           # Main entry — query(), agents, hooks, canUseTool
│   └── tools/
│       ├── workflow-state.ts     # SDK MCP: state machine, handoffs, rework loops
│       └── quality-gates.ts     # SDK MCP: score validation, artifact checks
├── package.json
└── tsconfig.json
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `MCP_TOOL_TIMEOUT` | No | MCP tool execution timeout (default: 30s) |

## Requirements

- Node.js 18+
- `@anthropic-ai/claude-agent-sdk` ^0.2.39 (installed via npm)
- `zod` ^4.0.0 (for structured output schemas)
