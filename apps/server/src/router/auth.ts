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
