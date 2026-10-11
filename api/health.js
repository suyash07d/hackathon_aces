/**
 * Vercel Serverless Function entry point for GET /api/health
 */

export default function handler(req, res) {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here'
  );

  res.status(200).json({
    status: 'ok',
    service: 'Rain Maker Vision AI Vercel Serverless Function',
    geminiConfigured: hasKey,
    model: 'gemini-3.5-flash',
    timestamp: new Date().toISOString(),
  });
}
