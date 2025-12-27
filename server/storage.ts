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

// ============================================
// IN-MEMORY STORAGE (for development without DB)
// ============================================

export class MemoryStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private tools: Map<string, Tool> = new Map();
  private collections: Map<string, Collection> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoryData: Category[] = [
      { id: 'cat-1', name: 'Chatbots', description: 'AI chat and conversation tools', color: '#fef3c7', icon: '💬' },
      { id: 'cat-2', name: 'Image Generation', description: 'AI image creation tools', color: '#fce7f3', icon: '🖼️' },
      { id: 'cat-3', name: 'Code Assistants', description: 'AI coding helpers', color: '#dbeafe', icon: '💻' },
      { id: 'cat-4', name: 'Writing Tools', description: 'AI writing assistants', color: '#d1fae5', icon: '✍️' },
      { id: 'cat-5', name: 'AI Agents', description: 'Autonomous AI agents', color: '#e9d5ff', icon: '🤖' },
      { id: 'cat-6', name: 'Audio/Video', description: 'Media generation tools', color: '#fed7aa', icon: '🎬' },
    ];
    categoryData.forEach(c => this.categories.set(c.id, c));

    // Seed tools
    const now = new Date();
    const toolData: Tool[] = [
      // CHATBOT tools
      { id: 'tool-1', name: 'ChatGPT', description: 'OpenAI conversational AI with GPT-4 and plugins', url: 'https://chat.openai.com', categoryId: 'cat-1', type: 'CHATBOT', status: 'active', tags: ['gpt-4', 'plugins', 'code'], contentType: 'text', trend: [65, 70, 75, 80, 85, 90, 95], usagePercent: 95, rating: 5, access: 'freemium', owner: 'OpenAI', source: 'https://openai.com', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-2', name: 'Claude', description: 'Anthropic AI assistant focused on safety and helpfulness', url: 'https://claude.ai', categoryId: 'cat-1', type: 'CHATBOT', status: 'active', tags: ['anthropic', 'safe', 'analysis'], contentType: 'text', trend: [50, 55, 60, 70, 75, 82, 88], usagePercent: 88, rating: 5, access: 'freemium', owner: 'Anthropic', source: 'https://anthropic.com', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-3', name: 'Gemini', description: 'Google multimodal AI assistant', url: 'https://gemini.google.com', categoryId: 'cat-1', type: 'CHATBOT', status: 'active', tags: ['google', 'multimodal', 'search'], contentType: 'text', trend: [40, 50, 55, 60, 65, 70, 78], usagePercent: 78, rating: 4, access: 'freemium', owner: 'Google', source: 'https://deepmind.google', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-4', name: 'Perplexity', description: 'AI-powered search and research assistant', url: 'https://perplexity.ai', categoryId: 'cat-1', type: 'CHATBOT', status: 'active', tags: ['search', 'research', 'citations'], contentType: 'text', trend: [30, 40, 50, 60, 68, 72, 75], usagePercent: 75, rating: 4, access: 'freemium', owner: 'Perplexity AI', source: 'https://perplexity.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-5', name: 'Pi', description: 'Inflection AI personal assistant', url: 'https://pi.ai', categoryId: 'cat-1', type: 'CHATBOT', status: 'active', tags: ['personal', 'emotional', 'friendly'], contentType: 'text', trend: [20, 25, 30, 35, 40, 45, 50], usagePercent: 50, rating: 4, access: 'free', owner: 'Inflection AI', source: 'https://inflection.ai', isPinned: false, createdAt: now, updatedAt: now },

      // IMAGE tools
      { id: 'tool-6', name: 'Midjourney', description: 'Premium AI image generation via Discord', url: 'https://midjourney.com', categoryId: 'cat-2', type: 'IMAGE', status: 'active', tags: ['art', 'discord', 'premium'], contentType: 'image', trend: [70, 75, 80, 85, 88, 90, 92], usagePercent: 92, rating: 5, access: 'paid', owner: 'Midjourney Inc', source: 'https://midjourney.com', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-7', name: 'DALL-E 3', description: 'OpenAI image generation integrated with ChatGPT', url: 'https://openai.com/dall-e-3', categoryId: 'cat-2', type: 'IMAGE', status: 'active', tags: ['openai', 'chatgpt', 'realistic'], contentType: 'image', trend: [60, 65, 70, 75, 80, 85, 88], usagePercent: 88, rating: 5, access: 'paid', owner: 'OpenAI', source: 'https://openai.com', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-8', name: 'Stable Diffusion', description: 'Open-source image generation model', url: 'https://stability.ai', categoryId: 'cat-2', type: 'IMAGE', status: 'active', tags: ['open-source', 'local', 'customizable'], contentType: 'image', trend: [55, 60, 62, 65, 68, 70, 72], usagePercent: 72, rating: 4, access: 'free', owner: 'Stability AI', source: 'https://stability.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-9', name: 'Leonardo.ai', description: 'AI art generation platform for games and creative', url: 'https://leonardo.ai', categoryId: 'cat-2', type: 'IMAGE', status: 'active', tags: ['gaming', 'creative', 'fine-tuning'], contentType: 'image', trend: [40, 48, 55, 60, 65, 68, 70], usagePercent: 70, rating: 4, access: 'freemium', owner: 'Leonardo.ai', source: 'https://leonardo.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-10', name: 'Ideogram', description: 'AI image generation with text rendering', url: 'https://ideogram.ai', categoryId: 'cat-2', type: 'IMAGE', status: 'active', tags: ['text', 'typography', 'design'], contentType: 'image', trend: [30, 38, 45, 52, 58, 62, 65], usagePercent: 65, rating: 4, access: 'freemium', owner: 'Ideogram', source: 'https://ideogram.ai', isPinned: false, createdAt: now, updatedAt: now },

      // CODE tools
      { id: 'tool-11', name: 'GitHub Copilot', description: 'AI pair programmer for code completion', url: 'https://github.com/features/copilot', categoryId: 'cat-3', type: 'CODE', status: 'active', tags: ['github', 'vscode', 'autocomplete'], contentType: 'code', trend: [75, 78, 82, 85, 88, 90, 93], usagePercent: 93, rating: 5, access: 'paid', owner: 'GitHub/Microsoft', source: 'https://github.com', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-12', name: 'Cursor', description: 'AI-first code editor with deep integration', url: 'https://cursor.sh', categoryId: 'cat-3', type: 'CODE', status: 'active', tags: ['editor', 'vscode-fork', 'chat'], contentType: 'code', trend: [40, 50, 60, 70, 78, 85, 90], usagePercent: 90, rating: 5, access: 'freemium', owner: 'Anysphere', source: 'https://cursor.sh', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-13', name: 'Replit AI', description: 'AI coding assistant in online IDE', url: 'https://replit.com', categoryId: 'cat-3', type: 'CODE', status: 'active', tags: ['online', 'ide', 'collaborative'], contentType: 'code', trend: [50, 55, 60, 65, 70, 72, 75], usagePercent: 75, rating: 4, access: 'freemium', owner: 'Replit', source: 'https://replit.com', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-14', name: 'Tabnine', description: 'AI code completion for multiple IDEs', url: 'https://tabnine.com', categoryId: 'cat-3', type: 'CODE', status: 'active', tags: ['privacy', 'local', 'enterprise'], contentType: 'code', trend: [45, 48, 50, 52, 55, 58, 60], usagePercent: 60, rating: 4, access: 'freemium', owner: 'Tabnine', source: 'https://tabnine.com', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-15', name: 'Codeium', description: 'Free AI code completion alternative', url: 'https://codeium.com', categoryId: 'cat-3', type: 'CODE', status: 'active', tags: ['free', 'fast', 'multi-language'], contentType: 'code', trend: [35, 42, 50, 58, 65, 70, 74], usagePercent: 74, rating: 4, access: 'free', owner: 'Exafunction', source: 'https://codeium.com', isPinned: false, createdAt: now, updatedAt: now },

      // WRITING tools
      { id: 'tool-16', name: 'Jasper', description: 'AI content creation for marketing teams', url: 'https://jasper.ai', categoryId: 'cat-4', type: 'WRITING', status: 'active', tags: ['marketing', 'content', 'brand'], contentType: 'text', trend: [55, 58, 62, 65, 68, 70, 72], usagePercent: 72, rating: 4, access: 'paid', owner: 'Jasper AI', source: 'https://jasper.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-17', name: 'Copy.ai', description: 'AI copywriting and content generation', url: 'https://copy.ai', categoryId: 'cat-4', type: 'WRITING', status: 'active', tags: ['copywriting', 'sales', 'templates'], contentType: 'text', trend: [45, 50, 55, 58, 62, 65, 68], usagePercent: 68, rating: 4, access: 'freemium', owner: 'Copy.ai', source: 'https://copy.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-18', name: 'Grammarly', description: 'AI writing assistant for grammar and style', url: 'https://grammarly.com', categoryId: 'cat-4', type: 'WRITING', status: 'active', tags: ['grammar', 'style', 'browser'], contentType: 'text', trend: [70, 72, 74, 76, 78, 80, 82], usagePercent: 82, rating: 5, access: 'freemium', owner: 'Grammarly Inc', source: 'https://grammarly.com', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-19', name: 'Notion AI', description: 'AI writing in Notion workspace', url: 'https://notion.so', categoryId: 'cat-4', type: 'WRITING', status: 'active', tags: ['notion', 'workspace', 'notes'], contentType: 'text', trend: [50, 55, 60, 65, 70, 75, 78], usagePercent: 78, rating: 4, access: 'paid', owner: 'Notion Labs', source: 'https://notion.so', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-20', name: 'Writesonic', description: 'AI writer for articles and marketing content', url: 'https://writesonic.com', categoryId: 'cat-4', type: 'WRITING', status: 'active', tags: ['articles', 'seo', 'blog'], contentType: 'text', trend: [40, 45, 50, 54, 58, 62, 65], usagePercent: 65, rating: 4, access: 'freemium', owner: 'Writesonic', source: 'https://writesonic.com', isPinned: false, createdAt: now, updatedAt: now },

      // AGENT tools
      { id: 'tool-21', name: 'AutoGPT', description: 'Autonomous AI agent framework', url: 'https://autogpt.net', categoryId: 'cat-5', type: 'AGENT', status: 'active', tags: ['autonomous', 'open-source', 'experimental'], contentType: 'mixed', trend: [60, 65, 58, 52, 48, 50, 55], usagePercent: 55, rating: 3, access: 'free', owner: 'Significant Gravitas', source: 'https://github.com/Significant-Gravitas/AutoGPT', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-22', name: 'AgentGPT', description: 'Browser-based autonomous AI agent', url: 'https://agentgpt.reworkd.ai', categoryId: 'cat-5', type: 'AGENT', status: 'active', tags: ['browser', 'no-code', 'tasks'], contentType: 'mixed', trend: [45, 50, 48, 45, 42, 45, 48], usagePercent: 48, rating: 3, access: 'freemium', owner: 'Reworkd', source: 'https://reworkd.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-23', name: 'CrewAI', description: 'Framework for orchestrating AI agents', url: 'https://crewai.io', categoryId: 'cat-5', type: 'AGENT', status: 'active', tags: ['framework', 'multi-agent', 'python'], contentType: 'code', trend: [30, 40, 50, 60, 68, 75, 80], usagePercent: 80, rating: 4, access: 'free', owner: 'CrewAI', source: 'https://github.com/joaomdmoura/crewAI', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-24', name: 'LangChain', description: 'Framework for LLM application development', url: 'https://langchain.com', categoryId: 'cat-5', type: 'AGENT', status: 'active', tags: ['framework', 'chains', 'python'], contentType: 'code', trend: [55, 65, 72, 78, 82, 85, 88], usagePercent: 88, rating: 5, access: 'free', owner: 'LangChain', source: 'https://github.com/langchain-ai/langchain', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-25', name: 'Semantic Kernel', description: 'Microsoft SDK for AI orchestration', url: 'https://learn.microsoft.com/semantic-kernel', categoryId: 'cat-5', type: 'AGENT', status: 'active', tags: ['microsoft', 'sdk', 'enterprise'], contentType: 'code', trend: [40, 48, 55, 62, 68, 72, 75], usagePercent: 75, rating: 4, access: 'free', owner: 'Microsoft', source: 'https://github.com/microsoft/semantic-kernel', isPinned: false, createdAt: now, updatedAt: now },

      // AUDIO/VIDEO tools
      { id: 'tool-26', name: 'ElevenLabs', description: 'AI voice synthesis and cloning', url: 'https://elevenlabs.io', categoryId: 'cat-6', type: 'AUDIO', status: 'active', tags: ['voice', 'tts', 'cloning'], contentType: 'audio', trend: [60, 68, 75, 80, 84, 88, 90], usagePercent: 90, rating: 5, access: 'freemium', owner: 'ElevenLabs', source: 'https://elevenlabs.io', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-27', name: 'Runway', description: 'AI video generation and editing suite', url: 'https://runway.ml', categoryId: 'cat-6', type: 'VIDEO', status: 'active', tags: ['video', 'editing', 'gen-2'], contentType: 'video', trend: [55, 62, 70, 76, 82, 86, 88], usagePercent: 88, rating: 5, access: 'freemium', owner: 'Runway AI', source: 'https://runway.ml', isPinned: true, createdAt: now, updatedAt: now },
      { id: 'tool-28', name: 'Suno', description: 'AI music generation platform', url: 'https://suno.ai', categoryId: 'cat-6', type: 'AUDIO', status: 'active', tags: ['music', 'songs', 'creative'], contentType: 'audio', trend: [40, 52, 65, 75, 82, 86, 89], usagePercent: 89, rating: 5, access: 'freemium', owner: 'Suno AI', source: 'https://suno.ai', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-29', name: 'Pika', description: 'AI video generation and editing', url: 'https://pika.art', categoryId: 'cat-6', type: 'VIDEO', status: 'active', tags: ['video', 'animation', 'creative'], contentType: 'video', trend: [35, 48, 60, 70, 78, 82, 85], usagePercent: 85, rating: 4, access: 'freemium', owner: 'Pika Labs', source: 'https://pika.art', isPinned: false, createdAt: now, updatedAt: now },
      { id: 'tool-30', name: 'Descript', description: 'AI-powered audio/video editing', url: 'https://descript.com', categoryId: 'cat-6', type: 'VIDEO', status: 'active', tags: ['editing', 'transcription', 'podcast'], contentType: 'video', trend: [50, 55, 60, 65, 70, 74, 78], usagePercent: 78, rating: 4, access: 'freemium', owner: 'Descript', source: 'https://descript.com', isPinned: false, createdAt: now, updatedAt: now },
    ];
    toolData.forEach(t => this.tools.set(t.id, t));

    // Seed a collection
    const collection: Collection = {
      id: 'col-1',
      name: 'Favorites',
      description: 'My favorite AI tools',
      toolIds: ['tool-1', 'tool-2', 'tool-6', 'tool-11', 'tool-12'],
      createdAt: now,
      updatedAt: now,
    };
    this.collections.set(collection.id, collection);
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = `cat-${Date.now()}`;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...updateData };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Tools
  async getAllTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  async getTool(id: string): Promise<Tool | undefined> {
    return this.tools.get(id);
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const id = `tool-${Date.now()}`;
    const now = new Date();
    const newTool: Tool = { ...tool, id, createdAt: now, updatedAt: now } as Tool;
    this.tools.set(id, newTool);
    return newTool;
  }

  async updateTool(id: string, updateData: Partial<InsertTool>): Promise<Tool | undefined> {
    const tool = this.tools.get(id);
    if (!tool) return undefined;
    const updated = { ...tool, ...updateData, updatedAt: new Date() };
    this.tools.set(id, updated);
    return updated;
  }

  async deleteTool(id: string): Promise<boolean> {
    return this.tools.delete(id);
  }

  // Collections
  async getAllCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = `col-${Date.now()}`;
    const now = new Date();
    const newCollection: Collection = { ...collection, id, createdAt: now, updatedAt: now } as Collection;
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async updateCollection(id: string, updateData: Partial<InsertCollection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    const updated = { ...collection, ...updateData, updatedAt: new Date() };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    return this.collections.delete(id);
  }

  async addToolToCollection(collectionId: string, toolId: string): Promise<Collection | undefined> {
    const collection = this.collections.get(collectionId);
    if (!collection) return undefined;
    const toolIds = [...(collection.toolIds || [])];
    if (!toolIds.includes(toolId)) {
      toolIds.push(toolId);
    }
    const updated = { ...collection, toolIds, updatedAt: new Date() };
    this.collections.set(collectionId, updated);
    return updated;
  }

  async removeToolFromCollection(collectionId: string, toolId: string): Promise<Collection | undefined> {
    const collection = this.collections.get(collectionId);
    if (!collection) return undefined;
    const toolIds = (collection.toolIds || []).filter(id => id !== toolId);
    const updated = { ...collection, toolIds, updatedAt: new Date() };
    this.collections.set(collectionId, updated);
    return updated;
  }
}

// Use MemoryStorage if DATABASE_URL is not set, otherwise use DatabaseStorage
export const storage: IStorage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemoryStorage();
