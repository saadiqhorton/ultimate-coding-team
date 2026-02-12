/**
 * Workflow State MCP Server
 *
 * Manages the shared workflow state file that coordinates
 * agent handoffs, tracks progress, and maintains shared context
 * across the 10-agent pipeline.
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// ── Schema ──────────────────────────────────────────────────────────

const WorkflowStateSchema = z.object({
  project_name: z.string(),
  current_agent: z.string(),
  current_phase: z.enum([
    "planning",
    "architecture",
    "implementation",
    "review",
    "testing",
    "documentation",
    "git",
    "cleanup",
    "retrospective",
    "complete",
  ]),
  completed_agents: z.array(z.string()),
  quality_scores: z.record(z.number()),
  loop_counts: z.record(z.number()),
  blockers: z.array(z.string()),
  shared_context: z.record(z.any()),
  started_at: z.string(),
  updated_at: z.string(),
});

type WorkflowState = z.infer<typeof WorkflowStateSchema>;

// ── Helpers ─────────────────────────────────────────────────────────

function getStatePath(workingDir: string): string {
  return join(workingDir, "data", "shared", "workflow_state.json");
}

function loadState(workingDir: string): WorkflowState {
  const path = getStatePath(workingDir);
  if (!existsSync(path)) {
    const initial: WorkflowState = {
      project_name: "",
      current_agent: "system-orchestrator",
      current_phase: "planning",
      completed_agents: [],
      quality_scores: {},
      loop_counts: {},
      blockers: [],
      shared_context: {},
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const dir = join(workingDir, "data", "shared");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

function saveState(workingDir: string, state: WorkflowState): void {
  state.updated_at = new Date().toISOString();
  const path = getStatePath(workingDir);
  writeFileSync(path, JSON.stringify(state, null, 2));
}

// ── Agent Pipeline Order ────────────────────────────────────────────

const AGENT_PIPELINE = [
  "project-planner",
  "code-architect",
  "implementation-agent",
  "code-reviewer",
  "testing-agent",
  "documentation-agent",
  "git-agent",
  "cleanup-agent",
  "retrospective-agent",
] as const;

const PHASE_MAP: Record<string, WorkflowState["current_phase"]> = {
  "project-planner": "planning",
  "code-architect": "architecture",
  "implementation-agent": "implementation",
  "code-reviewer": "review",
  "testing-agent": "testing",
  "documentation-agent": "documentation",
  "git-agent": "git",
  "cleanup-agent": "cleanup",
  "retrospective-agent": "retrospective",
};

// ── MCP Server ──────────────────────────────────────────────────────

export function createWorkflowStateMcpServer(workingDir: string) {
  return createSdkMcpServer({
    name: "workflow-state",
    version: "1.0.0",
    tools: [
      tool(
        "get_state",
        "Read the current workflow state including current agent, phase, scores, and blockers",
        {},
        async () => {
          const state = loadState(workingDir);
          return {
            content: [{ type: "text", text: JSON.stringify(state, null, 2) }],
          };
        }
      ),

      tool(
        "advance_agent",
        "Mark current agent as complete, record quality score, and advance to next agent in pipeline",
        {
          agent_name: z
            .string()
            .describe("Name of the agent that just completed"),
          quality_score: z
            .number()
            .min(0)
            .max(100)
            .describe("Quality score (0-100) for the agent's output"),
          notes: z
            .string()
            .optional()
            .describe("Optional notes about the agent's work"),
        },
        async (args) => {
          const state = loadState(workingDir);

          // Record completion
          if (!state.completed_agents.includes(args.agent_name)) {
            state.completed_agents.push(args.agent_name);
          }
          state.quality_scores[args.agent_name] = args.quality_score;

          if (args.notes) {
            state.shared_context[`${args.agent_name}_notes`] = args.notes;
          }

          // Find next agent
          const currentIdx = AGENT_PIPELINE.indexOf(
            args.agent_name as (typeof AGENT_PIPELINE)[number]
          );
          if (currentIdx >= 0 && currentIdx < AGENT_PIPELINE.length - 1) {
            const next = AGENT_PIPELINE[currentIdx + 1];
            state.current_agent = next;
            state.current_phase = PHASE_MAP[next] || "complete";
          } else {
            state.current_agent = "complete";
            state.current_phase = "complete";
          }

          saveState(workingDir, state);
          return {
            content: [
              {
                type: "text",
                text: `✅ ${args.agent_name} completed (score: ${args.quality_score}/100). Next: ${state.current_agent}`,
              },
            ],
          };
        }
      ),

      tool(
        "request_rework",
        "Send the workflow back to a previous agent for rework (used by reviewer/testing feedback loops)",
        {
          from_agent: z.string().describe("Agent requesting the rework"),
          target_agent: z
            .string()
            .describe("Agent that needs to redo work"),
          reason: z.string().describe("Why rework is needed"),
          loop_key: z
            .string()
            .describe("Loop tracking key (e.g. 'review_loop', 'test_loop')"),
          max_loops: z
            .number()
            .default(3)
            .describe("Maximum allowed rework loops"),
        },
        async (args) => {
          const state = loadState(workingDir);

          // Track loop count
          const count = (state.loop_counts[args.loop_key] || 0) + 1;
          state.loop_counts[args.loop_key] = count;

          if (count > args.max_loops) {
            // Max loops exceeded — force advance with warning
            state.blockers.push(
              `⚠️ ${args.loop_key} hit max loops (${args.max_loops}). Forcing advance from ${args.from_agent}. Reason: ${args.reason}`
            );
            return {
              content: [
                {
                  type: "text",
                  text: `🛑 Max loops (${args.max_loops}) reached for ${args.loop_key}. Cannot rework further — proceed with current output and document issues.`,
                },
              ],
            };
          }

          // Send back to target agent
          state.current_agent = args.target_agent;
          state.current_phase = PHASE_MAP[args.target_agent] || state.current_phase;
          state.shared_context[`${args.loop_key}_feedback`] = args.reason;

          // Remove target from completed so it re-runs
          state.completed_agents = state.completed_agents.filter(
            (a) => a !== args.target_agent
          );

          saveState(workingDir, state);
          return {
            content: [
              {
                type: "text",
                text: `🔄 Rework requested: ${args.target_agent} (loop ${count}/${args.max_loops}). Reason: ${args.reason}`,
              },
            ],
          };
        }
      ),

      tool(
        "set_context",
        "Store shared context data that other agents can read (e.g., tech stack decisions, file paths, conventions)",
        {
          key: z.string().describe("Context key"),
          value: z.any().describe("Context value (any JSON-serializable data)"),
        },
        async (args) => {
          const state = loadState(workingDir);
          state.shared_context[args.key] = args.value;
          saveState(workingDir, state);
          return {
            content: [
              {
                type: "text",
                text: `📝 Context set: ${args.key}`,
              },
            ],
          };
        }
      ),

      tool(
        "add_blocker",
        "Record a blocker or issue that needs attention",
        {
          blocker: z.string().describe("Description of the blocker"),
        },
        async (args) => {
          const state = loadState(workingDir);
          state.blockers.push(args.blocker);
          saveState(workingDir, state);
          return {
            content: [
              {
                type: "text",
                text: `🚧 Blocker added: ${args.blocker}`,
              },
            ],
          };
        }
      ),

      tool(
        "init_project",
        "Initialize workflow state for a new project",
        {
          project_name: z.string().describe("Name of the project"),
        },
        async (args) => {
          const state = loadState(workingDir);
          state.project_name = args.project_name;
          state.current_agent = "project-planner";
          state.current_phase = "planning";
          state.completed_agents = [];
          state.quality_scores = {};
          state.loop_counts = {};
          state.blockers = [];
          state.shared_context = {};
          state.started_at = new Date().toISOString();
          saveState(workingDir, state);
          return {
            content: [
              {
                type: "text",
                text: `🚀 Project "${args.project_name}" initialized. Starting with project-planner.`,
              },
            ],
          };
        }
      ),
    ],
  });
}
