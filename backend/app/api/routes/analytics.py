from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from collections import defaultdict

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.session import StudySession
from app.models.mood import MoodEntry
from app.ml.behavioral_analytics import compute_hourly_productivity

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Tasks completed this week
    result = await db.execute(
        select(func.count(Task.id)).where(
            Task.user_id == current_user.id,
            Task.status == TaskStatus.DONE,
            Task.created_at >= week_ago,
        )
    )
    tasks_completed = result.scalar() or 0

    # Study hours this week
    result = await db.execute(
        select(func.sum(StudySession.duration_mins)).where(
            StudySession.user_id == current_user.id,
            StudySession.start_time >= week_ago,
            StudySession.end_time.isnot(None),
        )
    )
    study_mins = result.scalar() or 0
    study_hours = round(study_mins / 60, 1)

    # Average stress this week
    result = await db.execute(
        select(func.avg(MoodEntry.stress_level)).where(
            MoodEntry.user_id == current_user.id,
            MoodEntry.timestamp >= week_ago,
        )
    )
    avg_stress = round(result.scalar() or 0, 1)

    # Study streak
    streak = await _compute_streak(current_user.id, db)

    # Most studied subject
    result = await db.execute(
        select(Task.subject, func.count(Task.id).label("cnt"))
        .where(Task.user_id == current_user.id, Task.status == TaskStatus.DONE)
        .group_by(Task.subject)
        .order_by(desc("cnt"))
        .limit(1)
    )
    row = result.first()
    most_studied = row[0] if row else "None"

    return {
        "tasks_completed_week": tasks_completed,
        "study_hours_week": study_hours,
        "avg_stress_week": avg_stress,
        "streak_days": streak["current_streak"],
        "most_studied_subject": most_studied,
    }


@router.get("/productivity")
async def get_productivity_heatmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.end_time.isnot(None),
        )
    )
    sessions = result.scalars().all()
    return compute_hourly_productivity(sessions)


@router.get("/subjects")
async def get_subject_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.end_time.isnot(None),
            StudySession.task_id.isnot(None),
        )
    )
    sessions = result.scalars().all()

    # Get tasks for mapping
    task_ids = list(set(s.task_id for s in sessions if s.task_id))
    if not task_ids:
        return []

    result = await db.execute(select(Task).where(Task.id.in_(task_ids)))
    tasks_map = {t.id: t.subject for t in result.scalars().all()}

    subject_mins = defaultdict(int)
    for s in sessions:
        subject = tasks_map.get(s.task_id, "Other")
        subject_mins[subject] += s.duration_mins or 0

    total = sum(subject_mins.values()) or 1
    return [
        {
            "subject": subject,
            "total_mins": mins,
            "percentage": round(mins / total * 100, 1),
        }
        for subject, mins in sorted(subject_mins.items(), key=lambda x: x[1], reverse=True)
    ]


@router.get("/progress")
async def get_weekly_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    weeks = []
    now = datetime.now(timezone.utc)

    for i in range(8):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(days=7)

        # Tasks created that week
        result = await db.execute(
            select(func.count(Task.id)).where(
                Task.user_id == current_user.id,
                Task.created_at >= week_start,
                Task.created_at < week_end,
            )
        )
        total = result.scalar() or 0

        # Tasks completed that week
        result = await db.execute(
            select(func.count(Task.id)).where(
                Task.user_id == current_user.id,
                Task.status == TaskStatus.DONE,
                Task.created_at >= week_start,
                Task.created_at < week_end,
            )
        )
        completed = result.scalar() or 0

        rate = round(completed / total * 100, 1) if total > 0 else 0
        weeks.append({
            "week_start": week_start.date().isoformat(),
            "completion_rate": rate,
        })

    weeks.reverse()
    return weeks


@router.get("/streaks")
async def get_streaks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _compute_streak(current_user.id, db)


async def _compute_streak(user_id: str, db: AsyncSession) -> dict:
    """Compute study streak from session history."""
    result = await db.execute(
        select(StudySession.start_time)
        .where(
            StudySession.user_id == user_id,
            StudySession.end_time.isnot(None),
        )
        .order_by(desc(StudySession.start_time))
    )
    times = result.scalars().all()

    if not times:
        return {"current_streak": 0, "longest_streak": 0, "last_studied_date": None}

    # Get unique study dates
    study_dates = sorted(set(t.date() for t in times), reverse=True)
    last_studied = study_dates[0]

    # Current streak
    current = 1
    today = date.today()
    if last_studied < today - timedelta(days=1):
        current = 0
    else:
        for i in range(1, len(study_dates)):
            if study_dates[i] == study_dates[i - 1] - timedelta(days=1):
                current += 1
            else:
                break

    # Longest streak
    longest = 1
    streak = 1
    for i in range(1, len(study_dates)):
        if study_dates[i] == study_dates[i - 1] - timedelta(days=1):
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 1

    return {
        "current_streak": current,
        "longest_streak": longest,
        "last_studied_date": last_studied.isoformat(),
    }
