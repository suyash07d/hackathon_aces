/**
 * Server-Side Crop Vision Analysis Handler
 *
 * Uses Google's official @google/genai SDK to analyze crop foliage images.
 * Runs strictly on the server side to protect GEMINI_API_KEY.
 *
 * Safety & Responsible Agricultural AI Guidelines:
 * 1. Distinguishes model-observed visual evidence from user-declared symptoms.
 * 2. Checks specimen suitability (living foliar leaf vs harvested produce / tubers / distant shot).
 * 3. Returns tentative candidate diseases with qualitative reasoning (no fabricated certainty percentages).
 * 4. Highlights alternative abiotic/environmental explanations (deficiencies, sunscald).
 * 5. Explicitly documents observation limits and uncertainties.
 * 6. Never prescribes chemical pesticide dosages; emphasizes cultural management and KVK laboratory referral.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB binary limit
const SUPPORTED_CROPS = ['potato', 'tomato', 'rice', 'wheat'];

/**
 * Normalizes base64 string and detects/cleans data URL prefix.
 */
function cleanBase64Data(rawBase64) {
  if (!rawBase64 || typeof rawBase64 !== 'string') return null;
  const match = rawBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return {
      detectedMime: match[1].toLowerCase(),
      data: match[2].trim(),
    };
  }
  return {
    detectedMime: null,
    data: rawBase64.trim(),
  };
}

/**
 * Handles POST /api/analyze-crop-vision requests.
 */
