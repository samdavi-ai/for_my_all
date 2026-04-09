from collections import defaultdict


def compute_peak_hours(sessions: list) -> list:
    """
    Compute user's peak productive hours based on session history.
    Returns a list of hours (0-23) where focus scores are highest.
    """
    if not sessions:
        return [9, 14, 19]  # Default peak hours

    hour_scores = defaultdict(list)

    for session in sessions:
        if session.start_time and session.focus_score:
            hour = session.start_time.hour
            hour_scores[hour].append(session.focus_score)

    if not hour_scores:
        return [9, 14, 19]

    # Compute average focus score per hour
    hour_averages = {
        hour: sum(scores) / len(scores)
        for hour, scores in hour_scores.items()
    }

    # Sort by average focus score descending, take top 3
    sorted_hours = sorted(hour_averages.items(), key=lambda x: x[1], reverse=True)
    peak_hours = [h for h, _ in sorted_hours[:3]]

    return sorted(peak_hours)


def compute_hourly_productivity(sessions: list) -> list:
    """
    Compute average focus score for each hour of the day (0-23).
    Returns list of {hour: int, avg_focus: float} for heatmap.
    """
    hour_scores = defaultdict(list)

    for session in sessions:
        if session.start_time and session.focus_score:
            hour = session.start_time.hour
            hour_scores[hour].append(session.focus_score)

    result = []
    for hour in range(24):
        scores = hour_scores.get(hour, [])
        avg = sum(scores) / len(scores) if scores else 0
        result.append({"hour": hour, "avg_focus": round(avg, 2)})

    return result
