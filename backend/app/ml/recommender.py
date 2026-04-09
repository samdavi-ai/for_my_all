import random


# Study tips organized by learning style
TIPS_BY_STYLE = {
    "Visual": [
        "Create colorful mind maps for complex topics",
        "Use diagrams and flowcharts to visualize processes",
        "Watch educational videos and animations",
        "Color-code your notes by topic or importance",
        "Draw sketches to represent abstract concepts",
        "Use flashcards with images and diagrams",
    ],
    "Auditory": [
        "Record yourself explaining topics and listen back",
        "Study with background music (lo-fi or classical)",
        "Join or form a study group for discussions",
        "Use text-to-speech for reading materials",
        "Create acronyms and rhymes for memorization",
        "Explain concepts out loud to yourself",
    ],
    "Reading": [
        "Summarize each chapter in your own words",
        "Create detailed written notes and outlines",
        "Read textbooks and reference materials",
        "Write practice essays and answers",
        "Make lists and bullet points for key concepts",
        "Use annotation tools while reading papers",
    ],
    "Kinesthetic": [
        "Take breaks with physical activities between study sessions",
        "Use hands-on experiments and simulations",
        "Walk around while reviewing flashcards",
        "Build physical models of concepts",
        "Practice by doing — code, solve problems, build things",
        "Use gestures and movement to memorize sequences",
    ],
}

# General tips
GENERAL_TIPS = [
    "Use the Pomodoro technique: 25 min focus + 5 min break",
    "Review material within 24 hours of learning it",
    "Get 7-8 hours of sleep for optimal memory consolidation",
    "Teach what you learn to someone else",
    "Start with the hardest task when your energy is highest",
    "Stay hydrated — dehydration reduces concentration",
    "Set specific, measurable goals for each study session",
    "Take handwritten notes — they improve retention",
]


def get_recommendations(learning_style: str = "Visual", count: int = 3) -> list:
    """Get personalized study recommendations based on learning style."""
    style_tips = TIPS_BY_STYLE.get(learning_style, TIPS_BY_STYLE["Visual"])
    all_tips = style_tips + GENERAL_TIPS
    return random.sample(all_tips, min(count, len(all_tips)))
