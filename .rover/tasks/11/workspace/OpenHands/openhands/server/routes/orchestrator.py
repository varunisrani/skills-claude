"""
API Routes for TaskOrchestrator

This module provides REST API endpoints for the TaskOrchestrator,
enabling web/API access to the Claude Agent SDK integration.

Endpoints:
    POST /api/orchestrator/task - Execute a simple task
    POST /api/orchestrator/github-issue - Resolve a GitHub issue
    GET /api/orchestrator/status/{task_id} - Get task status
    GET /api/orchestrator/result/{task_id} - Get task result

Usage:
    # Simple task
    curl -X POST http://localhost:3000/api/orchestrator/task \\
        -H "Content-Type: application/json" \\
        -d '{"task": "Fix the authentication bug", "agent_type": "code"}'

    # GitHub issue
    curl -X POST http://localhost:3000/api/orchestrator/github-issue \\
        -H "Content-Type: application/json" \\
        -d '{"title": "Add auth", "body": "Implement user authentication"}'
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field

from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.controller.state.state import State
from openhands.core.config import OpenHandsConfig
from openhands.core.schema import AgentState
from openhands.core.setup import (
    create_runtime,
    generate_sid,
    get_provider_tokens,
)
from openhands.events import EventStream
from openhands.runtime.base import Runtime
from openhands.utils.async_utils import call_async_from_sync
from openhands.utils.utils import create_registry_and_conversation_stats

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/orchestrator", tags=["orchestrator"])

# Task storage (in production, use a database)
task_storage: Dict[str, Dict[str, Any]] = {}


# Request/Response Models

class TaskRequest(BaseModel):
    """Request model for simple task execution."""
    task: str = Field(..., description="Task description")
    agent_type: str = Field("code", description="Agent type (code, analysis, testing, etc.)")
    workspace: Optional[str] = Field(None, description="Workspace directory")
    max_iterations: Optional[int] = Field(30, description="Maximum iterations")


class GitHubIssueRequest(BaseModel):
    """Request model for GitHub issue resolution."""
    title: str = Field(..., description="Issue title")
    body: str = Field("", description="Issue description")
    repo_path: Optional[str] = Field(None, description="Repository path")
    workspace: Optional[str] = Field(None, description="Workspace directory")
    max_iterations: Optional[int] = Field(50, description="Maximum iterations")


class TaskResponse(BaseModel):
    """Response model for task submission."""
    task_id: str = Field(..., description="Unique task ID")
    status: str = Field(..., description="Task status")
    message: str = Field(..., description="Status message")


class TaskStatusResponse(BaseModel):
    """Response model for task status."""
    task_id: str
    status: str
    agent_state: Optional[str] = None
    iteration: Optional[int] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class TaskResultResponse(BaseModel):
    """Response model for task result."""
    task_id: str
    status: str
    agent_state: Optional[str] = None
    iteration: Optional[int] = None
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


# Background task execution

async def execute_task_background(
    task_id: str,
    config: OpenHandsConfig,
    task: str,
    agent_type: str,
    workspace: str,
):
    """
    Execute a task in the background.

    Args:
        task_id: Task ID
        config: OpenHands configuration
        task: Task description
        agent_type: Agent type
        workspace: Workspace directory
    """
    logger.info(f"Starting background task {task_id}")

    try:
        # Update status
        task_storage[task_id]["status"] = "running"
        task_storage[task_id]["agent_state"] = "RUNNING"

        # Create runtime
        sid = generate_sid(config)
        llm_registry, conversation_stats, config = create_registry_and_conversation_stats(
            config, sid, None
        )

        runtime = create_runtime(
            config,
            llm_registry,
            sid=sid,
            headless_mode=True,
            agent=None,
            git_provider_tokens=get_provider_tokens(),
        )
        call_async_from_sync(runtime.connect)

        event_stream = runtime.event_stream

        # Create orchestrator adapter
        adapter = OrchestratorAdapter(
            config=config,
            event_stream=event_stream,
            workspace=workspace,
            conversation_stats=conversation_stats,
        )

        # Run task
        state = await adapter.run(
            task=task,
            agent_type=agent_type,
        )

        # Update result
        task_storage[task_id]["status"] = "completed"
        task_storage[task_id]["agent_state"] = state.agent_state.value
        task_storage[task_id]["iteration"] = state.iteration
        task_storage[task_id]["error"] = state.last_error
        task_storage[task_id]["completed_at"] = datetime.now().isoformat()
        task_storage[task_id]["result"] = {
            "agent_state": state.agent_state.value,
            "iteration": state.iteration,
        }

        logger.info(f"Task {task_id} completed with state: {state.agent_state}")

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}", exc_info=True)
        task_storage[task_id]["status"] = "failed"
        task_storage[task_id]["agent_state"] = "ERROR"
        task_storage[task_id]["error"] = str(e)
        task_storage[task_id]["completed_at"] = datetime.now().isoformat()


async def execute_github_issue_background(
    task_id: str,
    config: OpenHandsConfig,
    title: str,
    body: str,
    repo_path: Optional[str],
    workspace: str,
):
    """
    Execute a GitHub issue resolution in the background.

    Args:
        task_id: Task ID
        config: OpenHands configuration
        title: Issue title
        body: Issue body
        repo_path: Repository path
        workspace: Workspace directory
    """
    logger.info(f"Starting GitHub issue task {task_id}")

    try:
        # Update status
        task_storage[task_id]["status"] = "running"
        task_storage[task_id]["agent_state"] = "RUNNING"

        # Create runtime
        sid = generate_sid(config)
        llm_registry, conversation_stats, config = create_registry_and_conversation_stats(
            config, sid, None
        )

        runtime = create_runtime(
            config,
            llm_registry,
            sid=sid,
            headless_mode=True,
            agent=None,
            git_provider_tokens=get_provider_tokens(),
        )
        call_async_from_sync(runtime.connect)

        event_stream = runtime.event_stream

        # Use workspace as repo_path if not provided
        if repo_path is None:
            repo_path = workspace

        # Create orchestrator adapter
        adapter = OrchestratorAdapter(
            config=config,
            event_stream=event_stream,
            workspace=workspace,
            conversation_stats=conversation_stats,
        )

        # Run GitHub issue workflow
        state = await adapter.run_github_issue(
            issue_title=title,
            issue_body=body,
            repo_path=repo_path,
        )

        # Update result
        task_storage[task_id]["status"] = "completed"
        task_storage[task_id]["agent_state"] = state.agent_state.value
        task_storage[task_id]["iteration"] = state.iteration
        task_storage[task_id]["error"] = state.last_error
        task_storage[task_id]["completed_at"] = datetime.now().isoformat()
        task_storage[task_id]["result"] = {
            "agent_state": state.agent_state.value,
            "iteration": state.iteration,
        }

        logger.info(f"GitHub issue task {task_id} completed with state: {state.agent_state}")

    except Exception as e:
        logger.error(f"GitHub issue task {task_id} failed: {e}", exc_info=True)
        task_storage[task_id]["status"] = "failed"
        task_storage[task_id]["agent_state"] = "ERROR"
        task_storage[task_id]["error"] = str(e)
        task_storage[task_id]["completed_at"] = datetime.now().isoformat()


# API Endpoints

@router.post("/task", response_model=TaskResponse)
async def execute_task(
    request: TaskRequest,
    background_tasks: BackgroundTasks,
) -> TaskResponse:
    """
    Execute a simple task using TaskOrchestrator.

    This runs the task in the background and returns immediately
    with a task ID that can be used to check status.

    Args:
        request: Task request
        background_tasks: FastAPI background tasks

    Returns:
        TaskResponse with task ID
    """
    # Generate task ID
    task_id = str(uuid4())

    # Create task entry
    task_storage[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "agent_state": "INIT",
        "iteration": 0,
        "error": None,
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "result": None,
    }

    # Get config (in production, get from session/auth)
    from openhands.core.config import OpenHandsConfig
    config = OpenHandsConfig()
    config.max_iterations = request.max_iterations

    # Set workspace
    workspace = request.workspace or "/workspace"

    # Add background task
    background_tasks.add_task(
        execute_task_background,
        task_id=task_id,
        config=config,
        task=request.task,
        agent_type=request.agent_type,
        workspace=workspace,
    )

    return TaskResponse(
        task_id=task_id,
        status="pending",
        message="Task submitted for execution",
    )


@router.post("/github-issue", response_model=TaskResponse)
async def execute_github_issue(
    request: GitHubIssueRequest,
    background_tasks: BackgroundTasks,
) -> TaskResponse:
    """
    Resolve a GitHub issue using TaskOrchestrator.

    This uses the execute_github_issue_workflow pattern which is
    optimized for SWE-bench-style tasks.

    Args:
        request: GitHub issue request
        background_tasks: FastAPI background tasks

    Returns:
        TaskResponse with task ID
    """
    # Generate task ID
    task_id = str(uuid4())

    # Create task entry
    task_storage[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "agent_state": "INIT",
        "iteration": 0,
        "error": None,
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "result": None,
    }

    # Get config (in production, get from session/auth)
    from openhands.core.config import OpenHandsConfig
    config = OpenHandsConfig()
    config.max_iterations = request.max_iterations

    # Set workspace
    workspace = request.workspace or "/workspace"

    # Add background task
    background_tasks.add_task(
        execute_github_issue_background,
        task_id=task_id,
        config=config,
        title=request.title,
        body=request.body,
        repo_path=request.repo_path,
        workspace=workspace,
    )

    return TaskResponse(
        task_id=task_id,
        status="pending",
        message="GitHub issue task submitted for execution",
    )


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str) -> TaskStatusResponse:
    """
    Get the status of a task.

    Args:
        task_id: Task ID

    Returns:
        TaskStatusResponse with current status
    """
    if task_id not in task_storage:
        raise HTTPException(status_code=404, detail="Task not found")

    task_info = task_storage[task_id]

    return TaskStatusResponse(
        task_id=task_id,
        status=task_info["status"],
        agent_state=task_info.get("agent_state"),
        iteration=task_info.get("iteration"),
        error=task_info.get("error"),
        started_at=task_info.get("started_at"),
        completed_at=task_info.get("completed_at"),
    )


@router.get("/result/{task_id}", response_model=TaskResultResponse)
async def get_task_result(task_id: str) -> TaskResultResponse:
    """
    Get the result of a completed task.

    Args:
        task_id: Task ID

    Returns:
        TaskResultResponse with result

    Raises:
        HTTPException: If task not found or not completed
    """
    if task_id not in task_storage:
        raise HTTPException(status_code=404, detail="Task not found")

    task_info = task_storage[task_id]

    if task_info["status"] not in ("completed", "failed"):
        raise HTTPException(
            status_code=400,
            detail=f"Task not completed yet. Status: {task_info['status']}"
        )

    return TaskResultResponse(
        task_id=task_id,
        status=task_info["status"],
        agent_state=task_info.get("agent_state"),
        iteration=task_info.get("iteration"),
        error=task_info.get("error"),
        result=task_info.get("result"),
        started_at=task_info.get("started_at"),
        completed_at=task_info.get("completed_at"),
    )


# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "orchestrator",
        "active_tasks": len([t for t in task_storage.values() if t["status"] == "running"]),
    }
