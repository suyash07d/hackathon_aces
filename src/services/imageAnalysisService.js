/**
 * Image Analysis Service (Demo / Prototype Mode)
 *
 * Notice: No remote AI computer-vision model is configured in this repository.
 * This service implements a transparent, rule-assisted heuristic pattern matcher
 * based on agronomic disease guidelines. It produces structured exploratory candidate
 * evaluations without claiming confirmed diagnoses, automatic pixel classification,
 * or scientific validation.
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
  {
    id: 'sample-rice-blast',
    cropId: 'rice',
    specimenType: 'leaf',
    title: 'Rice Blade — Spindle blast lesions (Foliar Specimen)',
    symptoms: ['brown_spots', 'water_soaked'],
    notes: 'Diamond-shaped spots with gray centers on tiller blades.',
    previewColor: '#455d3f',
  },
  {
    id: 'sample-wheat-rust',
    cropId: 'wheat',
    specimenType: 'leaf',
    title: 'Wheat Flag Leaf — Yellow powdery pustules (Foliar Specimen)',
    symptoms: ['yellowing', 'white_powder'],
    notes: 'Yellow/orange stripes aligned along parallel leaf veins.',
    previewColor: '#6c623b',
  },
];

// Agronomic candidate knowledge base
const DISEASE_KNOWLEDGE_BASE = {
  potato: [
    {
      name: 'Late Blight (Phytophthora infestans)',
      pathogenType: 'Oomycete (Water Mold)',
      primarySymptoms: ['water_soaked', 'brown_spots'],
      supportingVisualSigns: 'Irregular dark, water-soaked lesions that rapidly expand and turn purplish-brown; delicate white mold often appears on leaf undersides in high humidity.',
      distinguishingCharacteristics: 'Lesions are not restricted by leaf veins; can cause rapid foliar collapse within days during cool, humid spells.',
      favorableConditions: 'Cool nights (10–15°C) and warm days (18–22°C) with relative humidity > 80% and prolonged dew.',
    },
    {
      name: 'Early Blight (Alternaria solani)',
      pathogenType: 'Fungal Pathogen',
      primarySymptoms: ['brown_spots', 'yellowing'],
      supportingVisualSigns: 'Concentric target-board rings on older basal foliage surrounded by chlorotic yellow halos.',
      distinguishingCharacteristics: 'Rarely shows white undersurface sporulation; progresses from lower leaves upward.',
      favorableConditions: 'Alternating wet and dry weather, temperature 24–29°C.',
    },
    {
      name: 'Blackleg / Bacterial Soft Rot',
      pathogenType: 'Bacterial Pathogen (Pectobacterium spp.)',
      primarySymptoms: ['wilting', 'water_soaked'],
      supportingVisualSigns: 'Inky black decay at stem base, rolling and stunting of apical leaves, sudden midday wilting.',
      distinguishingCharacteristics: 'Slimy, foul-smelling stem decay when split open; vascular browning.',
      favorableConditions: 'Warm, waterlogged soils with poor bed aeration.',
    },
  ],
  tomato: [
    {
      name: 'Early Blight & Septoria Leaf Spot',
      pathogenType: 'Fungal Complex (Alternaria / Septoria)',
      primarySymptoms: ['brown_spots', 'yellowing'],
      supportingVisualSigns: 'Numerous small circular spots with dark brown margins and sunken concentric rings on lower leaves.',
      distinguishingCharacteristics: 'Septoria spots often exhibit tiny black pinhead pycnidia fruiting bodies in the centers.',
      favorableConditions: 'Warm (20–28°C) overcast days with heavy morning dew or overhead irrigation splash.',
    },
    {
      name: 'Late Blight (Phytophthora infestans)',
      pathogenType: 'Oomycete Pathogen',
      primarySymptoms: ['water_soaked', 'wilting'],
      supportingVisualSigns: 'Large, greasy dark lesions on leaves and petiole stems, rapidly turning brown and brittle.',
      distinguishingCharacteristics: 'Associated with firm, greasy brown lesions on green or ripening tomato fruit.',
      favorableConditions: 'Persistent cool wet conditions (RH > 85%).',
    },
    {
      name: 'Powdery Mildew (Leveillula taurica)',
      pathogenType: 'Obligate Fungal Pathogen',
      primarySymptoms: ['white_powder', 'yellowing'],
      supportingVisualSigns: 'White powdery patches on upper and lower leaf surfaces accompanied by bright yellow chlorotic blotches.',
      distinguishingCharacteristics: 'Foliage appears dusted with flour; leaves eventually curl upward and drop prematurely.',
      favorableConditions: 'Moderate temperatures (20–26°C) and shaded, high-humidity canopies with dry leaves.',
    },
  ],
  rice: [
    {
      name: 'Rice Blast (Magnaporthe oryzae)',
      pathogenType: 'Ascomycete Fungus',
      primarySymptoms: ['brown_spots', 'water_soaked'],
      supportingVisualSigns: 'Diamond or spindle-shaped lesions with grayish-white centers and brownish-red borders on leaf blades.',
      distinguishingCharacteristics: 'Points of spindle lesions orient parallel to leaf veins; may cause neck rot during panicle emergence.',
      favorableConditions: 'Extended leaf wetness > 10 hours, cloudy skies, high nitrogen fertilization.',
    },
    {
      name: 'Sheath Blight (Rhizoctonia solani)',
      pathogenType: 'Soilborne Fungal Pathogen',
      primarySymptoms: ['water_soaked', 'brown_spots'],
      supportingVisualSigns: 'Oval or irregular greenish-gray water-soaked spots starting near the waterline on lower leaf sheaths.',
      distinguishingCharacteristics: 'Spots coalesce with distinct dark reddish-brown margins, resembling snake-skin patterns.',
      favorableConditions: 'High canopy humidity (> 85%) and dense tiller populations.',
    },
    {
      name: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
      pathogenType: 'Bacterial Vascular Pathogen',
      primarySymptoms: ['yellowing', 'wilting'],
      supportingVisualSigns: 'Water-soaked translucent stripes along leaf margins turning yellow to straw-white.',
      distinguishingCharacteristics: 'Milky bacterial ooze drops visible on young lesions during humid early mornings.',
      favorableConditions: 'Strong winds and rainstorms that create micro-wounds on leaf blades.',
    },
  ],
  wheat: [
    {
      name: 'Yellow / Stripe Rust (Puccinia striiformis)',
      pathogenType: 'Basidiomycete Fungus',
      primarySymptoms: ['yellowing', 'white_powder'],
      supportingVisualSigns: 'Bright yellow-orange powdery pustules arranged in narrow, parallel linear stripes along leaf veins.',
      distinguishingCharacteristics: 'Pustules rupture the epidermis, releasing powdery yellow urediniospores that easily dust fingertips.',
      favorableConditions: 'Cool weather (10–18°C) with frequent dews and cloudy skies.',
    },
    {
      name: 'Brown / Leaf Rust (Puccinia triticina)',
      pathogenType: 'Basidiomycete Fungus',
      primarySymptoms: ['brown_spots', 'yellowing'],
      supportingVisualSigns: 'Small circular to oval scattered brown pustules on upper leaf blades.',
      distinguishingCharacteristics: 'Non-striped, scattered random arrangement; typically thrives later in the season in warmer weather.',
      favorableConditions: 'Moderate temperatures (18–25°C) with overnight dew.',
    },
    {
      name: 'Powdery Mildew (Blumeria graminis)',
      pathogenType: 'Fungal Pathogen',
      primarySymptoms: ['white_powder'],
      supportingVisualSigns: 'Fluffy white to light gray cottony fungal cushions on lower leaf sheaths and flag leaf bases.',
      distinguishingCharacteristics: 'Later develops black pinhead cleistothecia resting structures embedded in the gray felt.',
      favorableConditions: 'Dense, lush stands under heavy nitrogen management and cool, humid microclimates.',
    },
  ],
};

/**
 * Perform transparent, rule-assisted symptom-matching analysis
 * @param {Object} params
 * @param {string} params.cropId - 'potato' | 'tomato' | 'rice' | 'wheat'
 * @param {string[]} params.symptoms - Selected symptom IDs
 * @param {string} params.specimenType - 'leaf' | 'harvested_produce' | 'other'
 * @param {string} params.notes - User observations
 * @param {Object} params.fileInfo - Uploaded file metadata
 * @returns {Promise<Object>}
 */
