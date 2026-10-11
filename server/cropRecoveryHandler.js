/**
 * Server-Side Crop Recovery Comparison Handler
 *
 * Compares baseline and follow-up crop photos using Google Gemini Vision AI.
 * Evaluates whether foliar symptoms are Improving, Stable, Worsening, or Inconclusive.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { cleanBase64Data } from './cropVisionHandler.js';

dotenv.config();

function getRuleBasedRecoveryComparison({ baselineSymptoms = [], followUpSymptoms = [] }) {
  const removed = baselineSymptoms.filter((s) => !followUpSymptoms.includes(s));
  const added = followUpSymptoms.filter((s) => !baselineSymptoms.includes(s));
  let status = 'stable';
  let statusLabel = 'Stable (Lesion Progression Contained)';

  if (added.length === 0 && removed.length > 0) {
    status = 'improving';
    statusLabel = 'Improving (Symptom Load Reducing)';
  } else if (added.length > 0) {
    status = 'worsening';
    statusLabel = 'Worsening (New Symptoms Reported)';
  }

  return {
    status,
    statusLabel,
    observedDifferences: [
      `Heuristic assessment: ${removed.length} symptoms resolved, ${added.length} new symptoms reported.`,
      'Visual pixel comparison running in rule-assisted fallback mode.',
    ],
    lesionProgressionAssessment: 'Progression evaluated via farmer symptom telemetry.',
    comparabilityNotes: 'Baseline and follow-up compared via reported symptom markers.',
    updatedRecommendations: [
      'Maintain morning root-zone watering; avoid overhead sprinklers.',
      'Continue removing blighted leaf debris away from the field perimeter.',
    ],
  };
}

export async function handleCropRecoveryComparison(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed.',
    });
  }

  const body = typeof req.body === 'string'
    ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
    : (req.body || {});

  const {
    baselineImageBase64,
    followUpImageBase64,
    cropId = 'potato',
    baselineSymptoms = [],
    followUpSymptoms = [],
    actionsTaken = '',
    notes = '',
  } = body;

  // Validate images
  if (!baselineImageBase64 || !followUpImageBase64) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_IMAGES',
      message: 'Both baseline and follow-up images are required for recovery comparison.',
    });
  }

  const cleanBaseline = cleanBase64Data(baselineImageBase64);
  const cleanFollowUp = cleanBase64Data(followUpImageBase64);

  if (!cleanBaseline || !cleanFollowUp) {
    return res.status(400).json({
      success: false,
      error: 'MALFORMED_IMAGE_DATA',
      message: 'One or both images have invalid base64 encoding.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    const fallback = getRuleBasedRecoveryComparison({ baselineSymptoms, followUpSymptoms });
    return res.status(200).json({
      success: true,
      isAiInference: false,
      ...fallback,
    });
  }

  // Execute Gemini Multimodal Dual-Image Comparison
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const systemPrompt = `You are an expert plant pathologist evaluating crop recovery over time for a smallholder farmer.
Target Crop: ${cropId.toUpperCase()}
Baseline Declared Symptoms: ${baselineSymptoms.join(', ') || 'None declared'}
Follow-Up Declared Symptoms: ${followUpSymptoms.join(', ') || 'None declared'}
Farmer Cultural Actions Taken: ${actionsTaken || 'Routine field care'}
Farmer Notes: ${notes || 'None provided'}

You are provided with two images:
Image 1: Initial Baseline Scan of the crop.
Image 2: Follow-up Scan of the crop taken several days later.

Analyze the visual changes between the two photos:
1. Assess whether the image angle and lighting are comparable ("comparabilityNotes").
2. Check if the follow-up image shows plant leaves or unrelated objects. If unrelated or non-plant, flag status as "inconclusive".
3. Evaluate lesion margin behavior:
   - "improving": Lesions dried up, brown rings contained, yellowing reversing, green new shoots emerging.
   - "stable": Existing spots stopped expanding, no new lesions on upper leaves, no stem streaking.
   - "worsening": Lesions enlarged, water-soaking spreading, wilting accelerating, black stem streaks developing.
   - "inconclusive": Image too blurry, angle completely different, or distant shot.
4. Provide safe cultural next steps only. NEVER prescribe chemical pesticides or dosages.

Return ONLY valid JSON:
{
  "status": "improving" | "stable" | "worsening" | "inconclusive",
  "statusLabel": string,
  "observedDifferences": string[],
  "lesionProgressionAssessment": string,
  "comparabilityNotes": string,
  "updatedRecommendations": string[]
}`;

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
    let responseText = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanBaseline.detectedMime || 'image/jpeg',
                    data: cleanBaseline.data,
                  },
                },
                {
                  inlineData: {
                    mimeType: cleanFollowUp.detectedMime || 'image/jpeg',
                    data: cleanFollowUp.data,
                  },
                },
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.15,
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Gemini recovery model ${model} failed: ${err.message}`);
      }
    }

    if (!responseText) {
      throw new Error('Gemini multimodal recovery comparison did not return a response.');
    }

    const stripped = responseText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(stripped);

    return res.status(200).json({
      success: true,
      isAiInference: true,
      status: parsed.status || 'stable',
      statusLabel: parsed.statusLabel || (parsed.status === 'improving' ? 'Improving' : 'Monitoring'),
      observedDifferences: Array.isArray(parsed.observedDifferences) ? parsed.observedDifferences : [],
      lesionProgressionAssessment: parsed.lesionProgressionAssessment || '',
      comparabilityNotes: parsed.comparabilityNotes || 'Visual angle evaluated by Gemini Vision.',
      updatedRecommendations: Array.isArray(parsed.updatedRecommendations) ? parsed.updatedRecommendations : [],
    });
  } catch (err) {
    console.warn('Gemini recovery comparison unavailable, providing rule-assisted fallback:', err.message || err);
    const fallback = getRuleBasedRecoveryComparison({ baselineSymptoms, followUpSymptoms });
    return res.status(200).json({
      success: true,
      isAiInference: false,
      fallbackToHeuristic: true,
      ...fallback,
    });
  }
}
