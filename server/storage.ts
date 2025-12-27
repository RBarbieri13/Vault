import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import {
  type Category, type Tool, type Collection,
  type InsertCategory, type InsertTool, type InsertCollection
} from "@shared/schema";

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

  // Collections
  getAllCollections(): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  addToolToCollection(collectionId: string, toolId: string): Promise<Collection | undefined>;
  removeToolFromCollection(collectionId: string, toolId: string): Promise<Collection | undefined>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(pool, { schema });
  }

  // ============================================
  // CATEGORIES
  // ============================================

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
    await this.db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id));
    return true;
  }

  // ============================================
  // TOOLS
  // ============================================

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
    await this.db
      .delete(schema.tools)
      .where(eq(schema.tools.id, id));
    return true;
  }

  // ============================================
  // COLLECTIONS
  // ============================================

  async getAllCollections(): Promise<Collection[]> {
    return await this.db.select().from(schema.collections);
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const [collection] = await this.db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id));
    return collection;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await this.db
      .insert(schema.collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(id: string, updateData: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [collection] = await this.db
      .update(schema.collections)
      .set(updateData)
      .where(eq(schema.collections.id, id))
      .returning();
    return collection;
  }

  async deleteCollection(id: string): Promise<boolean> {
    await this.db
      .delete(schema.collections)
      .where(eq(schema.collections.id, id));
    return true;
  }

  async addToolToCollection(collectionId: string, toolId: string): Promise<Collection | undefined> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return undefined;

    const toolIds = [...(collection.toolIds || [])];
    if (!toolIds.includes(toolId)) {
      toolIds.push(toolId);
    }

    const [updated] = await this.db
      .update(schema.collections)
      .set({ toolIds })
      .where(eq(schema.collections.id, collectionId))
      .returning();
    return updated;
  }

  async removeToolFromCollection(collectionId: string, toolId: string): Promise<Collection | undefined> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return undefined;

    const toolIds = (collection.toolIds || []).filter(id => id !== toolId);

    const [updated] = await this.db
      .update(schema.collections)
      .set({ toolIds })
      .where(eq(schema.collections.id, collectionId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
