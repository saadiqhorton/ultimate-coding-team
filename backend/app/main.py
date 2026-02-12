"""FastAPI application: CrewAI backend service for the Ultimate Coding Team."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.config import settings
from app.models import (
    StartWorkflowRequest,
    StartWorkflowResponse,
    WorkflowResultResponse,
    WorkflowStatus,
    WorkflowStatusResponse,
)
from app.crew_runner import start_workflow_background
from app.store import store


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Shutdown: optional cleanup
    pass


app = FastAPI(
    title="Ultimate Coding Team – CrewAI Backend",
    description="Backend service that runs the Ultimate Coding Team workflow via CrewAI.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ultimate-coding-team-backend"}


@app.post("/workflows", response_model=StartWorkflowResponse)
async def start_workflow(body: StartWorkflowRequest):
    """Start a new workflow. Runs in the background; use GET /workflows/{id} for status."""
    workflow_id = start_workflow_background(
        request=body.request,
        project_name=body.project_name,
    )
    return StartWorkflowResponse(
        workflow_id=workflow_id,
        status=WorkflowStatus.PENDING,
        message="Workflow accepted and queued.",
    )


@app.get("/workflows/{workflow_id}", response_model=WorkflowStatusResponse)
async def get_workflow_status(workflow_id: str):
    """Get current status of a workflow run."""
    try:
        run = store.get_or_404(workflow_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return WorkflowStatusResponse(**run.to_status_dict())


@app.get("/workflows/{workflow_id}/result", response_model=WorkflowResultResponse)
async def get_workflow_result(workflow_id: str):
    """Get the result of a workflow (when completed or failed)."""
    try:
        run = store.get_or_404(workflow_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return WorkflowResultResponse(**run.to_result_dict())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
