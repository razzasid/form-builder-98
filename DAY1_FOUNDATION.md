# 📅 Day 1 — Foundation, Setup & Authentication
**Goal by end of day:** Monorepo running, PostgreSQL connected, register + login working, Windows 98 desktop visible in browser with Login/Register dialogs.

**Time estimate:** 6–8 hours

---

## PHASE 1: Initialize the Monorepo (30 min)

### Step 1.1 — Create root folder and package.json
```bash
mkdir form-builder-98
cd form-builder-98
```

Create `package.json` at root:
```json
{
  "name": "form-builder-98",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "db:push": "cd packages/db && npx drizzle-kit push",
    "db:studio": "cd packages/db && npx drizzle-kit studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Step 1.2 — Create turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Step 1.3 — Create folder structure
```bash
mkdir -p apps/web
mkdir -p apps/server/src/router
mkdir -p packages/db/src/schema
```

### Step 1.4 — Create .env at root
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/form_builder
JWT_SECRET=my-super-secret-jwt-key-change-in-production-please
PORT=3001
NODE_ENV=development
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 1.5 — Create .gitignore
```
node_modules
.next
dist
.env
.turbo
*.local
```

---

## PHASE 2: Docker Compose (10 min)

Create `docker-compose.yml` at root:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: form_builder_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: form_builder
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

```bash
# Start postgres
docker-compose up -d

# Verify it's running
docker ps
# Should show form_builder_db running
```

---

## PHASE 3: Database Package (45 min)

### Step 3.1 — packages/db/package.json
```json
{
  "name": "@form-builder/db",
  "version": "0.0.1",
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.21.0",
    "dotenv": "^16.0.0"
  },
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts"
  }
}
```

### Step 3.2 — packages/db/drizzle.config.ts
```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Step 3.3 — packages/db/src/schema/users.ts
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull().unique(),
  password:  varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Step 3.4 — packages/db/src/schema/forms.ts
```typescript
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const forms = pgTable('forms', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  shareToken:  varchar('share_token', { length: 64 }).unique(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at'),
});

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
```

### Step 3.5 — packages/db/src/schema/fields.ts
```typescript
import { pgTable, uuid, varchar, boolean, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import { forms } from './forms';

export const formFields = pgTable('form_fields', {
  id:           uuid('id').defaultRandom().primaryKey(),
  formId:       uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  type:         varchar('type', { length: 50 }).notNull(),
  label:        varchar('label', { length: 255 }).notNull(),
  placeholder:  varchar('placeholder', { length: 255 }),
  required:     boolean('required').default(false).notNull(),
  options:      jsonb('options').$type<string[]>(),
  displayOrder: integer('display_order').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;
```

### Step 3.6 — packages/db/src/schema/submissions.ts
```typescript
import { pgTable, uuid, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { forms } from './forms';
import { formFields } from './fields';

export const submissions = pgTable('submissions', {
  id:          uuid('id').defaultRandom().primaryKey(),
  formId:      uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  ipAddress:   varchar('ip_address', { length: 45 }),
});

export const submissionAnswers = pgTable('submission_answers', {
  id:           uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull(),
  fieldId:      uuid('field_id').references(() => formFields.id, { onDelete: 'set null' }),
  value:        text('value'),
});

export type Submission = typeof submissions.$inferSelect;
export type SubmissionAnswer = typeof submissionAnswers.$inferSelect;
```

### Step 3.7 — packages/db/src/schema/index.ts
```typescript
export * from './users';
export * from './forms';
export * from './fields';
export * from './submissions';
```

