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
