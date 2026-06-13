import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db, formFields, forms } from '@form-builder/db';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const fieldInputSchema = z.object({
  id: z.string().uuid().optional(), // existing field id (to update) or undefined (to insert)
  type: z.enum(['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'radio']),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  displayOrder: z.number().int(),
});

export const fieldsRouter = router({
  // Bulk save: replaces all fields for a form
  saveAll: protectedProcedure
    .input(z.object({
      formId: z.string().uuid(),
      fields: z.array(fieldInputSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });

      // Delete all existing fields for this form
      await db.delete(formFields).where(eq(formFields.formId, input.formId));

      if (input.fields.length === 0) return [];

      // Re-insert all fields
      const inserted = await db
        .insert(formFields)
        .values(
          input.fields.map((f) => ({
            formId: input.formId,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
            options: f.options ?? null,
            displayOrder: f.displayOrder,
          }))
        )
        .returning();

      // Update form updatedAt
      await db.update(forms).set({ updatedAt: new Date() }).where(eq(forms.id, input.formId));

      return inserted;
    }),

  getByFormId: publicProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(formFields)
        .where(eq(formFields.formId, input.formId))
        .orderBy(formFields.displayOrder);
    }),
});