### Step 3.8 — packages/db/src/index.ts
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export * from './schema';
```

### Step 3.9 — Push schema to database
```bash
cd packages/db
npm install
npx drizzle-kit push
# Should say: All tables created ✓
```

---

## PHASE 4: Express + tRPC Server (60 min)

### Step 4.1 — apps/server/package.json
```json
{
  "name": "@form-builder/server",
  "version": "0.0.1",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
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
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Step 4.2 — apps/server/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4.3 — apps/server/src/trpc.ts
```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to do this',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // TypeScript now knows user is non-null
    },
  });
});
```

### Step 4.4 — apps/server/src/context.ts
```typescript
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import { db, users } from '@form-builder/db';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const [found] = await db.select().from(users).where(eq(users.id, payload.userId));
      user = found ?? null;
    } catch {
      // Invalid or expired token — just leave user as null
    }
  }

  return { user, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Step 4.5 — apps/server/src/router/auth.ts
```typescript
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { router, publicProcedure } from '../trpc';
import { db, users } from '@form-builder/db';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    }))
    .mutation(async ({ input }) => {
      // Check if email already exists
      const [existing] = await db.select().from(users).where(eq(users.email, input.email));
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const [user] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
      }).returning();

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      return { user: { id: user.id, name: user.name, email: user.email }, token };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No account with that email' });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect password' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      return { user: { id: user.id, name: user.name, email: user.email }, token };
    }),

  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email };
  }),
});
```

### Step 4.6 — apps/server/src/router/index.ts
```typescript
import { router } from '../trpc';
import { authRouter } from './auth';
// We'll add more routers in later days:
// import { formsRouter } from './forms';
// import { fieldsRouter } from './fields';
// import { submissionsRouter } from './submissions';

export const appRouter = router({
  auth: authRouter,
  // forms: formsRouter,
  // fields: fieldsRouter,
  // submissions: submissionsRouter,
});

export type AppRouter = typeof appRouter;
```

### Step 4.7 — apps/server/src/index.ts
```typescript
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './context';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS so Next.js can call this server
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Mount tRPC on /trpc
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 tRPC available at http://localhost:${PORT}/trpc`);
});
```

### Step 4.8 — Install and run server
```bash
cd apps/server
npm install
npm run dev
# Should see: 🚀 Server running at http://localhost:3001
```

---

## PHASE 5: Next.js Frontend (90 min)

### Step 5.1 — Initialize Next.js
```bash
cd apps
npx create-next-app@14 web --typescript --app --no-tailwind --src-dir --import-alias "@/*"
cd web
```

### Step 5.2 — apps/web/package.json (add dependencies)
Add to dependencies section (run `npm install <packages>`):
```bash
npm install @trpc/client@^10.45.0 @trpc/react-query@^10.45.0 @trpc/server@^10.45.0
npm install @tanstack/react-query@^5.0.0
npm install 98.css zustand
npm install recharts
```

### Step 5.3 — apps/web/src/lib/trpc.ts
```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src/router';

export const trpc = createTRPCReact<AppRouter>();
```

### Step 5.4 — apps/web/src/lib/auth.ts
```typescript
const TOKEN_KEY = 'fb98-auth-token';
const USER_KEY = 'fb98-user';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: (): boolean => {
    return !!authStorage.getToken();
  },
};
```

### Step 5.5 — apps/web/src/store/windowStore.ts
```typescript
import { create } from 'zustand';
import { AuthUser } from '@/lib/auth';

type WindowName = 'login' | 'register' | 'myForms' | 'createForm' | 
                  'formBuilder' | 'formPreview' | 'submissions' | 
                  'analytics' | 'recycleBin';

interface WindowStore {
  openWindows: Set<WindowName>;
  activeWindow: WindowName | null;
  currentFormId: string | null;
  user: AuthUser | null;
  startMenuOpen: boolean;

