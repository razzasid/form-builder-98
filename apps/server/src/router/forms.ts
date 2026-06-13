import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db, forms, formFields } from '@form-builder/db';
import { eq, isNull, isNotNull, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

// Simple random token generator (nanoid alternative using crypto)
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const formsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(forms)
      .where(and(eq(forms.userId, ctx.user.id), isNull(forms.deletedAt)))
      .orderBy(forms.createdAt);
  }),

  getDeleted: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(forms)
      .where(and(eq(forms.userId, ctx.user.id), isNotNull(forms.deletedAt)))
      .orderBy(forms.createdAt);
  }),

  getById: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  getByShareToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.shareToken, input.token), isNull(forms.deletedAt)));
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });

      const fields = await db
        .select()
        .from(formFields)
        .where(eq(formFields.formId, form.id))
        .orderBy(formFields.displayOrder);

      return { ...form, fields };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [form] = await db
        .insert(forms)
        .values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
        })
        .returning();
      return form;
    }),

  update: protectedProcedure
    .input(z.object({
      formId: z.string().uuid(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [form] = await db
        .update(forms)
        .set({
          title: input.title,
          description: input.description,
          updatedAt: new Date(),
        })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  softDelete: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(forms)
        .set({ deletedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      return { success: true };
    }),

  restore: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(forms)
        .set({ deletedAt: null })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      return { success: true };
    }),

  permanentDelete: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      return { success: true };
    }),

  generateShareToken: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const token = generateToken();
      const [form] = await db
        .update(forms)
        .set({ shareToken: token, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/f/${token}`;
      return { token, url };
    }),
});
