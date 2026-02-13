/**
 * Quality Gates — SDK MCP Server
 *
 * An in-process MCP server (createSdkMcpServer) that validates agent
 * outputs against configurable score thresholds, checks for required
 * artifacts, and enforces quality standards for each pipeline stage.
 *
 * Tools provided:
 *   - validate_gate         — Check if agent output meets its quality gate
 *   - get_gate_requirements — Get requirements for a specific agent
 *   - pipeline_summary      — Full summary of all gates and their status
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// ── Gate Definitions ────────────────────────────────────────────────

interface QualityGate {
  minScore: number;
  requiredArtifacts: string[];
  description: string;
}

const QUALITY_GATES: Record<string, QualityGate> = {
  "project-planner": {
    minScore: 85,
    requiredArtifacts: ["tasks/active/project_plan.md"],
    description:
      "Project plan with atomic tasks, dependencies, and effort estimates",
  },
  "code-architect": {
    minScore: 85,
    requiredArtifacts: ["docs/architecture/"],
    description:
      "Architecture decision records, tech stack selection, system design",
  },
  "implementation-agent": {
    minScore: 80,
    requiredArtifacts: ["src/"],
    description:
      "Working code that follows architecture decisions and coding standards",
  },
  "code-reviewer": {
    minScore: 85,
    requiredArtifacts: ["data/reviews/"],
    description:
      "Code review with actionable findings, security check, and quality score",
  },
  "testing-agent": {
    minScore: 80,
    requiredArtifacts: ["tests/"],
    description:
      "Test suite with unit, integration, and edge case coverage ≥80%",
  },
  "documentation-agent": {
    minScore: 80,
    requiredArtifacts: ["docs/"],
    description:
      "README, API docs, inline docs — written in simple language",
  },
  "git-agent": {
    minScore: 90,
    requiredArtifacts: [],
    description:
      "Clean git history with conventional commits and proper branching",
  },
  "cleanup-agent": {
    minScore: 85,
    requiredArtifacts: [],
    description:
      "No dead code, temp files cleaned, consistent formatting",
  },
  "retrospective-agent": {
    minScore: 75,
    requiredArtifacts: ["data/knowledge_base/lessons_learned.md"],
    description:
      "Lessons learned, patterns documented, knowledge base updated",
  },
};

// ── MCP Server ──────────────────────────────────────────────────────

export function createQualityGatesMcpServer(workingDir: string) {
  return createSdkMcpServer({
    name: "quality-gates",
    version: "1.0.0",
    tools: [
      // ── validate_gate ─────────────────────────────────────────
      tool(
        "validate_gate",
        "Check if an agent's output meets its quality gate — verifies score threshold and required artifacts exist",
        {
          agent_name: z.string().describe("Agent to validate"),
          score: z
            .number()
            .min(0)
            .max(100)
            .describe("Self-assessed quality score"),
        },
        async (args) => {
          const gate = QUALITY_GATES[args.agent_name];
          if (!gate) {
            return {
              content: [
                {
                  type: "text",
                  text: `⚠️ No quality gate defined for agent: ${args.agent_name}`,
                },
              ],
            };
          }

          const issues: string[] = [];

          // Check score threshold
          if (args.score < gate.minScore) {
            issues.push(
              `Score ${args.score} below minimum ${gate.minScore}`
            );
          }

          // Check required artifacts
          for (const artifact of gate.requiredArtifacts) {
            const fullPath = join(workingDir, artifact);
            if (!existsSync(fullPath)) {
              issues.push(`Missing required artifact: ${artifact}`);
            }
          }

          const passed = issues.length === 0;
          const status = passed ? "✅ PASSED" : "❌ FAILED";

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    agent: args.agent_name,
                    status,
                    passed,
                    score: args.score,
                    threshold: gate.minScore,
                    issues,
                    gate_description: gate.description,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      ),

      // ── get_gate_requirements ──────────────────────────────────
      tool(
        "get_gate_requirements",
        "Get the quality gate requirements for a specific agent",
        {
          agent_name: z.string().describe("Agent name"),
        },
        async (args) => {
          const gate = QUALITY_GATES[args.agent_name];
          if (!gate) {
            return {
              content: [
                {
                  type: "text",
                  text: `No gate defined for: ${args.agent_name}. Known agents: ${Object.keys(QUALITY_GATES).join(", ")}`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    agent: args.agent_name,
                    min_score: gate.minScore,
                    required_artifacts: gate.requiredArtifacts,
                    description: gate.description,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      ),

      // ── pipeline_summary ──────────────────────────────────────
      tool(
        "pipeline_summary",
        "Get a full summary of all quality gates and which have been passed",
        {},
        async () => {
          // Read workflow state if available
          const statePath = join(
            workingDir,
            "data",
            "shared",
            "workflow_state.json"
          );
          let scores: Record<string, number> = {};
          if (existsSync(statePath)) {
            const state = JSON.parse(readFileSync(statePath, "utf-8"));
            scores = state.quality_scores || {};
          }

          const summary = Object.entries(QUALITY_GATES).map(
            ([agent, gate]) => {
              const score = scores[agent];
              let status = "⏳ Pending";
              if (score !== undefined) {
                status =
                  score >= gate.minScore
                    ? `✅ Passed (${score}/${gate.minScore})`
                    : `❌ Failed (${score}/${gate.minScore})`;
              }
              return { agent, status, threshold: gate.minScore };
            }
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(summary, null, 2),
              },
            ],
          };
        }
      ),
    ],
  });
}
