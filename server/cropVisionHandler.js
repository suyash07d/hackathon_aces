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

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB binary limit
export const SUPPORTED_CROPS = ['potato', 'tomato', 'rice', 'wheat'];

/**
 * Normalizes base64 string and detects/cleans data URL prefix.
 */
export function cleanBase64Data(rawBase64) {
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
      isPlantCrop: true,
      isSuitableSpecimen: false,
      validationStatus: isHarvested ? 'harvested_produce' : 'unrelated_image',
      specimenType,
      specimenLabel: isHarvested ? 'Harvested Produce / Tuber' : 'Non-Foliar View',
      isHealthy: false,
      healthyExplanation: '',
      specimenAssessment: isHarvested
        ? 'The image was declared as harvested produce (e.g. tubers or fruit). Rain Maker foliar canopy screening requires clear, close-up photos of living plant leaves or stems.'
        : 'The image was declared as a non-foliar or distant field view. Foliar disease analysis requires a close-up photo of affected plant foliage.',
      observedVisualFeatures: [],
      candidates: [],
      conflictingCandidates: false,
      uncertaintyExplanation: 'Post-harvest produce diagnostics require tuber/fruit rot inspection rather than foliar canopy blights.',
      alternativeAbioticCauses: ['Post-harvest mechanical abrasions or transit bruising.'],
      culturalPractices: [
        'Take a close-up photograph of living crop leaves showing discoloration or lesions in the field.',
        'If investigating tuber rot, store produce in cool, well-ventilated dry storage and consult local horticulture officers.',
      ],
      escalationTriggers: [
        'If tubers develop foul-smelling soft rot in storage, isolate affected sacks immediately.',
      ],
      expertConsultationAdvice: 'For post-harvest storage decay or seed tuber inspection, consult your district agriculture office or Krishi Vigyan Kendra (KVK) with a physical specimen.',
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

  // 6. Execute Genuine Gemini Multimodal Vision Inference with 4-Stage Diagnostic Guardrails
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const systemPrompt = `You are an expert plant pathologist and agricultural diagnostic specialist assisting smallholder farmers in India and South Asia.
Target Crop: ${normalizedCropId.toUpperCase()} (${cropId})
User-Reported Symptoms: ${Array.isArray(userSymptoms) && userSymptoms.length > 0 ? userSymptoms.join(', ') : 'None declared by user'}
User Field Notes: ${userNotes || 'None provided'}

Analyze the attached image strictly adhering to the 4 diagnostic stages and agricultural safety guardrails:

STAGE 1: STRICT IMAGE VALIDATION & UNRELATED IMAGE GUARDRAIL
- Determine if the image contains genuine agricultural plant foliage or living crop leaves.
- If the image depicts a human, face, fictional character (e.g. Thor, superhero, comic/movie character), actor, animal, pet, vehicle, building, furniture, indoor room, electronic device, cartoon, or ANY non-plant subject:
  You MUST set:
  "isPlantCrop": false,
  "isSuitableSpecimen": false,
  "validationStatus": "unrelated_image",
  "identifiedSpecies": "Non-plant subject / Fictional character or person",
  "speciesMatchesTarget": false,
  "isHealthy": false,
  "healthyExplanation": "",
  "candidates": [],
  "observedVisualFeatures": [],
  "modelObservedSymptoms": [],
  "specimenAssessment": "The image depicts a non-plant subject (such as a person, fictional character, or object) rather than living crop foliage. Rain Maker cannot perform crop diagnosis on non-plant images.",
  "culturalPractices": ["Please take a clear photo of living crop leaves showing symptoms in your field."],
  "escalationTriggers": [],
  "expertConsultationAdvice": "Please upload a clear photograph of an affected plant leaf."
  STRICT MANDATE: DO NOT suggest or invent ANY plant diseases or pathogens for non-plant images under any circumstances!
- If the image depicts harvested tubers/potatoes or picked fruit instead of foliage, set "isPlantCrop": true, "isSuitableSpecimen": false, "validationStatus": "harvested_produce", and explain that foliar screening requires living leaves.
- If the image is too blurry, dark, or low quality to evaluate, set "isSuitableSpecimen": false, "validationStatus": "inconclusive_quality".

STAGE 2: PLANT IDENTIFICATION & HEALTH STATUS
- Identify the plant species visible in the image ("identifiedSpecies"). Note if it matches ${normalizedCropId} ("speciesMatchesTarget": true/false).
- Assess baseline foliar health ("isHealthy": true/false).
- CRITICAL: If the leaves appear healthy with no active disease lesions, chlorosis, or necrotic spots, set "isHealthy": true, "candidates": [], and explain in "healthyExplanation" that the foliage appears healthy. NEVER force a disease result on healthy plants!

STAGE 3: EVIDENCE-BASED DISEASE DETECTION (IF SICK/LESIONS PRESENT)
- Confirmed Observations vs Possible Explanations:
  - Document what is directly confirmed in the pixels ("observedVisualFeatures").
  - Do NOT invent symptoms that are not visible.
- Suggest tentative candidate diseases strictly as POSSIBILITIES, NEVER as confirmed diagnoses ("likelihoodTag": "Primary Possibility" | "Secondary Possibility" | "Tentative Possibility").
- For each candidate:
  - "name": Common name and scientific pathogen in parentheses.
  - "pathogen": Pathogen type (e.g. Oomycete, Fungus, Bacterium, Virus).
  - "likelihoodTag": Qualitative possibility tag. NEVER invent probability percentages.
  - "visualEvidencePresent": Exactly what visual signs in the image support this candidate.
  - "evidenceMissingOrUncertain": Exactly what evidence cannot be verified from a photo (e.g. microscopic spore examination, fungal fruiting structures, internal vascular discoloration).
  - "differentialComparison": If multiple diseases share similar symptoms, explain the overlap and why visual diagnosis is inconclusive.
- Flag "conflictingCandidates": true if multiple diseases have overlapping visual manifestations.
- Provide "alternativeAbioticCauses" (e.g. nitrogen deficiency, potassium scorch, herbicide drift, heat stress).

STAGE 4: FARMER RECOMMENDATIONS & SAFETY
- Provide safe, practical cultural practices only ("culturalPractices").
- STRICT SAFETY GUARDRAIL: NEVER invent synthetic pesticide names, chemical fungicides, or application dosages.
- Always recommend consulting a local Krishi Vigyan Kendra (KVK) or extension officer with a physical leaf sample.
- Include "escalationTriggers" (when the farmer must call extension officers immediately).

Return ONLY valid JSON matching this schema:
{
  "isPlantCrop": boolean,
  "isSuitableSpecimen": boolean,
  "validationStatus": "valid_foliar" | "unrelated_image" | "harvested_produce" | "inconclusive_quality",
  "identifiedSpecies": string,
  "speciesMatchesTarget": boolean,
  "isHealthy": boolean,
  "healthyExplanation": string,
  "specimenAssessment": string,
  "observedVisualFeatures": string[],
  "modelObservedSymptoms": string[],
  "candidates": [
    {
      "name": string,
      "pathogen": string,
      "likelihoodTag": string,
      "visualEvidencePresent": string,
      "evidenceMissingOrUncertain": string,
      "differentialComparison": string,
      "matchedSymptoms": string[]
    }
  ],
  "conflictingCandidates": boolean,
  "uncertaintyExplanation": string,
  "alternativeAbioticCauses": string[],
  "culturalPractices": string[],
  "escalationTriggers": string[],
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
            temperature: 0.15, // Low temperature for consistent, factual diagnostic reasoning
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

    // Validate mandatory keys and enforce strict safety guardrails
    const nonPlantKeywords = [
      'person', 'human', 'man', 'woman', 'thor', 'superhero', 'avenger', 'marvel',
      'character', 'costume', 'actor', 'animal', 'dog', 'cat', 'vehicle', 'car',
      'building', 'room', 'toy', 'statue', 'robot', 'screen', 'celebrity'
    ];
    const speciesLower = String(parsedData.identifiedSpecies || '').toLowerCase();
    const assessmentLower = String(parsedData.specimenAssessment || '').toLowerCase();
    const matchesNonPlantKeyword = nonPlantKeywords.some(kw => 
      speciesLower.includes(kw) || assessmentLower.includes(kw)
    );

    const isExplicitlyPlant = parsedData.isPlantCrop === true && !matchesNonPlantKeyword;
    const isExplicitlySuitable = Boolean(parsedData.isSuitableSpecimen) && isExplicitlyPlant && parsedData.validationStatus !== 'unrelated_image';
    const isHealthy = Boolean(parsedData.isHealthy);

    let validationStatus = parsedData.validationStatus;
    if (!isExplicitlyPlant || matchesNonPlantKeyword) {
      validationStatus = 'unrelated_image';
    } else if (!isExplicitlySuitable) {
      validationStatus = parsedData.validationStatus === 'harvested_produce' ? 'harvested_produce' : 'unsuitable_view';
    } else {
      validationStatus = 'valid_foliar';
    }

    const isPlant = isExplicitlyPlant && validationStatus !== 'unrelated_image';
    const isSuitable = isExplicitlySuitable && isPlant;

    // Strict safety rule: If unrelated image, non-plant, harvested produce, or healthy plant, candidates MUST be empty!
    let candidates = Array.isArray(parsedData.candidates) ? parsedData.candidates : [];
    if (!isPlant || !isSuitable || isHealthy || validationStatus === 'unrelated_image' || validationStatus === 'harvested_produce') {
      candidates = [];
    }

    const observedVisualFeatures = Array.isArray(parsedData.observedVisualFeatures)
      ? parsedData.observedVisualFeatures
      : [];
    const uncertainties = Array.isArray(parsedData.uncertainties)
      ? parsedData.uncertainties
      : ['Visual image inspection alone cannot replace laboratory culturing or microscopic verification.'];

    // Strip any accidental synthetic pesticide dosage instructions from culturalPractices to preserve safety
    const culturalPractices = (Array.isArray(parsedData.culturalPractices) ? parsedData.culturalPractices : [
      'Avoid overhead sprinkler irrigation; transition to early-morning furrow or drip irrigation.',
      'Carefully remove and safely bag severely blighted lower canopy leaves; do not leave in furrows.',
      'Sterilize shears, sickles, and harvesting tools between plant rows.',
      'Ensure adequate row spacing and weed control to promote canopy aeration.'
    ]).filter(step => !/\b(\d+\s*(?:ml|g|gm|kg|litre|liter|ppm)\b|\b(?:mancozeb|chlorothalonil|carbendazim|copper oxychloride|propiconazole|metalaxyl)\s*\d+)/i.test(step));

    const escalationTriggers = Array.isArray(parsedData.escalationTriggers) ? parsedData.escalationTriggers : [
      'If more than 15% of your crop canopy shows expanding spots or lesions within 48 hours.',
      'If plants continue wilting rapidly even though the soil is sufficiently moist.',
      'If spots turn black and spread across stems and growing shoots.',
    ];

    return res.status(200).json({
      success: true,
      isAiInference: true,
      aiProvider: 'Google Gemini Vision (Official @google/genai SDK)',
      aiModel: selectedModel,
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isPlantCrop: isPlant,
      isSuitableSpecimen: isSuitable,
      validationStatus,
      specimenType,
      specimenLabel: !isPlant
        ? 'Unrelated Image (Non-Plant)'
        : isSuitable
          ? 'Foliar Leaf Specimen (AI Verified)'
          : 'Unsuitable Specimen View',
      identifiedSpecies: parsedData.identifiedSpecies || normalizedCropId,
      speciesMatchesTarget: parsedData.speciesMatchesTarget !== false,
      isHealthy,
      healthyExplanation: parsedData.healthyExplanation || (isHealthy ? 'Foliage appears visibly healthy with no active pathogen lesions or chlorosis detected.' : ''),
      specimenAssessment: parsedData.specimenAssessment || (isSuitable ? 'Foliar canopy view inspected.' : 'Image not suitable for foliar diagnosis.'),
      observedVisualFeatures,
      modelObservedSymptoms: Array.isArray(parsedData.modelObservedSymptoms) ? parsedData.modelObservedSymptoms : [],
      candidates,
      conflictingCandidates: Boolean(parsedData.conflictingCandidates),
      uncertaintyExplanation: parsedData.uncertaintyExplanation || 'Foliar symptoms may overlap across bacterial and fungal pathogens, or mimic abiotic physiological stress.',
      alternativeAbioticCauses: Array.isArray(parsedData.alternativeAbioticCauses) ? parsedData.alternativeAbioticCauses : [],
      uncertainties,
      culturalPractices,
      escalationTriggers,
      expertConsultationAdvice: parsedData.expertConsultationAdvice || 'Consult your local Krishi Vigyan Kendra (KVK) or State Agricultural Extension Office with a physical plant sample for certified confirmation.',
      chemicalDisclaimer: 'Do not apply chemical fungicides or synthetic pesticides based solely on visual inspection. For certified chemical recommendations and exact dosages, always consult your nearest Krishi Vigyan Kendra (KVK).',
      disclaimer: 'Notice: Google Gemini AI vision analysis provides preliminary decision-support observations based on visible leaf morphology. It does not constitute a certified laboratory phytopathological diagnosis.',
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
