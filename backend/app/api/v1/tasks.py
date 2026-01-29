"""Task management API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.database import get_session
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.auth.jwt import get_current_user, User

router = APIRouter()


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a new task for the authenticated user.

    Args:
        task_data: Task creation data (title, description)
        current_user: Authenticated user from JWT token
        session: Database session

    Returns:
        TaskResponse: Created task with all fields

    Security:
        - Requires valid JWT token in Authorization header
        - Task is automatically associated with authenticated user
    """
    # Create new task instance
    task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description,
        completed=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    # Persist to database
    session.add(task)
    session.commit()
    session.refresh(task)

    return task


@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get all tasks for the authenticated user.

    Args:
        current_user: Authenticated user from JWT token
        session: Database session

    Returns:
        List[TaskResponse]: List of user's tasks, ordered by created_at descending

    Security:
        - Requires valid JWT token in Authorization header
        - Only returns tasks belonging to authenticated user (user data isolation)
    """
    # Query tasks filtered by user_id, ordered by created_at descending
    statement = (
        select(Task)
        .where(Task.user_id == current_user.id)
        .order_by(Task.created_at.desc())
    )

    tasks = session.exec(statement).all()
    return tasks


@router.patch("/tasks/{task_id}/complete", response_model=TaskResponse)
def toggle_task_completion(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Toggle task completion status (for User Story 2).

    Args:
        task_id: ID of task to toggle
        current_user: Authenticated user from JWT token
        session: Database session

    Returns:
        TaskResponse: Updated task

    Raises:
        HTTPException 404: If task not found or doesn't belong to user

    Security:
        - Verifies task ownership (user_id matches authenticated user)
        - Returns 404 for unauthorized access (prevents user enumeration)
    """
    # Query task with ownership verification
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user.id
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Toggle completion status
    task.completed = not task.completed
    task.mark_updated()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Update task title and/or description (for User Story 3).

    Args:
        task_id: ID of task to update
        task_data: Updated fields (title, description)
        current_user: Authenticated user from JWT token
        session: Database session

    Returns:
        TaskResponse: Updated task

    Raises:
        HTTPException 404: If task not found or doesn't belong to user

    Security:
        - Verifies task ownership (user_id matches authenticated user)
        - Returns 404 for unauthorized access (prevents user enumeration)
        - Preserves task ownership, completion status, and created_at
    """
    # Query task with ownership verification
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user.id
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update fields if provided
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description

    task.mark_updated()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Delete a task (for User Story 4).

    Args:
        task_id: ID of task to delete
        current_user: Authenticated user from JWT token
        session: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException 404: If task not found or doesn't belong to user

    Security:
        - Verifies task ownership (user_id matches authenticated user)
        - Returns 404 for unauthorized access (prevents user enumeration)
    """
    # Query task with ownership verification
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user.id
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Delete task
    session.delete(task)
    session.commit()

    return {
        "success": True,
        "data": {"message": "Task deleted successfully"}
    }
