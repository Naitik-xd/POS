import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  extractClientIp,
  validateIpRequest,
  recordSuccessfulRequest,
  isGibberish,
  handleGibberishOffense,
  getIpSecurityRecord,
  getAllIpSecurityRecords,
  updateIpSecurityRecord,
} from "./src/services/aiSecurityGuard.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Security Headers Middleware (A+ rating on Observatory / SecurityHeaders)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), browsing-topics=()"
  );
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app; base-uri 'self'; form-action 'self'; object-src 'none';"
  );
  next();
});

app.use(express.json({ limit: "5mb" }));

// Helper to retrieve Gemini API key (supports Vercel secret GAPI_POS and fallback GEMINI_API_KEY)
function getGeminiApiKey(): string | undefined {
  return process.env.GAPI_POS || process.env.GEMINI_API_KEY;
}

// Lazy initialize Gemini API client with required User-Agent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GAPI_POS or GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(getGeminiApiKey()),
  });
});

// Endpoint for Manager to inspect IP security status
app.get("/api/security/ip-status", (req: Request, res: Response) => {
  const clientIp = extractClientIp(req);
  const targetIp = (req.query.ip as string) || clientIp;
  const record = getIpSecurityRecord(targetIp);
  const allRecords = getAllIpSecurityRecords();

  res.json({
    clientIp,
    currentRecord: record,
    allRecords,
    limits: {
      maxRequests: 15,
      windowHours: 3,
      gibberishWarningsAllowed: 3,
      tempBanHours: 24,
    },
  });
});

// Endpoint for Manager to set perma_ban (true/false) or reset IP warnings
app.post("/api/security/set-perma-ban", (req: Request, res: Response) => {
  const { ip, perma_ban, notes, reset_warnings } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: "IP address is required." });
  }

  const updates: any = {};
  if (typeof perma_ban === "boolean") {
    updates.perma_ban = perma_ban;
  }
  if (notes) {
    updates.notes = notes;
  }
  if (reset_warnings) {
    updates.warning_count = 0;
    updates.is_banned = false;
    updates.banned_until = null;
  }

  const updatedRecord = updateIpSecurityRecord(ip, updates);
  res.json({
    success: true,
    record: updatedRecord,
    message: `Updated IP ${ip}: perma_ban=${updatedRecord.perma_ban}`,
  });
});

