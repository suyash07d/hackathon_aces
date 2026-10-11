/**
 * Rain Maker — Lightweight Express Backend Server
 *
 * Provides the secure local proxy for Google Gemini Vision AI inference.
 * Reads GEMINI_API_KEY exclusively from server environment variables.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleCropVisionAnalysis } from './cropVisionHandler.js';

// Load .env configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for local development
app.use(cors());

// Configure JSON body parser with 15MB limit for image base64 payloads
app.use(express.json({ limit: '15mb' }));

// Health and configuration check endpoint (Never exposes secret values!)
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here'
  );

  res.status(200).json({
    status: 'ok',
    service: 'Rain Maker Vision AI Proxy',
    geminiConfigured: hasKey,
    model: 'gemini-3.5-flash',
    timestamp: new Date().toISOString(),
  });
});

// Primary Vision Analysis Route
app.post('/api/analyze-crop-vision', (req, res) => {
  return handleCropVisionAnalysis(req, res);
});

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Rain Maker Server] Running on http://localhost:${PORT}`);
    console.log(`[Rain Maker Server] Gemini API Status: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Unconfigured (Set GEMINI_API_KEY in .env)'}`);
  });
}

export default app;
