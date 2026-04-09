from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskStatusUpdate

router = APIRouter()


def compute_priority(difficulty: int, deadline, importance_flag: bool) -> float:
    """Compute task priority score."""
    now = datetime.now(timezone.utc)
    if deadline:
        days_left = max(0, (deadline - now).total_seconds() / 86400)
        urgency = max(0, 1 - days_left / 30)
    else:
        urgency = 0.5
    return round((difficulty / 5) * 0.4 + urgency * 0.4 + (1.0 if importance_flag else 0.0) * 0.2, 3)


@router.post("", response_model=TaskOut)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    priority = compute_priority(task_data.difficulty, task_data.deadline, task_data.importance_flag)

    task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description,
        subject=task_data.subject,
        deadline=task_data.deadline,
        difficulty=task_data.difficulty,
        importance_flag=task_data.importance_flag,
        priority_score=priority,
        estimated_mins=task_data.estimated_mins,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("", response_model=List[TaskOut])
async def get_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    subject: Optional[str] = None,
    sort_by: str = "priority",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).where(Task.user_id == current_user.id)

    if status_filter:
        query = query.where(Task.status == status_filter)
    else:
        # Exclude archived by default
        query = query.where(Task.status != TaskStatus.ARCHIVED)

    if subject:
        query = query.where(Task.subject == subject)

    if sort_by == "priority":
        query = query.order_by(desc(Task.priority_score))
    elif sort_by == "deadline":
        query = query.order_by(Task.deadline.asc().nullslast())
    else:
        query = query.order_by(desc(Task.created_at))

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/today", response_model=List[TaskOut])
async def get_today_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        )
        .order_by(desc(Task.priority_score))
        .limit(5)
    )
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = task_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(task, field, value)

    # Recalculate priority
    task.priority_score = compute_priority(task.difficulty, task.deadline, task.importance_flag)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = TaskStatus.ARCHIVED
    await db.commit()
    return {"message": "Task archived"}


@router.patch("/{task_id}/status", response_model=TaskOut)
async def update_task_status(
    task_id: str,
    status_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = status_data.status
    await db.commit()
    await db.refresh(task)
    return task
