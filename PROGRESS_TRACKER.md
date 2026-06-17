# 📊 FormBuilder-98 — Progress Tracker
> Update this file after every completed step. Paste it alongside MASTER_CONTEXT.md in every LLM session.

---

## CURRENT STATUS
**Day:** 4
**Step:** AI features fully enabled (Clippy assistant via Gemini 2.5 Flash, dynamic pleasantries blocker), plus new retro applications (ScanDisk with scanning audio loop and success popup; Music Player with MP3 playlist, volume, seek slider, and auto-next track transition).
**Next Step:** Full integration testing and further polish.
**Blockers:** None

---

## WHAT IS WORKING RIGHT NOW
- [x] Docker is running (postgres is up)
- [x] `npm run dev` starts server (port 3001) — run from `apps/server`
- [x] `npm run dev` starts web (port 3000) — run from `apps/web`
- [x] Server running on port 3001
- [x] Web running on port 3000
- [x] Database tables created (drizzle push done)
- [x] Can register a new user (UI working, connects to DB)
- [x] Can log in and get JWT token
- [x] Desktop screen shows after login (My Forms, Recycle Bin, Analytics icons)
- [x] My Forms window opens
- [x] Can create a new form
- [x] Form Builder opens
- [x] Can add fields to form (all 7 types: text, email, number, textarea, dropdown, checkbox, radio)
- [x] Can save form (bulk save via fields.saveAll)
- [x] Can preview form (FormPreviewWindow)
- [x] Share URL generates (generates /f/[token])
- [x] Public form fills and submits (/f/[token] page)
- [x] Submissions list shows (SubmissionsWindow)
- [x] Analytics page shows charts (AnalyticsWindow with Recharts)
- [x] Recycle Bin works (restore + permanent delete)
- [x] Clippy tips rotating in bottom-right
- [x] Win98Window bugfixes (drag performance, duplicate title bar icons, 8-directional edge resizing, minimize state preservation, native drag cursor)
- [x] Form Builder: Added required fields toggle and enforced validation before submission
- [x] Added "Back to Builder" navigation from Submissions and Analytics pages
- [x] Added Display Properties (custom desktop wallpapers & themes, local storage persistence)
- [x] Implemented Draggable Desktop Icons with strict vertical grid snapping, collision detection, and auto-arrange
- [x] Enhanced UI with classic Win98 blue hover effects on desktop icons and lists
- [x] Built Notepad application with menus, word wrap, cursor tracking, and functional Save/Save As downloads
- [x] Reordered default desktop icons layout (Recycle Bin under My Forms)
- [x] Updated favicon for Next.js App Router
- [x] Clippy AI Form Assistant integrated with Gemini 2.5 Flash API (auto-generates fields, saves to database, opens in builder)
- [x] Clippy off-topic prompt interception (sarcastic, witty, dynamic responses for greetings or off-topic questions)
- [x] ScanDisk application with progress tracking, animated cluster grid blocks, audio loop, and retro success popup
- [x] Music Player application with custom user MP3 playlist, seek bar, time elapsed index, volume control, and auto-transition to next track
- [x] Replaced modern emojis in player controls with highly compatible classic Unicode geometric shapes (`|◀`, `▶`, `❚❚`, `■`, `▶|`, `♫`)

---

## CURRENT FILE STRUCTURE

### apps/server/src/
```
index.ts              ← Express app entry + CORS + health check
trpc.ts               ← initTRPC, publicProcedure, protectedProcedure
context.ts            ← JWT auth context
router/
  index.ts            ← appRouter (merges all)
  auth.ts             ← register, login, me
  forms.ts            ← full CRUD + generateShareToken + softDelete/restore/permanentDelete
  fields.ts           ← saveAll (bulk replace), getByFormId
  submissions.ts      ← submit (public), list (protected), getAnalytics
  ai.ts               ← generateForm (protected mutation calling Gemini 2.5 Flash)
```

