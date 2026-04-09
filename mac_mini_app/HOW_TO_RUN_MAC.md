# Smart Study Companion (Mac Lite Version) 🍎

This is a single-file, highly compressed version of the Smart Study Companion designed specifically to be portable and extremely easy to run on macOS. 

This version uses **Streamlit** to generate both the backend and frontend in a single script.

## 🛠️ How to run it

1. **Open your Mac Terminal** (`Cmd + Space` -> type "Terminal" -> Press Enter)
2. Use the terminal to navigate into this exact folder:
   ```bash
   cd path/to/for_my_all/mac_mini_app
   ```
3. Install the required libraries via `pip` (or `pip3` if your Mac requires it):
   ```bash
   pip3 install -r requirements.txt
   ```
4. Run the application using Streamlit:
   ```bash
   streamlit run app.py
   ```

A browser window will immediately pop open with the application running!

## 🤖 Setting up AI Chat
When the app opens, look at the sidebar on the left. You will see a text box for a **Groq API Key**.
Copy your free API key from [console.groq.com](https://console.groq.com) and paste it into that sidebar box, and hit Enter. The Study Assistant chat will immediately unlock!
