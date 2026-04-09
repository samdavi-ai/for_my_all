from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionStart(BaseModel):
    task_id: Optional[str] = None
    planned_duration_mins: int = 25


class SessionEnd(BaseModel):
    session_id: str
    focus_score: int = 5  # 1-10
    notes: Optional[str] = None
    distraction_count: int = 0


class SessionOut(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_mins: Optional[int] = None
    focus_score: Optional[int] = None
    break_count: int = 0
    distraction_count: int = 0
    notes: Optional[str] = None

    class Config:
        from_attributes = True
