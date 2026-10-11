/**
 * Vercel Serverless Function entry point for POST /api/farmer-assistant
 */

import { handleFarmerAssistant } from '../server/farmerAssistantHandler.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

export default async function handler(req, res) {
  return handleFarmerAssistant(req, res);
}