export async function analyzeCropImage({ 
  cropId, 
  symptoms = [], 
  specimenType = 'leaf',
  notes = '', 
  fileInfo 
}) {
  // Simulate brief local image parsing delay (600ms) for responsive feedback
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cropKnowledge = DISEASE_KNOWLEDGE_BASE[cropId] || DISEASE_KNOWLEDGE_BASE.potato;
  const isLeafSpecimen = specimenType === 'leaf';
  const hasUserSymptoms = Array.isArray(symptoms) && symptoms.length > 0;

  // Case 1: Unsuitable Specimen (e.g. Harvested Produce or Distant Shot)
  if (!isLeafSpecimen) {
    const specimenLabel = specimenType === 'harvested_produce' ? 'Harvested Produce / Tuber' : 'Non-Foliar / Distant View';
    return {
      analysisMode: 'DEMO / Rule-Assisted Heuristic Pattern Matcher',
      isAiInference: false,
      isSuitableSpecimen: false,
      specimenType,
      specimenLabel,
      unsuitabilityNotice: 'The uploaded image depicts harvested produce (such as tubers or picked fruit) or a distant view rather than an affected leaf. This screening system is specifically designed for foliar canopy disease symptoms. Please upload a clear, well-lit, close-up photo of an affected plant leaf or canopy stem.',
      transparencyDisclaimer: 'Notice: Uploaded image metadata is recorded, but pixel contents were not analyzed by an AI computer-vision model. Because the specimen is not a plant leaf, foliar disease candidates cannot be evaluated.',
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
      userNotes: notes.trim() || 'None provided',
      candidates: [],
      severityEstimate: {
        level: 'Non-Foliar Specimen (Screening Paused)',
        description: 'Foliar disease pattern matching requires clear leaf or stem views. Harvested produce cannot be screened using foliar symptom rules.',
      },
      uncertaintyFactors: [
        'Post-harvest tuber rot or transit blemishes have completely different symptom criteria from foliar canopy blights.',
        'No computer-vision model was run to inspect tuber skin, eyes, or internal flesh.',
      ],
      recommendedNextSteps: [
        'Re-photograph the crop in the field: take a close-up photo of the living plant leaves showing spots or yellowing.',
        'If investigating post-harvest tuber rot, inspect for foul odor, soft watery decay (bacterial soft rot), or dry spongy cavities (dry rot/Fusarium).',
        'Store tubers in cool (10–12°C), dry, well-ventilated storage to avoid post-harvest humidity buildup.',
      ],
      expertConsultationGuidance: {
        recommendation: 'For post-harvest tuber diagnostics or seed certification, consult a local agricultural extension office or horticulture department with a physical specimen.',
        contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551).',
      },
    };
  }

  // Case 2: Leaf Specimen, but NO symptoms selected by user
  if (!hasUserSymptoms) {
    return {
      analysisMode: 'DEMO / Rule-Assisted Heuristic Pattern Matcher',
      isAiInference: false,
      isSuitableSpecimen: true,
      specimenType: 'leaf',
      specimenLabel: 'Foliar Leaf Specimen',
      hasUserSymptoms: false,
      unsuitabilityNotice: null,
      transparencyDisclaimer: 'Notice: No visible foliar symptoms were selected by the user. The rule-based engine will NOT invent or guess symptoms from the image bytes. Without user-reported symptom markers, specific disease candidates cannot be responsibly proposed or ranked.',
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
      userNotes: notes.trim() || 'None provided',
      candidates: [], // Empty! No forcing or inventing candidates
      severityEstimate: {
        level: 'Undetermined (No Visible Symptoms Reported)',
        description: 'Evidence is insufficient to rank specific disease candidates. If foliage appears healthy, continue baseline monitoring.',
      },
      uncertaintyFactors: [
        'No observable symptom markers (e.g. spots, chlorosis, wilting, powder) were specified.',
        'Pixel contents were not processed by an AI vision network to extract features automatically.',
      ],
      recommendedNextSteps: [
        'If you observe foliar abnormalities in the field, re-evaluate and check the corresponding symptom boxes (e.g., yellow leaves, concentric brown spots).',
        'Inspect the undersides of lower leaves in shaded canopy areas for early water-soaked lesions or white mold rings.',
        'Continue routine preventive scouting: check 10 random plants across the field every 3–4 days during humid weather.',
        'Review the regional Open-Meteo weather telemetry above to watch for upcoming relative humidity spikes (>80%).',
      ],
      expertConsultationGuidance: {
        recommendation: 'If you suspect early infection but cannot identify visual signs, take a high-resolution leaf sample to your local Krishi Vigyan Kendra (KVK).',
        contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551).',
      },
    };
  }

  // Case 3: Leaf Specimen with User-Reported Symptoms
  // Score candidate diseases based on user symptoms
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

      let likelihoodTag = 'Preliminary Candidate';
      if (matchCount >= 2) {
        likelihoodTag = 'Primary Symptom Correlation (Rule Match)';
      } else if (matchCount === 1) {
        likelihoodTag = 'Secondary Symptom Possibility (Rule Match)';
      } else {
        likelihoodTag = 'Low Symptom Overlap';
      }

      return {
        name: disease.name,
        pathogenType: disease.pathogenType,
        likelihoodTag,
        matchScore: matchCount,
        matchedSymptoms,
        supportingVisualSigns: disease.supportingVisualSigns,
        distinguishingCharacteristics: disease.distinguishingCharacteristics,
        favorableConditions: disease.favorableConditions,
      };
    })
    .filter((cand) => cand.matchScore > 0); // Only include candidates that correlate with user symptoms!

  // Sort by match score descending
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  // Determine qualitative visual severity based on user symptoms
  let severityLevel = 'Mild / Early Manifestation (Based on User Symptoms)';
  let severityDescription = 'Symptoms appear localized to isolated foliar markers. Prompt cultural management can safeguard developing yield.';
  
  if (symptoms.length >= 3) {
    severityLevel = 'Moderate Canopy Stress (Based on User Symptoms)';
    severityDescription = 'Multiple concurrent symptom markers selected. Active field scouting across the entire field block is strongly recommended.';
  } else if (symptoms.includes('wilting') || symptoms.includes('water_soaked')) {
    severityLevel = 'Attention Required (Based on User Symptoms)';
    severityDescription = 'Water-soaked or vascular wilting indicators suggest potential systemic or rapid pathogen progression.';
  }

  return {
    analysisMode: 'DEMO / Rule-Assisted Heuristic Pattern Matcher',
    isAiInference: false,
    isSuitableSpecimen: true,
    specimenType: 'leaf',
    specimenLabel: 'Foliar Leaf Specimen',
    hasUserSymptoms: true,
    transparencyDisclaimer: 'This result was generated using agronomic pattern-matching rules correlated strictly with your selected crop and user-reported visual markers. No deep-learning computer vision inference was executed on the image bytes. An image alone cannot provide a definitive botanical or phytopathological diagnosis.',
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
    userNotes: notes.trim() || 'None provided',
    candidates: scoredCandidates,
    severityEstimate: {
      level: severityLevel,
      description: severityDescription,
    },
    uncertaintyFactors: [
      'Visual foliar symptoms can closely mimic abiotic physiological disorders, including nitrogen chlorosis, magnesium deficiency, or fertilizer scorching.',
      'Bacterial and fungal necrotic lesions can have overlapping appearances during initial infection phases.',
      'Pest feeding punctures (thrips, mites) can introduce secondary opportunistic fungal saprophytes.',
    ],
    recommendedNextSteps: [
      'Scout in a "W" or "Z" pattern across the field plot to check if symptoms are isolated or clustered in low-lying damp spots.',
      'Avoid entering or pruning foliage when leaves are wet with dew or rain, as brushing against wet canopies rapidly spreads inocula.',
      'Carefully remove and bag severely blighted lower leaves; do not discard them in field irrigation furrows.',
      'Check irrigation scheduling: transition to morning drip or furrow irrigation to minimize night-time leaf wetness duration.',
    ],
    expertConsultationGuidance: {
      recommendation: 'If symptoms expand across more than 10–15% of your crop canopy or if black stem lesions develop, take physical sample leaves in a sealed plastic bag to your nearest Krishi Vigyan Kendra (KVK) or State Agricultural Extension Office for microscopic or PCR verification.',
      contactChannels: 'Toll-free Kisan Call Centre (1800-180-1551) or certified district agronomist.',
    },
  };
}
