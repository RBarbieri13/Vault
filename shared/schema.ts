import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// DATABASE TABLES
// ============================================

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon"),
  parentId: varchar("parent_id"),
  collapsed: boolean("collapsed").notNull().default(false),
  toolIds: text("tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("categories_parent_id_idx").on(table.parentId),
  index("categories_sort_order_idx").on(table.sortOrder),
]);

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
  icon: text("icon"),
  // Trend data: 7 values for sparkline visualization
  trend: integer("trend").array().notNull().default(sql`ARRAY[5,5,5,5,5,5,5]::integer[]`),
  // Usage percentage 0-100
  usage: integer("usage").notNull().default(50),
  // Status: active, inactive, beta, deprecated
  status: text("status").notNull().default('active'),
  // Content type: tool, website, video, podcast, article
  contentType: text("content_type").notNull().default('tool'),
}, (table) => [
  // Indexes for frequently queried columns
  index("tools_category_id_idx").on(table.categoryId),
  index("tools_type_idx").on(table.type),
  index("tools_status_idx").on(table.status),
  index("tools_is_pinned_idx").on(table.isPinned),
  index("tools_content_type_idx").on(table.contentType),
  index("tools_created_at_idx").on(table.createdAt),
  // Composite index for common filter combinations
  index("tools_type_status_idx").on(table.type, table.status),
]);

// Collections table for user-created collections
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon"),
  toolIds: text("tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
});

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

// Tool type constants for badge colors
export type ToolType = 'CHATBOT' | 'AGENT' | 'IMAGE' | 'WRITING' | 'CODE' | 'SEARCH' | 'VIDEO' | 'AUDIO' | 'CREATIVE' | 'DEV' | 'RESEARCH';

// Tool status constants
export type ToolStatus = 'active' | 'inactive' | 'beta' | 'deprecated';

// Content type constants
export type ContentType = 'tool' | 'website' | 'video' | 'podcast' | 'article';

// Navigation item for hierarchical sidebar
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  children?: NavItem[];
  isExpanded?: boolean;
  level: number;
  type: 'section' | 'category' | 'subcategory' | 'item';
}
