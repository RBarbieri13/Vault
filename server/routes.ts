import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertToolSchema, insertCollectionSchema, type Category } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { analyzeUrl } from "./services/url-analyzer";

// Category cache for faster URL analysis
let categoryCache: { data: Pick<Category, "id" | "name">[]; timestamp: number } | null = null;
const CATEGORY_CACHE_TTL = 60000; // 1 minute

async function getCachedCategories(): Promise<Pick<Category, "id" | "name">[]> {
  const now = Date.now();
  if (categoryCache && (now - categoryCache.timestamp) < CATEGORY_CACHE_TTL) {
    return categoryCache.data;
  }
  const categories = await storage.getAllCategories();
  categoryCache = {
    data: categories.map(c => ({ id: c.id, name: c.name })),
    timestamp: now,
  };
  return categoryCache.data;
}

function invalidateCategoryCache() {
  categoryCache = null;
}

// Structured logging for API calls
const logApi = (method: string, path: string, status: number, duration: number, details?: string) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${method} ${path} ${status} ${duration}ms`;
  if (status >= 400) {
    console.error(message, details ? `- ${details}` : '');
  } else {
    console.log(message, details ? `- ${details}` : '');
  }
};

// Middleware for timing API calls
const withTiming = (handler: (req: any, res: any) => Promise<void>) => {
  return async (req: any, res: any) => {
    const start = Date.now();
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = (data: any) => {
      const duration = Date.now() - start;
      logApi(req.method, req.path, res.statusCode, duration);
      return originalJson(data);
    };

    res.send = (data: any) => {
      const duration = Date.now() - start;
      logApi(req.method, req.path, res.statusCode, duration);
      return originalSend(data);
    };

    await handler(req, res);
  };
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============================================
  // HEALTH CHECK (for deployment services)
  // ============================================

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0"
    });
  });

  // ============================================
  // CATEGORY ROUTES
  // ============================================

  app.get("/api/categories", withTiming(async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }));

  app.get("/api/categories/:id", withTiming(async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  }));

  app.post("/api/categories", withTiming(async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).toString() });
      }
      const category = await storage.createCategory(parsed.data);
      invalidateCategoryCache();
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  }));

  app.patch("/api/categories/:id", withTiming(async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      invalidateCategoryCache();
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  }));

  app.delete("/api/categories/:id", withTiming(async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      invalidateCategoryCache();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }));

  // ============================================
  // TOOL ROUTES
  // ============================================

  app.get("/api/tools", withTiming(async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  }));

  app.get("/api/tools/:id", withTiming(async (req, res) => {
    try {
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({ error: "Failed to fetch tool" });
    }
  }));

  app.post("/api/tools", withTiming(async (req, res) => {
    try {
      const parsed = insertToolSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).toString() });
      }
      const tool = await storage.createTool(parsed.data);
      res.status(201).json(tool);
    } catch (error) {
      console.error("Error creating tool:", error);
      res.status(500).json({ error: "Failed to create tool" });
    }
  }));

  app.patch("/api/tools/:id", withTiming(async (req, res) => {
    try {
      const tool = await storage.updateTool(req.params.id, req.body);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error updating tool:", error);
      res.status(500).json({ error: "Failed to update tool" });
    }
  }));

  app.delete("/api/tools/:id", withTiming(async (req, res) => {
    try {
      await storage.deleteTool(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tool:", error);
      res.status(500).json({ error: "Failed to delete tool" });
    }
  }));

  // ============================================
  // COLLECTION ROUTES
  // ============================================

  app.get("/api/collections", withTiming(async (req, res) => {
    try {
      const collections = await storage.getAllCollections();
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  }));

  app.get("/api/collections/:id", withTiming(async (req, res) => {
    try {
      const collection = await storage.getCollection(req.params.id);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  }));

  app.post("/api/collections", withTiming(async (req, res) => {
    try {
      const parsed = insertCollectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).toString() });
      }
      const collection = await storage.createCollection(parsed.data);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  }));

  app.patch("/api/collections/:id", withTiming(async (req, res) => {
    try {
      const collection = await storage.updateCollection(req.params.id, req.body);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ error: "Failed to update collection" });
    }
  }));

  app.delete("/api/collections/:id", withTiming(async (req, res) => {
    try {
      await storage.deleteCollection(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  }));

  // Add tool to collection
  app.post("/api/collections/:id/tools/:toolId", withTiming(async (req, res) => {
    try {
      const collection = await storage.addToolToCollection(req.params.id, req.params.toolId);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error adding tool to collection:", error);
      res.status(500).json({ error: "Failed to add tool to collection" });
    }
  }));

  // Remove tool from collection
  app.delete("/api/collections/:id/tools/:toolId", withTiming(async (req, res) => {
    try {
      const collection = await storage.removeToolFromCollection(req.params.id, req.params.toolId);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error removing tool from collection:", error);
      res.status(500).json({ error: "Failed to remove tool from collection" });
    }
  }));

  // ============================================
  // URL ANALYSIS ROUTES
  // ============================================

  // URL Analysis endpoint - AI-powered auto-fill (optimized with caching)
  app.post("/api/analyze-url", withTiming(async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({
          success: false,
          error: "URL is required",
          errorType: "MISSING_URL"
        });
      }

      // Use cached categories for faster response
      const categoryList = await getCachedCategories();

      // Analyze the URL with AI
      const result = await analyzeUrl(url, categoryList);

      res.json(result);
    } catch (error) {
      console.error("Error analyzing URL:", error);
      res.status(500).json({
        success: false,
        error: "Analysis failed unexpectedly",
        errorType: "SERVER_ERROR"
      });
    }
  }));

  return httpServer;
}
