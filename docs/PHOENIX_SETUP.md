# Arize Phoenix setup for the Ultimate Coding Team

This guide walks you through setting up **Arize Phoenix** so you can view CrewAI workflow runs in a **web UI** (traces, agent steps, LLM calls).

---

## What you get

- **Phoenix UI** at http://localhost:6006: project list, trace timeline, span details.
- **CrewAI traces**: each workflow run appears as a trace; you can drill into tasks, tool calls, and LLM requests.

---

## "I've got it up and running — now what?"

1. **Trigger a workflow** so the crew runs and traces appear in Phoenix:
   ```bash
   curl -X POST http://localhost:8000/workflows \
     -H "Content-Type: application/json" \
     -d '{"request": "Add a health check endpoint to the API"}'
   ```
   Or open **http://localhost:8000/docs** and use the **POST /workflows** "Try it out" with the same JSON body.

2. **Check the response** for a `workflow_id` (e.g. `wf_20260207_001`). The workflow runs in the background.

3. **Open Phoenix** at http://localhost:6006 → select project **ultimate-coding-team** → open the latest trace to see agent steps, tool calls, and LLM spans.

4. **Poll status or result** (optional):
   ```bash
   curl http://localhost:8000/workflows/wf_20260207_001
   curl http://localhost:8000/workflows/wf_20260207_001/result
   ```

5. **Next:** Expand the crew in `backend/app/crew/definition.py` to the full 9-agent pipeline and quality gates (see `docs/CREWAI_INTEGRATION_GUIDE.md`).

---

## Quick setup with a virtual environment

Use a single virtual environment for both the backend and Phoenix so everything is in one place.

From the **workspace root**:

```bash
# 1. Create and activate a virtual environment (backend/.venv)
#    Use Python 3.10–3.13 (CrewAI does not support 3.14 yet). If your default is 3.14, use:
#    python3.12 -m venv .venv   # or python3.11 / python3.13
cd backend
python3 -m venv .venv            # or: python3.12 -m venv .venv
source .venv/bin/activate        # Linux/macOS
#  .venv\Scripts\activate        # Windows

# 2. Install backend + Phoenix and CrewAI instrumentation
pip install -r requirements.txt -r requirements-phoenix.txt

# 3. Leave this terminal with the venv active for the next steps
```

From here on, use **two terminals**, both with the same venv activated (so `phoenix` and `uvicorn` are on your PATH).

---

## Step 1: Start the Phoenix server (web UI)

In **terminal 1**, activate the venv and start Phoenix:

```bash
cd backend
source .venv/bin/activate          # Linux/macOS (Windows: .venv\Scripts\activate)
phoenix serve
```

- **UI:** open **http://localhost:6006** in your browser.
- **OTLP endpoint:** Phoenix accepts traces at `http://localhost:6006` (HTTP). The backend uses this by default.

Leave this terminal running.

---

## Step 2: Point the backend at Phoenix

In **terminal 2**, set the collector endpoint so the backend sends traces to Phoenix:

```bash
export UCT_PHOENIX_ENDPOINT=http://localhost:6006

# If your Phoenix UI runs on another host/port:
# export UCT_PHOENIX_ENDPOINT=http://your-host:6006
```

Optional: use a `.env` file in `backend/` so you don’t need to export every time:

```bash
# backend/.env
UCT_PHOENIX_ENDPOINT=http://localhost:6006
```

---

## Step 3: Start the Ultimate Coding Team backend

In **terminal 2** (with the venv activated and `UCT_PHOENIX_ENDPOINT` set if desired):

**You must run uvicorn from inside `backend/`** so the `app` package is found:

```bash
cd /path/to/ultimate-coding-team-gh/backend
source .venv/bin/activate          # if not already active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you prefer to stay at the workspace root, set `PYTHONPATH` first:

```bash
cd /path/to/ultimate-coding-team-gh
source backend/.venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend reads `UCT_PHOENIX_ENDPOINT` and, if set, registers OpenTelemetry with Phoenix and instruments CrewAI. No code changes are required.

---

## Step 4: Run a workflow and open the UI

1. **Trigger a workflow** (e.g. with curl or the API docs at http://localhost:8000/docs):
   ```bash
   curl -X POST http://localhost:8000/workflows \
     -H "Content-Type: application/json" \
     -d '{"request": "Add a health check endpoint"}'
   ```
2. **Open Phoenix:** http://localhost:6006  
3. **Select the project** (e.g. **ultimate-coding-team**).  
4. **Open the latest trace** to see agent tasks, tool calls, and LLM spans.

---

## Checklist

| Step | Command / action |
|------|-------------------|
| 0. Venv | `cd backend && python3 -m venv .venv && source .venv/bin/activate` |
| 1. Install | `pip install -r requirements.txt -r requirements-phoenix.txt` |
| 2. Start Phoenix | `phoenix serve` (terminal 1, venv active) |
| 3. Set endpoint | `export UCT_PHOENIX_ENDPOINT=http://localhost:6006` (terminal 2) |
| 4. Start backend | `uvicorn backend.app.main:app --reload --port 8000` (terminal 2, venv active) |
| 5. Open UI | http://localhost:6006 |
| 6. Trigger run | `POST /workflows` with a request body |

---

## Troubleshooting

**No traces in Phoenix**

- Ensure **Phoenix is running** (`phoenix serve`) before you start the backend and trigger a workflow.
- Confirm **`UCT_PHOENIX_ENDPOINT`** is set in the environment where the backend runs (`echo $UCT_PHOENIX_ENDPOINT`).
- Restart the backend after setting the env var so it picks up the value.

**Phoenix port in use**

- Change the port: `PHOENIX_PORT=6007 phoenix serve`, then set `UCT_PHOENIX_ENDPOINT=http://localhost:6007`.

**CrewAI instrumentation not installed**

- Install: `pip install openinference-instrumentation-crewai`. The backend will skip instrumentation if the package is missing (traces simply won’t appear).

**Backend runs but no CrewAI spans**

- The telemetry setup runs only when a workflow is executed (in the worker thread). Trigger at least one `POST /workflows` and wait for the crew to run; then check Phoenix again.

---

## Virtual environment location

The guide uses **`backend/.venv`** so that:

- Backend and Phoenix share one venv (simpler install and upgrades).
- `phoenix serve` and `uvicorn` are available after activation.
- You can use a different path (e.g. `.venv` at the repo root) if you prefer; just activate it in both terminals before running Phoenix and the backend.

---

## References

- [Phoenix – Setup OTEL](https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/setup-using-phoenix-otel)
- [CrewAI – Arize Phoenix](https://docs.crewai.com/en/observability/arize-phoenix)
- Backend config: `backend/app/config.py` (`phoenix_endpoint`), `backend/app/telemetry.py`
