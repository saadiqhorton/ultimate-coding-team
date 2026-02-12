"""Request/response and workflow state models for the API."""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class WorkflowStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StartWorkflowRequest(BaseModel):
    """Request body for starting a new workflow."""

    request: str = Field(..., description="User request / feature description")
    project_name: str | None = Field(None, description="Project name; derived from request if omitted")
    force_full_workflow: bool = Field(False, description="If true, skip smart detection and run full pipeline")


class StartWorkflowResponse(BaseModel):
    """Response after submitting a workflow."""

    workflow_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    message: str = "Workflow accepted and queued."


class WorkflowStatusResponse(BaseModel):
    """Current workflow status."""

    workflow_id: str
    status: WorkflowStatus
    project_name: str | None
    current_agent: str | None
    completed_agents: list[str]
    pending_agents: list[str]
    quality_scores: dict[str, Any]
    loop_counts: dict[str, int]
    human_review_required: bool
    started_at: datetime | None
    completed_at: datetime | None
    error: str | None = None


class WorkflowResultResponse(BaseModel):
    """Workflow result (when completed)."""

    workflow_id: str
    status: WorkflowStatus
    final_score: float | None
    output_summary: str | None = None
    completed_at: datetime | None
    error: str | None = None
