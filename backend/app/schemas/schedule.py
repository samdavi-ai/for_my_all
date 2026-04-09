from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    task_id: Optional[str] = None
    task_title: str = ""
    slot_type: str = "study"  # study | break | exam


class ScheduleCreate(BaseModel):
    start_date: date
    days: int = 7


class ScheduleOut(BaseModel):
    id: str
    user_id: str
    date: date
    time_slots: List[dict] = []
    generated_by_ai: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScheduleUpdate(BaseModel):
    time_slots: List[TimeSlot]