  openWindow: (name: WindowName) => void;
  closeWindow: (name: WindowName) => void;
  setActiveWindow: (name: WindowName) => void;
  setCurrentFormId: (id: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  logout: () => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  openWindows: new Set(),
  activeWindow: null,
  currentFormId: null,
  user: null,
  startMenuOpen: false,

  openWindow: (name) => set((state) => ({
    openWindows: new Set([...state.openWindows, name]),
    activeWindow: name,
  })),

  closeWindow: (name) => set((state) => {
    const next = new Set(state.openWindows);
    next.delete(name);
    return { openWindows: next, activeWindow: state.activeWindow === name ? null : state.activeWindow };
  }),

  setActiveWindow: (name) => set({ activeWindow: name }),
  setCurrentFormId: (id) => set({ currentFormId: id }),
  setUser: (user) => set({ user }),
  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),
  logout: () => set({ user: null, openWindows: new Set(), activeWindow: null }),
}));
```

### Step 5.6 — apps/web/src/app/providers.tsx
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { authStorage } from '@/lib/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
          headers() {
            const token = authStorage.getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Step 5.7 — apps/web/src/app/layout.tsx
```typescript
import type { Metadata } from 'next';
import { Providers } from './providers';
import 'react';
// Import Windows 98 CSS globally
import '98.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'FormBuilder 98',
  description: 'Build forms like it\'s 1998',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Step 5.8 — apps/web/src/app/globals.css
```css
/* Importing 98.css via npm - already done in layout.tsx */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  font-family: 'Pixelated MS Sans Serif', Arial, sans-serif;
  font-size: 11px;
}

/* Desktop background */
.desktop {
  width: 100vw;
  height: calc(100vh - 28px); /* leave room for taskbar */
  background: radial-gradient(ellipse at center, #2d6b2d 0%, #1a4a1a 60%, #0d2b0d 100%);
  position: relative;
  overflow: hidden;
  user-select: none;
}

/* Desktop icons grid */
.desktop-icons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  position: absolute;
  left: 0;
  top: 0;
}

.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 72px;
  cursor: pointer;
  padding: 4px;
  border: 1px dashed transparent;
}

.desktop-icon:hover,
.desktop-icon.selected {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 128, 0.4);
}

.desktop-icon img,
.desktop-icon .icon-emoji {
  width: 32px;
  height: 32px;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.desktop-icon span {
  color: white;
  font-size: 11px;
  text-align: center;
  text-shadow: 1px 1px 2px black;
  word-break: break-word;
  line-height: 1.2;
}

/* Taskbar */
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: #c0c0c0;
  border-top: 2px solid #ffffff;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  z-index: 10000;
}

.start-btn {
  font-weight: bold;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  min-width: 54px;
  height: 22px;
}

.taskbar-separator {
  width: 2px;
  height: 20px;
  background: #808080;
  border-right: 1px solid #ffffff;
  margin: 0 4px;
}

.taskbar-item {
  height: 22px;
  min-width: 80px;
  max-width: 150px;
  font-size: 11px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* Taskbar clock */
.taskbar-clock {
  margin-left: auto;
  border: 1px inset #c0c0c0;
  padding: 2px 8px;
  font-size: 11px;
  white-space: nowrap;
}

/* Start Menu */
.start-menu {
  position: fixed;
  bottom: 28px;
  left: 0;
  width: 200px;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  z-index: 10001;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.start-menu-brand {
  background: linear-gradient(180deg, #808080, #404040);
  width: 28px;
  color: white;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 2px;
  padding: 8px 6px;
  float: left;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-menu-items {
  padding-left: 28px;
}

.start-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.start-menu-item:hover {
  background: #000080;
  color: white;
}

.start-menu-divider {
  height: 1px;
  background: #808080;
  border-bottom: 1px solid #ffffff;
  margin: 2px 0;
}

/* Clippy assistant */
.clippy {
  position: fixed;
  bottom: 40px;
  right: 16px;
  z-index: 9999;
  cursor: pointer;
}

.clippy-bubble {
  position: absolute;
  bottom: 50px;
  right: 0;
  background: #ffffc0;
  border: 1px solid #000;
  padding: 6px 8px;
  font-size: 11px;
  max-width: 180px;
  border-radius: 4px;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.clippy-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 20px;
  border: 4px solid transparent;
  border-top-color: #000;
}

/* Overlay for windows that are "fullscreen" within the desktop */
.window-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 28px;
  z-index: 1000;
}

/* Centered dialog windows */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* Active window gets higher z-index */
.window-active {
  z-index: 5000;
}
```

