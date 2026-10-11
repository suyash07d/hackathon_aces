/**
 * Vercel Serverless Function entry point for POST /api/analyze-crop-vision
 * Enables native zero-config deployment on Vercel with server-side environment variables.
 */

import { handleCropVisionAnalysis } from '../server/cropVisionHandler.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req, res) {
  return handleCropVisionAnalysis(req, res);
}
