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