### Step 5.9 — Build the Desktop page: apps/web/src/app/page.tsx
```typescript
'use client';

import { useEffect, useState } from 'react';
import { authStorage } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';
import { Desktop } from '@/components/desktop/Desktop';
import { Taskbar } from '@/components/desktop/Taskbar';
import { LoginWindow } from '@/components/windows/LoginWindow';
import { RegisterWindow } from '@/components/windows/RegisterWindow';
import { MyFormsWindow } from '@/components/windows/MyFormsWindow';

export default function HomePage() {
  const { openWindows, openWindow, user, setUser } = useWindowStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Restore user from localStorage on mount
    const savedUser = authStorage.getUser();
    if (savedUser && authStorage.isLoggedIn()) {
      setUser(savedUser);
    }
  }, [setUser]);

  if (!mounted) return null; // prevent hydration mismatch

  return (
    <>
      <Desktop user={user} />
      <Taskbar />

      {/* Auth windows (show on top of desktop when not logged in) */}
      {openWindows.has('login') && <LoginWindow />}
      {openWindows.has('register') && <RegisterWindow />}

      {/* App windows (only when logged in) */}
      {user && openWindows.has('myForms') && <MyFormsWindow />}

      {/* More windows will be added in Day 2 & 3 */}
    </>
  );
}
```

### Step 5.10 — Desktop component: apps/web/src/components/desktop/Desktop.tsx
```typescript
'use client';

import { useWindowStore } from '@/store/windowStore';
import { DesktopIcon } from './DesktopIcon';
import { StartMenu } from './StartMenu';
import { Clippy } from './Clippy';
import { AuthUser } from '@/lib/auth';

interface Props {
  user: AuthUser | null;
}

export function Desktop({ user }: Props) {
  const { openWindow, closeStartMenu } = useWindowStore();

  return (
    <div className="desktop" onClick={closeStartMenu}>
      <div className="desktop-icons">
        {!user ? (
          // Not logged in — show Login and Register icons
          <>
            <DesktopIcon emoji="🔑" label="Login" onDoubleClick={() => openWindow('login')} />
            <DesktopIcon emoji="📝" label="Register" onDoubleClick={() => openWindow('register')} />
          </>
        ) : (
          // Logged in — show app icons
          <>
            <DesktopIcon emoji="📋" label="My Forms" onDoubleClick={() => openWindow('myForms')} />
            <DesktopIcon emoji="🗑️" label="Recycle Bin" onDoubleClick={() => openWindow('recycleBin')} />
            <DesktopIcon emoji="📊" label="My Analytics" onDoubleClick={() => {}} />
            <DesktopIcon emoji="💾" label="ScanDisk" onDoubleClick={() => {}} />
            <DesktopIcon emoji="🎵" label="Music Player" onDoubleClick={() => {}} />
            <DesktopIcon emoji="💀" label="Scary Shortcut" onDoubleClick={() => {}} />
          </>
        )}
      </div>

      <StartMenu />
      <Clippy user={user} />
    </div>
  );
}
```

### Step 5.11 — DesktopIcon component
```typescript
// apps/web/src/components/desktop/DesktopIcon.tsx
'use client';
import { useState } from 'react';

interface Props {
  emoji: string;
  label: string;
  onDoubleClick: () => void;
}

export function DesktopIcon({ emoji, label, onDoubleClick }: Props) {
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`desktop-icon ${selected ? 'selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); setSelected(true); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
      onBlur={() => setSelected(false)}
      tabIndex={0}
    >
      <span className="icon-emoji" role="img" aria-label={label}>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}
