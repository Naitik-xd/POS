import { GoogleGenAI } from '@google/genai';
import {
  extractClientIp,
  validateIpRequest,
  recordSuccessfulRequest,
  isGibberish,
  handleGibberishOffense,
} from '../../src/services/aiSecurityGuard';

export interface ApiRequest {
  method?: string;
  body?: any;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (data: any) => void;
  send: (body: any) => void;
}

function getApiKey(): string | undefined {
  return process.env.GAPI_POS || process.env.GEMINI_API_KEY;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = extractClientIp(req);

  // 1. Validate security, perma_ban & 15 requests in 3 hours limit
  const securityCheck = validateIpRequest(clientIp);
  if (!securityCheck.allowed) {
    return res.status(securityCheck.statusCode || 429).json({
      success: false,
      error: securityCheck.error,
      record: securityCheck.record,
      securityBlocked: true,
    });
  }

  const { messages, storeContext } = req.body || {};
  const lastUserMsg = (messages || []).filter((m: any) => m.role === 'user').pop()?.content || '';

  // 2. Gibberish & prompt abuse detection
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
If a user prompt is unclear or marginally coherent, politely ask them to rephrase and refuse to engage in non-grocery random babbling. Format your answers cleanly with concise markdown bullet points, clear grocery advice, and actionable numbers.`;

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

      // Record successful legitimate request
      const updatedRecord = recordSuccessfulRequest(clientIp);

      return res.status(200).json({
        success: true,
        reply: response.text || "I'm ready to assist with your grocery store operations.",
        source: 'gemini-2.5-flash',
        security: {
          remainingRequests: Math.max(0, 15 - updatedRecord.request_count),
          warningCount: updatedRecord.warning_count,
          ip: clientIp,
        },
      });
    } catch (error: any) {
      console.warn('Gemini Chat fallback triggered:', error.message);
    }
  }

  // Fallback if API key missing or rate-limited: Context-grounded intelligent grocery store response
  const updatedRecord = recordSuccessfulRequest(clientIp);
  const lowStockList =
    storeContext?.lowStockItems?.map((i: any) => `${i.name} (only ${i.stock} left)`).join(', ') ||
    'Honeycrisp Apples, Pasture Eggs, Spinach';
  const topSellers =
    storeContext?.topSellingItems?.map((i: any) => `${i.name} ($${i.price})`).join(', ') ||
    'Large Brown Eggs, Milk 1 Gal, Bananas';
  const outOfStock = storeContext?.outOfStockItems?.join(', ') || 'Organic Jasmine Rice';

  let fallbackReply = `Here is the operational analysis for your store:\n\n`;
  const q = lastUserMsg.toLowerCase();

  if (q.includes('trend') || q.includes('popular') || q.includes('best seller')) {
    fallbackReply += `🔥 **Trending High-Velocity Items:**\n${
      storeContext?.topSellingItems?.map((i: any, idx: number) => `${idx + 1}. **${i.name}** — High sales count (${i.sales} sold, retail $${i.price})`).join('\n') || topSellers
    }\n\n💡 *Action:* Keep these stocked on main entrance displays to maintain sales momentum.`;
  } else if (q.includes('low') || q.includes('reorder') || q.includes('stock') || q.includes('empty')) {
    fallbackReply += `⚠️ **Urgent Inventory Alerts:**\n• **Out of stock:** ${outOfStock}\n• **Critically low:** ${lowStockList}\n\n📦 *Recommendation:* Issue reorders today for these staple lines to prevent customer walkouts.`;
  } else if (q.includes('bundle') || q.includes('discount') || q.includes('promo') || q.includes('deal')) {
    fallbackReply += `🏷️ **Recommended Promotional Grocery Bundle:**\n• **"Farm Fresh Breakfast Basket"**\n  - Large Brown Eggs + Milk 1 Gal + Artisan Sourdough Boule\n  - Normal Total: $14.77 → Bundle Special: $12.99 (Save 12%)\n  - Benefit: High-margin pairing that increases average basket value.`;
  } else {
    fallbackReply += `📊 **Store Operational Snapshot:**\n• **Active Catalog:** ${storeContext?.totalProducts || 18} unique grocery products\n• **Top Performing Lines:** ${topSellers}\n• **Low Stock Attention:** ${lowStockList}\n• **Total Transactions Logged:** ${storeContext?.recentSalesCount || 3} receipts\n\nFeel free to ask me to analyze trending lines, calculate reorder quantities, or draft promotional bundles!`;
  }

  return res.status(200).json({
    success: true,
    reply: fallbackReply,
    source: 'store-engine',
    security: {
      remainingRequests: Math.max(0, 15 - updatedRecord.request_count),
      warningCount: updatedRecord.warning_count,
      ip: clientIp,
    },
  });
}
