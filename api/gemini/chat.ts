import { GoogleGenAI } from '@google/genai';

export interface ApiRequest {
  method?: string;
  body?: any;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  ip?: string;
}

export interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (data: any) => void;
  send: (body: any) => void;
  setHeader?: (name: string, value: string) => void;
}

// In-memory rate limiting for serverless instance
interface IpRecord {
  count: number;
  windowStart: number;
  warnings: number;
  bannedUntil: number | null;
}
const ipMap = new Map<string, IpRecord>();

function getClientIp(req: ApiRequest): string {
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0].trim() : realIp.trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

function checkGibberish(text: string): { isGibberish: boolean; reason?: string } {
  if (!text || text.trim().length < 4) return { isGibberish: false };
  const clean = text.trim();

  // Excessive repetitive characters e.g. "aaaaaaa", "asdfasdfasdf"
  if (/(.)\1{6,}/i.test(clean)) {
    return { isGibberish: true, reason: 'Repeated character spam detected' };
  }
  if (/([a-z0-9]{2,4})\1{4,}/i.test(clean)) {
    return { isGibberish: true, reason: 'Repetitive pattern spam detected' };
  }

  // Keyboard smash detection (long sequences of consonants)
  const words = clean.split(/\s+/);
  for (const w of words) {
    if (w.length >= 14 && !/[aeiouy]/i.test(w)) {
      return { isGibberish: true, reason: 'Random keyboard smash detected' };
    }
  }

  return { isGibberish: false };
}

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GAPI_POS;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Always set JSON content-type
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const now = Date.now();
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Track IP rate limits
  let rec = ipMap.get(clientIp);
  if (!rec || now - rec.windowStart > THREE_HOURS) {
    rec = { count: 0, windowStart: now, warnings: rec?.warnings || 0, bannedUntil: rec?.bannedUntil || null };
    ipMap.set(clientIp, rec);
  }

  // Check 24-hour ban
  if (rec.bannedUntil && now < rec.bannedUntil) {
    return res.status(429).json({
      success: false,
      error: 'Your IP is temporarily suspended due to repeated abuse. Please try again later.',
      securityBlocked: true,
    });
  }

  // Check 15 requests limit
  if (rec.count >= 15) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit reached: Maximum 15 requests per 3 hours. Please wait for the window to reset.',
      securityBlocked: true,
    });
  }

  // Parse body safely
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { messages, storeContext } = body || {};
  const lastUserMsg = (messages || []).filter((m: any) => m.role === 'user').pop()?.content || '';

  // Check gibberish
  if (lastUserMsg) {
    const gib = checkGibberish(lastUserMsg);
    if (gib.isGibberish) {
      rec.warnings = (rec.warnings || 0) + 1;
      const isBannedNow = rec.warnings >= 3;
      if (isBannedNow) {
        rec.bannedUntil = now + TWENTY_FOUR_HOURS;
      }
      return res.status(isBannedNow ? 429 : 400).json({
        success: false,
        isGibberish: true,
        warningCount: rec.warnings,
        isBannedNow,
        error: isBannedNow
          ? '3 spam strikes reached. Your device is restricted for 24 hours.'
          : `Spam warning ${rec.warnings} of 3: Please enter a clear grocery store question.`,
      });
    }
  }

  // Fallback intelligent grocery response helper
  const generateFallbackResponse = () => {
    const lowStockList =
      storeContext?.lowStockItems?.map((i: any) => `${i.name} (only ${i.stock} left)`).join(', ') ||
      'Honeycrisp Apples, Pasture Eggs, Whole Milk';
    const topSellers =
      storeContext?.topSellingItems?.map((i: any) => `${i.name} ($${i.price})`).join(', ') ||
      'Large Brown Eggs, Whole Milk, Bananas';
    const outOfStock = storeContext?.outOfStockItems?.join(', ') || 'Organic Jasmine Rice';

    const q = lastUserMsg.toLowerCase();
    let reply = `### 📊 FreshMart Store Insights\n\n`;

    if (q.includes('trend') || q.includes('popular') || q.includes('best seller')) {
      reply += `🔥 **Top Velocity Grocery Items:**\n${
        storeContext?.topSellingItems?.map((i: any, idx: number) => `${idx + 1}. **${i.name}** — ${i.sales} units sold ($${i.price})`).join('\n') || topSellers
      }\n\n💡 *Action:* Keep these items positioned near main checkout entrances to maximize sales momentum.`;
    } else if (q.includes('low') || q.includes('reorder') || q.includes('stock') || q.includes('empty')) {
      reply += `⚠️ **Urgent Stock Alerts:**\n• **Out of stock:** ${outOfStock}\n• **Critically low:** ${lowStockList}\n\n📦 *Recommendation:* Reorder staple grocery lines immediately to prevent lost sales.`;
    } else if (q.includes('bundle') || q.includes('discount') || q.includes('promo') || q.includes('deal')) {
      reply += `🏷️ **Recommended Promotional Bundle:**\n• **"Farm Fresh Breakfast Basket"**\n  - Large Brown Eggs + Whole Milk + Sourdough Loaf\n  - Bundle Promo Price: $12.99 (Save 12%)\n  - *Benefit:* High margin basket-builder with strong shopper appeal.`;
    } else {
      reply += `• **Active Catalog:** ${storeContext?.totalProducts || 18} unique grocery products\n• **Top Performing Lines:** ${topSellers}\n• **Low Stock Attention:** ${lowStockList}\n• **Total Transactions Logged:** ${storeContext?.recentSalesCount || 3} receipts\n\nAsk me about trending sales, restocking quantities, or grocery bundles!`;
    }
    return reply;
  };

  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are FreshMart AI, an expert grocery store operations assistant.
You help grocery store cashiers and managers with:
- Finding trending grocery items and sales velocity
- Identifying items that are running low and need reorder
- Highlighting slow-moving or perishable inventory at risk
- Suggesting grocery promotion bundles and pricing optimizations
- Store Context Data: ${JSON.stringify(storeContext || {})}
Format your answers cleanly with concise markdown bullet points, clear grocery advice, and actionable numbers.`;

      const contents = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      rec.count += 1;

      return res.status(200).json({
        success: true,
        reply: response.text || generateFallbackResponse(),
        source: 'gemini-2.5-flash',
        security: {
          remainingRequests: Math.max(0, 15 - rec.count),
          warningCount: rec.warnings,
          ip: clientIp,
        },
      });
    } catch (error: any) {
      console.warn('Gemini API call failed, using intelligent grocery engine:', error?.message);
    }
  }

  // Fallback if API key missing or call failed
  rec.count += 1;
  return res.status(200).json({
    success: true,
    reply: generateFallbackResponse(),
    source: 'store-engine',
    security: {
      remainingRequests: Math.max(0, 15 - rec.count),
      warningCount: rec.warnings,
      ip: clientIp,
    },
  });
}
