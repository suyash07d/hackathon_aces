/**
 * Image Analysis Service
 *
 * Integrates genuine Google Gemini Vision AI inference via secure backend proxy
 * (POST /api/analyze-crop-vision) with transparent client-side heuristic fallback.
 *
 * Safety & Security Principles:
 * 1. GEMINI_API_KEY is NEVER held or accessed on the client. It is read strictly on the server.
 * 2. If the backend is offline, unconfigured, or returns an error, the system transparently
 *    falls back to the defensible rule-assisted heuristic matcher without crashing.
 * 3. Genuine AI status (isAiInference: true) is displayed ONLY upon verified, successful model inference.
 * 4. Model-observed visual evidence is strictly distinguished from user-reported symptoms.
 * 5. Zero-symptom safeguards and non-foliar specimen unsuitability checks are preserved.
 */

export const SYMPTOM_OPTIONS = [
  { id: 'yellowing', label: 'Yellowing Leaves (Chlorosis)', icon: '🟡' },
  { id: 'brown_spots', label: 'Concentric Brown / Black Spots', icon: '🟤' },
  { id: 'water_soaked', label: 'Water-Soaked / Dark Lesions', icon: '🍂' },
  { id: 'wilting', label: 'Wilting / Drooping Foliage', icon: '🥀' },
  { id: 'white_powder', label: 'White / Powdery Mildew Coating', icon: '⚪' },
  { id: 'leaf_damage', label: 'Chewed / Torn Leaf Margins', icon: '🐛' },
  { id: 'curling', label: 'Leaf Curling / Stunting', icon: '🌀' },
];

export const SPECIMEN_TYPES = [
  { 
    id: 'leaf', 
    label: 'Affected Leaf / Canopy Foliage', 
    description: 'Recommended for foliar disease screening.',
    isSuitable: true 
  },
  { 
    id: 'harvested_produce', 
    label: 'Harvested Produce / Tuber / Fruit', 
    description: 'Unsuitable for foliar disease screening (e.g., dug-up potatoes, picked fruit).',
    isSuitable: false 
  },
  { 
    id: 'other', 
    label: 'Whole Field / Distant Shot / Other', 
    description: 'Unsuitable for leaf lesion screening.',
    isSuitable: false 
  },
];

// Presets for quick evaluation in demo mode
export const SAMPLE_PRESET_IMAGES = [
  {
    id: 'sample-potato-blight',
    cropId: 'potato',
    specimenType: 'leaf',
    title: 'Potato Leaf Canopy — Water-soaked spots (Foliar Specimen)',
    symptoms: ['water_soaked', 'brown_spots', 'yellowing'],
    notes: 'Observed on lower foliage following 2 rainy mornings in Nashik plot.',
    previewColor: '#4d5c41',
  },
  {
    id: 'sample-tomato-spots',
    cropId: 'tomato',
    specimenType: 'leaf',
    title: 'Tomato Foliage — Concentric target rings (Foliar Specimen)',
    symptoms: ['brown_spots', 'yellowing'],
    notes: 'Lower leaves showing target-like brown spots with yellow halos.',
    previewColor: '#703e3b',
  },
];

