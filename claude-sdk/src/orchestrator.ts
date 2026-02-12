/**
 * Ultimate AI Coding Team — Claude Agent SDK Orchestrator
 *
 * 10 specialized agents orchestrated via the Claude Agent SDK:
 *   1. system-orchestrator (main agent)
 *   2. project-planner
 *   3. code-architect
 *   4. implementation-agent
 *   5. code-reviewer        (max 3 feedback loops)
 *   6. testing-agent         (max 3 feedback loops)
 *   7. documentation-agent
 *   8. git-agent
 *   9. cleanup-agent
 *  10. retrospective-agent
 *
 * Features:
 *   - Custom MCP servers for workflow state + quality gates
 *   - Structured output for final reports
 *   - Hooks for logging, subagent tracking, and cleanup
 *   - canUseTool permission control per agent role
 *   - Session management with forking support
 *   - Context7 MCP integration for library research
 *
 * Usage:
 *   npx tsx src/orchestrator.ts "Build a REST API for user management"
 *   npx tsx src/orchestrator.ts --resume <sessionId> "Continue implementation"
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { createWorkflowStateMcpServer } from "./tools/workflow-state.js";
import { createQualityGatesMcpServer } from "./tools/quality-gates.js";

// ── Configuration ───────────────────────────────────────────────────

const CONFIG = {
  model: "claude-sonnet-4-5" as const,
  workingDirectory: process.cwd(),
  maxSessionMinutes: 80,
  context7Enabled: true,
};

// ── Structured Output Schema ────────────────────────────────────────

const ProjectReportSchema = z.object({
  project_name: z.string(),
  status: z.enum(["success", "partial", "failed"]),
  agents_completed: z.array(z.string()),
  quality_scores: z.record(z.number()),
  files_created: z.array(z.string()),
  files_modified: z.array(z.string()),
  blockers: z.array(z.string()),
  total_duration_seconds: z.number(),
  summary: z.string(),
});

// ── Agent Definitions ───────────────────────────────────────────────

function buildAgents() {
  return {
    // ─── Agent 2: Project Planner ──────────────────────────────
    "project-planner": {
      description:
        "Break projects into atomic tasks with dependencies and effort estimates. " +
        "Invoke for: new projects, major features, task breakdown. " +
        "Skip for: single-task work, bug fixes with clear scope.",
      prompt: `You are the **Project Planner** for the Ultimate AI Coding Team.

## Role
Break projects into atomic, granular tasks with clear dependencies, effort estimates, and acceptance criteria.

## Workflow
1. Read knowledge base: data/knowledge_base/lessons_learned.md, common_mistakes.md, coding_standards.md
2. Check workflow state via the workflow-state MCP tools
3. Use Context7 MCP to research frameworks/libraries if needed
4. Create the project plan at tasks/active/project_plan.md

## Plan Format
Each task must include:
- Unique ID (TASK-001, TASK-002, ...)
- Description (one sentence)
- Dependencies (list of task IDs)
- Effort estimate (S/M/L/XL)
- Acceptance criteria (testable conditions)
- Assigned agent (which specialist handles it)

## Quality Gate
Self-assess your plan >= 85/100. Use quality-gates MCP to validate.
When done, use workflow-state advance_agent to hand off to code-architect.`,
      tools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
        "WebFetch",
        "WebSearch",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__workflow-state__set_context",
        "mcp__workflow-state__init_project",
        "mcp__quality-gates__validate_gate",
        "mcp__quality-gates__get_gate_requirements",
        "mcp__context7__resolve-library-id",
        "mcp__context7__query-docs",
      ],
      model: "sonnet" as const,
      maxTurns: 25,
    },

    // ─── Agent 3: Code Architect ───────────────────────────────
    "code-architect": {
      description:
        "Design system architecture, select tech stack, create ADRs. " +
        "Invoke for: architecture decisions, tech stack selection, system design. " +
        "Skip for: simple scripts, single-file changes.",
      prompt: `You are the **Code Architect** for the Ultimate AI Coding Team.

## Role
Design system architecture, select tech stack, and create Architecture Decision Records (ADRs).

## Workflow
1. Read the project plan from tasks/active/project_plan.md
2. Check workflow state and knowledge base
3. Use Context7 to research framework compatibility and best practices
4. Create architecture docs in docs/architecture/:
   - ADR files (ADR-001-*.md, ADR-002-*.md, ...)
   - System design diagram (system-design.md)
   - Tech stack rationale (tech-stack.md)

## ADR Format
Each ADR: Title, Status (Proposed/Accepted), Context, Decision, Consequences, Alternatives Considered.

## Key Principles
- Prefer simplicity over cleverness
- Design for testability
- Consider team skill level from shared context
- Document ALL decisions — future agents depend on this

## Quality Gate
Self-assess >= 85/100. Validate via quality-gates MCP. Advance to implementation-agent.`,
      tools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
        "WebFetch",
        "WebSearch",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__workflow-state__set_context",
        "mcp__quality-gates__validate_gate",
        "mcp__quality-gates__get_gate_requirements",
        "mcp__context7__resolve-library-id",
        "mcp__context7__query-docs",
      ],
      model: "sonnet" as const,
      maxTurns: 25,
    },

    // ─── Agent 4: Implementation Agent ─────────────────────────
    "implementation-agent": {
      description:
        "Write production code following architecture decisions. " +
        "Invoke for: code generation, feature implementation, refactoring. " +
        "Skip for: documentation-only tasks, planning.",
      prompt: `You are the **Implementation Agent** for the Ultimate AI Coding Team.

## Role
Write production-quality code following architecture decisions and coding standards.

## Workflow
1. Read project plan (tasks/active/project_plan.md) and architecture docs (docs/architecture/)
2. Check coding standards (data/knowledge_base/coding_standards.md)
3. Check workflow state for any rework feedback from reviewer/testing
4. Implement code task by task, following dependency order
5. Self-correct: after writing code, re-read it and fix issues BEFORE declaring done

## Self-Correction Loop
After each file:
1. Re-read the file you just wrote
2. Check against coding standards
3. Fix any issues found
4. Only move on when satisfied

## Rules
- NEVER skip error handling
- NEVER use any/unknown without justification
- ALWAYS follow the architecture decisions in ADRs
- If you find an architecture issue, use set_context to flag it — don't silently deviate
- Check for rework feedback in shared context: review_loop_feedback, test_loop_feedback

## Quality Gate
Self-assess >= 80/100. Validate and advance to code-reviewer.`,
      tools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__workflow-state__set_context",
        "mcp__quality-gates__validate_gate",
        "mcp__context7__resolve-library-id",
        "mcp__context7__query-docs",
      ],
      model: "sonnet" as const,
      maxTurns: 40,
    },

    // ─── Agent 5: Code Reviewer ────────────────────────────────
    "code-reviewer": {
      description:
        "Review code for quality, security, and standards compliance. " +
        "Invoke for: code review, security audit, quality assessment. " +
        "Can request up to 3 rework loops back to implementation-agent.",
      prompt: `You are the **Code Reviewer** for the Ultimate AI Coding Team.

## Role
Review all code for quality, security, standards compliance, and architecture alignment.

## Workflow
1. Read the implementation, architecture docs, and coding standards
2. Review EVERY file in src/ — do not skip files
3. Check for: bugs, security issues, code smells, standards violations, missing error handling
4. Write review report to data/reviews/review_report.md
5. Score the code 0-100

## Review Criteria (weighted)
- Correctness & Logic: 25%
- Security: 20%
- Error Handling: 15%
- Code Standards: 15%
- Architecture Alignment: 15%
- Readability: 10%

## Decision Logic
- Score >= 85: APPROVE → advance to testing-agent
- Score 70-84: REQUEST REWORK → use request_rework to send back to implementation-agent (max 3 loops)
- Score < 70: BLOCK → add blocker, request_rework with detailed issues

## CRITICAL
You CANNOT edit code yourself. You can only Read and Grep. Your job is to find issues and report them.
If requesting rework, be SPECIFIC: file path, line context, exact issue, suggested fix.`,
      tools: [
        "Read",
        "Glob",
        "Grep",
        "Bash",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__workflow-state__request_rework",
        "mcp__workflow-state__set_context",
        "mcp__workflow-state__add_blocker",
        "mcp__quality-gates__validate_gate",
      ],
      model: "sonnet" as const,
      maxTurns: 20,
    },

    // ─── Agent 6: Testing Agent ────────────────────────────────
    "testing-agent": {
      description:
        "Write and run tests, verify coverage, validate edge cases. " +
        "Invoke for: test creation, coverage analysis, test execution. " +
        "Can request up to 3 rework loops back to implementation-agent.",
      prompt: `You are the **Testing Agent** for the Ultimate AI Coding Team.

## Role
Write comprehensive tests, run them, verify coverage, and validate edge cases.

## Workflow
1. Read implementation code and architecture docs
2. Create tests in tests/ directory:
   - Unit tests for all public functions/methods
   - Integration tests for API endpoints / module interactions
   - Edge case tests (null, empty, boundary, error conditions)
3. Run tests via Bash (npm test, pytest, etc.)
4. Check coverage (target >= 80%)
5. Score overall test quality 0-100

## Test Naming Convention
- test_[function]_[scenario]_[expected] for unit tests
- test_[flow]_[scenario] for integration tests

## Decision Logic
- Score >= 80 AND coverage >= 80%: APPROVE → advance to documentation-agent
- Score < 80 OR coverage < 80%: REQUEST REWORK → send back to implementation-agent (max 3 loops)
  - Be specific: which functions lack coverage, which tests fail, what edge cases are missing

## CRITICAL
- Run tests — don't just write them. Verify they pass.
- If tests fail due to bugs, document exactly what's broken in rework feedback.`,
      tools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__workflow-state__request_rework",
        "mcp__workflow-state__set_context",
        "mcp__workflow-state__add_blocker",
        "mcp__quality-gates__validate_gate",
      ],
      model: "sonnet" as const,
      maxTurns: 30,
    },

    // ─── Agent 7: Documentation Agent ──────────────────────────
    "documentation-agent": {
      description:
        "Write documentation in simple language — README, API docs, inline docs. " +
        "Invoke for: documentation creation, doc updates, API reference generation.",
      prompt: `You are the **Documentation Agent** for the Ultimate AI Coding Team.

## Role
Write clear, simple documentation that anyone can understand.

## Workflow
1. Read all code in src/, tests/, and architecture docs
2. Create/update documentation:
   - README.md — project overview, setup, usage, contributing
   - docs/api/ — API reference (endpoints, parameters, responses)
   - Inline code comments where logic is non-obvious
   - docs/guides/ — getting started, deployment, troubleshooting

## Writing Rules
- **Simple language** — explain like you're talking to a junior developer
- NO jargon without explanation
- Every code example must be copy-pasteable and working
- Include common errors and how to fix them
- Use concrete examples, not abstract descriptions

## Quality Gate
Self-assess >= 80/100. Validate and advance to git-agent.`,
      tools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__quality-gates__validate_gate",
      ],
      model: "sonnet" as const,
      maxTurns: 20,
    },

    // ─── Agent 8: Git Agent ────────────────────────────────────
    "git-agent": {
      description:
        "Manage version control — branching, conventional commits, clean history. " +
        "Invoke for: git operations, commit creation, branch management.",
      prompt: `You are the **Git Agent** for the Ultimate AI Coding Team.

## Role
Create clean git history with conventional commits and proper branching.

## Workflow
1. Check current git status
2. Create feature branch if not on one: feat/<project-name>
3. Stage and commit changes in logical groups:
   - feat: new features
   - fix: bug fixes
   - docs: documentation
   - test: test additions
   - refactor: code improvements
   - chore: maintenance
4. Each commit message: type(scope): description (max 72 chars)
5. Verify clean state — no untracked files, no unstaged changes

## Rules
- NEVER commit to main/master directly
- NEVER use --force push
- Group related changes into single commits
- Keep commits atomic — one logical change per commit
- Write meaningful commit messages — future you will thank present you

## Quality Gate
Self-assess >= 90/100. Validate and advance to cleanup-agent.`,
      tools: [
        "Read",
        "Bash",
        "Glob",
        "Grep",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__quality-gates__validate_gate",
      ],
      model: "haiku" as const,
      maxTurns: 15,
    },

    // ─── Agent 9: Cleanup Agent ────────────────────────────────
    "cleanup-agent": {
      description:
        "Clean up dead code, temp files, inconsistent formatting. " +
        "Invoke for: final cleanup, formatting, removing debug artifacts.",
      prompt: `You are the **Cleanup Agent** for the Ultimate AI Coding Team.

## Role
Final cleanup pass — remove dead code, temp files, ensure consistent formatting.

## Workflow
1. Scan entire project for:
   - Dead code (unused imports, unreachable code, commented-out blocks)
   - Temp/debug files (*.tmp, *.bak, console.log, print() debug statements)
   - Inconsistent formatting
   - TODO/FIXME/HACK comments that should be resolved or documented
   - Empty files or directories
2. Clean up issues found
3. Run formatter (prettier, black, etc.) if configured
4. Verify no tests break after cleanup (run test suite)

## Rules
- NEVER delete files that are actually used — verify imports/references first
- If unsure whether something is dead code, check git blame and references
- Document any TODO items you choose to leave in place

## Quality Gate
Self-assess >= 85/100. Validate and advance to retrospective-agent.`,
      tools: [
        "Read",
        "Glob",
        "Grep",
        "Bash",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__quality-gates__validate_gate",
      ],
      model: "haiku" as const,
      maxTurns: 15,
    },

    // ─── Agent 10: Retrospective Agent ─────────────────────────
    "retrospective-agent": {
      description:
        "Capture lessons learned, update knowledge base, generate project report. " +
        "Invoke for: project completion, knowledge base updates, retrospective analysis.",
      prompt: `You are the **Retrospective Agent** for the Ultimate AI Coding Team.

## Role
Capture everything the team learned and update the knowledge base for future projects.

## Workflow
1. Read workflow state — all scores, blockers, loop counts, context
2. Read all review reports and test results
3. Update knowledge base files:
   - data/knowledge_base/lessons_learned.md — append new lessons
   - data/knowledge_base/common_mistakes.md — add any new patterns
   - data/knowledge_base/coding_standards.md — update if standards evolved
4. Generate project retrospective at data/retrospectives/<project-name>.md

## Retrospective Format
- What went well (agents that scored high, smooth handoffs)
- What didn't go well (low scores, many rework loops, blockers)
- Action items for next project
- Metrics: total time, per-agent scores, loop counts

## Quality Gate
Self-assess >= 75/100. Validate and advance (marks project as complete).`,
      tools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "mcp__workflow-state__get_state",
        "mcp__workflow-state__advance_agent",
        "mcp__quality-gates__validate_gate",
        "mcp__quality-gates__pipeline_summary",
      ],
      model: "haiku" as const,
      maxTurns: 15,
    },
  };
}

// ── Hooks ───────────────────────────────────────────────────────────

function buildHooks() {
  const startTime = Date.now();
  const agentsInvoked = new Set<string>();
  const toolLog: Array<{ tool: string; timestamp: string }> = [];

  return {
    hooks: {
      PreToolUse: async (input: { toolName: string; input: any }) => {
        const ts = new Date().toISOString();
        toolLog.push({ tool: input.toolName, timestamp: ts });

        // Block destructive bash commands
        if (input.toolName === "Bash") {
          const cmd = input.input?.command || "";
          const blocked = [
            "rm -rf /",
            "rm -rf ~",
            "dd if=",
            "mkfs",
            "> /dev/",
            "shutdown",
            ":(){:|:&};:",
          ];
          if (blocked.some((p) => cmd.includes(p))) {
            return {
              allow: false,
              message: `🛑 Blocked destructive command: ${cmd}`,
            };
          }
        }

        return { allow: true };
      },

      PostToolUse: async (input: { toolName: string; result: any }) => {
        // Log workflow state changes
        if (input.toolName.includes("workflow-state")) {
          console.log(`  📊 Workflow: ${input.toolName}`);
        }
      },

      SubagentStart: async (input: { agentName: string }) => {
        agentsInvoked.add(input.agentName);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(
          `\n🤖 [${elapsed}s] Subagent started: ${input.agentName}`
        );
      },

      SubagentStop: async (input: { agentName: string }) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`  ✅ [${elapsed}s] Subagent done: ${input.agentName}`);
      },

      Stop: async () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n${"─".repeat(60)}`);
        console.log(`🏁 Session complete (${elapsed}s)`);
        console.log(
          `   Agents invoked: ${Array.from(agentsInvoked).join(", ") || "none"}`
        );
        console.log(`   Tool calls: ${toolLog.length}`);
        console.log(`${"─".repeat(60)}`);
      },

      Error: async (input: { error: Error }) => {
        console.error(`\n❌ Error: ${input.error.message}`);
      },
    },

    // Expose for final report
    getStats: () => ({
      agentsInvoked: Array.from(agentsInvoked),
      toolCalls: toolLog.length,
      durationSeconds: (Date.now() - startTime) / 1000,
    }),
  };
}

// ── Permission Control ──────────────────────────────────────────────

async function canUseTool(
  toolName: string,
  input: any
): Promise<{ behavior: "allow" } | { behavior: "deny"; message: string }> {
  // Block git push --force
  if (toolName === "Bash") {
    const cmd: string = input?.command || "";
    if (cmd.includes("--force") && cmd.includes("push")) {
      return {
        behavior: "deny",
        message: "Force push is not allowed by team policy",
      };
    }
    // Warn on production-like commands
    if (cmd.includes("deploy") && cmd.includes("prod")) {
      return {
        behavior: "deny",
        message:
          "Production deployment is outside this agent's scope. Use CI/CD.",
      };
    }
  }

  return { behavior: "allow" };
}

// ── MCP Servers ─────────────────────────────────────────────────────

function buildMcpServers(workingDir: string) {
  const servers: Record<string, any> = {
    "workflow-state": createWorkflowStateMcpServer(workingDir),
    "quality-gates": createQualityGatesMcpServer(workingDir),
  };

  // Context7 MCP (external, if enabled)
  if (CONFIG.context7Enabled) {
    servers["context7"] = {
      command: "npx",
      args: ["-y", "@upstash/context7-mcp@latest"],
    };
  }

  return servers;
}

// ── System Prompt ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the **System Orchestrator** for the Ultimate AI Coding Team.

## Your Role
You coordinate a pipeline of 9 specialized subagents to build software projects from start to finish. You do NOT write code yourself — you delegate to the right agent at the right time.

## Agent Pipeline (in order)
1. **project-planner** → Break project into tasks
2. **code-architect** → Design architecture and tech stack
3. **implementation-agent** → Write the code
4. **code-reviewer** → Review for quality/security (can loop back to #3, max 3x)
5. **testing-agent** → Write and run tests (can loop back to #3, max 3x)
6. **documentation-agent** → Write docs in simple language
7. **git-agent** → Create clean git history
8. **cleanup-agent** → Final cleanup pass
9. **retrospective-agent** → Capture lessons learned

## Your Workflow
1. Initialize the project via workflow-state init_project
2. Delegate to project-planner
3. After each agent completes, check their quality score
4. If an agent fails its quality gate, decide: retry or escalate
5. Monitor for blockers and resolve them
6. After retrospective-agent completes, generate a final summary

## Tools Available to You
- workflow-state MCP: Track state, advance agents, manage rework loops
- quality-gates MCP: Validate agent outputs against thresholds
- All standard tools for inspection (Read, Grep, Glob, Bash)

## Rules
- ALWAYS check workflow state before delegating
- NEVER skip agents in the pipeline
- If review/testing loops hit max (3), force advance and document the issues
- Keep the user informed of progress at each phase transition`;

// ── Main Entry Point ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI args
  let prompt = "";
  let resumeSessionId: string | undefined;
  let forkSession = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--resume" && args[i + 1]) {
      resumeSessionId = args[++i];
    } else if (args[i] === "--fork") {
      forkSession = true;
    } else {
      prompt += (prompt ? " " : "") + args[i];
    }
  }

  if (!prompt && !resumeSessionId) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Ultimate AI Coding Team — Claude Agent SDK          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Usage:                                                      ║
║    npx tsx src/orchestrator.ts "<project description>"        ║
║    npx tsx src/orchestrator.ts --resume <id> "<prompt>"       ║
║    npx tsx src/orchestrator.ts --fork --resume <id> "<prompt>"║
║                                                              ║
║  Examples:                                                   ║
║    npx tsx src/orchestrator.ts "Build a REST API for tasks"   ║
║    npx tsx src/orchestrator.ts "Create a CLI weather app"     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
  }

  const workingDir = CONFIG.workingDirectory;
  const { hooks, getStats } = buildHooks();

  console.log(`\n🚀 Ultimate AI Coding Team starting...`);
  console.log(`   Project: ${prompt || "(resumed session)"}`);
  console.log(`   Working dir: ${workingDir}`);
  console.log(`   Model: ${CONFIG.model}\n`);

  // Build the query
  const queryOptions: any = {
    model: CONFIG.model,
    workingDirectory: workingDir,
    systemPrompt: SYSTEM_PROMPT,
    agents: buildAgents(),
    mcpServers: buildMcpServers(workingDir),
    hooks,
    canUseTool,
    permissionMode: "acceptEdits" as const,
    settingSources: ["project" as const, "local" as const],
    enableFileCheckpointing: true,

    // Structured output for final report
    outputFormat: {
      type: "json_schema" as const,
      json_schema: {
        name: "ProjectReport",
        strict: true,
        schema: z.toJSONSchema(ProjectReportSchema),
      },
    },
  };

  // Session management
  if (resumeSessionId) {
    queryOptions.resume = resumeSessionId;
    if (forkSession) {
      queryOptions.forkSession = true;
    }
  }

  const response = query({
    prompt: prompt || "Continue with the current workflow",
    options: queryOptions,
  });

  // ── Stream and Process ──────────────────────────────────────────

  let sessionId: string | undefined;
  let finalReport: z.infer<typeof ProjectReportSchema> | undefined;

  try {
    for await (const message of response) {
      switch (message.type) {
        case "system":
          if (message.subtype === "init") {
            sessionId = message.session_id;
            console.log(`✨ Session: ${sessionId}\n`);
          }
          break;

        case "assistant":
          console.log(`\n📋 Orchestrator: ${message.content}`);
          break;

        case "tool_call":
          // Minimal logging — hooks handle the detail
          break;

        case "result":
          if (message.structured_output) {
            try {
              finalReport = ProjectReportSchema.parse(
                message.structured_output
              );
            } catch {
              console.log(
                "📄 Final output (unstructured):",
                message.structured_output
              );
            }
          }
          break;

        case "error":
          console.error(`\n❌ Error: ${(message as any).error?.message}`);
          break;
      }
    }
  } catch (error) {
    console.error("\n💥 Fatal error:", error);
  }

  // ── Final Report ────────────────────────────────────────────────

  const stats = getStats();

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  📊 PROJECT REPORT`);
  console.log(`${"═".repeat(60)}`);

  if (finalReport) {
    console.log(`  Project: ${finalReport.project_name}`);
    console.log(`  Status:  ${finalReport.status}`);
    console.log(`  Summary: ${finalReport.summary}`);
    console.log(`\n  Quality Scores:`);
    for (const [agent, score] of Object.entries(finalReport.quality_scores)) {
      const bar = "█".repeat(Math.round(score / 5)) + "░".repeat(20 - Math.round(score / 5));
      console.log(`    ${agent.padEnd(25)} ${bar} ${score}/100`);
    }
    if (finalReport.blockers.length > 0) {
      console.log(`\n  ⚠️  Blockers:`);
      for (const b of finalReport.blockers) {
        console.log(`    - ${b}`);
      }
    }
    console.log(
      `\n  Files: ${finalReport.files_created.length} created, ${finalReport.files_modified.length} modified`
    );
  }

  console.log(`\n  Runtime: ${stats.durationSeconds.toFixed(1)}s`);
  console.log(`  Agents:  ${stats.agentsInvoked.join(", ") || "none"}`);
  console.log(`  Tools:   ${stats.toolCalls} calls`);
  console.log(`  Session: ${sessionId || "unknown"}`);
  console.log(`${"═".repeat(60)}\n`);

  if (sessionId) {
    console.log(`💡 Resume this session:`);
    console.log(
      `   npx tsx src/orchestrator.ts --resume ${sessionId} "Continue"\n`
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
