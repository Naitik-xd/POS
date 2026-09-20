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

export default function handler(_req: ApiRequest, res: ApiResponse) {
  const geminiConfigured = Boolean(process.env.GAPI_POS || process.env.GEMINI_API_KEY);
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    geminiConfigured,
  });
}