// Knowledge base for transparent rule-assisted heuristic fallback
// Knowledge base for transparent rule-assisted heuristic fallback
export const DISEASE_KNOWLEDGE_BASE = {
  potato: [
    {
      id: 'late-blight',
      name: 'Late Blight (Phytophthora infestans)',
      pathogenType: 'Oomycete / Water Mold',
      primarySymptoms: ['water_soaked', 'brown_spots', 'yellowing'],
      favorableCondition: 'Prolonged high humidity (>85%) with mild temperatures (15–21°C).',
      visualMarkers: 'Large, irregular water-soaked dark lesions on leaves, often with pale yellow borders and white mold on undersides during high humidity.',
      missingEvidence: 'Cannot confirm microscopic sporangia or oospores from photo pixels alone; requires morning dew field inspection of leaf underside.',
      differentialComparison: 'Lesions resemble Early Blight in late necrosis, but Late Blight lacks concentric target rings and features expanding pale water-soaked borders.',
      severityDefault: 'High (Immediate Action Required)',
    },
    {
      id: 'early-blight-potato',
      name: 'Early Blight (Alternaria solani)',
      pathogenType: 'Fungus',
      primarySymptoms: ['brown_spots', 'yellowing'],
      favorableCondition: 'Warm temperatures (24–29°C) with alternating wet and dry periods.',
      visualMarkers: 'Dark brown, dry, concentric circular rings ("target-board" pattern) primarily on older lower leaves.',
      missingEvidence: 'Concentric ring morphology indicates Alternaria, but conidiophore formation requires laboratory microscopic verification.',
      differentialComparison: 'Concentric target rings distinguish Early Blight from Late Blight, which develops water-soaked irregular patches rather than dry rings.',
      severityDefault: 'Moderate (Active Monitoring Required)',
    },
    {
      id: 'bacterial-wilt',
      name: 'Bacterial Wilt / Brown Rot (Ralstonia solanacearum)',
      pathogenType: 'Bacterium',
      primarySymptoms: ['wilting', 'yellowing'],
      favorableCondition: 'Warm soils (>25°C) with high soil moisture.',
      visualMarkers: 'Rapid daytime wilting of foliage, slight yellowing, and brown vascular ring discoloration in stems.',
      missingEvidence: 'Requires a clear-water stem streaming test to confirm milky bacterial streaming from xylem vessels.',
      differentialComparison: 'Daytime wilting despite wet soil distinguishes Bacterial Wilt from dry fungal root rot, which typically displays slow progressive chlorosis.',
      severityDefault: 'High (Vascular Pathogen)',
    },
  ],
  tomato: [
    {
      id: 'early-blight-tomato',
      name: 'Early Blight (Alternaria solani)',
      pathogenType: 'Fungus',
      primarySymptoms: ['brown_spots', 'yellowing'],
      favorableCondition: 'Warm temperatures (22–28°C) with heavy dew or rain splash.',
      visualMarkers: 'Concentric ring target spots surrounded by chlorotic yellow halos on oldest lower leaves.',
      missingEvidence: 'Microscopic identification of beaked multicelled conidia needed to distinguish Alternaria solani from Alternaria alternata.',
      differentialComparison: 'Target-board rings distinguish Early Blight from Septoria leaf spot, which forms smaller spots with light grey centers and dark speckles.',
      severityDefault: 'Moderate (Prompt Scouting Advised)',
    },
    {
      id: 'late-blight-tomato',
      name: 'Late Blight (Phytophthora infestans)',
      pathogenType: 'Oomycete',
      primarySymptoms: ['water_soaked', 'brown_spots', 'wilting'],
      favorableCondition: 'Cool, wet, overcast weather with RH > 90%.',
      visualMarkers: 'Greasy, water-soaked grayish lesions that rapidly expand and turn brown and paper-like.',
      missingEvidence: 'White fungal down on leaf undersides must be confirmed while morning dew is intact.',
      differentialComparison: 'Rapid lesion enlargement across entire leaf blades distinguishes Late Blight from localized circular Early Blight spots.',
      severityDefault: 'High (High Transmission Risk)',
    },
    {
      id: 'powdery-mildew-tomato',
      name: 'Powdery Mildew (Leveillula taurica / Oidium neolycopersici)',
      pathogenType: 'Fungus',
      primarySymptoms: ['white_powder', 'yellowing'],
      favorableCondition: 'Moderate temperatures (18–25°C) with shaded canopy and moderate humidity.',
      visualMarkers: 'White powdery fungal patches on upper or lower leaf surfaces accompanied by bright yellow leaf patches.',
      missingEvidence: 'Cannot confirm internal endophytic mycelium without microscopic cross-section.',
      differentialComparison: 'Superficial white powdery talc-like coating easily differentiates Powdery Mildew from necrotic leaf blights.',
      severityDefault: 'Low to Moderate',
    },
  ],
  rice: [
    {
      id: 'rice-blast',
      name: 'Rice Blast (Magnaporthe oryzae)',
      pathogenType: 'Fungus',
      primarySymptoms: ['brown_spots', 'water_soaked'],
      favorableCondition: 'Extended leaf wetness (>10 hrs), night temperatures 20–24°C, high nitrogen.',
      visualMarkers: 'Spindle- or diamond-shaped lesions with gray or whitish centers and brown margins on leaf blades.',
      missingEvidence: 'Requires microscopic verification of pyriform (pear-shaped) three-celled conidia.',
      differentialComparison: 'Spindle-shaped diamond lesions distinguish Blast from Brown Spot (Bipolaris oryzae), which produces round to oval lesions.',
      severityDefault: 'High (Epidemic Potential)',
    },
    {
      id: 'sheath-blight',
      name: 'Sheath Blight (Rhizoctonia solani)',
      pathogenType: 'Fungus',
      primarySymptoms: ['water_soaked', 'brown_spots'],
      favorableCondition: 'Dense crop canopy, high humidity (>85%), temperatures 28–32°C.',
      visualMarkers: 'Greenish-gray, water-soaked oval spots on leaf sheaths near the water level, developing into irregular blotches with dark borders.',
      missingEvidence: 'Presence of dark brown fungal sclerotia must be scouted at the base of tillers.',
      differentialComparison: 'Basal sheath location near water surface differentiates Sheath Blight from foliar canopy leaf blast.',
      severityDefault: 'Moderate to High',
    },
  ],
  wheat: [
    {
      id: 'stripe-rust',
      name: 'Stripe / Yellow Rust (Puccinia striiformis)',
      pathogenType: 'Fungus',
      primarySymptoms: ['yellowing', 'brown_spots'],
      favorableCondition: 'Cool, humid weather (10–18°C) with morning dew persistence.',
      visualMarkers: 'Narrow, yellow-orange pustules arranged in conspicuous linear stripes along leaf veins.',
      missingEvidence: 'Urediniospore viability and race classification require agricultural university rust pathology testing.',
      differentialComparison: 'Linear striped arrangement along leaf veins distinguishes Yellow Rust from Brown Rust, which produces scattered random pustules.',
      severityDefault: 'High (Airborne Spore Spread)',
    },
    {
      id: 'leaf-rust-wheat',
      name: 'Leaf / Brown Rust (Puccinia triticina)',
      pathogenType: 'Fungus',
      primarySymptoms: ['brown_spots'],
      favorableCondition: 'Mild temperatures (15–22°C) with moisture.',
      visualMarkers: 'Small, round-to-oval orange-brown pustules scattered randomly across the upper leaf blade surface.',
      missingEvidence: 'Cannot confirm specific rust pathotype without testing on differential wheat cultivars.',
      differentialComparison: 'Randomly scattered oval pustules differentiate Brown Rust from linear striped Yellow Rust.',
      severityDefault: 'Moderate',
    },
  ],
};

