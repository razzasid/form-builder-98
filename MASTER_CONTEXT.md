# 🖥️ FormBuilder-98 — Master LLM Context Document


## PROJECT SUMMARY
A **Google Forms clone with a Windows 98 desktop UI** built as a fullstack monorepo. Users see a retro Windows 98 desktop with icons. They can log in, create forms with a drag-and-drop builder, share forms publicly, collect submissions, and view analytics — all presented through classic Windows 98 dialog windows.

---

## TECH STACK (STRICT — do not deviate)
| Layer | Technology |
|---|---|
| Monorepo | **Turbo Repo** |
| Frontend | **Next.js 14 (App Router)** + TypeScript |
| API | **tRPC** mounted on **Express** (NO REST) |
| ORM | **Drizzle ORM** |
| Database | **PostgreSQL** (via Docker) |
| Local Dev | **Docker Compose** |
| Auth | JWT (jsonwebtoken) |
| UI Theme | **98.css** library (Windows 98 look) |
| Charts | **Recharts** (for analytics) |

---

## MONOREPO DIRECTORY STRUCTURE
```
form-builder-98/
├── apps/
│   ├── web/                          # Next.js 14 frontend (port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Desktop (main entry — shows icons)
│   │   │   │   └── f/[token]/page.tsx # Public form fill page (no auth needed)
│   │   │   ├── components/
│   │   │   │   ├── desktop/
│   │   │   │   │   ├── Desktop.tsx
│   │   │   │   │   ├── DesktopIcon.tsx
│   │   │   │   │   ├── Taskbar.tsx
│   │   │   │   │   ├── StartMenu.tsx
│   │   │   │   │   └── Clippy.tsx    # AI assistant (paperclip mascot)
│   │   │   │   ├── windows/
│   │   │   │   │   ├── Window.tsx    # Reusable draggable window shell
│   │   │   │   │   ├── LoginWindow.tsx
│   │   │   │   │   ├── RegisterWindow.tsx
│   │   │   │   │   ├── MyFormsWindow.tsx
│   │   │   │   │   ├── CreateFormWindow.tsx
│   │   │   │   │   ├── FormBuilderWindow.tsx
│   │   │   │   │   ├── FormPreviewWindow.tsx
│   │   │   │   │   ├── SubmissionsWindow.tsx
│   │   │   │   │   ├── AnalyticsWindow.tsx
│   │   │   │   │   └── RecycleBinWindow.tsx
│   │   │   │   └── ui/               # Shared Win98 UI primitives
│   │   │   │       ├── Win98Button.tsx
│   │   │   │       ├── Win98Input.tsx
│   │   │   │       └── Win98Toggle.tsx
│   │   │   ├── lib/
│   │   │   │   ├── trpc.ts           # tRPC client + React Query setup
│   │   │   │   └── auth.ts           # Token storage helpers
│   │   │   ├── store/
│   │   │   │   └── windowStore.ts    # Zustand: which windows are open
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── server/                       # Express + tRPC backend (port 3001)
│       ├── src/
│       │   ├── index.ts              # Express app entry point
│       │   ├── trpc.ts               # t = initTRPC, publicProcedure, protectedProcedure
│       │   ├── context.ts            # JWT auth context creation
│       │   └── router/
│       │       ├── index.ts          # appRouter (root — merges all)
│       │       ├── auth.ts           # register, login
│       │       ├── forms.ts          # CRUD for forms
│       │       ├── fields.ts         # bulk save/get fields
│       │       └── submissions.ts    # submit, list, analytics
│       └── package.json
│
├── packages/
│   └── db/                           # Drizzle schema + DB client
│       ├── src/
│       │   ├── index.ts              # exports { db }
│       │   └── schema/
│       │       ├── index.ts          # exports all tables
│       │       ├── users.ts
│       │       ├── forms.ts
│       │       ├── fields.ts
│       │       └── submissions.ts
│       ├── drizzle.config.ts
│       └── package.json
│
├── docker-compose.yml
├── turbo.json
├── package.json                      # root (workspaces config)
└── .env                              # shared env vars
```

---

## DATABASE SCHEMA (Drizzle)

