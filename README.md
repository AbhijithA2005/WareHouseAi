# WareHouseAi 🤖🏭

A full-stack, monorepo application for simulating warehouse robot navigation using Reinforcement Learning (Q-Learning & SARSA).

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js:** version 18.11.0 or higher.
- **npm:** version 9.0.0 or higher.

### 2. Installation
From the project root directory, run:
```bash
npm run install:all
```
This will automatically install dependencies for the root, the frontend, and the backend.

### 3. Running the App
Start both the Frontend and Backend simultaneously with:
```bash
npm start
```
- **Frontend UI:** [http://localhost:5180](http://localhost:5180)
- **Backend API:** [http://localhost:4000](http://localhost:4000)

---

## 🏗️ Project Structure
- `/frontend`: React SPA (Vite, TailwindCSS, RL Engine).
- `/backend`: Node.js Express API.
- `/package.json`: Root monorepo orchestration.

---

## 🪟 Windows OS Compatibility Guide
This project is designed to be fully compatible with Windows.

### 💻 Recommended Terminals
- **PowerShell** (Best performance)
- **Git Bash**
- **Command Prompt** (Cmd)

### ⚠️ Common Pitfalls
1. **Execution Policy (PowerShell):** If you get a script execution error, run PowerShell as Administrator and execute:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
2. **Node Version:** Ensure you are on Node 18+. To check, run `node -v`. We use the native `node --watch` feature which is unavailable in older versions.
3. **Port Conflicts:** The backend runs on port **4000**. If this port is occupied, you can change it in `/backend/server.js`.

---

## 🧬 Algorithm Implementation
The simulation uses **Reinforcement Learning** (specifically **Q-Learning** and **SARSA**) with an **ε-greedy** exploration strategy and **Bellman Equations** for Q-table updates. 

For a deep dive into the architecture, see the generated [system_explanation.md](file:///Users/abhi/Desktop/WareHouseAi/system_explanation.md).
