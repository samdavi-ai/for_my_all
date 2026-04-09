# How to Run (VSCode Guide for Beginners) 🚀

This is a step-by-step guide designed specifically for you to run the **Smart Study Companion** using entirely **Visual Studio Code (VSCode)**. No prior programming knowledge is required!

---

## 🛠️ Prerequisite Checks (Do this once)
Before we begin, you need to have three things installed on your computer:
1. **VSCode**: You probably already have this open!
2. **Python**: The backend database engine. Download at [python.org](https://www.python.org/downloads/). *(CRITICAL: Check the box "Add python.exe to PATH" during installation).*
3. **Node.js**: The frontend interface engine. Download the LTS version at [nodejs.org](https://nodejs.org/).

---

## 📂 Step 1: Open the Project in VSCode
1. Open VSCode.
2. Click on **File > Open Folder...** at the top left.
3. Select the folder named `for_my_all` (or whatever the main project folder is named on your computer).
4. If a popup asks "Do you trust the authors of the files in this folder?", check the box and click **Yes, I trust the authors**.

---

## 🔑 Step 2: Get a Free Groq AI Key
This app uses a highly advanced, free AI called Groq for the Chat Companion. You need a key to turn it on.
1. Go to [console.groq.com](https://console.groq.com/) and sign in with Google or create an account.
2. On the left menu, click **API Keys**.
3. Click the **Create API Key** button.
4. Copy the long text that begins with `gsk_`.

Now, inside VSCode:
1. Look at your **Explorer** panel on the left.
2. Expand the `backend` folder and click on the file named `.env`.
3. Find the line that says `GROQ_API_KEY=your-api-key-here`.
4. Delete `your-api-key-here` and paste your copied key. *(Make sure there are no spaces around the `=` sign!)*
5. Press `Ctrl + S` to save the file.

---

## 🖥️ Step 3: Start the Backend (Terminal 1)
VSCode has a built-in terminal at the bottom of the screen. We are going to use it!
1. In VSCode, click **Terminal > New Terminal** at the top menu.
2. A terminal panel will open at the bottom.
3. Type the following command to enter the backend directory and press Enter:
   ```bash
   cd backend
   ```
4. Now, install the required python packages by typing this and pressing Enter:
   ```bash
   pip install -r requirements.txt
   ```
   *(Wait a minute for the progress bars to finish).*
5. Finally, start the backend database by typing this and pressing Enter:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *You should see text saying "Application startup complete". **Leave this terminal alone now.***

---

## 🎨 Step 4: Start the Frontend UI (Terminal 2)
Now we need to start the visual part of the app in a *second* terminal.
1. In your VSCode terminal panel at the bottom, look for the **"+" (Plus icon)** on the top right corner of the terminal box and click it. This opens a *brand new* terminal tab!
2. In this new terminal tab, type this command to enter the frontend directory and press Enter:
   ```bash
   cd frontend
   ```
3. Install the web packages by typing this and pressing Enter:
   ```bash
   npm install
   ```
   *(Wait a minute for this to finish).*
4. Start the user interface by typing:
   ```bash
   npm run dev
   ```
5. You will see a green link appear in the terminal, usually `http://localhost:5173/`. 
6. Hover over that link, hold down the `Ctrl` key on your keyboard, and **Click** it! 

🎉 **Your default web browser will instantly pop open and launch the Smart Study Companion!** 
You can now register a brand new account from the web page and start testing!

---

## 🛑 How to stop the app safely
When you are done testing:
1. Go to your first VSCode terminal tab and press `Ctrl + C` to stop the Python backend.
2. Go to your second VSCode terminal tab and press `Ctrl + C` (and type `Y` if it asks) to stop the Node frontend.
3. Close VSCode. 

Next time you want to use the app, just repeat **Steps 3 and 4**!
