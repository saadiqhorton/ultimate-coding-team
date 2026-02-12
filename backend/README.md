# Ultimate Coding Team – CrewAI Backend Service

This directory contains a **backend service** that runs the Ultimate Coding Team workflow using CrewAI as the execution engine. Clients (CLI, IDE, or other services) send requests over HTTP and poll for status and results.

## Quick start

Create a virtualenv and run the service **from inside `backend/`** (so the `app` module is found):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run the service (must be from backend/ directory)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The service will still see `data/`, `scripts/`, etc. because it resolves the workspace root from the backend path. To run from the workspace root instead, set `PYTHONPATH`:

```bash
cd /path/to/ultimate-coding-team-gh
source backend/.venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/workflows` | Start a new workflow (body: `request`, optional `project_name`, `force_full_workflow`) |
| GET | `/workflows/{workflow_id}` | Get current status |
| GET | `/workflows/{workflow_id}/result` | Get result (summary, final score, error) |

### Start a workflow

```bash
curl -X POST http://localhost:8000/workflows \
  -H "Content-Type: application/json" \
  -d '{"request": "Add a health check endpoint to the API"}'
```

Response:

```json
{
  "workflow_id": "wf_20260207_001",
  "status": "pending",
  "message": "Workflow accepted and queued."
}
```

### Poll status

```bash
curl http://localhost:8000/workflows/wf_20260207_001
```

### Get result

```bash
curl http://localhost:8000/workflows/wf_20260207_001/result
```

## Configuration

Environment variables (optional), prefix `UCT_`:

| Variable | Default | Description |
|----------|---------|-------------|
| `UCT_WORKSPACE_ROOT` | Parent of `backend/` | Workspace root (data/, scripts/, etc.) |
| `UCT_HOST` | `0.0.0.0` | Bind host |
| `UCT_PORT` | `8000` | Bind port |

The service expects the standard Ultimate Coding Team layout: `data/shared/`, `scripts/workflow_gate.sh`, `logs/`, `tasks/`, `output/`, `projects/`.

## Crew definition

Agents and tasks are defined in `app/crew/definition.py`. The default is a **minimal two-agent crew** (Project Planner → Implementation Agent) so the service runs end-to-end without full setup. To use the full 9-agent pipeline and quality gates:

1. Add all 9 agents (from SKILL.md goals/backstories).
2. Add one Task per stage with `context=[previous_task]`.
3. Implement review/test loops (e.g. ConditionalTask or a wrapper Flow) and escalation to `/tasks/review/`.

See `docs/CREWAI_INTEGRATION_GUIDE.md` for the full design.

## State and gate

- The service keeps **in-memory** state per run (status, scores, result). Restarting the process clears it; for persistence you can add a DB or file-based store.
- When the crew finishes, the service runs `./scripts/workflow_gate.sh autofix`. If the gate fails, the workflow is marked **failed** and the error message is set.

## Workflow failed / no traces in Phoenix

If the workflow shows **failed** in `data/shared/workflow_state.json` or you don’t see traces in Phoenix:

1. **Get the error message**
   - **API:** `GET /workflows/{workflow_id}/result` → response includes an `error` field.
   - **File:** `data/shared/workflow_state.json` → look at `"error"` and `"escalation_reason"`.
   - **Logs:** `logs/errors/` → new runs write a markdown file per failure (e.g. `20260208-052340-wf_20260208_001-error.md`) with the exception and traceback.

2. **Common cause: missing LLM API key**  
   CrewAI’s agents use an LLM (typically OpenAI). Set one of:
   ```bash
   export OPENAI_API_KEY="sk-..."
   # or for another provider, see CrewAI env docs
   ```
   Restart the backend after setting the variable, then trigger a new workflow.

3. **Phoenix:** Traces appear only for **successful** crew execution up to the point of sending spans. If the crew crashes before or during the first LLM call, you may see no trace. Fix the error (e.g. API key) and run again.

## Web UI for viewing CrewAI runs (optional)

To view agent runs, traces, and LLM calls in a **web UI** with **Arize Phoenix**:

1. **Install and start Phoenix** (see full steps in **`docs/PHOENIX_SETUP.md`**):
   ```bash
   pip install -r backend/requirements-phoenix.txt
   phoenix serve
   ```
   Open **http://localhost:6006** in your browser.

2. **Send traces from the backend:** set `UCT_PHOENIX_ENDPOINT=http://localhost:6006` and run the backend. Traces will appear in the Phoenix UI when you trigger a workflow.

3. **Alternative:** Use [CrewAI AMP](https://app.crewai.com) or another integration (Langfuse, Langtrace). See **`docs/CREWAI_INTEGRATION_GUIDE.md`** → “Viewing CrewAI runs in a web UI”.
