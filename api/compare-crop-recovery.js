/**
 * Vercel Serverless Function entry point for POST /api/compare-crop-recovery
 */

import { handleCropRecoveryComparison } from '../server/cropRecoveryHandler.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req, res) {
  return handleCropRecoveryComparison(req, res);
}
