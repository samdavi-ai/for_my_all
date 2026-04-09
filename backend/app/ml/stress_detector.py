def analyze_stress_pattern(mood_entries: list) -> dict:
    """
    Analyze stress patterns from recent mood entries.
    Uses rolling average and linear trend via least squares.
    """
    if not mood_entries:
        return {
            "alert_triggered": False,
            "current_avg": 0.0,
            "trend": "stable",
            "recommendations": []
        }

    scores = [m.stress_level for m in mood_entries]

    # Rolling average of last 3 entries
    rolling_3 = sum(scores[:3]) / min(3, len(scores))

    # Linear trend via least squares
    x = list(range(len(scores)))
    n = len(x)
    if n < 2:
        slope = 0
    else:
        sum_x = sum(x)
        sum_y = sum(scores)
        sum_xy = sum(i * s for i, s in zip(x, scores))
        sum_x2 = sum(i ** 2 for i in x)
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2 + 1e-9)

    if slope > 0.3:
        trend = "increasing"
    elif slope < -0.3:
        trend = "decreasing"
    else:
        trend = "stable"

    alert = rolling_3 > 7 and trend in ("increasing", "stable")

    recommendations = []
    if alert:
        recommendations = [
            "Take a 15-min walk between study sessions",
            "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s",
            "Break your next task into 10-min micro-goals",
            "Talk to a friend or counselor — you are not alone",
            "Consider taking a complete break from studying today",
            "Try a quick 5-minute meditation or mindfulness exercise"
        ]
    elif rolling_3 > 5:
        recommendations = [
            "Good job managing stress! Keep taking regular breaks",
            "Stay hydrated and maintain good sleep habits",
            "Try the Pomodoro technique for better focus"
        ]

    return {
        "alert_triggered": alert,
        "current_avg": round(rolling_3, 2),
        "trend": trend,
        "recommendations": recommendations
    }
