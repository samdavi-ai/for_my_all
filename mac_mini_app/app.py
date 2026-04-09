import streamlit as st
import sqlite3
import time
from datetime import datetime
from groq import Groq

# ---------------------------------------------------------
# Database Initialization
# ---------------------------------------------------------
def init_db():
    conn = sqlite3.connect('local_study_data.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    return sqlite3.connect('local_study_data.db')

# ---------------------------------------------------------
# UI setup
# ---------------------------------------------------------
st.set_page_config(page_title="Smart Study Companion Mini", page_icon="🎓", layout="wide")
init_db()

st.title("🎓 Smart Study Companion (Lite)")

# --- Sidebar: API Keys & Navigation ---
st.sidebar.header("Configuration")
api_key = st.sidebar.text_input("Groq API Key", type="password", help="Get this from console.groq.com")

st.sidebar.markdown("---")
st.sidebar.header("Navigation")
menu = st.sidebar.radio("Go to", ["✅ Tasks", "⏱️ Timer", "🤖 AI Chat"])

# ---------------------------------------------------------
# Feature: Tasks
# ---------------------------------------------------------
if menu == "✅ Tasks":
    st.subheader("Task Manager")
    
    # Add Task
    with st.form("add_task_form", clear_on_submit=True):
        col1, col2 = st.columns([3, 1])
        new_task = col1.text_input("New Task", placeholder="E.g., Read chapter 4...")
        submit = col2.form_submit_button("Add Task")
        
        if submit and new_task:
            conn = get_db_connection()
            conn.cursor().execute("INSERT INTO tasks (title) VALUES (?)", (new_task,))
            conn.commit()
            conn.close()
            st.success("Task added!")
            st.rerun()

    st.markdown("### Your Tasks")
    
    conn = get_db_connection()
    tasks = conn.cursor().execute("SELECT id, title, status FROM tasks ORDER BY id DESC").fetchall()
    conn.close()
    
    if not tasks:
        st.info("No tasks yet. Add one above!")
    
    for task_id, title, status in tasks:
        col1, col2, col3 = st.columns([0.1, 0.8, 0.1])
        is_done = status == 'completed'
        
        # Checkbox to toggle status
        toggled = col1.checkbox("", value=is_done, key=f"chk_{task_id}")
        
        # Update DB if checkbox changed
        if toggled != is_done:
            new_status = 'completed' if toggled else 'pending'
            conn = get_db_connection()
            conn.cursor().execute("UPDATE tasks SET status = ? WHERE id = ?", (new_status, task_id))
            conn.commit()
            conn.close()
            st.rerun()
            
        # Display title
        if toggled:
            col2.markdown(f"~~{title}~~")
        else:
            col2.markdown(f"**{title}**")
            
        # Delete button
        if col3.button("❌", key=f"del_{task_id}"):
            conn = get_db_connection()
            conn.cursor().execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            conn.commit()
            conn.close()
            st.rerun()

# ---------------------------------------------------------
# Feature: Timer
# ---------------------------------------------------------
elif menu == "⏱️ Timer":
    st.subheader("Pomodoro Timer")
    
    col1, col2 = st.columns(2)
    minutes = col1.number_input("Minutes", min_value=1, max_value=120, value=25)
    
    if st.button("Start Timer", type="primary"):
        st.markdown("---")
        timer_placeholder = st.empty()
        progress_bar = st.progress(0)
        
        total_seconds = minutes * 60
        
        for i in range(total_seconds):
            remaining = total_seconds - i
            mins, secs = divmod(remaining, 60)
            
            # Update UI
            timer_placeholder.markdown(f"<h1 style='text-align: center; font-size: 6rem;'>{mins:02d}:{secs:02d}</h1>", unsafe_allow_html=True)
            progress_bar.progress(i / total_seconds)
            
            time.sleep(1)
            
        # Finished
        timer_placeholder.markdown(f"<h1 style='text-align: center; font-size: 6rem; color: #10B981;'>00:00</h1>", unsafe_allow_html=True)
        progress_bar.progress(1.0)
        st.balloons()
        st.success("Session complete! Take a break.")

# ---------------------------------------------------------
# Feature: AI Chat
# ---------------------------------------------------------
elif menu == "🤖 AI Chat":
    st.subheader("Study Assistant")
    
    if not api_key:
        st.warning("👈 Please enter your Groq API Key in the sidebar to use the AI Assistant.")
    else:
        # Initialize chat history
        if "messages" not in st.session_state:
            st.session_state.messages = [
                {"role": "assistant", "content": "Hi! I am your AI study buddy. What are we learning today?"}
            ]

        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

        # Chat input
        if prompt := st.chat_input("Ask a question about your studies..."):
            # Display user message
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            # API Call
            with st.chat_message("assistant"):
                message_placeholder = st.empty()
                try:
                    client = Groq(api_key=api_key)
                    # Use a fast versatile model
                    chat_completion = client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": "You are a helpful, encouraging student tutor. Give concise answers."}
                        ] + st.session_state.messages,
                        model="llama-3.3-70b-versatile",
                        temperature=0.5,
                        max_tokens=1024,
                    )
                    response = chat_completion.choices[0].message.content
                    message_placeholder.markdown(response)
                    st.session_state.messages.append({"role": "assistant", "content": response})
                except Exception as e:
                    st.error(f"Error communicating with AI: {e}")