### users table
```typescript
// packages/db/src/schema/users.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull().unique(),
  password:  varchar('password', { length: 255 }).notNull(), // bcrypt hashed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### forms table
```typescript
// packages/db/src/schema/forms.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const forms = pgTable('forms', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  shareToken:  varchar('share_token', { length: 64 }).unique(), // random token for public URL
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at'),                          // null = active, non-null = in recycle bin
});
```

### form_fields table
```typescript
// packages/db/src/schema/fields.ts
import { pgTable, uuid, varchar, boolean, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import { forms } from './forms';

export const formFields = pgTable('form_fields', {
  id:          uuid('id').defaultRandom().primaryKey(),
  formId:      uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  type:        varchar('type', { length: 50 }).notNull(), // 'text'|'email'|'number'|'textarea'|'dropdown'|'checkbox'|'radio'
  label:       varchar('label', { length: 255 }).notNull(),
  placeholder: varchar('placeholder', { length: 255 }),
  required:    boolean('required').default(false).notNull(),
  options:     jsonb('options'),       // string[] for dropdown/checkbox/radio options
  displayOrder: integer('display_order').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});
```

### submissions table
```typescript
// packages/db/src/schema/submissions.ts
import { pgTable, uuid, timestamp, varchar } from 'drizzle-orm/pg-core';
import { forms } from './forms';

export const submissions = pgTable('submissions', {
  id:          uuid('id').defaultRandom().primaryKey(),
  formId:      uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  ipAddress:   varchar('ip_address', { length: 45 }),
});
```

### submission_answers table
```typescript
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { submissions } from './submissions';
import { formFields } from './fields';

export const submissionAnswers = pgTable('submission_answers', {
  id:           uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull(),
  fieldId:      uuid('field_id').references(() => formFields.id, { onDelete: 'cascade' }).notNull(),
  value:        text('value'),
});
```

---

## tRPC API — ALL PROCEDURES

### Auth Router (`auth.*`)
| Procedure | Type | Input | Output |
|---|---|---|---|
| `auth.register` | mutation | `{ name, email, password }` | `{ user, token }` |
| `auth.login` | mutation | `{ email, password }` | `{ user, token }` |
| `auth.me` | query | _(none, uses JWT)_ | `{ user }` |

### Forms Router (`forms.*`)
| Procedure | Type | Auth | Input | Output |
|---|---|---|---|---|
| `forms.list` | query | ✅ | _(none)_ | `Form[]` (not deleted) |
| `forms.getDeleted` | query | ✅ | _(none)_ | `Form[]` (recycle bin) |
| `forms.getById` | query | ✅ | `{ formId }` | `Form` |
| `forms.getByShareToken` | query | ❌ public | `{ token }` | `Form + fields` |
| `forms.create` | mutation | ✅ | `{ title, description }` | `Form` |
| `forms.update` | mutation | ✅ | `{ formId, title, description }` | `Form` |
| `forms.softDelete` | mutation | ✅ | `{ formId }` | `{ success }` |
| `forms.restore` | mutation | ✅ | `{ formId }` | `{ success }` |
| `forms.permanentDelete` | mutation | ✅ | `{ formId }` | `{ success }` |
| `forms.generateShareToken` | mutation | ✅ | `{ formId }` | `{ token, url }` |

### Fields Router (`fields.*`)
| Procedure | Type | Auth | Input |
|---|---|---|---|
| `fields.saveAll` | mutation | ✅ | `{ formId, fields: FieldInput[] }` |
| `fields.getByFormId` | query | ❌ public | `{ formId }` |

### Submissions Router (`submissions.*`)
| Procedure | Type | Auth | Input |
|---|---|---|---|
| `submissions.submit` | mutation | ❌ public | `{ formId, answers: {fieldId, value}[] }` |
| `submissions.list` | query | ✅ | `{ formId }` |
| `submissions.getAnalytics` | query | ✅ | `{ formId }` → counts, chart data, field distributions |

---

## UI SCREENS & FLOW

```
[Browser opens] → Desktop page (green background)
  ↓ (not logged in → shows Login/Register icons)
[Double-click Login icon] → LoginWindow dialog opens
[Double-click Register icon] → RegisterWindow dialog opens
  ↓ (after login)
[Desktop with icons: My Forms, Recycle Bin, My Analytics, Notepad, ScanDisk, Music Player]
[Bottom: Taskbar with Start button, open window tabs, clock]
[Bottom-right: Clippy paperclip AI assistant with speech bubble]

[Double-click My Forms] → MyFormsWindow opens (floating or fullscreen)
  → Shows list: Title (bold), Description (gray), Date, Delete button
  → [New Form button] → CreateFormWindow dialog
  → [Double-click a form] → FormBuilderWindow (fullscreen)
    → Toolbar: Forms | Save | Preview | Submissions | Analytics | Share
    → Field type buttons: +Text +Email +Number +Text Area +Dropdown +Checkbox +Radio
    → Fields list with: #N, type, label, placeholder, required toggle, ↑↓ X
    → [Preview button] → FormPreviewWindow (fullscreen)
    → [Submissions] → SubmissionsWindow (fullscreen)
    → [Analytics] → AnalyticsWindow (fullscreen)
    → [Share button] → generates URL like /f/[token]

[Public URL /f/[token]] → small Win98 dialog with form fields → Submit → Thank You screen
```

---

## KEY UI DESIGN DECISIONS
- **98.css library** for authentic Windows 98 styling — install as npm package
- Desktop background: **dark forest green** (`#1a4a1a` to `#2d6b2d` gradient, NOT classic teal)
- Windows open as **modals/overlays** on the desktop (not true OS windows)
- **Draggable windows** using mouse events (mousedown on title bar → track mouse movement)
- **Taskbar** shows currently open window names as clickable tabs
- **Clippy** (paperclip icon bottom-right) with rotating AI-powered tips
- **Start menu** opens upward from Start button with: My Forms, Log Off, Shut Down
- Forms in My Forms list have a **pause/stop icon** (delete/archive) on the right
- Fields in Form Builder are numbered (#1, #2...) with a type dropdown you can change

---

## ENVIRONMENT VARIABLES (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/form_builder

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## PACKAGE VERSIONS (use these exact versions)
```json
{
  "turbo": "^2.0.0",
  "drizzle-orm": "^0.30.0",
  "drizzle-kit": "^0.21.0",
  "@trpc/server": "^10.45.0",
  "@trpc/client": "^10.45.0",
  "@trpc/react-query": "^10.45.0",
  "@tanstack/react-query": "^5.0.0",
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "zod": "^3.22.0",
  "98.css": "^0.1.22",
  "recharts": "^2.10.0",
  "zustand": "^4.5.0",
  "next": "14.2.0",
  "typescript": "^5.0.0",
  "postgres": "^3.4.0"
}
```

---

## IMPORTANT PATTERNS TO FOLLOW

### tRPC Context (JWT Auth)
```typescript
// apps/server/src/context.ts
export async function createContext({ req }: CreateExpressContextOptions) {
  let user = null;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const [found] = await db.select().from(users).where(eq(users.id, payload.userId));
      user = found ?? null;
    } catch {}
  }
  return { user };
}
```

### Protected Procedure Pattern
```typescript
// apps/server/src/trpc.ts
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } }); // user is now non-null
});
```

### tRPC Client in Next.js
```typescript
// apps/web/src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/src/router'; // shared type import

export const trpc = createTRPCReact<AppRouter>();
```

### Calling tRPC from components
```typescript
// QUERY (reading data)
const { data: forms, isLoading } = trpc.forms.list.useQuery();

// MUTATION (writing data)
const createForm = trpc.forms.create.useMutation({
  onSuccess: () => { /* refresh list */ }
});
createForm.mutate({ title: 'My Form', description: '...' });
```

---

## HOW TO RUN THE PROJECT
```bash
# 1. Start database
docker-compose up -d

# 2. Push schema to DB (first time)
cd packages/db && npx drizzle-kit push

# 3. Run everything
cd ../..  # back to root
npm run dev   # runs both Next.js (3000) and Express (3001) via Turbo

# OR manually:
# Terminal 1: cd apps/server && npm run dev
# Terminal 2: cd apps/web && npm run dev
```