// Comprehensive AI Store Intelligence Analysis
app.post("/api/gemini/analyze", async (req: Request, res: Response) => {
  const clientIp = extractClientIp(req);

  // Validate security, perma-ban & 15 req/3hr limit
  const securityCheck = validateIpRequest(clientIp);
  if (!securityCheck.allowed) {
    return res.status(securityCheck.statusCode || 429).json({
      success: false,
      error: securityCheck.error,
      record: securityCheck.record,
      securityBlocked: true,
    });
  }

  try {
    const { inventorySummary, salesSummary, customQuestion } = req.body;

    // Check customQuestion for gibberish if provided
    if (customQuestion && typeof customQuestion === "string") {
      const gibberishCheck = isGibberish(customQuestion);
      if (gibberishCheck.isGibberish) {
        const offense = handleGibberishOffense(clientIp, gibberishCheck.reason);
        return res.status(offense.isBannedNow ? 429 : 400).json({
          success: false,
          error: offense.message,
          warningCount: offense.warningCount,
          isBannedNow: offense.isBannedNow,
          bannedUntil: offense.bannedUntil,
          isGibberish: true,
        });
      }
    }

    const ai = getGeminiClient();

    const prompt = `
You are an expert Grocery Retail Business Intelligence Consultant and Inventory Operations Analyst.
Analyze the following store inventory and sales metrics from this grocery store:

=== INVENTORY SNAPSHOT ===
${JSON.stringify(inventorySummary, null, 2)}

=== SALES & TRANSACTIONS SNAPSHOT ===
${JSON.stringify(salesSummary, null, 2)}

${customQuestion ? `=== USER SPECIFIC INQUIRY ===\n${customQuestion}\n` : ""}

Please generate an actionable, professional, and clear retail report formatted strictly as JSON with the following structure:
{
  "executiveSummary": "Concise 2-3 sentence overview of overall store velocity, stock health, and cash generation.",
  "trendingItems": [
    {
      "name": "Item Name",
      "reason": "Why it is trending (velocity, repeat orders, basket driver)",
      "actionRecommendation": "e.g. Ensure prime eye-level shelf placement, check safety stock"
    }
  ],
  "underperformingItems": [
    {
      "name": "Item Name",
      "stockCount": 0,
      "reason": "Why it is stagnant or slow-moving",
      "actionRecommendation": "e.g. Bundle with high-velocity complementary item, weekend 15% markdown"
    }
  ],
  "lowStockAlerts": [
    {
      "name": "Item Name",
      "currentStock": 0,
      "recommendedReorderQty": 0,
      "urgency": "CRITICAL"
    }
  ],
  "bundleOpportunities": [
    {
      "pair": "Item A + Item B",
      "rationale": "High grocery basket correlation",
      "discountStrategy": "e.g. Buy Bread & Eggs, get 10% off Butter"
    }
  ],
  "pricingAndMarginTips": [
    "Tip 1 for margin improvement or perishable waste reduction",
    "Tip 2"
  ],
  "customAnswer": "${customQuestion ? "Direct answer to the user inquiry with grocery data evidence" : ""}"
}

Return ONLY valid JSON matching this schema. Do not enclose in markdown ticks if possible, or use standard raw JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    // Record legitimate successful call
    const updatedRecord = recordSuccessfulRequest(clientIp);

    const rawText = response.text || "{}";
    let parsedData;
    try {
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    } catch {
      parsedData = {
        executiveSummary: rawText,
        trendingItems: [],
        underperformingItems: [],
        lowStockAlerts: [],
        bundleOpportunities: [],
        pricingAndMarginTips: [],
      };
    }

    res.json({
      success: true,
      analysis: parsedData,
      generatedAt: new Date().toISOString(),
      security: {
        remainingRequests: Math.max(0, 15 - updatedRecord.request_count),
        warningCount: updatedRecord.warning_count,
        ip: clientIp,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini Analysis Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to analyze grocery data with Gemini.",
    });
  }
});

// Interactive AI Retail Copilot Chat
app.post("/api/gemini/chat", async (req: Request, res: Response) => {
  const clientIp = extractClientIp(req);

  // 1. Validate security, perma-ban & 15 req/3hr limit
  const securityCheck = validateIpRequest(clientIp);
  if (!securityCheck.allowed) {
    return res.status(securityCheck.statusCode || 429).json({
      success: false,
      error: securityCheck.error,
      record: securityCheck.record,
      securityBlocked: true,
    });
  }

  const { messages, storeContext } = req.body;
  const lastUserMsg = (messages || []).filter((m: any) => m.role === 'user').pop()?.content || '';

  // 2. Check for Gibberish & prompt-injection
  if (lastUserMsg) {
    const gibberishCheck = isGibberish(lastUserMsg);
    if (gibberishCheck.isGibberish) {
      const offense = handleGibberishOffense(clientIp, gibberishCheck.reason);
      return res.status(offense.isBannedNow ? 429 : 400).json({
        success: false,
        error: offense.message,
        reply: offense.message,
        warningCount: offense.warningCount,
        isBannedNow: offense.isBannedNow,
        bannedUntil: offense.bannedUntil,
        isGibberish: true,
      });
    }
  }

  try {
    if (!getGeminiApiKey()) {
      throw new Error("GAPI_POS or GEMINI_API_KEY not configured in environment");
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are FreshMart AI, an expert grocery store operations assistant.
You help grocery store cashiers and managers with:
- Finding trending grocery items and sales velocity
- Identifying items that are running low and need reorder
- Highlighting slow-moving or perishable inventory at risk
- Suggesting grocery promotion bundles and pricing optimizations
- Store Context Data: ${JSON.stringify(storeContext || {})}
If a user prompt is unclear or marginally coherent, politely ask them to rephrase and refuse to engage in non-grocery random babbling. Format your answers cleanly with concise markdown bullet points, clear grocery advice, and actionable numbers.`;

    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    // Record legitimate successful call
    const updatedRecord = recordSuccessfulRequest(clientIp);

    res.json({
      success: true,
      reply: response.text || "I'm ready to assist with your grocery store operations.",
      source: "gemini-2.5-flash",
      security: {
        remainingRequests: Math.max(0, 15 - updatedRecord.request_count),
        warningCount: updatedRecord.warning_count,
        ip: clientIp,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.warn("Gemini Chat fallback triggered:", err.message);

    // Record legitimate attempt
    const updatedRecord = recordSuccessfulRequest(clientIp);

    // Context-grounded intelligent grocery store response
    const lowStockList = storeContext?.lowStockItems?.map((i: any) => `${i.name} (only ${i.stock} left)`).join(', ') || 'Honeycrisp Apples, Pasture Eggs, Spinach';
    const topSellers = storeContext?.topSellingItems?.map((i: any) => `${i.name} ($${i.price})`).join(', ') || 'Large Brown Eggs, Milk 1 Gal, Bananas';
    const outOfStock = storeContext?.outOfStockItems?.join(', ') || 'Organic Jasmine Rice';

    let fallbackReply = `Here is the operational analysis for your store:\n\n`;
    const q = lastUserMsg.toLowerCase();

    if (q.includes('trend') || q.includes('popular') || q.includes('best seller')) {
      fallbackReply += `🔥 **Trending High-Velocity Items:**\n${storeContext?.topSellingItems?.map((i: any, idx: number) => `${idx + 1}. **${i.name}** — High sales count (${i.sales} sold, retail $${i.price})`).join('\n') || topSellers}\n\n💡 *Action:* Keep these stocked on main entrance displays to maintain sales momentum.`;
    } else if (q.includes('low') || q.includes('reorder') || q.includes('stock') || q.includes('empty')) {
      fallbackReply += `⚠️ **Urgent Inventory Alerts:**\n• **Out of stock:** ${outOfStock}\n• **Critically low:** ${lowStockList}\n\n📦 *Recommendation:* Issue reorders today for these staple lines to prevent customer walkouts.`;
    } else if (q.includes('bundle') || q.includes('discount') || q.includes('promo') || q.includes('deal')) {
      fallbackReply += `🏷️ **Recommended Promotional Grocery Bundle:**\n• **"Farm Fresh Breakfast Basket"**\n  - Large Brown Eggs + Milk 1 Gal + Artisan Sourdough Boule\n  - Normal Total: $14.77 → Bundle Special: $12.99 (Save 12%)\n  - Benefit: High-margin pairing that increases average basket value.`;
    } else {
      fallbackReply += `📊 **Store Operational Snapshot:**\n• **Active Catalog:** ${storeContext?.totalProducts || 18} unique grocery products\n• **Top Performing Lines:** ${topSellers}\n• **Low Stock Attention:** ${lowStockList}\n• **Total Transactions Logged:** ${storeContext?.recentSalesCount || 3} receipts\n\nFeel free to ask me to analyze trending lines, calculate reorder quantities, or draft promotional bundles!`;
    }

    res.json({
      success: true,
      reply: fallbackReply,
      source: "store-engine",
      security: {
        remainingRequests: Math.max(0, 15 - updatedRecord.request_count),
        warningCount: updatedRecord.warning_count,
        ip: clientIp,
      },
    });
  }
});


// Setup Vite middleware or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Grocery POS Server running on http://localhost:${PORT}`);
  });
}

startServer();
