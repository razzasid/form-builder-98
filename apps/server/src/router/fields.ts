import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db, formFields, forms } from '@form-builder/db';
import { eq, and, inArray } from 'drizzle-orm';
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

      // Get existing fields
      const existingFields = await db
        .select({ id: formFields.id })
        .from(formFields)
        .where(eq(formFields.formId, input.formId));

      const inputIds = input.fields.map((f) => f.id).filter(Boolean) as string[];
      
      const toDelete = existingFields.filter((f: any) => !inputIds.includes(f.id));
      const toUpdate = input.fields.filter((f) => f.id);
      const toInsert = input.fields.filter((f) => !f.id);

      // 1. Delete removed fields
      if (toDelete.length > 0) {
        await db.delete(formFields).where(
          and(
            eq(formFields.formId, input.formId),
            inArray(formFields.id, toDelete.map((f: any) => f.id))
          )
        );
      }

      // 2. Update existing fields
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((f) =>
            db.update(formFields)
              .set({
                type: f.type,
                label: f.label,
                placeholder: f.placeholder,
                required: f.required,
                options: f.options ?? null,
                displayOrder: f.displayOrder,
              })
              .where(eq(formFields.id, f.id!))
          )
        );
      }

      // 3. Insert new fields
      if (toInsert.length > 0) {
        await db.insert(formFields).values(
          toInsert.map((f) => ({
            formId: input.formId,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
            options: f.options ?? null,
            displayOrder: f.displayOrder,
          }))
        );
      }

      // Update form updatedAt
      await db.update(forms).set({ updatedAt: new Date() }).where(eq(forms.id, input.formId));

      return await db.select().from(formFields).where(eq(formFields.formId, input.formId));
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