### apps/web/src/
```
app/
  layout.tsx          ← imports 98.css, wraps in Providers
  globals.css         ← desktop, taskbar, windows, tables CSS
  page.tsx            ← main desktop page (mounts all windows conditionally)
  providers.tsx       ← tRPC + React Query providers with JWT header injection
  f/[token]/page.tsx  ← public form fill page
lib/
  trpc.ts             ← createTRPCReact<AppRouter>()
  auth.ts             ← authStorage (localStorage helpers)
store/
  windowStore.ts      ← Zustand: open windows, active window, current form, user
components/
  desktop/
    Desktop.tsx       ← green background, icons (Login/Register or app icons)
    DesktopIcon.tsx   ← single-click select, double-click open
    Taskbar.tsx       ← Start button, window tabs, clock
    StartMenu.tsx     ← opens upward from Start, shows context-aware items
    Clippy.tsx        ← rotating tips, toggleable, bottom-right
  windows/
    LoginWindow.tsx
    RegisterWindow.tsx
    MyFormsWindow.tsx       ← list forms, inline create, soft delete
    FormBuilderWindow.tsx   ← add/reorder/remove all 7 field types, share
    FormPreviewWindow.tsx   ← live preview, submit disabled
    SubmissionsWindow.tsx   ← table view of all responses
    AnalyticsWindow.tsx     ← Recharts line + bar charts
    RecycleBinWindow.tsx    ← restore + permanent delete
    ScanDiskWindow.tsx      ← animated sector checking, progress bar, audio loop
    MusicPlayerWindow.tsx    ← MP3 playlist, seek, play/pause/stop/prev/next, volume slider
```

---

## HOW TO RUN (from separate terminals)

```bash
# Terminal 1 — Start DB (if not already running)
docker-compose up -d

# Terminal 2 — Start server
cd apps/server
cmd /c npm run dev
# → http://localhost:3001 (health: /health)

# Terminal 3 — Start web
cd apps/web
cmd /c npm run dev
# → http://localhost:3000
```

---

## PACKAGES ACTUALLY INSTALLED

### apps/server/package.json
```json
{
  "dependencies": {
    "@form-builder/db": "*",
    "@trpc/server": "^10.45.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "nanoid": "^3.3.7",
    "zod": "^3.22.0"
  }
}
```

### apps/web/package.json
```json
{
  "dependencies": {
    "@tanstack/react-query": "^4.44.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/server": "^10.45.0",
    "98.css": "^0.1.21",
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^3.8.1",
    "react-is": "^19.x (peer dep for recharts 3)",
    "zustand": "^5.0.14"
  }
}
```

### packages/db/package.json
```json
{
  "dependencies": {
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.21.0",
    "dotenv": "^16.0.0"
  }
}
```

---

## DECISIONS MADE SO FAR

| Decision | Reason |
|---|---|
| `submission_answers.field_id` uses `onDelete: 'set null'` | Per DAY1_FOUNDATION — preserves answer history if a field is deleted |
| Removed `version: '3.8'` from docker-compose.yml | Obsolete in Docker Compose v2+; was causing a warning |
| Scaffolded in `Form Builder/` folder directly | No nested `form-builder-98/` subfolder |
| Used `@tanstack/react-query@4.44.0` (not v5) | `@trpc/react-query@10.x` requires react-query v4 |
| Used `recharts@^3.8.1` (not v2) | Latest version auto-installed; needed `react-is` as extra dep |
| All 4 routers built on Day 1 | Not just auth — built forms, fields, submissions too for completeness |
| `fields.saveAll` does delete-then-reinsert | Simpler than diffing; fine for current scale |

---

## ERROR LOG

| Error | Resolution |
|---|---|
| Docker compose hang on first run | First run was pulling `postgres:16-alpine`. Wait for image download. |
| Shell tool timeout on first attempt | Cursor tool timeout during Docker pull — retry succeeded. |
| Docker Compose `version` attribute warning | Removed obsolete `version: '3.8'` line |
| `.gitkeep` blocking `create-next-app` | Deleted `.gitkeep` from `apps/web/` before running create-next-app |
| `@tanstack/react-query@5` peer conflict | Downgraded to `4.44.0` for tRPC v10 compatibility |
| `@tanstack/react-query@4.36.0` not found | Used `4.44.0` (exact version, not `4.36.0`) |
| `recharts` → `react-is` not found | Installed `react-is` separately as peer dep for recharts 3 |
| Server `npm install` workspace warning | `npm warn workspaces @form-builder/server in filter set` — harmless, install succeeded |
| Gemini API 429 Quota Exceeded (limit: 0) | Gemini 2.0-flash-lite / 2.0-flash free tier had zero quota enabled. Resolved by switching to `gemini-2.5-flash` model which was fully provisioned on standard key quota. |
| Music Player emojis displaying as black boxes | Replaced color emojis with classic Unicode geometric shapes (`|◀`, `▶`, `❚❚`, `■`, `▶|`, `♫`) for 100% retro theme compatibility. |
