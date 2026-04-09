# Smart Study Companion 🎓✨

Welcome to the **Smart Study Companion**! This is an AI-powered app built to help you track your tasks, manage your study schedule, track your focus time, and chat with an AI study buddy.

Because you are setting this up on your local computer, this guide is written step-by-step for absolute beginners. You don't need any programming experience to get this running!

---

## 🛠️ Step 1: Install What You Need

Before you can run the app, you need to install two programs on your computer. If you already have these, you can skip to Step 2.

1. **Python**: The engine that runs the backend (database and AI logic).
   - Go to [python.org/downloads](https://www.python.org/downloads/)
   - Download the latest version for Windows.
   - **CRITICAL STEP**: When you run the installer, look at the very bottom of the first screen. There is a checkbox that says **"Add python.exe to PATH"**. You MUST check this box before clicking Install.

2. **Node.js**: The engine that runs the user interface (the frontend).
   - Go to [nodejs.org](https://nodejs.org/en)
   - Download the **LTS (Long Term Support)** version.
   - Run the installer and just click "Next" through all the default options.

---

## 🔑 Step 2: Get a Free Groq AI Key

This app uses an incredibly fast AI called Groq for the Chat Companion and Schedule Generation. You need a free "key" to use it.

1. Go to [console.groq.com](https://console.groq.com/)
2. Create a free account or sign in with Google.
3. On the left menu, click on **API Keys**.
4. Click the **Create API Key** button. 
5. Name it something like "Study App" and click Submit.
6. A long string of text starting with `gsk_` will appear. **Copy this string and keep it safe**. You will need it in a minute. Note: if you want to test the app without an AI key, the app has a built-in "mock mode" that will provide fake AI responses so it won't crash!

---

## 🚀 Step 3: Run the Application!

The application is split into two halves: The **Backend** (Python) and the **Frontend** (Menu/Buttons). You have to start them both.

### Part A: Start the Backend (Do this first)

1. Open a terminal or **Command Prompt**. (Press the Windows Key, type `cmd`, and press Enter).
2. Type `cd d:\Projects\Active\for_my_all\backend` and press Enter. (If your folder is located somewhere else, copy that path instead).
3. Now we need to install the dependencies. Type this exact command and press Enter:
   ```cmd
   pip install -r requirements.txt
   ```
   *(Wait a minute or two for the progress bars to finish).*
4. Next, we need to add your Groq API Key! 
   - Open the directory `backend` in your File Explorer. 
   - Open the file `.env` using Notepad.
   - Find the line that says `GROQ_AI_KEY=your-groq-api-key-here` and replace `your-groq-api-key-here` with the exact `gsk_...` key you got in Step 2. Do not put spaces around the `=` sign.
   - Save the file and close Notepad.
5. Back in the Command Prompt, type:
   ```cmd
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *You should see text saying "Application startup complete". **Leave this window open!***

### Part B: Start the Frontend (Do this second)

1. Open a **brand new** Command Prompt window. (You should now have two open).
2. Type `cd d:\Projects\Active\for_my_all\frontend` and press Enter.
3. Install the web dependencies by typing:
   ```cmd
   npm install
   ```
   *(Wait a minute for this to finish).*
4. Start the user interface by typing:
   ```cmd
   npm run dev
   ```
5. It will print a local link, usually it says `http://localhost:5173/`.
6. Open your web browser (Chrome, Edge, Safari) and go to that link!

🎉 **You are done! You can now Register a new account and start using the app!**

---

## 🛑 How to stop the app
When you are done using the app, go to your Command Prompt windows and press `Ctrl + C` on your keyboard. This will safely shut down the servers. You can then close the windows. Next time you want to use the app, just repeat **Step 3 (Parts A and B)**!

## 💡 Troubleshooting
- If the browser shows a white screen, make sure both Command Prompt windows are running without red errors.
- If the AI Chat responds with "I am a helpful mock AI", it means your Groq API Key was not set up correctly in the `backend/.env` file. Check that the file was saved correctly and restart the backend server.
- The `smart_study.db` file in your backend folder stores all your data. If you delete it, you will lose your tasks and profile!
