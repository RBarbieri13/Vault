import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  collapsed: boolean("collapsed").notNull().default(false),
  toolIds: text("tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
});

export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  summary: text("summary").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  categoryId: varchar("category_id").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  whatItIs: text("what_it_is").notNull().default(''),
  capabilities: text("capabilities").array().notNull().default(sql`ARRAY[]::text[]`),
  bestFor: text("best_for").array().notNull().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;