/**
 * Checks backend health and Gemini API availability.
 * Safe read-only check; never returns secret values.
 * @returns {Promise<{ isOnline: boolean, geminiConfigured: boolean }>}
 */
export async function checkBackendAiStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        isOnline: true,
        geminiConfigured: Boolean(data.geminiConfigured),
        model: data.model || 'gemini-3.5-flash',
      };
    }
  } catch {
    // Backend offline or running in static preview
  }
  return {
    isOnline: false,
    geminiConfigured: false,
    model: null,
  };
}

/**
 * Executes transparent rule-assisted heuristic evaluation fallback.
 */
function evaluateHeuristicFallback({ cropId, symptoms, notes, fileInfo, fallbackReason }) {
  const cropKnowledge = DISEASE_KNOWLEDGE_BASE[cropId] || DISEASE_KNOWLEDGE_BASE.potato;

  const scoredCandidates = cropKnowledge
    .map((disease) => {
      let matchCount = 0;
      const matchedSymptoms = [];
      disease.primarySymptoms.forEach((sym) => {
        if (symptoms.includes(sym)) {
          matchCount++;
          const opt = SYMPTOM_OPTIONS.find((s) => s.id === sym);
          if (opt) matchedSymptoms.push(opt.label);
        }
      });

      let likelihoodTag = 'Tentative Possibility (Preliminary Screening)';
      if (matchCount >= 2) {
        likelihoodTag = 'Primary Possibility (Rule Correlation)';
      } else if (matchCount === 1) {
        likelihoodTag = 'Secondary Possibility (Rule Correlation)';
      }

      return {
        name: disease.name,
        pathogen: disease.pathogenType,
        likelihoodTag,
        visualRationale: disease.visualMarkers,
        visualEvidencePresent: matchedSymptoms.length > 0
          ? `User-reported visual markers: ${matchedSymptoms.join(', ')}`
          : 'Baseline microclimate screening check',
        missingEvidence: disease.missingEvidence || 'Microscopic spore and pathogen culture verification cannot be performed from photo pixels.',
        evidenceMissingOrUncertain: disease.missingEvidence || 'Microscopic spore and pathogen culture verification cannot be performed from photo pixels.',
        differentialComparison: disease.differentialComparison || 'Visual foliar lesions can overlap with related pathogens; lab culturing recommended.',
        favorableConditions: disease.favorableCondition,
        matchedSymptoms,
        matchCount,
      };
    })
    .filter((cand) => cand.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  const conflictingCandidates = scoredCandidates.length > 1;

  let severityLevel = 'Mild / Early Manifestation (Based on User Symptoms)';
  let severityDescription = 'Symptoms appear localized to isolated foliar markers. Prompt cultural management can safeguard developing yield.';

  if (symptoms.length >= 3) {
    severityLevel = 'Moderate Canopy Stress (Based on User Symptoms)';
    severityDescription = 'Multiple concurrent symptom markers selected. Active field scouting across the entire field block is strongly recommended.';
  } else if (symptoms.includes('wilting') || symptoms.includes('water_soaked')) {
    severityLevel = 'Attention Required (Based on User Symptoms)';
    severityDescription = 'Water-soaked or vascular wilting indicators suggest potential systemic or rapid pathogen progression.';
  }

  const transparencyNote = fallbackReason
    ? `Notice: ${fallbackReason} Analysis executed using transparent preliminary heuristic screening based strictly on crop taxonomy and user-reported visual markers.`
    : 'Notice: This result was generated using preliminary agronomic screening rules correlated strictly with your selected crop and user-reported visual markers. No deep-learning computer vision inference was executed on the image bytes.';

  const culturalPractices = [
    'Avoid overhead sprinkler irrigation; transition to early-morning furrow or drip irrigation.',
    'Carefully remove and safely bag severely blighted lower canopy leaves; do not leave in furrows or compost.',
    'Sanitize sickles, shears, and harvesting tools with soap or diluted sanitizer between rows.',
    'Increase row spacing and weed thoroughly to promote aeration through the crop canopy.'
  ];

  const chemicalDisclaimer = 'Do not apply chemical fungicides or synthetic pesticides based solely on visual inspection. For certified chemical recommendations and exact dosages, always consult your nearest Krishi Vigyan Kendra (KVK).';

  const escalationTriggers = [
    'If more than 15% of your crop canopy shows expanding spots or lesions within 48 hours.',
    'If plants continue wilting rapidly even though the soil is sufficiently moist.',
    'If spots turn black and spread across stems and growing shoots.'
  ];

  return {
    analysisMode: 'PRELIMINARY / Rule-Assisted Heuristic Pattern Matcher',
    isAiInference: false,
    aiModel: null,
    isPlantCrop: true,
    isSuitableSpecimen: true,
    validationStatus: 'valid_foliar',
    specimenType: 'leaf',
    specimenLabel: 'Foliar Leaf Specimen (Heuristic Screening)',
    specimenAssessment: 'Foliar canopy leaf specimen accepted for rule-assisted screening.',
    identifiedSpecies: cropId,
    speciesMatchesTarget: true,
    isHealthy: symptoms.length === 0,
    healthyExplanation: symptoms.length === 0 ? 'No foliar symptoms reported by user. Foliage evaluated as visibly healthy or in early incubation.' : '',
    hasUserSymptoms: symptoms.length > 0,
    hasConfirmedObservations: symptoms.length > 0,
    transparencyDisclaimer: transparencyNote,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cropId,
    cropName: cropId.charAt(0).toUpperCase() + cropId.slice(1),
    fileInfo: {
      name: fileInfo?.name || 'Selected Crop Photo',
      sizeFormatted: fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'Preset Sample',
      type: fileInfo?.type || 'image/jpeg',
      previewUrl: fileInfo?.previewUrl || null,
    },
    userReportedSymptoms: symptoms.map((sId) => {
      const match = SYMPTOM_OPTIONS.find((opt) => opt.id === sId);
      return match ? match.label : sId;
    }),
    modelObservedSymptoms: [],
    observedVisualFeatures: [],
    userNotes: notes.trim() || 'None provided',
    candidates: scoredCandidates,
    conflictingCandidates,
    evidenceMissingOrUncertain: [
      'Microscopic pathogen sporulation and bacterial streaming cannot be confirmed without laboratory culture or PCR assay.',
      'Surface leaf photographs cannot inspect internal stem vascular bundles or root crowns.',
      'Fungal incubation may be active in surrounding asymptomatic leaves prior to macroscopic lesion emergence.'
    ],
    visualEvidencePresent: symptoms.map((sId) => {
      const match = SYMPTOM_OPTIONS.find((opt) => opt.id === sId);
      return match ? match.label : sId;
    }),
    uncertaintyExplanation: conflictingCandidates
      ? 'Multiple candidate diseases match the reported visual symptoms. In-field scouting and extension verification are required to differentiate between them.'
      : 'Visual foliar symptoms can overlap across bacterial and fungal pathogens, or mimic abiotic nutritional chlorosis.',
    alternativeAbioticCauses: [
      'Visual foliar symptoms can closely mimic abiotic physiological disorders, including nitrogen chlorosis or magnesium deficiency.',
      'Bacterial and fungal necrotic lesions can have overlapping appearances during initial infection phases.',
      'Sun scorch, chemical fertilizer burn, or micro-pest feeding punctures can also cause foliar margin browning.'
    ],
    alternativeExplanations: [
      'Visual foliar symptoms can closely mimic abiotic physiological disorders, including nitrogen chlorosis or magnesium deficiency.',
      'Bacterial and fungal necrotic lesions can have overlapping appearances during initial infection phases.',
      'Sun scorch, chemical fertilizer burn, or micro-pest feeding punctures can also cause foliar margin browning.'
    ],
    severityEstimate: {
      level: severityLevel,
      description: severityDescription,
    },
    uncertaintyFactors: [
      'Visual foliar symptoms can mimic abiotic physiological disorders, including fertilizer scorching or nutritional chlorosis.',
      'Pixel contents were not processed by a deep-learning vision network to inspect microscopic fungal structures.',
      'Pest feeding punctures (thrips, mites) can introduce secondary opportunistic fungal saprophytes.',
    ],
    culturalPractices,
    recommendedNextSteps: culturalPractices,
    chemicalDisclaimer,
    escalationTriggers,
    expertConsultationGuidance: {
      recommendation: 'If symptoms expand across more than 10–15% of your crop canopy or if black stem lesions develop, take physical sample leaves in a sealed paper envelope to your nearest Krishi Vigyan Kendra (KVK) or State Agricultural Extension Office for microscopic or PCR verification.',
      contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551) or certified district agronomist.',
    },
  };
}

