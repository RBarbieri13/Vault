import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { type Category, type Tool, type InsertCategory, type InsertTool } from "@shared/schema";

const { Pool } = pg;

export interface IStorage {
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Tools
  getAllTools(): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(pool, { schema });
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await this.db.select().from(schema.categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await this.db
      .insert(schema.categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await this.db
      .update(schema.categories)
      .set(updateData)
      .where(eq(schema.categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id));
    return true;
  }

  // Tools
  async getAllTools(): Promise<Tool[]> {
    return await this.db.select().from(schema.tools);
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const [tool] = await this.db
      .select()
      .from(schema.tools)
      .where(eq(schema.tools.id, id));
    return tool;
  }

  async createTool(insertTool: InsertTool): Promise<Tool> {
    const [tool] = await this.db
      .insert(schema.tools)
      .values(insertTool)
      .returning();
    return tool;
  }

  async updateTool(id: string, updateData: Partial<InsertTool>): Promise<Tool | undefined> {
    const [tool] = await this.db
      .update(schema.tools)
      .set(updateData)
      .where(eq(schema.tools.id, id))
      .returning();
    return tool;
  }

  async deleteTool(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.tools)
      .where(eq(schema.tools.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
