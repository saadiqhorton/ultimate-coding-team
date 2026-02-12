# Leveraging CrewAI with the Ultimate Coding Team

This guide explains how to integrate [CrewAI](https://docs.crewai.com/) with the Ultimate Coding Team workflow to get a stronger execution engine, observability, and optional automation while keeping your existing SKILL.md agents and quality gates.

---

## CrewAI as a Backend Service

CrewAI is used as a **backend service** for the Ultimate Coding Team: a long-running HTTP API that accepts workflow requests and runs the crew in the background.

- **Location:** `backend/` in this repo.
- **Stack:** FastAPI + CrewAI; workflows run in background threads.
- **API:** `POST /workflows` to start a run; `GET /workflows/{id}` for status; `GET /workflows/{id}/result` for the outcome.
- **State:** In-memory per run; `data/shared/workflow_state.json` is updated during execution. After the crew finishes, `./scripts/workflow_gate.sh autofix` is run; if it fails, the workflow is marked failed.

See **`backend/README.md`** for quick start, API details, and configuration. The crew definition (agents and tasks) lives in `backend/app/crew/definition.py`; expand it to the full 9-agent pipeline and quality gates as described below.

---

## How Your Workflow Maps to CrewAI

| Ultimate Coding Team | CrewAI Concept | Notes |
|----------------------|----------------|-------|
| System Orchestrator + `workflow_state.json` | **Flow** | Flow = backbone: state, steps, conditional logic, event-driven execution. |
| Project Planner, Code Architect, … (9 agents) | **Crew** (agents + tasks) | One Crew with 9 role-playing Agents and one Task per stage. |
| Each stage (plan → architect → implement → …) | **Task** (with `context` from prior tasks) | Sequential process; each task gets prior outputs as context. |
| Quality gates + “loop back to Implementation” | **ConditionalTask** or **Flow** logic | E.g. “if code_review_score < 85 and loops < 3 → re-run Implementation task”. |
| Smart detection (full vs simple) | **Flow** entry + optional second Crew | Flow decides; complex path runs full Crew, simple path runs minimal Crew or single agent. |
| Knowledge base + MCP (e.g. Context7) | **Knowledge** + **MCP tools** on agents | CrewAI supports Knowledge and MCP servers as tools on agents. |

Your workflow is **sequential with conditional loops** and **human escalation**. CrewAI supports this via:

- **Process.sequential** for the main pipeline.
- **ConditionalTask** or a **Flow** that checks scores and re-runs tasks (e.g. Implementation) up to 3 times.
- **Human-in-the-loop** (e.g. when max loops exceeded) via Flow or callbacks.

---

## Benefits of Adding CrewAI

1. **Execution engine**  
   You get a single Python process that runs the whole pipeline (plan → … → retrospective) with real agent execution instead of relying only on external orchestration (e.g. Cursor reading SKILL.md and handoff).

2. **State and persistence**  
   Flows give you state management and optional persistence/resume, which aligns well with `workflow_state.json` and long-running runs.

3. **Quality gates as code**  
   Gate checks (e.g. score ≥ 85) can be implemented as Flow steps or ConditionalTask conditions, so “loop back to Implementation” is explicit and testable.

4. **Observability**  
   CrewAI’s tracing and integrations (Langfuse, Datadog, etc.) give you metrics and logs per agent/task, which complements your existing `/logs/` layout.

5. **MCP and Context7**  
   Agents that need documentation lookup (Planner, Architect, Implementation, Testing) can use Context7 via CrewAI’s MCP integration (e.g. `mcps=[...]` or `MCPServerStdio`/HTTP), so research stays inside the same run.

6. **Structured outputs**  
   Pydantic outputs per task (e.g. “plan”, “architecture summary”, “review score”) make it easy to feed the next stage and to write conditional logic (e.g. “if review_score < 85 → loop”).

7. **Async and scalability**  
   You can use async kickoff and, later, distribute heavy stages (e.g. testing) if needed.

---

## Integration Strategies

### Option A: Hybrid (recommended first step)

Keep your current design and add CrewAI as an **alternative runner**:

- **Keep:** SKILL.md files, `workflow_state.json`, quality gates, `workflow_gate.sh`, knowledge base, routing table.
- **Add:** A Python “CrewAI runner” that:
  - Defines one **Crew** with 9 agents and one **Task** per stage.
  - Reads/writes `workflow_state.json` (or mirrors it inside a Flow).
  - Implements the same sequence and loops (e.g. with ConditionalTask or a thin Flow).
  - Calls `workflow_gate.sh` (or equivalent checks) before marking the run complete.

**Pros:** No need to change existing Cursor/IDE workflows; you can run the same pipeline headlessly with CrewAI.  
**Cons:** Two ways to run (SKILL.md handoff vs CrewAI); you need to keep them in sync (e.g. same thresholds, same agent order).

### Option B: Flow as orchestrator, Crew as coding team

Use a **Flow** as the top-level orchestrator and your 9 agents as a single **Crew** invoked from the Flow:

- **Flow:**  
  - Smart detection (complexity score).  
  - If simple → run a “simple” Crew (e.g. one agent) or skip to a single task.  
  - If complex → load `workflow_state`, run the full **Crew** (plan → … → retrospective), then update state, run workflow gate, and optionally trigger human review.

- **Crew:**  
  - Sequential process.  
  - Tasks: plan, architect, implement, review, test, document, cleanup, git, retrospective.  
  - Conditional or Flow logic: “if review_score < 85 and loop_count < 3 → re-run implement + review”; same for testing; after 3 failures → escalate (e.g. write to `/tasks/review/` and stop).

**Pros:** One canonical execution path; state and branching live in the Flow.  
**Cons:** More of the logic moves into Python/Flow; SKILL.md can still document each role for humans.

### Option C: Full CrewAI-native

Define everything in CrewAI (agents, tasks, tools, knowledge, MCP). Keep only:

- Directory layout (`/projects/`, `/tasks/`, `/output/`, `/logs/`, etc.).
- Contract: “workflow is complete only when `workflow_gate.sh` passes.”

**Pros:** Single stack; maximum use of CrewAI features.  
**Cons:** Largest shift; SKILL.md become documentation only unless you generate them from CrewAI config.

---

## Practical Implementation Outline (Option A)

1. **Create a CrewAI project (e.g. `crew/` or `runners/crewai/`)**  
   - `requirements.txt`: `crewai`, `crewai-tools`, optional `mcp` for Context7.  
   - One module that defines agents and tasks (see below).

2. **Define agents from your SKILL.md**  
   - One CrewAI `Agent` per role (project_planner, code_architect, implementation_agent, code_reviewer, testing_agent, documentation_agent, cleanup_agent, git_agent, retrospective_agent).  
   - Copy goal/backstory from each SKILL.md; attach tools (file read/write, grep, run tests, git, etc.).  
   - For Planner/Architect/Implementation/Testing: attach MCP (Context7) so they can query docs.

3. **Define one Task per stage**  
   - Each task has `description`, `expected_output`, `agent`, and `context=[previous_task_output]` so the pipeline is sequential.  
   - Use **Pydantic** outputs where useful (e.g. `ReviewOutput(score=int, issues=list[str])` for Code Reviewer).

4. **Implement loops with ConditionalTask or a wrapper Flow**  
   - Example: after Code Reviewer task, a condition `score < 85 and loop_count < 3` → re-run Implementation + Code Reviewer; else proceed to Testing.  
   - Same idea for Testing (re-run Implementation + Testing up to 3 times).  
   - After 3 failures → write escalation file under `/tasks/review/` and stop (human-in-the-loop).

5. **Sync state**  
   - Before/after each task (or at each Flow step), update `workflow_state.json`: `current_agent`, `completed_agents`, `quality_scores`, `loop_counts`.  
   - This keeps your existing dashboards and logs consistent.

6. **Workflow gate**  
   - After the last task (Retrospective), run `./scripts/workflow_gate.sh autofix` (or subprocess). If exit code != 0, do not mark the run as successful and optionally retry or escalate.

7. **Observability**  
   - Enable CrewAI tracing (or Langfuse/Datadog).  
   - Optionally mirror key events into `/logs/traces/` and `/logs/agent_metrics.json` so your current log structure still works.

8. **MCP for Context7**  
   - Configure Context7 as an MCP server (stdio or HTTP).  
   - Attach it to the agents that use it (e.g. `mcps=[...]` or `MCPServerStdio`).  
   - In task descriptions, instruct those agents to use the Context7 tools for documentation lookup.

---

## Example: Minimal Crew definition (pseudo-code)

```python
from crewai import Agent, Task, Crew, Process
from crewai.tasks.conditional_task import ConditionalTask  # if available
# from crewai.flow import Flow  # if using Flows

# Agents (summarized; in practice load from SKILL.md or config)
project_planner = Agent(role="Project Planner", goal="Break projects into atomic tasks...", backstory="...", tools=[...], mcps=[context7_mcp])
code_architect = Agent(role="Code Architect", goal="Design architecture and tech stack...", ...)
implementation_agent = Agent(role="Implementation Agent", goal="Write production code...", ...)
code_reviewer = Agent(role="Code Reviewer", goal="Review code for quality and security...", ...)
# ... testing_agent, documentation_agent, cleanup_agent, git_agent, retrospective_agent

# Tasks with context chain
plan_task = Task(description="Analyze request and produce plan...", agent=project_planner, expected_output="Task breakdown and plan")
architect_task = Task(description="Design architecture...", agent=code_architect, expected_output="Architecture and ADRs", context=[plan_task])
implement_task = Task(description="Implement per architecture...", agent=implementation_agent, expected_output="Production code", context=[architect_task])
review_task = Task(description="Review code; output score and issues...", agent=code_reviewer, expected_output="Review report with score", context=[implement_task], output_pydantic=ReviewOutput)
# ... then testing_task, docs_task, cleanup_task, git_task, retrospective_task

# Crew with sequential process
coding_crew = Crew(
    agents=[project_planner, code_architect, implementation_agent, code_reviewer, ...],
    tasks=[plan_task, architect_task, implement_task, review_task, ...],
    process=Process.sequential,
)

# Run (in practice wrap in Flow for state + conditional loops + gate)
result = coding_crew.kickoff(inputs={"request": user_request})
# Update workflow_state.json from result; run workflow_gate.sh; handle escalation
```

You would then add ConditionalTasks or a Flow to implement “if review_score < 85 and loops < 3 → re-run implement + review” and the same for testing, plus escalation to `/tasks/review/`.

---

## Summary

- **Use CrewAI to:** run your 9-agent pipeline in one process, enforce quality gates and loops in code, add observability, and plug Context7 in via MCP.  
- **Keep:** SKILL.md, `workflow_state.json`, `workflow_gate.sh`, and directory layout so the system stays compatible with your current file-based coordination and Cursor workflows.  
- **Start with Option A (hybrid):** add a CrewAI runner alongside the existing flow, then consider moving orchestration into a Flow (Option B) once you’re comfortable.

For full details on CrewAI, see [CrewAI Introduction](https://docs.crewai.com/introduction), [Processes](https://docs.crewai.com/en/concepts/processes), [Conditional Tasks](https://docs.crewai.com/en/learn/conditional-tasks), and [MCP Overview](https://docs.crewai.com/en/mcp/overview).

---

## Viewing CrewAI runs in a web UI

You can view agent runs, traces, and metrics from the CrewAI side in several ways:

### 1. CrewAI AMP / Crew Studio (CrewAI’s own UI)

- **What:** CrewAI’s hosted platform with a web dashboard (Crew Studio, Traces, automations).
- **URL:** [app.crewai.com](https://app.crewai.com) (sign in with email or Google).
- **Use when:** You use or evaluate CrewAI’s **enterprise/cloud** offering (AMP). Gives built-in traces, crew management, and human-in-the-loop.
- **Note:** This is their commercial product; self-hosted/open-source backend runs do not automatically appear there unless you deploy or connect to AMP.

### 2. Arize Phoenix (local web UI, free)

- **What:** Open-source LLM observability; run the Phoenix server locally and get a **web UI** for traces (agent steps, tool calls, LLM calls).
- **How:** See the step-by-step guide **`docs/PHOENIX_SETUP.md`**. In short: install `arize-phoenix` and `openinference-instrumentation-crewai`, run `phoenix serve`, set `UCT_PHOENIX_ENDPOINT=http://localhost:6006`, and start the backend; traces appear at http://localhost:6006.
- **Use when:** You want a **local, free** web UI to inspect runs from your CrewAI backend without using CrewAI cloud.

### 3. Langfuse (self-hosted or cloud)

- **What:** Open-source LLM engineering platform with tracing and analytics; has a web UI.
- **How:** Self-host Langfuse or use their cloud, then add the [CrewAI + Langfuse](https://docs.crewai.com/en/observability/langfuse) integration so your crew sends traces to Langfuse.
- **Use when:** You already use or prefer Langfuse for observability.

### 4. Other backends (Langtrace, OpenLIT, Datadog, etc.)

CrewAI supports many [observability integrations](https://docs.crewai.com/en/observability/overview). Any that provide a web dashboard (e.g. Langtrace, OpenLIT, Datadog) will let you view runs from the CrewAI side once the backend is instrumented.

**Practical choice for a local web UI:** Run **Phoenix** (`phoenix serve` → http://localhost:6006) and instrument the backend with OpenInference/CrewAI so each workflow run shows up as traces in the Phoenix UI.

---

## Backend service summary

| What | Where |
|------|--------|
| Run the service | `cd backend && uvicorn app.main:app --reload --port 8000` (from workspace root: `uvicorn backend.app.main:app --reload --port 8000`) |
| API docs | http://localhost:8000/docs |
| Start workflow | `POST /workflows` with body `{"request": "Add feature X", "project_name": "my-app"}` |
| Status / result | `GET /workflows/{workflow_id}` and `GET /workflows/{workflow_id}/result` |
| Crew definition | `backend/app/crew/definition.py` (expand to 9 agents + quality gates) |
| Config | Env vars `UCT_*`; see `backend/README.md` |
