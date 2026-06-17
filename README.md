# 🖥️ FormBuilder-98

A **Google Forms clone with a Windows 98 desktop UI** built as a fullstack monorepo. Users see a retro Windows 98 desktop with icons. They can log in, create forms, share forms publicly, collect submissions, and view analytics — all presented through classic Windows 98 dialog windows.

## ✨ Features

- **Retro UI:** Authentic Windows 98 styling utilizing `98.css`.
- **Desktop Experience:** Draggable windows, desktop icons, taskbar, start menu, and draggable desktop icons with strict grid snapping.
- **Form Builder:** Create forms with 7 field types (text, email, number, textarea, dropdown, checkbox, radio).
- **Submissions & Analytics:** Collect public submissions and view analytics with charts (via Recharts).
- **AI Assistant:** Clippy AI Form Assistant integrated with Gemini 2.5 Flash to automatically generate forms based on prompts!
- **Extra Apps:** ScanDisk, Music Player, and Notepad.
- **Customization:** Display Properties for custom desktop wallpapers & themes with local storage persistence.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turbo Repo |
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **API** | tRPC mounted on Express |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL (via Docker) |
| **Auth** | JWT (jsonwebtoken) |
| **UI Theme** | 98.css library |
| **Charts** | Recharts |

## 🚀 How to Run

1. **Start the Database (Docker):**
   Ensure Docker is running, then start the PostgreSQL container:
   ```bash
   docker-compose up -d
   ```

2. **Push the Database Schema (First Time):**
   ```bash
   cd packages/db
   npx drizzle-kit push
   cd ../..
   ```

3. **Run the Application:**
   You can run both the server and the web app simultaneously using Turbo from the root directory:
   ```bash
   npm run dev
   ```
   
   Alternatively, you can run them in separate terminals:
   
   **Terminal 1 (Server):**
   ```bash
   cd apps/server
   npm run dev
   ```
   *Runs on http://localhost:3001*

   **Terminal 2 (Web):**
   ```bash
   cd apps/web
   npm run dev
   ```
   *Runs on http://localhost:3000*

## 📂 Project Structure

```text
form-builder-98/
├── apps/
│   ├── web/          # Next.js 14 frontend (port 3000)
│   └── server/       # Express + tRPC backend (port 3001)
├── packages/
│   └── db/           # Drizzle schema + DB client
├── docker-compose.yml
└── turbo.json
```

## 📊 Current Status

- **Phase:** Polish and Integration Testing
- **Completed Features:**
  - Full Authentication & Session Management.
  - Windows 98 Desktop UI (draggable windows, taskbar, start menu, custom desktop icons).
  - Complete Form Builder & Public Submission Workflow.
  - Submissions Data Table & Recharts Analytics.
  - Recycle Bin with soft delete/restore capabilities.
  - **Clippy AI Form Assistant** (Gemini 2.5 Flash).
  - Custom Retro Apps: ScanDisk, Notepad, and Music Player (with MP3 playlist support).

*For more in-depth architectural context, see `MASTER_CONTEXT.md`. To see the full progress and current steps, see `PROGRESS_TRACKER.md`.*
