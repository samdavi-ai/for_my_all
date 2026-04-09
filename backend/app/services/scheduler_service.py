from datetime import timedelta
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.schedule import Schedule
from app.ml import study_scheduler


async def generate_schedule(user_id: str, start_date, days: int, db: AsyncSession):
    """Generate AI-powered study schedule for N days."""
    # Get pending tasks ordered by priority
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id, Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]))
        .order_by(desc(Task.priority_score))
    )
    tasks = result.scalars().all()

    # Get user's peak hours
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    peak_hours = user.peak_hours if user and user.peak_hours else [9, 14, 19]

    schedules = []
    for day_offset in range(days):
        date = start_date + timedelta(days=day_offset)

        # Check if schedule already exists for this date
        existing = await db.execute(
            select(Schedule).where(
                Schedule.user_id == user_id,
                Schedule.date == date
            )
        )
        existing_schedule = existing.scalar_one_or_none()

        # Allocate tasks to time slots
        slots = study_scheduler.allocate_day(
            tasks=tasks,
            date=date,
            peak_hours=peak_hours,
            max_study_hours=8,
            pomodoro_work=25,
            pomodoro_break=5
        )

        if existing_schedule:
            existing_schedule.time_slots = slots
            existing_schedule.generated_by_ai = True
            schedules.append(existing_schedule)
        else:
            schedule = Schedule(
                user_id=user_id,
                date=date,
                time_slots=slots,
                generated_by_ai=True
            )
            db.add(schedule)
            schedules.append(schedule)

    await db.commit()

    # Refresh all objects
    for s in schedules:
        await db.refresh(s)

    return schedules