/**
 * Main Crop Image Analysis Function
 *
 * Attempts genuine Google Gemini Vision AI inference via /api/analyze-crop-vision.
 * Seamlessly falls back to transparent rule-assisted heuristic mode if backend/key is offline or unconfigured.
 *
 * @param {Object} params
 * @param {string} params.cropId - Selected crop ('potato', 'tomato', 'rice', 'wheat')
 * @param {Array<string>} [params.symptoms] - User-reported symptom IDs
 * @param {string} [params.specimenType] - 'leaf' | 'harvested_produce' | 'other'
 * @param {string} [params.notes] - Field observations
 * @param {Object} params.fileInfo - File metadata and previewUrl (base64)
 * @returns {Promise<Object>} Structured diagnostic findings
 */
export async function analyzeCropImage({ 
  cropId, 
  symptoms = [], 
  specimenType = 'leaf', 
  notes = '', 
  fileInfo 
}) {
  const isLeafSpecimen = specimenType === 'leaf';
  const hasUserSymptoms = Array.isArray(symptoms) && symptoms.length > 0;

  // -------------------------------------------------------------------------
  // GUARDRAIL 1: Unsuitable Specimen View (Harvested Produce vs Leaf)
  // -------------------------------------------------------------------------
  if (!isLeafSpecimen) {
    const specimenLabel = specimenType === 'harvested_produce' ? 'Harvested Produce / Tuber' : 'Non-Foliar / Distant View';
    return {
      analysisMode: 'PRELIMINARY / Non-Foliar Specimen Guardrail',
      isAiInference: false,
      aiModel: null,
      isPlantCrop: specimenType !== 'other',
      isSuitableSpecimen: false,
      validationStatus: specimenType === 'harvested_produce' ? 'harvested_produce' : 'unrelated_image',
      specimenType,
      specimenLabel,
      identifiedSpecies: cropId,
      speciesMatchesTarget: true,
      isHealthy: false,
      healthyExplanation: '',
      hasUserSymptoms: false,
      hasConfirmedObservations: false,
      specimenAssessment: 'Non-foliar view detected. Foliar disease analysis requires living leaves.',
      unsuitabilityNotice: 'The uploaded image depicts harvested produce (such as tubers or picked fruit) or a distant view rather than an affected leaf. This screening system is specifically designed for foliar canopy disease symptoms. Please upload a clear, well-lit, close-up photo of an affected plant leaf or canopy stem.',
      transparencyDisclaimer: 'Notice: Uploaded image metadata is recorded, but pixel contents were not analyzed for foliar disease. Because the specimen is not a plant leaf, foliar disease candidates cannot be evaluated.',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cropId,
      cropName: cropId.charAt(0).toUpperCase() + cropId.slice(1),
      fileInfo: {
        name: fileInfo?.name || 'Uploaded File',
        sizeFormatted: fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'Preset Sample',
        type: fileInfo?.type || 'image/jpeg',
        previewUrl: fileInfo?.previewUrl || null,
      },
      userReportedSymptoms: [],
      modelObservedSymptoms: [],
      observedVisualFeatures: [],
      userNotes: notes.trim() || 'None provided',
      candidates: [],
      conflictingCandidates: false,
      uncertaintyExplanation: 'Post-harvest tuber decay criteria differ completely from foliar canopy blights.',
      alternativeAbioticCauses: ['Post-harvest mechanical transit blemishes or bruising.'],
      alternativeExplanations: ['Post-harvest tuber rot or transit blemishes have different criteria from canopy blights.'],
      severityEstimate: {
        level: 'Non-Foliar Specimen (Screening Paused)',
        description: 'Foliar disease pattern matching requires clear leaf or stem views. Harvested produce cannot be screened using foliar symptom rules.',
      },
      uncertaintyFactors: [
        'Post-harvest produce decay criteria differ completely from foliar canopy blights.',
        'No computer-vision model was run to inspect tuber eyes, skin, or internal flesh.',
      ],
      culturalPractices: [
        'Re-photograph the crop in the field: take a close-up photo of the living plant leaves showing spots or yellowing.',
        'If investigating post-harvest tuber rot, store tubers in cool (10–12°C), dry, well-ventilated storage to avoid post-harvest humidity buildup.',
      ],
      recommendedNextSteps: [
        'Re-photograph the crop in the field: take a close-up photo of the living plant leaves showing spots or yellowing.',
        'If investigating post-harvest tuber rot, store tubers in cool (10–12°C), dry, well-ventilated storage to avoid post-harvest humidity buildup.',
      ],
      chemicalDisclaimer: 'Do not apply chemical pesticides or unregistered fungicides to harvested produce without laboratory diagnosis.',
      escalationTriggers: [
        'If tubers develop foul-smelling soft rot in storage, isolate affected sacks immediately.',
      ],
      expertConsultationGuidance: {
        recommendation: 'For post-harvest tuber diagnostics or seed certification, consult a local agricultural extension office or horticulture department with a physical specimen.',
        contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551).',
      },
    };
  }

  // -------------------------------------------------------------------------
  // GUARDRAIL 2: Zero Symptoms / Healthy Foliage Safeguard
  // -------------------------------------------------------------------------
  if (!hasUserSymptoms) {
    return {
      analysisMode: 'PRELIMINARY / Asymptomatic Baseline Check',
      isAiInference: false,
      aiModel: null,
      isPlantCrop: true,
      isSuitableSpecimen: true,
      validationStatus: 'valid_foliar',
      specimenType: 'leaf',
      specimenLabel: 'Foliar Leaf Specimen (Asymptomatic)',
      specimenAssessment: 'Asymptomatic foliar leaf view reported. No active disease markers selected.',
      identifiedSpecies: cropId,
      speciesMatchesTarget: true,
      isHealthy: true,
      healthyExplanation: 'No visible disease symptoms were declared. If foliage appears vibrant green without necrotic lesions or sporulation, the crop is assessed as visibly healthy.',
      hasUserSymptoms: false,
      hasConfirmedObservations: false,
      unsuitabilityNotice: null,
      transparencyDisclaimer: 'Notice: No visible foliar symptoms were selected by the user. The system will NOT invent or guess symptoms from image pixels. Without observable symptom markers, disease candidates are not forced or proposed.',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cropId,
      cropName: cropId.charAt(0).toUpperCase() + cropId.slice(1),
      fileInfo: {
        name: fileInfo?.name || 'Selected Crop Photo',
        sizeFormatted: fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'Preset Sample',
        type: fileInfo?.type || 'image/jpeg',
        previewUrl: fileInfo?.previewUrl || null,
      },
      userReportedSymptoms: [],
      modelObservedSymptoms: [],
      observedVisualFeatures: [],
      userNotes: notes.trim() || 'None provided',
      candidates: [], // Strictly empty: NEVER force or invent candidates on healthy/asymptomatic plants!
      conflictingCandidates: false,
      uncertaintyExplanation: 'Leaf may be completely healthy or in early microscopic incubation prior to macroscopic lesion emergence.',
      alternativeAbioticCauses: ['Leaf may be in early pre-symptomatic stage or completely healthy.'],
      alternativeExplanations: ['Leaf may be in early pre-symptomatic stage or completely healthy.'],
      severityEstimate: {
        level: 'Undetermined / Visibly Healthy (No Symptoms Reported)',
        description: 'Evidence indicates healthy foliage or pre-symptomatic phase without reported symptoms. Continue standard cultural hygiene and monitor weather forecasts for humidity spikes.',
      },
      uncertaintyFactors: [
        'No observable symptom markers (e.g. spots, chlorosis, wilting, powder) were specified.',
        'Early incubation phases may be micro-climatically active before lesions are macroscopically visible.',
      ],
      culturalPractices: [
        'Continue routine preventive scouting: check 10 random plants across the field every 3–4 days during humid weather.',
        'Inspect the undersides of lower leaves in shaded canopy areas for early water-soaked lesions or white mold rings.',
        'Review regional Open-Meteo weather telemetry above to watch for upcoming relative humidity spikes (>80%).',
      ],
      recommendedNextSteps: [
        'Continue routine preventive scouting: check 10 random plants across the field every 3–4 days during humid weather.',
        'Inspect the undersides of lower leaves in shaded canopy areas for early water-soaked lesions or white mold rings.',
        'Review regional Open-Meteo weather telemetry above to watch for upcoming relative humidity spikes (>80%).',
      ],
      chemicalDisclaimer: 'No chemical intervention is needed or recommended for healthy foliage.',
      escalationTriggers: [
        'If spots or wilting appear on more than 5% of plants following heavy rain or fog, perform an updated evaluation.',
      ],
      expertConsultationGuidance: {
        recommendation: 'If you suspect early infection but cannot identify visual signs, take a high-resolution leaf sample to your local Krishi Vigyan Kendra (KVK).',
        contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551).',
      },
    };
  }

  // -------------------------------------------------------------------------
  // ATTEMPT GENUINE GEMINI VISION INFERENCE VIA BACKEND PROXY
  // -------------------------------------------------------------------------
  let fallbackReason = null;
  const imagePayload = fileInfo?.base64Payload || fileInfo?.previewUrl;

  if (imagePayload && typeof imagePayload === 'string' && imagePayload.startsWith('data:image')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const response = await fetch('/api/analyze-crop-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imagePayload,
          mimeType: fileInfo.type || 'image/jpeg',
          cropId,
          specimenType,
          userSymptoms: symptoms,
          userNotes: notes,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.isAiInference) {
          const isPlant = data.isPlantCrop === true && data.validationStatus !== 'unrelated_image';
          const isSuitable = Boolean(data.isSuitableSpecimen) && isPlant && data.validationStatus === 'valid_foliar';
          const isHealthy = Boolean(data.isHealthy);
          const validationStatus = !isPlant 
            ? 'unrelated_image' 
            : (data.validationStatus || (isSuitable ? 'valid_foliar' : 'unsuitable_view'));

          const unsuitabilityNotice = !isPlant || validationStatus === 'unrelated_image'
            ? 'The uploaded image depicts a non-plant subject (such as a person, fictional character, or object) rather than living crop foliage. Rain Maker foliar screening requires clear, close-up photos of living plant leaves. Please upload a clear photo of an affected leaf in your field.'
            : (validationStatus === 'harvested_produce' 
                ? 'Harvested produce is not suitable for foliar disease screening. Please upload a photo of living plant leaves.' 
                : null);

          return {
            analysisMode: `GENUINE AI / Google ${data.aiModel || 'Gemini 3.5 Flash'} Multimodal Vision`,
            isAiInference: true,
            aiProvider: data.aiProvider || 'Google Gemini Vision (@google/genai)',
            aiModel: data.aiModel || 'gemini-3.5-flash',
            isPlantCrop: isPlant,
            isSuitableSpecimen: isSuitable,
            validationStatus,
            specimenType,
            specimenLabel: data.specimenLabel || (isSuitable ? 'Foliar Leaf Specimen (AI Verified)' : (!isPlant ? 'Unrelated Image (Non-Plant)' : 'Unsuitable Specimen View')),
            specimenAssessment: data.specimenAssessment || (isSuitable ? 'Foliar canopy leaf analyzed by Gemini Vision.' : 'Image not suitable for foliar diagnosis.'),
            unsuitabilityNotice,
            identifiedSpecies: data.identifiedSpecies || cropId,
            speciesMatchesTarget: data.speciesMatchesTarget !== false,
            isHealthy,
            healthyExplanation: data.healthyExplanation || '',
            hasUserSymptoms: symptoms.length > 0,
            hasConfirmedObservations: (data.observedVisualFeatures && data.observedVisualFeatures.length > 0) || symptoms.length > 0,
            analyzedAt: data.analyzedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cropId,
            cropName: cropId.charAt(0).toUpperCase() + cropId.slice(1),
            fileInfo: {
              name: fileInfo?.name || 'Uploaded Crop Photo',
              sizeFormatted: fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'Analyzed Specimen',
              type: fileInfo?.type || 'image/jpeg',
              previewUrl: fileInfo?.previewUrl || null,
            },
            userReportedSymptoms: symptoms.map((sId) => {
              const match = SYMPTOM_OPTIONS.find((opt) => opt.id === sId);
              return match ? match.label : sId;
            }),
            modelObservedSymptoms: Array.isArray(data.modelObservedSymptoms) ? data.modelObservedSymptoms : [],
            observedVisualFeatures: Array.isArray(data.observedVisualFeatures) ? data.observedVisualFeatures : [],
            userNotes: notes.trim() || 'None provided',
            candidates: isHealthy || !isSuitable || !isPlant || validationStatus === 'unrelated_image' || validationStatus === 'harvested_produce'
              ? [] 
              : (Array.isArray(data.candidates) ? data.candidates : []),
            conflictingCandidates: Boolean(data.conflictingCandidates),
            uncertaintyExplanation: data.uncertaintyExplanation || 'Foliar symptoms may overlap across bacterial and fungal pathogens, or mimic abiotic physiological stress.',
            alternativeAbioticCauses: Array.isArray(data.alternativeAbioticCauses) ? data.alternativeAbioticCauses : (Array.isArray(data.alternativeExplanations) ? data.alternativeExplanations : []),
            alternativeExplanations: Array.isArray(data.alternativeAbioticCauses) ? data.alternativeAbioticCauses : (Array.isArray(data.alternativeExplanations) ? data.alternativeExplanations : []),
            severityEstimate: {
              level: isHealthy ? 'Healthy Plant Foliage' : (!isPlant ? 'Unrelated Image (Non-Plant)' : (!isSuitable ? 'Non-Foliar / Unsuitable Specimen' : 'Multimodal Vision Diagnostic Match')),
              description: isHealthy ? 'No visible active disease lesions or chlorosis detected.' : (!isPlant ? 'Subject is not plant foliage; diagnosis withheld.' : 'Observed foliar lesions analyzed against phytopathological patterns.'),
            },
            uncertaintyFactors: Array.isArray(data.uncertainties) ? data.uncertainties : [],
            culturalPractices: Array.isArray(data.culturalPractices) ? data.culturalPractices : (Array.isArray(data.scoutingAndCulturalSteps) ? data.scoutingAndCulturalSteps : []),
            recommendedNextSteps: Array.isArray(data.culturalPractices) ? data.culturalPractices : (Array.isArray(data.scoutingAndCulturalSteps) ? data.scoutingAndCulturalSteps : []),
            chemicalDisclaimer: data.chemicalDisclaimer || 'Do not apply chemical fungicides or synthetic pesticides based solely on visual inspection. Always consult your nearest Krishi Vigyan Kendra (KVK).',
            escalationTriggers: Array.isArray(data.escalationTriggers) ? data.escalationTriggers : [
              'If more than 15% of your crop canopy shows expanding spots or lesions within 48 hours.',
              'If plants continue wilting rapidly even though the soil is sufficiently moist.',
              'If spots turn black and spread across stems and growing shoots.'
            ],
            expertConsultationGuidance: {
              recommendation: data.expertConsultationAdvice || 'Confirm severe symptoms with a local Krishi Vigyan Kendra (KVK) using a physical specimen.',
              contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551).',
            },
            transparencyDisclaimer: data.disclaimer || 'Google Gemini AI vision provides decision-support observations based on visible morphology. It does not replace laboratory phytopathological diagnostics.',
          };
        }
        if (data.error === 'GEMINI_API_KEY_NOT_CONFIGURED') {
          fallbackReason = 'Gemini API key is not configured on the backend server. Set GEMINI_API_KEY in server environment (.env).';
        } else {
          fallbackReason = data.message || 'Gemini inference returned an unhandled status.';
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        fallbackReason = errJson.message || `Backend proxy responded with HTTP status ${response.status}.`;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        fallbackReason = 'Vision API request timed out (12s).';
      } else {
        fallbackReason = 'Backend proxy server is offline or unreachable.';
      }
    }
  } else {
    fallbackReason = 'Sample preset evaluated in prototype demonstration mode.';
  }

  // -------------------------------------------------------------------------
  // TRANSPARENT RULE-ASSISTED HEURISTIC FALLBACK
  // -------------------------------------------------------------------------
  return evaluateHeuristicFallback({
    cropId,
    symptoms,
    notes,
    fileInfo,
    fallbackReason,
  });
}
