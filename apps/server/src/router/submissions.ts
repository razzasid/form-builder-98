import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { db, submissions, submissionAnswers, formFields, forms } from '@form-builder/db';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const submissionsRouter = router({
  submit: publicProcedure
    .input(z.object({
      formId: z.string().uuid(),
      answers: z.array(z.object({
        fieldId: z.string().uuid(),
        value: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify form exists and is not deleted
      const [form] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, input.formId));
      if (!form || form.deletedAt) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      }

      const ipAddress = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || ctx.req.socket.remoteAddress
        || null;

      // Insert submission record
      const [submission] = await db
        .insert(submissions)
        .values({
          formId: input.formId,
          ipAddress,
        })
        .returning();

      // Insert all answers
      if (input.answers.length > 0) {
        await db.insert(submissionAnswers).values(
          input.answers.map((a) => ({
            submissionId: submission.id,
            fieldId: a.fieldId,
            value: a.value ?? null,
          }))
        );
      }

      return { success: true, submissionId: submission.id };
    }),

  list: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify form ownership
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });

      // Get all submissions for this form
      const subs = await db
        .select()
        .from(submissions)
        .where(eq(submissions.formId, input.formId))
        .orderBy(submissions.submittedAt);

      // Get answers for each submission
      const result = await Promise.all(
        subs.map(async (sub: any) => {
          const answers = await db
            .select()
            .from(submissionAnswers)
            .where(eq(submissionAnswers.submissionId, sub.id));
          return { ...sub, answers };
        })
      );

      return result;
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify form ownership
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });

      const fields = await db
        .select()
        .from(formFields)
        .where(eq(formFields.formId, input.formId))
        .orderBy(formFields.displayOrder);

      const allSubmissions = await db
        .select()
        .from(submissions)
        .where(eq(submissions.formId, input.formId));

      const totalSubmissions = allSubmissions.length;

      // Build per-field analytics
      const fieldAnalytics = await Promise.all(
        fields.map(async (field: any) => {
          const answers = await db
            .select()
            .from(submissionAnswers)
            .where(eq(submissionAnswers.fieldId, field.id));

          const nonEmpty = answers.filter((a: any) => a.value && a.value.trim() !== '');

          // For choice fields: count each option
          let distribution: { label: string; count: number }[] = [];
          if (['dropdown', 'checkbox', 'radio'].includes(field.type) && field.options) {
            const options = field.options as string[];
            distribution = options.map((opt) => ({
              label: opt,
              count: answers.filter((a: any) => a.value === opt || (a.value?.split(',').map((v: any) => v.trim()).includes(opt))).length,
            }));
          }

          return {
            fieldId: field.id,
            label: field.label,
            type: field.type,
            totalAnswers: answers.length,
            filledAnswers: nonEmpty.length,
            distribution,
          };
        })
      );

      // Submissions per day (last 30 days)
      const submissionsPerDay = allSubmissions.reduce<Record<string, number>>((acc: any, sub: any) => {
        const day = sub.submittedAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(submissionsPerDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      return {
        totalSubmissions,
        fieldAnalytics,
        chartData,
      };
    }),
});
