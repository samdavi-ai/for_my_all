from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.schedule import Schedule
from app.schemas.schedule import ScheduleCreate, ScheduleOut, ScheduleUpdate
from app.services import scheduler_service

router = APIRouter()


@router.post("/generate", response_model=List[ScheduleOut])
async def generate_schedule(
    data: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schedules = await scheduler_service.generate_schedule(
        user_id=current_user.id,
        start_date=data.start_date,
        days=data.days,
        db=db,
    )
    return schedules


@router.get("/week", response_model=List[ScheduleOut])
async def get_week_schedule(
    week_start: date = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not week_start:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday

    dates = [week_start + timedelta(days=i) for i in range(7)]

    result = await db.execute(
        select(Schedule)
        .where(Schedule.user_id == current_user.id, Schedule.date.in_(dates))
        .order_by(Schedule.date)
    )
    schedules = result.scalars().all()

    # Fill missing days with empty schedules
    existing_dates = {s.date for s in schedules}
    all_schedules = list(schedules)
    for d in dates:
        if d not in existing_dates:
            all_schedules.append(Schedule(
                id=f"empty-{d.isoformat()}",
                user_id=current_user.id,
                date=d,
                time_slots=[],
                generated_by_ai=False,
            ))

    all_schedules.sort(key=lambda s: s.date)
    return all_schedules


@router.get("/{schedule_date}", response_model=ScheduleOut)
async def get_schedule_by_date(
    schedule_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule).where(
            Schedule.user_id == current_user.id,
            Schedule.date == schedule_date,
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        # Return empty schedule
        return ScheduleOut(
            id="empty",
            user_id=current_user.id,
            date=schedule_date,
            time_slots=[],
            generated_by_ai=False,
        )
    return schedule


@router.put("/{schedule_date}", response_model=ScheduleOut)
async def update_schedule(
    schedule_date: date,
    data: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule).where(
            Schedule.user_id == current_user.id,
            Schedule.date == schedule_date,
        )
    )
    schedule = result.scalar_one_or_none()

    slots_dict = [s.model_dump() for s in data.time_slots]

    if schedule:
        schedule.time_slots = slots_dict
        schedule.generated_by_ai = False
    else:
        schedule = Schedule(
            user_id=current_user.id,
            date=schedule_date,
            time_slots=slots_dict,
            generated_by_ai=False,
        )
        db.add(schedule)

    await db.commit()
    await db.refresh(schedule)
    return schedule