export async function handleCropVisionAnalysis(req, res) {
  // 1. Only allow POST
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
    imageBase64,
    mimeType: clientMime,
    cropId,
    specimenType = 'leaf',
    userSymptoms = [],
    userNotes = '',
  } = body;

  // 2. Validate cropId
  const normalizedCropId = (cropId || '').toLowerCase().trim();
  if (!normalizedCropId || !SUPPORTED_CROPS.includes(normalizedCropId)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_CROP_TYPE',
      message: `Unsupported or missing cropId. Supported crops: ${SUPPORTED_CROPS.join(', ')}.`,
      fallbackToHeuristic: false,
    });
  }

  // 3. Validate image presence & format
  if (!imageBase64) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_IMAGE_DATA',
      message: 'No image data provided. Please provide a base64 encoded image.',
      fallbackToHeuristic: false,
    });
  }

  const cleaned = cleanBase64Data(imageBase64);
  if (!cleaned || !cleaned.data) {
    return res.status(400).json({
      success: false,
      error: 'MALFORMED_BASE64',
      message: 'Image data is not a valid base64 string.',
      fallbackToHeuristic: false,
    });
  }

  const resolvedMime = (cleaned.detectedMime || clientMime || 'image/jpeg').toLowerCase();
  const normalizedMime = resolvedMime === 'image/jpg' ? 'image/jpeg' : resolvedMime;

  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_MIME_TYPE',
      message: `Invalid MIME type (${resolvedMime}). Supported: JPG, JPEG, PNG, WEBP.`,
      fallbackToHeuristic: false,
    });
  }

  // Estimate binary byte size from base64 (each 4 base64 chars represent 3 bytes)
  const estimatedByteSize = Math.floor((cleaned.data.length * 3) / 4);
  if (estimatedByteSize > MAX_IMAGE_BYTES) {
    return res.status(400).json({
      success: false,
      error: 'IMAGE_TOO_LARGE',
      message: `Image size (${(estimatedByteSize / (1024 * 1024)).toFixed(1)} MB) exceeds 10 MB limit.`,
      fallbackToHeuristic: false,
    });
  }

  // 4. Handle non-foliar specimen declaration server-side (Guardrail)
  if (specimenType === 'harvested_produce' || specimenType === 'other') {
    const isHarvested = specimenType === 'harvested_produce';
    return res.status(200).json({
      success: true,
      isAiInference: false,
      isSuitableSpecimen: false,
      specimenType,
      specimenLabel: isHarvested ? 'Harvested Produce / Tuber' : 'Non-Foliar View',
      unsuitabilityNotice: isHarvested
        ? 'The image was declared as harvested produce (e.g. tubers or fruit). Rain Maker foliar canopy screening requires clear, close-up photos of living plant leaves or stems.'
        : 'The image was declared as a non-foliar or distant field view. Foliar disease analysis requires a close-up photo of affected plant foliage.',
      observedVisualFeatures: [],
      candidates: [],
      uncertainties: ['Post-harvest produce diagnostics require tuber/fruit rot inspection rather than foliar canopy blights.'],
      scoutingAndCulturalSteps: [
        'Take a close-up photograph of living crop leaves showing discoloration or lesions in the field.',
        'If investigating tuber rot, store produce in cool, well-ventilated dry storage and consult local horticulture officers.',
      ],
      expertConsultationAdvice: 'For post-harvest storage decay or seed tuber inspection, consult your district agriculture office with a physical specimen.',
    });
  }

  // 5. Verify server-side GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    return res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY_NOT_CONFIGURED',
      message: 'GEMINI_API_KEY is not configured on the server. Set GEMINI_API_KEY in the server environment (.env).',
      fallbackToHeuristic: true,
    });
  }

  // 6. Execute Genuine Gemini Multimodal Vision Inference
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const systemPrompt = `You are an expert plant pathologist and agricultural diagnostic specialist assisting farmers and field extension workers in India and South Asia.
Target Crop: ${normalizedCropId.toUpperCase()} (${cropId})
User-Reported Symptoms: ${Array.isArray(userSymptoms) && userSymptoms.length > 0 ? userSymptoms.join(', ') : 'None declared by user'}
User Field Notes: ${userNotes || 'None provided'}

Your task is to analyze the attached crop image with scientific rigor, empathy for farmers, and strict agricultural safety guardrails:

CRITICAL INSTRUCTIONS:
1. SPECIMEN CHECK: First verify if the image actually shows plant foliage/leaf/stem of ${normalizedCropId}. If it shows harvested tubers/potatoes, picked fruit, non-plant objects, or distant unreadable vistas, mark "isSuitableSpecimen": false and explain why.
2. DISTINGUISH EVIDENCE: Clearly distinguish between visual features YOU OBSERVE directly in the image pixels versus symptoms the user declared in text. Do not invent symptoms not visible in the image.
3. DISEASE CANDIDATES: Identify tentative disease candidates that match the visual lesion morphology on ${normalizedCropId}. Provide qualitative likelihood ("Primary Visual Match" or "Secondary Possibility"). NEVER invent statistical confidence percentages.
4. ALTERNATIVE EXPLANATIONS: Mention alternative non-disease causes that could produce similar symptoms (e.g. nitrogen deficiency, potassium deficiency, sunburn, thrips feeding, herbicide drift).
5. UNCERTAINTIES & BOUNDARIES: Explicitly document visual uncertainties (e.g. lighting shadows, resolution limits, inability to inspect lower leaf surface or isolate spores without a microscope).
6. SAFE ACTIONABLE NEXT STEPS: Provide practical, preventive cultural field steps (e.g. canopy aeration, avoiding overhead watering, sanitation).
7. SAFETY RULES:
   - NEVER claim that this visual image confirms a definitive phytopathological diagnosis.
   - NEVER prescribe chemical pesticide dosages (e.g. do not state "spray 2.5 ml of mancozeb per liter").
   - Always recommend confirming severe symptoms with a local Krishi Vigyan Kendra (KVK) or agricultural extension specialist with a physical specimen.

Return ONLY a valid, parseable JSON object matching this schema:
{
  "isSuitableSpecimen": boolean,
  "specimenAssessment": string,
  "observedVisualFeatures": string[],
  "modelObservedSymptoms": string[],
  "candidates": [
    {
      "name": string,
      "pathogen": string,
      "likelihoodTag": string,
      "visualRationale": string,
      "matchedSymptoms": string[]
    }
  ],
  "alternativeExplanations": string[],
  "uncertainties": string[],
  "scoutingAndCulturalSteps": string[],
  "expertConsultationAdvice": string
}`;

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
    let lastError = null;
    let responseText = null;
    let selectedModel = 'gemini-3.5-flash';

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
                    mimeType: normalizedMime,
                    data: cleaned.data,
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
            temperature: 0.2, // Low temperature for factual, consistent diagnostic reasoning
          },
        });

        if (response && response.text) {
          responseText = response.text;
          selectedModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model ${model} failed: ${err.message}. Trying next candidate...`);
      }
    }

    if (!responseText) {
      throw lastError || new Error('All candidate Gemini vision models failed to return a response.');
    }

    // 7. Parse & Validate Model Response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Try stripping possible markdown code block wrap if returned
      const stripped = responseText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(stripped);
    }

    // Validate mandatory keys
    const isSuitable = Boolean(parsedData.isSuitableSpecimen);
    const candidates = Array.isArray(parsedData.candidates) ? parsedData.candidates : [];
    const observedVisualFeatures = Array.isArray(parsedData.observedVisualFeatures)
      ? parsedData.observedVisualFeatures
      : [];
    const uncertainties = Array.isArray(parsedData.uncertainties)
      ? parsedData.uncertainties
      : ['Visual image inspection alone cannot replace laboratory culturing or microscopic verification.'];
    const scoutingAndCulturalSteps = Array.isArray(parsedData.scoutingAndCulturalSteps)
      ? parsedData.scoutingAndCulturalSteps
      : ['Inspect lower canopy leaves and verify furrow drainage.'];

    return res.status(200).json({
      success: true,
      isAiInference: true,
      aiProvider: 'Google Gemini Vision (Official @google/genai SDK)',
      aiModel: selectedModel,
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isSuitableSpecimen: isSuitable,
      specimenType,
      specimenLabel: isSuitable ? 'Foliar Leaf Specimen (AI Verified)' : 'Unsuitable Specimen View',
      specimenAssessment: parsedData.specimenAssessment || (isSuitable ? 'Foliar canopy view inspected.' : 'Image not suitable for foliar diagnosis.'),
      observedVisualFeatures,
      modelObservedSymptoms: Array.isArray(parsedData.modelObservedSymptoms) ? parsedData.modelObservedSymptoms : [],
      candidates,
      alternativeExplanations: Array.isArray(parsedData.alternativeExplanations) ? parsedData.alternativeExplanations : [],
      uncertainties,
      scoutingAndCulturalSteps,
      expertConsultationAdvice: parsedData.expertConsultationAdvice || 'Consult your local Krishi Vigyan Kendra (KVK) with a physical plant sample for laboratory confirmation.',
      disclaimer: 'Notice: Google Gemini AI vision analysis provides decision-support observations based on visible leaf morphology. It does not constitute a certified laboratory phytopathological diagnosis.',
    });
  } catch (err) {
    console.error('Gemini Vision Inference Error:', err.message || err);
    return res.status(502).json({
      success: false,
      error: 'GEMINI_INFERENCE_FAILED',
      message: `Gemini Vision inference encountered an error: ${err.message || 'Unknown provider error'}`,
      fallbackToHeuristic: true,
    });
  }
}
