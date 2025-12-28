import { eq, sql, desc, asc } from "drizzle-orm";
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
  private pool: pg.Pool;

  constructor() {
    // Optimized connection pool settings for better performance
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool optimization
      max: 20, // Maximum number of connections in the pool
      min: 2, // Minimum number of connections to keep open
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Wait 5 seconds for a connection
      maxUses: 7500, // Close connections after 7500 queries to prevent memory leaks
    });
    this.db = drizzle(this.pool, { schema });
  }

  // ============================================
  // CATEGORIES
  // ============================================

  // Categories - ordered by sortOrder for consistent UI
  async getAllCategories(): Promise<Category[]> {
    return await this.db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));
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

  // Tools - ordered by pinned first, then by name for consistent display
  async getAllTools(): Promise<Tool[]> {
    return await this.db
      .select()
      .from(schema.tools)
      .orderBy(
        desc(schema.tools.isPinned),
        asc(schema.tools.name)
      );
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
    // Seed categories based on user's sample data hierarchy
    const categoryData = [
      { id: 'cat-chatbots', name: 'Chatbots & LLM', icon: '💬', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 0 },
      { id: 'cat-image', name: 'Image & Creative', icon: '🖼️', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 1 },
      { id: 'cat-video', name: 'Video', icon: '🎬', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 2 },
      { id: 'cat-audio', name: 'Audio', icon: '🎵', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 3 },
      { id: 'cat-development', name: 'Development', icon: '💻', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 4 },
      { id: 'cat-automation', name: 'Automation & Agents', icon: '🤖', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 5 },
      { id: 'cat-writing', name: 'Writing & Productivity', icon: '✍️', parentId: null, collapsed: false, toolIds: [] as string[], sortOrder: 6 },
    ];
    categoryData.forEach(c => this.categories.set(c.id, c as Category));

    // Seed tools - User's 30 sample AI tool entries
    const now = new Date();
    const toolData = [
      // ==================== CHATBOTS & LLM (7) ====================
      { id: 'tool-1', name: 'OpenAI ChatGPT', url: 'https://chat.openai.com', type: 'CHATBOT', summary: 'Conversational AI model for language tasks, coding, and content generation', tags: ['LLM', 'Productivity', 'General'], categoryId: 'cat-chatbots', isPinned: true, createdAt: new Date('2024-12-24'), whatItIs: 'OpenAI flagship conversational AI model', capabilities: ['Text generation', 'Code writing', 'Q&A', 'Content creation'], bestFor: ['General queries', 'Writing', 'Coding'], icon: '◎', trend: [65, 70, 72, 78, 82, 88, 94], usage: 94, status: 'active', contentType: 'tool' },
      { id: 'tool-2', name: 'Claude 3.5 Sonnet', url: 'https://claude.ai', type: 'CHATBOT', summary: 'Anthropic\'s most capable AI assistant focused on safety and helpfulness', tags: ['LLM', 'Research', 'Enterprise'], categoryId: 'cat-chatbots', isPinned: true, createdAt: new Date('2024-12-22'), whatItIs: 'Anthropic AI assistant with constitutional AI principles', capabilities: ['Long context', 'Analysis', 'Coding', 'Writing'], bestFor: ['Research', 'Coding', 'Document analysis'], icon: 'C', trend: [45, 52, 61, 70, 78, 84, 89], usage: 89, status: 'active', contentType: 'tool' },
      { id: 'tool-3', name: 'Google Gemini', url: 'https://gemini.google.com', type: 'CHATBOT', summary: 'Google\'s multimodal AI model with search integration', tags: ['LLM', 'Google', 'Multimodal'], categoryId: 'cat-chatbots', isPinned: false, createdAt: new Date('2024-12-20'), whatItIs: 'Google flagship multimodal AI model', capabilities: ['Multimodal', 'Code', 'Reasoning', 'Search integration'], bestFor: ['Research', 'Code', 'Analysis'], icon: 'G', trend: [50, 55, 60, 65, 70, 75, 79], usage: 79, status: 'active', contentType: 'tool' },
      { id: 'tool-4', name: 'Perplexity AI', url: 'https://perplexity.ai', type: 'SEARCH', summary: 'AI-powered search engine with cited sources and real-time data', tags: ['Research', 'Search', 'AI'], categoryId: 'cat-chatbots', isPinned: false, createdAt: new Date('2024-12-18'), whatItIs: 'AI-powered search engine with citations', capabilities: ['Real-time search', 'Citations', 'Follow-up questions'], bestFor: ['Research', 'Fact-checking', 'Current events'], icon: '◇', trend: [40, 48, 55, 62, 68, 72, 76], usage: 76, status: 'active', contentType: 'tool' },
      { id: 'tool-5', name: 'Meta Llama 3', url: 'https://llama.meta.com', type: 'CHATBOT', summary: 'Open source large language model for local deployment', tags: ['LLM', 'OpenSource', 'Local'], categoryId: 'cat-chatbots', isPinned: false, createdAt: new Date('2024-12-15'), whatItIs: 'Meta open source large language model', capabilities: ['Local deployment', 'Fine-tuning', 'Open weights'], bestFor: ['Development', 'Privacy', 'Custom models'], icon: 'Lm', trend: [55, 58, 60, 62, 64, 65, 65], usage: 65, status: 'active', contentType: 'tool' },
      { id: 'tool-6', name: 'Mistral AI', url: 'https://mistral.ai', type: 'CHATBOT', summary: 'European open-weight AI models with strong performance', tags: ['LLM', 'OpenSource', 'EU'], categoryId: 'cat-chatbots', isPinned: false, createdAt: new Date('2024-12-12'), whatItIs: 'European open-weight AI models', capabilities: ['Open weights', 'Strong performance', 'EU compliance'], bestFor: ['Enterprise', 'Privacy', 'EU deployment'], icon: 'Mi', trend: [30, 35, 42, 48, 52, 55, 58], usage: 58, status: 'active', contentType: 'tool' },
      { id: 'tool-7', name: 'Pi by Inflection', url: 'https://pi.ai', type: 'CHATBOT', summary: 'Personal AI companion designed for emotional intelligence', tags: ['LLM', 'Personal', 'EQ'], categoryId: 'cat-chatbots', isPinned: false, createdAt: new Date('2024-12-10'), whatItIs: 'Personal AI companion with emotional intelligence', capabilities: ['Emotional support', 'Conversation', 'Personal assistant'], bestFor: ['Personal use', 'Emotional support', 'Casual chat'], icon: 'Pi', trend: [38, 40, 41, 42, 42, 42, 42], usage: 42, status: 'active', contentType: 'tool' },

      // ==================== IMAGE & CREATIVE (6) ====================
      { id: 'tool-8', name: 'Midjourney', url: 'https://midjourney.com', type: 'IMAGE', summary: 'AI image generation via Discord with artistic and photorealistic styles', tags: ['Creative', 'Art', 'Discord'], categoryId: 'cat-image', isPinned: true, createdAt: new Date('2024-12-24'), whatItIs: 'AI art generator accessible through Discord', capabilities: ['Artistic styles', 'High quality', 'Variations', 'Upscaling'], bestFor: ['Art', 'Design', 'Concepts'], icon: '⛵', trend: [88, 90, 92, 94, 96, 97, 98], usage: 98, status: 'active', contentType: 'tool' },
      { id: 'tool-9', name: 'DALL-E 3', url: 'https://openai.com/dall-e-3', type: 'IMAGE', summary: 'OpenAI\'s latest image generation model with excellent text rendering', tags: ['Creative', 'OpenAI', 'Text'], categoryId: 'cat-image', isPinned: false, createdAt: new Date('2024-12-20'), whatItIs: 'OpenAI state-of-the-art image generator', capabilities: ['Text in images', 'Prompt understanding', 'Multiple styles'], bestFor: ['Marketing', 'Content', 'Graphics'], icon: '◎', trend: [82, 83, 84, 84, 85, 85, 85], usage: 85, status: 'active', contentType: 'tool' },
      { id: 'tool-10', name: 'Stable Diffusion XL', url: 'https://stability.ai', type: 'IMAGE', summary: 'Open source image generation model with local deployment options', tags: ['Creative', 'OpenSource', 'Local'], categoryId: 'cat-image', isPinned: false, createdAt: new Date('2024-12-18'), whatItIs: 'Open source image generation model', capabilities: ['Open source', 'Local run', 'Customizable', 'Fine-tuning'], bestFor: ['Development', 'Custom models', 'Privacy'], icon: 'SD', trend: [80, 79, 78, 78, 78, 78, 78], usage: 78, status: 'active', contentType: 'tool' },
      { id: 'tool-11', name: 'Flux Pro', url: 'https://blackforestlabs.ai', type: 'IMAGE', summary: 'Fast high-quality image generation with excellent prompt adherence', tags: ['Creative', 'Fast', 'Quality'], categoryId: 'cat-image', isPinned: false, createdAt: new Date('2024-12-15'), whatItIs: 'High-quality image generation model', capabilities: ['Speed', 'Quality', 'Consistency', 'Prompt adherence'], bestFor: ['Rapid iteration', 'Production', 'Quality'], icon: 'Fl', trend: [45, 52, 58, 64, 68, 71, 73], usage: 73, status: 'active', contentType: 'tool' },
      { id: 'tool-12', name: 'Leonardo AI', url: 'https://leonardo.ai', type: 'IMAGE', summary: 'AI art platform with fine-tuned models and training capabilities', tags: ['Creative', 'Training', 'Platform'], categoryId: 'cat-image', isPinned: false, createdAt: new Date('2024-12-12'), whatItIs: 'Creative AI platform with fine-tuning', capabilities: ['Custom models', 'Multiple styles', 'Training', 'Game assets'], bestFor: ['Game dev', 'Consistent styles', 'Assets'], icon: 'Le', trend: [55, 58, 61, 63, 65, 66, 67], usage: 67, status: 'active', contentType: 'tool' },
      { id: 'tool-13', name: 'Ideogram', url: 'https://ideogram.ai', type: 'IMAGE', summary: 'AI image generator specializing in typography and text in images', tags: ['Creative', 'Typography', 'Text'], categoryId: 'cat-image', isPinned: false, createdAt: new Date('2024-12-10'), whatItIs: 'Image generator excelling at text in images', capabilities: ['Text rendering', 'Logos', 'Typography', 'Design'], bestFor: ['Logos', 'Marketing', 'Text-heavy'], icon: 'Id', trend: [35, 40, 45, 48, 51, 53, 54], usage: 54, status: 'active', contentType: 'tool' },

      // ==================== VIDEO (3) ====================
      { id: 'tool-14', name: 'Runway Gen-3', url: 'https://runway.com', type: 'VIDEO', summary: 'AI video generation and editing platform with motion brush', tags: ['Creative', 'Video', 'Editing'], categoryId: 'cat-video', isPinned: false, createdAt: new Date('2024-12-18'), whatItIs: 'AI video generation and editing platform', capabilities: ['Video generation', 'Motion brush', 'Editing', 'Effects'], bestFor: ['Video production', 'Creative projects', 'Editing'], icon: 'R', trend: [50, 55, 58, 62, 65, 67, 69], usage: 69, status: 'active', contentType: 'tool' },
      { id: 'tool-15', name: 'Pika Labs', url: 'https://pika.art', type: 'VIDEO', summary: 'AI video generation from text and images with motion controls', tags: ['Creative', 'Video', 'Motion'], categoryId: 'cat-video', isPinned: false, createdAt: new Date('2024-12-15'), whatItIs: 'AI video generation with motion controls', capabilities: ['Text to video', 'Image to video', 'Motion controls'], bestFor: ['Short videos', 'Animation', 'Creative'], icon: 'Pk', trend: [40, 45, 50, 54, 58, 60, 62], usage: 62, status: 'active', contentType: 'tool' },
      { id: 'tool-16', name: 'Sora', url: 'https://openai.com/sora', type: 'VIDEO', summary: 'OpenAI\'s text-to-video model for realistic video generation', tags: ['Creative', 'Video', 'OpenAI'], categoryId: 'cat-video', isPinned: false, createdAt: new Date('2024-12-20'), whatItIs: 'OpenAI text-to-video model', capabilities: ['Realistic video', 'Long form', 'High quality'], bestFor: ['Professional video', 'Cinematic', 'Storytelling'], icon: 'So', trend: [10, 18, 25, 32, 38, 42, 45], usage: 45, status: 'beta', contentType: 'tool' },

      // ==================== AUDIO (3) ====================
      { id: 'tool-17', name: 'ElevenLabs', url: 'https://elevenlabs.io', type: 'AUDIO', summary: 'AI voice synthesis, cloning, and text-to-speech platform', tags: ['Voice', 'TTS', 'Cloning'], categoryId: 'cat-audio', isPinned: false, createdAt: new Date('2024-12-16'), whatItIs: 'AI voice synthesis and cloning platform', capabilities: ['Voice cloning', 'Text-to-speech', 'Multiple languages', 'Emotions'], bestFor: ['Voiceovers', 'Content creation', 'Accessibility'], icon: '\'l', trend: [55, 58, 62, 65, 68, 70, 71], usage: 71, status: 'active', contentType: 'tool' },
      { id: 'tool-18', name: 'Suno AI', url: 'https://suno.ai', type: 'AUDIO', summary: 'AI music generation from text prompts with vocals and instruments', tags: ['Music', 'Creative', 'Generation'], categoryId: 'cat-audio', isPinned: false, createdAt: new Date('2024-12-14'), whatItIs: 'AI music generation platform', capabilities: ['Music generation', 'Vocals', 'Instruments', 'Lyrics'], bestFor: ['Music creation', 'Content', 'Experimentation'], icon: 'Su', trend: [35, 42, 48, 54, 58, 61, 63], usage: 63, status: 'active', contentType: 'tool' },
      { id: 'tool-19', name: 'Whisper', url: 'https://github.com/openai/whisper', type: 'AUDIO', summary: 'OpenAI\'s speech recognition model for transcription', tags: ['Transcription', 'OpenSource', 'STT'], categoryId: 'cat-audio', isPinned: false, createdAt: new Date('2024-12-10'), whatItIs: 'OpenAI speech recognition model', capabilities: ['Transcription', 'Multiple languages', 'Open source'], bestFor: ['Transcription', 'Subtitles', 'Accessibility'], icon: 'Wh', trend: [72, 73, 74, 75, 76, 77, 77], usage: 77, status: 'active', contentType: 'tool' },

      // ==================== DEVELOPMENT (5) ====================
      { id: 'tool-20', name: 'GitHub Copilot', url: 'https://github.com/features/copilot', type: 'CODE', summary: 'AI pair programmer integrated with VS Code and JetBrains IDEs', tags: ['Development', 'AI', 'IDE'], categoryId: 'cat-development', isPinned: true, createdAt: new Date('2024-12-22'), whatItIs: 'AI coding assistant integrated into IDE', capabilities: ['Code completion', 'Suggestions', 'Documentation', 'Chat'], bestFor: ['Daily coding', 'Boilerplate', 'Learning'], icon: '⬡', trend: [82, 84, 86, 88, 89, 90, 91], usage: 91, status: 'active', contentType: 'tool' },
      { id: 'tool-21', name: 'Cursor', url: 'https://cursor.com', type: 'CODE', summary: 'AI-first code editor with built-in chat and intelligent completions', tags: ['Development', 'IDE', 'Editor'], categoryId: 'cat-development', isPinned: true, createdAt: new Date('2024-12-20'), whatItIs: 'VS Code fork with native AI integration', capabilities: ['Chat', 'Edit', 'Codebase aware', 'Multi-file'], bestFor: ['Full projects', 'Refactoring', 'Learning'], icon: 'Cu', trend: [60, 68, 74, 79, 83, 86, 88], usage: 88, status: 'active', contentType: 'tool' },
      { id: 'tool-22', name: 'Replit AI', url: 'https://replit.com', type: 'CODE', summary: 'Cloud IDE with AI code generation and deployment', tags: ['Development', 'Cloud', 'Deployment'], categoryId: 'cat-development', isPinned: false, createdAt: new Date('2024-12-18'), whatItIs: 'Cloud IDE with AI features', capabilities: ['Browser-based', 'Multiplayer', 'Deploy', 'AI assist'], bestFor: ['Quick projects', 'Learning', 'Collaboration'], icon: 'Re', trend: [62, 64, 66, 68, 70, 71, 72], usage: 72, status: 'active', contentType: 'tool' },
      { id: 'tool-23', name: 'Cody by Sourcegraph', url: 'https://sourcegraph.com/cody', type: 'CODE', summary: 'AI coding assistant with codebase context and search', tags: ['Development', 'Search', 'Context'], categoryId: 'cat-development', isPinned: false, createdAt: new Date('2024-12-15'), whatItIs: 'AI coding assistant with codebase context', capabilities: ['Codebase search', 'Context aware', 'Multi-repo'], bestFor: ['Large codebases', 'Enterprise', 'Search'], icon: 'Cd', trend: [48, 50, 51, 52, 53, 54, 54], usage: 54, status: 'active', contentType: 'tool' },
      { id: 'tool-24', name: 'Tabnine', url: 'https://tabnine.com', type: 'CODE', summary: 'AI code completion with team learning and privacy focus', tags: ['Development', 'Completion', 'Privacy'], categoryId: 'cat-development', isPinned: false, createdAt: new Date('2024-12-12'), whatItIs: 'Privacy-first AI coding assistant', capabilities: ['Local models', 'Enterprise', 'Secure', 'Team learning'], bestFor: ['Enterprise', 'Privacy', 'Compliance'], icon: 'Tb', trend: [52, 51, 50, 49, 48, 48, 48], usage: 48, status: 'active', contentType: 'tool' },

      // ==================== AUTOMATION & AGENTS (4) ====================
      { id: 'tool-25', name: 'Zapier', url: 'https://zapier.com', type: 'AGENT', summary: 'Automation platform connecting 5000+ apps with AI actions', tags: ['Automation', 'Integration', 'NoCode'], categoryId: 'cat-automation', isPinned: true, createdAt: new Date('2024-12-20'), whatItIs: 'Automation platform with AI actions', capabilities: ['5000+ integrations', 'AI actions', 'No-code', 'Workflows'], bestFor: ['Business automation', 'Integration', 'Productivity'], icon: '★', trend: [80, 80, 81, 81, 82, 82, 82], usage: 82, status: 'active', contentType: 'tool' },
      { id: 'tool-26', name: 'Make (Integromat)', url: 'https://make.com', type: 'AGENT', summary: 'Visual automation platform for complex multi-step workflows', tags: ['Automation', 'Visual', 'Workflows'], categoryId: 'cat-automation', isPinned: false, createdAt: new Date('2024-12-18'), whatItIs: 'Visual automation platform', capabilities: ['Visual builder', 'Complex workflows', 'Many integrations'], bestFor: ['Complex automation', 'Visual workflows', 'Power users'], icon: 'Mk', trend: [62, 64, 65, 66, 67, 68, 68], usage: 68, status: 'active', contentType: 'tool' },
      { id: 'tool-27', name: 'AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT', type: 'AGENT', summary: 'Autonomous AI agent for complex multi-step task execution', tags: ['Automation', 'Autonomous', 'OpenSource'], categoryId: 'cat-automation', isPinned: false, createdAt: new Date('2024-12-14'), whatItIs: 'Open source autonomous agent', capabilities: ['Task chains', 'Web browse', 'Memory', 'Autonomous'], bestFor: ['Research', 'Automation', 'Experiments'], icon: 'AG', trend: [65, 60, 58, 55, 53, 52, 51], usage: 51, status: 'beta', contentType: 'tool' },
      { id: 'tool-28', name: 'CrewAI', url: 'https://crewai.com', type: 'AGENT', summary: 'Framework for orchestrating AI agents working together', tags: ['Development', 'Agents', 'Framework'], categoryId: 'cat-automation', isPinned: false, createdAt: new Date('2024-12-12'), whatItIs: 'Framework for orchestrating AI agents', capabilities: ['Multi-agent', 'Orchestration', 'Python', 'Customizable'], bestFor: ['Agent development', 'Complex tasks', 'Automation'], icon: 'Cr', trend: [25, 30, 35, 40, 43, 45, 47], usage: 47, status: 'active', contentType: 'tool' },

      // ==================== WRITING & PRODUCTIVITY (2) ====================
      { id: 'tool-29', name: 'Notion AI', url: 'https://notion.so', type: 'WRITING', summary: 'AI writing features built into Notion workspace and databases', tags: ['Productivity', 'Notes', 'Workspace'], categoryId: 'cat-writing', isPinned: false, createdAt: new Date('2024-12-16'), whatItIs: 'AI embedded in Notion', capabilities: ['Summarize', 'Draft', 'Edit', 'Translate', 'Database queries'], bestFor: ['Note-taking', 'Team docs', 'Productivity'], icon: 'N', trend: [68, 70, 71, 72, 73, 74, 74], usage: 74, status: 'active', contentType: 'tool' },
      { id: 'tool-30', name: 'Jasper', url: 'https://jasper.ai', type: 'WRITING', summary: 'AI writing assistant for marketing copy and content creation', tags: ['Marketing', 'Content', 'Copy'], categoryId: 'cat-writing', isPinned: false, createdAt: new Date('2024-12-14'), whatItIs: 'Marketing-focused AI writer', capabilities: ['Ad copy', 'Blog posts', 'Templates', 'Brand voice'], bestFor: ['Marketing', 'SEO', 'Scale content'], icon: '○', trend: [72, 70, 69, 68, 67, 66, 66], usage: 66, status: 'active', contentType: 'tool' },
    ];
    toolData.forEach(t => this.tools.set(t.id, t as Tool));

    // Seed a collection with favorites from sample data
    const collection = {
      id: 'col-1',
      name: 'Favorites',
      icon: '⭐',
      toolIds: ['tool-1', 'tool-2', 'tool-8', 'tool-20', 'tool-21', 'tool-25'],
      sortOrder: 0,
    };
    this.collections.set(collection.id, collection as Collection);
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
    const newCategory: Category = {
      id,
      name: category.name,
      icon: category.icon ?? null,
      parentId: category.parentId ?? null,
      collapsed: category.collapsed ?? false,
      toolIds: category.toolIds ?? [],
      sortOrder: category.sortOrder ?? 0,
    };
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
