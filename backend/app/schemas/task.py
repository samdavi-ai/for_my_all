from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str
    subject: str
    deadline: Optional[datetime] = None
    difficulty: int = 3
    importance_flag: bool = False
    estimated_mins: int = 60
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    deadline: Optional[datetime] = None
    difficulty: Optional[int] = None
    importance_flag: Optional[bool] = None
    estimated_mins: Optional[int] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None


class TaskOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    subject: str
    deadline: Optional[datetime] = None
    difficulty: int
    importance_flag: bool
    priority_score: float
    estimated_mins: int
    status: TaskStatus
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskStatusUpdate(BaseModel):
    status: TaskStatus
