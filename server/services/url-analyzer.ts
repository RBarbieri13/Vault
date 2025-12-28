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

// Content type detection based on URL patterns
export function detectContentType(url: string): "tool" | "website" | "video" | "podcast" | "article" {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const pathname = new URL(url).pathname.toLowerCase();

    // Video platforms
    if (
      ["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "twitch.tv"].some((h) =>
        hostname.includes(h)
      )
    ) {
      return "video";
    }

    // Podcast platforms
    if (
      ["spotify.com", "podcasts.apple.com", "anchor.fm", "transistor.fm", "podbean.com", "buzzsprout.com"].some(
        (h) => hostname.includes(h)
      )
    ) {
      return "podcast";
    }

    // Article patterns
    if (
      hostname.includes("medium.com") ||
      hostname.includes("substack.com") ||
      hostname.includes("dev.to") ||
      hostname.includes("hashnode.") ||
      hostname.includes("blog.") ||
      pathname.includes("/blog/") ||
      pathname.includes("/article/") ||
      pathname.includes("/post/")
    ) {
      return "article";
    }

    // Default to tool for AI/tech products, website for others
    return "tool";
  } catch {
    return "tool";
  }
}

// Scrape URL and extract content
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script and style elements
  $("script, style, nav, footer, header, aside").remove();

  // Extract metadata
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;

  const metaKeywords =
    $('meta[name="keywords"]')
      .attr("content")
      ?.split(",")
      .map((k) => k.trim())
      .filter(Boolean) || [];

  // Extract main content text (limited to ~3000 chars for AI)
  const bodyText = $("main, article, .content, #content, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  return {
    url,
    title: title.trim(),
    description: description.trim(),
    ogImage,
    bodyText,
    metaKeywords,
  };
}

// Analyze content with Claude AI
export async function analyzeWithClaude(
  content: ScrapedContent,
  categories: Pick<Category, "id" | "name">[]
): Promise<AIAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are an AI tool catalog specialist. Analyze the provided webpage content and extract structured information for a tool database entry.

You MUST return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "name": "string - The official name of the tool/product (clean, no taglines)",
  "type": "string - One of: CHATBOT, AGENT, IMAGE, WRITING, CODE, SEARCH, VIDEO, AUDIO, CREATIVE, DEV, RESEARCH",
  "categoryId": "string - Best matching category ID from the provided list",
  "summary": "string - One sentence description (max 100 chars)",
  "whatItIs": "string - 1-2 sentence explanation of what this tool is and does",
  "capabilities": ["array of 3-5 key features/capabilities"],
  "bestFor": ["array of 3-5 ideal use cases or target users"],
  "tags": ["array of 3-7 relevant tags from the allowed list"],
  "status": "string - One of: active, inactive, beta, deprecated",
  "contentType": "string - One of: tool, website, video, podcast, article",
  "notes": "string - Any notable observations, pricing info, or caveats (optional)"
}

Available tags (use only these): LLM, Prod, Dev, Test, Creative, Open, Beta, Gen, Art, Content, Mkt, AI, OSS, Research, OpenAI, IDE, Notes, Edit, Voice, TTS, Avatar, Ent, Auto, Google, Fast, Search, Trans, Productivity, General, Experimental, Agents, Automation, No-code, Coding, Design, 3D, Data, Modeling, Collaboration, Writing, Audio, Video

Rules:
1. Infer the tool type from its primary function
2. Match to the most appropriate category from the provided list (use exact ID)
3. Extract REAL capabilities mentioned on the page, don't invent them
4. Set status to "beta" if you see beta/preview indicators, otherwise "active"
5. Keep summary concise and factual
6. Return ONLY the JSON object, nothing else`;

  const userPrompt = `Analyze this webpage and provide structured tool information.

URL: ${content.url}
Title: ${content.title}
Description: ${content.description}
Keywords: ${content.metaKeywords.join(", ")}

Page Content (excerpt):
${content.bodyText}

Available Categories (use exact ID for categoryId field):
${categories.map((c) => `- ID: "${c.id}", Name: "${c.name}"`).join("\n")}

Return ONLY the JSON object matching the schema. No markdown, no explanation.`;

  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  // Extract text from response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const result = JSON.parse(jsonStr) as AIAnalysisResult;

    // Validate required fields
    if (!result.name || !result.type || !result.categoryId) {
      throw new Error("Missing required fields in AI response");
    }

    // Ensure arrays are arrays
    result.capabilities = Array.isArray(result.capabilities) ? result.capabilities : [];
    result.bestFor = Array.isArray(result.bestFor) ? result.bestFor : [];
    result.tags = Array.isArray(result.tags) ? result.tags : [];

    return result;
  } catch (parseError) {
    console.error("Failed to parse AI response:", responseText);
    throw new Error("Failed to parse AI analysis response");
  }
}

// Main analysis function
export async function analyzeUrl(
  url: string,
  categories: Pick<Category, "id" | "name">[]
): Promise<{ success: true; data: AIAnalysisResult; scraped: ScrapedContent } | { success: false; error: string; errorType: string }> {
  try {
    // Validate URL
    new URL(url);
  } catch {
    return { success: false, error: "Invalid URL format", errorType: "INVALID_URL" };
  }

  try {
    // Scrape the URL
    const scraped = await scrapeUrl(url);

    // If no content extracted, return error
    if (!scraped.title && !scraped.description && !scraped.bodyText) {
      return { success: false, error: "Could not extract content from page", errorType: "PARSE_FAILED" };
    }

    // Detect content type from URL
    const detectedContentType = detectContentType(url);

    // Analyze with AI
    const analysis = await analyzeWithClaude(scraped, categories);

    // Override contentType with URL-based detection if more specific
    if (detectedContentType !== "tool") {
      analysis.contentType = detectedContentType;
    }

    return { success: true, data: analysis, scraped };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Failed to fetch")) {
      return { success: false, error: "Could not reach this URL. Please check it is valid.", errorType: "FETCH_FAILED" };
    }
    if (message.includes("ANTHROPIC_API_KEY")) {
      return { success: false, error: "AI service not configured", errorType: "AI_CONFIG_ERROR" };
    }
    if (message.includes("parse")) {
      return { success: false, error: "AI analysis produced invalid results", errorType: "AI_PARSE_ERROR" };
    }

    console.error("URL analysis error:", error);
    return { success: false, error: "Analysis failed. Please try again or fill manually.", errorType: "AI_FAILED" };
  }
}