```

### Step 5.12 — LoginWindow component
```typescript
// apps/web/src/components/windows/LoginWindow.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { authStorage } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';

export function LoginWindow() {
  const { closeWindow, openWindow, setUser } = useWindowStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      setUser(data.user);
      closeWindow('login');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    if (!email || !password) { setError('All fields required'); return; }
    login.mutate({ email, password });
  };

  return (
    <div className="dialog-overlay" onClick={() => closeWindow('login')}>
      <div className="window" style={{ width: 300 }} onClick={(e) => e.stopPropagation()}>
        <div className="title-bar">
          <div className="title-bar-text">Login</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={() => closeWindow('login')} />
          </div>
        </div>
        <div className="window-body" style={{ padding: 16 }}>
          <p style={{ marginBottom: 12, fontSize: 11 }}>
            Enter your credentials to access the Form Builder.
          </p>

          <div className="field-row-stacked" style={{ marginBottom: 8 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="field-row-stacked" style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%' }}
            />
          </div>

          {error && <p style={{ color: 'red', marginBottom: 8, fontSize: 11 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => { closeWindow('login'); openWindow('register'); }}>
              Register
            </button>
            <button onClick={handleSubmit} disabled={login.isPending}>
              {login.isPending ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 5.13 — RegisterWindow component
```typescript
// apps/web/src/components/windows/RegisterWindow.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { authStorage } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';

export function RegisterWindow() {
  const { closeWindow, openWindow, setUser } = useWindowStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      setUser(data.user);
      closeWindow('register');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    if (!name || !email || !password) { setError('All fields required'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    register.mutate({ name, email, password });
  };

  return (
    <div className="dialog-overlay">
      <div className="window" style={{ width: 360 }}>
        <div className="title-bar">
          <div className="title-bar-text">Register New User</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={() => closeWindow('register')} />
          </div>
        </div>
        <div className="window-body" style={{ padding: 16 }}>
          <p style={{ marginBottom: 12 }}>Create a new account to start building forms.</p>

          {['Full Name', 'Email', 'Password', 'Confirm Password'].map((label, i) => (
            <div key={label} className="field-row-stacked" style={{ marginBottom: 8 }}>
              <label>{label}</label>
              <input
                type={i >= 2 ? 'password' : i === 1 ? 'email' : 'text'}
                value={[name, email, password, confirm][i]}
                onChange={(e) => [setName, setEmail, setPassword, setConfirm][i](e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          ))}

          {error && <p style={{ color: 'red', marginBottom: 8, fontSize: 11 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={() => { closeWindow('register'); openWindow('login'); }}>
              Back to Login
            </button>
            <button onClick={handleSubmit} disabled={register.isPending}>
              {register.isPending ? 'Creating...' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 6: Wire Up Taskbar & Start Menu (30 min)

### Step 6.1 — Taskbar
```typescript
// apps/web/src/components/desktop/Taskbar.tsx
'use client';

import { useWindowStore } from '@/store/windowStore';
import { useEffect, useState } from 'react';

const WINDOW_LABELS: Record<string, string> = {
  login: 'Login',
  register: 'Register New User',
  myForms: 'My Forms',
  createForm: 'Create New Form',
  formBuilder: 'Form Builder',
  formPreview: 'Form Preview',
  submissions: 'Submissions',
  analytics: 'Analytics',
  recycleBin: 'Recycle Bin',
};

export function Taskbar() {
  const { openWindows, activeWindow, setActiveWindow, toggleStartMenu, user } = useWindowStore();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="taskbar">
      <button className="button start-btn" onClick={(e) => { e.stopPropagation(); toggleStartMenu(); }}>
        🪟 Start
      </button>
      <div className="taskbar-separator" />
      {[...openWindows].map((w) => (
        <button
          key={w}
          className="button taskbar-item"
          style={{ fontWeight: activeWindow === w ? 'bold' : 'normal' }}
          onClick={() => setActiveWindow(w)}
        >
          {WINDOW_LABELS[w] || w}
        </button>
      ))}
      <div className="taskbar-clock">
        {user ? `${user.name.split(' ')[0]}  ` : ''}{time}
      </div>
    </div>
  );
}
```

### Step 6.2 — StartMenu
```typescript
// apps/web/src/components/desktop/StartMenu.tsx
'use client';

import { useWindowStore } from '@/store/windowStore';
import { authStorage } from '@/lib/auth';

export function StartMenu() {
  const { startMenuOpen, closeStartMenu, openWindow, logout, user } = useWindowStore();

  if (!startMenuOpen) return null;

  const handleLogout = () => {
    authStorage.clear();
    logout();
    closeStartMenu();
  };

  return (
    <div className="start-menu" onClick={(e) => e.stopPropagation()}>
      <div className="start-menu-brand">Windows 98</div>
      <div className="start-menu-items">
        {user ? (
          <>
            <div className="start-menu-item" onClick={() => { openWindow('myForms'); closeStartMenu(); }}>
              📋 My Forms
            </div>
            <div className="start-menu-divider" />
            <div className="start-menu-item" onClick={handleLogout}>
              🚪 Log Off ({user.name.split(' ')[0]})
            </div>
          </>
        ) : (
          <>
            <div className="start-menu-item" onClick={() => { openWindow('login'); closeStartMenu(); }}>
              🔑 Login
            </div>
            <div className="start-menu-item" onClick={() => { openWindow('register'); closeStartMenu(); }}>
              📝 Register
            </div>
          </>
        )}
        <div className="start-menu-divider" />
        <div className="start-menu-item" onClick={closeStartMenu}>
          ⏹️ Shut Down
        </div>
      </div>
    </div>
  );
}
```

### Step 6.3 — Clippy
```typescript
// apps/web/src/components/desktop/Clippy.tsx
'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/auth';
import { useWindowStore } from '@/store/windowStore';

const TIPS_LOGGED_IN = [
  'Need a form? Just tell me what you want!',
  'Forms made easy – describe and I\'ll build it.',
  'Double-click My Forms to get started!',
  'You can share forms with a unique link.',
];

const TIPS_LOGGED_OUT = [
  'Welcome! Double-click Login to get started.',
  'Register to start building forms!',
  'You can ask me for a contact form, survey, registration, and more!',
];

interface Props {
  user: AuthUser | null;
}

export function Clippy({ user }: Props) {
  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const tips = user ? TIPS_LOGGED_IN : TIPS_LOGGED_OUT;

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="clippy" onClick={() => setVisible(!visible)}>
      {visible && (
        <div className="clippy-bubble">
          {tips[tipIndex]}
        </div>
      )}
      <span style={{ fontSize: 32 }}>📎</span>
    </div>
  );
}
```

---

## PHASE 7: Final Run (10 min)

### Step 7.1 — Add dev scripts to both packages
In each app's package.json, make sure `"dev"` script works.

For turbo dev to work, create `turbo.json` at root (already done in Step 1.2).

### Step 7.2 — Run everything
```bash
# From root:
npm install  # install turbo
npm run dev  # starts both apps
```

### Step 7.3 — Verify Day 1 success
- [ ] Browser opens `http://localhost:3000` → see green desktop with Login and Register icons
- [ ] Double-click Register → register window appears
- [ ] Fill in details and click Register → window closes, icons change to My Forms etc.
- [ ] Refresh page → still logged in (token in localStorage)
- [ ] Click Start → start menu appears
- [ ] Click Log Off → back to Login/Register icons
- [ ] Server at `http://localhost:3001/health` → `{"status":"ok"}`

---

## DAY 1 DONE ✅
Update your PROGRESS_TRACKER.md and proceed to Day 2!
