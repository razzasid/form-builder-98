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
