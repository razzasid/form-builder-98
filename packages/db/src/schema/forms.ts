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
