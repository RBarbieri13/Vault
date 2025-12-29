import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import type { Category } from "@shared/schema";

// Types
export interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  bodyText: string;
  metaKeywords: string[];
}

export interface AIAnalysisResult {
  name: string;
  type: string;
  categoryId: string;
  summary: string;
  whatItIs: string;
  capabilities: string[];
  bestFor: string[];
  tags: string[];
  status: "active" | "inactive" | "beta" | "deprecated";
  contentType: "tool" | "website" | "video" | "podcast" | "article";
  notes: string;
}

// Singleton Anthropic client for connection reuse
let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// Content type detection sets for faster lookup
const VIDEO_HOSTS = new Set(["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "twitch.tv"]);
const PODCAST_HOSTS = new Set(["spotify.com", "podcasts.apple.com", "anchor.fm", "transistor.fm", "podbean.com", "buzzsprout.com"]);
const ARTICLE_HOSTS = new Set(["medium.com", "substack.com", "dev.to"]);

export function detectContentType(url: string): "tool" | "website" | "video" | "podcast" | "article" {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.toLowerCase();
    const path = pathname.toLowerCase();

    // Check video platforms
    for (const h of VIDEO_HOSTS) {
      if (host.includes(h)) return "video";
    }

    // Check podcast platforms
    for (const h of PODCAST_HOSTS) {
      if (host.includes(h)) return "podcast";
    }

    // Check article patterns
    for (const h of ARTICLE_HOSTS) {
      if (host.includes(h)) return "article";
    }
    if (host.includes("hashnode.") || host.includes("blog.") ||
        path.includes("/blog/") || path.includes("/article/") || path.includes("/post/")) {
      return "article";
    }

    return "tool";
  } catch {
    return "tool";
  }
}

// Scrape URL with timeout
const FETCH_TIMEOUT_MS = 5000;

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VaultBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $("script, style, nav, footer, header, aside, noscript, iframe").remove();

    // Extract metadata efficiently
    const title = $('meta[property="og:title"]').attr("content") ||
                  $('meta[name="twitter:title"]').attr("content") ||
                  $("title").text() || "";

    const description = $('meta[property="og:description"]').attr("content") ||
                        $('meta[name="twitter:description"]').attr("content") ||
                        $('meta[name="description"]').attr("content") || "";

    const ogImage = $('meta[property="og:image"]').attr("content") ||
                    $('meta[name="twitter:image"]').attr("content") || null;

    const keywordsAttr = $('meta[name="keywords"]').attr("content");
    const metaKeywords = keywordsAttr
      ? keywordsAttr.split(",").map(k => k.trim()).filter(Boolean).slice(0, 10)
      : [];

    // Extract main content (reduced to 2000 chars for faster AI processing)
    const bodyText = $("main, article, .content, #content, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      ogImage,
      bodyText,
      metaKeywords,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Optimized system prompt - concise for faster processing
const SYSTEM_PROMPT = `Extract tool info as JSON only. Schema:
{"name":"string","type":"CHATBOT|AGENT|IMAGE|WRITING|CODE|SEARCH|VIDEO|AUDIO|CREATIVE|DEV|RESEARCH","categoryId":"string","summary":"string<100chars","whatItIs":"string","capabilities":["3-5 items"],"bestFor":["3-5 items"],"tags":["3-7 from: LLM,Prod,Dev,Test,Creative,Open,Beta,Gen,Art,Content,Mkt,AI,OSS,Research,OpenAI,IDE,Notes,Edit,Voice,TTS,Avatar,Ent,Auto,Google,Fast,Search,Trans,Productivity,General,Experimental,Agents,Automation,No-code,Coding,Design,3D,Data,Modeling,Collaboration,Writing,Audio,Video"],"status":"active|inactive|beta|deprecated","contentType":"tool|website|video|podcast|article","notes":"string"}
Return ONLY valid JSON.`;

export async function analyzeWithClaude(
  content: ScrapedContent,
  categories: Pick<Category, "id" | "name">[]
): Promise<AIAnalysisResult> {
  const client = getAnthropicClient();

  // Build compact category list
  const categoryList = categories.map(c => `${c.id}:${c.name}`).join("|");

  const userPrompt = `URL:${content.url}
Title:${content.title}
Desc:${content.description}
Content:${content.bodyText.slice(0, 1500)}
Categories:${categoryList}
JSON:`;

  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 800,
    messages: [{ role: "user", content: userPrompt }],
    system: SYSTEM_PROMPT,
  });

  // Extract and parse response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();

  // Handle markdown wrapping
  let jsonStr = responseText;
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result = JSON.parse(jsonStr) as AIAnalysisResult;

  // Validate and normalize
  if (!result.name || !result.type || !result.categoryId) {
    throw new Error("Missing required fields in AI response");
  }

  result.capabilities = Array.isArray(result.capabilities) ? result.capabilities : [];
  result.bestFor = Array.isArray(result.bestFor) ? result.bestFor : [];
  result.tags = Array.isArray(result.tags) ? result.tags : [];
  result.notes = result.notes || "";

  return result;
}

// Main analysis function with improved error handling
export async function analyzeUrl(
  url: string,
  categories: Pick<Category, "id" | "name">[]
): Promise<{ success: true; data: AIAnalysisResult; scraped: ScrapedContent } | { success: false; error: string; errorType: string }> {
  // Validate URL format
  try {
    new URL(url);
  } catch {
    return { success: false, error: "Invalid URL format", errorType: "INVALID_URL" };
  }

  // Detect content type early (fast, no network)
  const detectedContentType = detectContentType(url);

  try {
    // Scrape the URL
    const scraped = await scrapeUrl(url);

    // Check for minimal content
    if (!scraped.title && !scraped.description && !scraped.bodyText) {
      return { success: false, error: "Could not extract content from page", errorType: "PARSE_FAILED" };
    }

    // Analyze with AI
    const analysis = await analyzeWithClaude(scraped, categories);

    // Apply URL-based content type if more specific
    if (detectedContentType !== "tool") {
      analysis.contentType = detectedContentType;
    }

    return { success: true, data: analysis, scraped };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAbort = error instanceof Error && error.name === "AbortError";

    if (isAbort || message.includes("Failed to fetch")) {
      return { success: false, error: "Could not reach URL (timeout or blocked)", errorType: "FETCH_FAILED" };
    }
    if (message.includes("ANTHROPIC_API_KEY")) {
      return { success: false, error: "AI service not configured", errorType: "AI_CONFIG_ERROR" };
    }
    if (message.includes("JSON") || message.includes("parse")) {
      return { success: false, error: "AI analysis failed - try again", errorType: "AI_PARSE_ERROR" };
    }

    console.error("URL analysis error:", message);
    return { success: false, error: "Analysis failed. Please try again.", errorType: "AI_FAILED" };
  }
}
