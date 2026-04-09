from app.ml.recommender import get_recommendations


async def get_study_recommendations(learning_style: str, stress_trend: str = "stable") -> dict:
    """Get personalized study recommendations."""
    tips = get_recommendations(learning_style, count=4)

    if stress_trend == "increasing":
        tips.insert(0, "🧘 Your stress has been rising — consider lighter study loads today")
    elif stress_trend == "decreasing":
        tips.insert(0, "🎉 Your stress is going down — great job managing your workload!")

    return {
        "trend": stress_trend,
        "tips": tips
    }
