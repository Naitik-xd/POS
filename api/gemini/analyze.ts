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

  const { inventorySummary, salesSummary, customQuestion } = req.body || {};

  // Check custom question for gibberish
  if (customQuestion && typeof customQuestion === 'string') {
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

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY or GAPI_POS environment variable is missing in Vercel settings.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
You are an expert Grocery Retail Business Intelligence Consultant and Inventory Operations Analyst.
Analyze the following store inventory and sales metrics from this grocery store:

=== INVENTORY SNAPSHOT ===
${JSON.stringify(inventorySummary, null, 2)}

=== SALES & TRANSACTIONS SNAPSHOT ===
${JSON.stringify(salesSummary, null, 2)}

${customQuestion ? `=== USER SPECIFIC INQUIRY ===\n${customQuestion}\n` : ''}

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
  "customAnswer": "${customQuestion ? 'Direct answer to the user inquiry with grocery data evidence' : ''}"
}

Return ONLY valid JSON matching this schema. Do not enclose in markdown ticks if possible, or use standard raw JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const updatedRecord = recordSuccessfulRequest(clientIp);

    const rawText = response.text || '{}';
    let parsedData;
    try {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
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

    return res.status(200).json({
      success: true,
      analysis: parsedData,
      generatedAt: new Date().toISOString(),
      security: {
        remainingRequests: Math.max(0, 15 - updatedRecord.request_count),
        warningCount: updatedRecord.warning_count,
        ip: clientIp,
      },
    });
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze grocery data with Gemini.',
    });
  }
}
