from datetime import datetime, timedelta, time


def allocate_day(tasks, date, peak_hours, max_study_hours=8, pomodoro_work=25, pomodoro_break=5):
    """
    Greedy scheduling algorithm that allocates tasks to time slots for a given day.
    Prioritizes difficult tasks during peak hours.
    """
    available_start = datetime.combine(date, time(8, 0))
    available_end = datetime.combine(date, time(22, 0))
    current_time = available_start
    slots = []
    total_study_mins = 0
    max_study_mins = max_study_hours * 60

    # Separate high-difficulty tasks for peak hours
    high_diff_tasks = [t for t in tasks if t.difficulty >= 4]
    normal_tasks = [t for t in tasks if t.difficulty < 4]

    # Schedule high-difficulty tasks in peak hours first
    for task in high_diff_tasks:
        if total_study_mins >= max_study_mins:
            break

        # Find next peak hour slot
        while current_time.hour not in peak_hours and current_time < available_end:
            current_time += timedelta(hours=1)

        if current_time >= available_end:
            break

        duration = min(task.estimated_mins, pomodoro_work * 4)  # max 100 min block
        end_time = current_time + timedelta(minutes=duration)
        if end_time > available_end:
            break

        slots.append({
            "start": current_time.isoformat(),
            "end": end_time.isoformat(),
            "task_id": str(task.id),
            "task_title": task.title,
            "slot_type": "study"
        })

        break_end = end_time + timedelta(minutes=pomodoro_break)
        slots.append({
            "start": end_time.isoformat(),
            "end": break_end.isoformat(),
            "task_id": None,
            "task_title": "Break",
            "slot_type": "break"
        })

        current_time = break_end
        total_study_mins += duration

    # Fill remaining time with normal tasks
    current_time = available_start
    for task in normal_tasks:
        if total_study_mins >= max_study_mins:
            break

        # Skip already-used time slots
        while any(
            s["start"] <= current_time.isoformat() < s["end"]
            for s in slots
        ) and current_time < available_end:
            current_time += timedelta(minutes=5)

        if current_time >= available_end:
            break

        duration = min(task.estimated_mins, pomodoro_work * 4)
        end_time = current_time + timedelta(minutes=duration)
        if end_time > available_end:
            break

        slots.append({
            "start": current_time.isoformat(),
            "end": end_time.isoformat(),
            "task_id": str(task.id),
            "task_title": task.title,
            "slot_type": "study"
        })

        break_end = end_time + timedelta(minutes=pomodoro_break)
        slots.append({
            "start": end_time.isoformat(),
            "end": break_end.isoformat(),
            "task_id": None,
            "task_title": "Break",
            "slot_type": "break"
        })

        current_time = break_end
        total_study_mins += duration

    # Sort slots by start time
    slots.sort(key=lambda s: s["start"])
    return slots
