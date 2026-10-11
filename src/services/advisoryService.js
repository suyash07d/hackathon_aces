/**
 * Farmer Advisory Engine
 *
 * Generates practical, prioritized agronomic advisories based on
 * meteorological disease risk evaluations, weather telemetry, and
 * visual symptom observations.
 *
 * Safety & Responsible Guidance Rules:
 * 1. Prioritize alerts by risk severity and time sensitivity.
 * 2. Avoid duplicate or contradictory recommendations.
 * 3. Never prescribe chemical pesticide dosages or claim guaranteed treatment efficacy.
 * 4. Emphasize cultural prevention, field drainage, canopy aeration, and timely scouting.
 * 5. Clearly indicate when expert consultation (KVK / Kisan Call Centre) is required.
 * 6. Explicitly state data freshness and forecast horizons.
 */

import { RISK_CATEGORIES } from './diseaseRiskEngine.js';

/**
 * Generate prioritized farmer advisories for the active crop and micro-climate context.
 *
 * @param {Object} params
 * @param {Object} params.cropRisk - Assessment from diseaseRiskEngine
 * @param {Object} params.weather - Current weather telemetry object
 * @param {string} params.cropName - Selected crop name
 * @param {Object} [params.imageAnalysis] - Optional result from image scanner
 * @returns {Array<Object>} Prioritized array of actionable advisories
 */
export function generateFarmerAdvisories({ cropRisk, weather, cropName, imageAnalysis }) {
  const advisories = [];
  const riskCategory = cropRisk?.riskCategory || RISK_CATEGORIES.UNDETERMINED;
  const isDataIncomplete = Boolean(cropRisk?.isDataIncomplete);
  const diseaseName = cropRisk?.targetDisease || 'Crop Pathogens';
  const forecastPeriod = cropRisk?.forecastPeriod || 'Next 24 Hours';
  const dataFreshness = cropRisk?.dataFreshness || 'Weather Telemetry';

  const currentTemp = weather?.current?.temperature ?? weather?.temperature;
  const currentRH = weather?.current?.humidity ?? weather?.humidity;
  const weatherSnapshot = (typeof currentTemp === 'number' && typeof currentRH === 'number')
    ? `Current: ${currentTemp}°C, ${currentRH}% RH • `
    : '';

  // =========================================================================
  // Case A: Missing or Incomplete Weather Data
  // =========================================================================
  if (isDataIncomplete && riskCategory === RISK_CATEGORIES.UNDETERMINED) {
    advisories.push({
      id: 'adv-missing-data',
      priority: 'urgent',
      badge: 'Data Notice',
      badgeColor: 'amber',
      category: 'Meteorological Telemetry Notice',
      title: `Weather Telemetry Unavailable for ${cropName}`,
      description: `Live weather telemetry could not be verified for your location. Micro-climatic disease models cannot calculate risk without temperature and relative humidity inputs.`,
      contributingConditions: 'Missing API connection or offline state.',
      inspectionGuidance: 'Do not rely on digital models while telemetry is offline. Conduct immediate manual visual scouting of lower canopy leaves across 10 random plants.',
      recommendation: 'Check field moisture manually. If recent rainfall or heavy morning dew was observed locally, treat conditions as potentially favorable for fungal development.',
      expertConsultation: 'Contact the Kisan Call Centre (Toll-Free 1800-180-1551) for district-level weather alerts and pest surveillance bulletins.',
      applicableCrops: [cropName],
      forecastPeriod: 'Current State',
      dataFreshness,
      icon: '⚠️',
    });

    // Add baseline general field sanitation advisory
    advisories.push({
      id: 'adv-baseline-sanitation',
      priority: 'routine',
      badge: 'Good Practice',
      badgeColor: 'green',
      category: 'Field Sanitation',
      title: 'Maintain Baseline Plot Sanitation & Drainage',
      description: 'Regardless of weather telemetry, preventive cultural practices form the first line of defense against crop diseases.',
      contributingConditions: 'Routine farm management.',
      inspectionGuidance: 'Check field borders, bunds, and furrows weekly for volunteer weeds that can harbor alternative pathogen hosts.',
      recommendation: 'Ensure water drainage furrows are clear of debris. Remove dead or fallen plant foliage from between rows to reduce saprophytic inoculum buildup.',
      expertConsultation: 'Consult your local Krishi Vigyan Kendra (KVK) for recommended seasonal crop management schedules.',
      applicableCrops: [cropName],
      forecastPeriod: 'Seasonal Baseline',
      dataFreshness,
      icon: '🌱',
    });

    return advisories;
  }

  // =========================================================================
  // Case B: Elevated Disease Risk (Primary Urgent Advisory)
  // =========================================================================
  if (riskCategory === RISK_CATEGORIES.ELEVATED) {
    advisories.push({
      id: `adv-elevated-${cropRisk.cropId}`,
      priority: 'urgent',
      badge: 'Urgent Alert',
      badgeColor: 'red',
      category: 'Micro-Climatic Disease Warning',
      title: `Elevated Vulnerability: ${diseaseName} in ${cropName}`,
      description: `Meteorological forecast models indicate ambient temperature and prolonged humidity have entered the active pathogen infection zone for ${diseaseName}.`,
      contributingConditions: `${weatherSnapshot}${cropRisk.contributingWeatherFactors?.slice(0, 3).join(' • ') || 'High humidity and favorable temperatures.'}`,
      inspectionGuidance: `Immediate action required: Scout lower leaf undersides, stem junctions, and shaded canopy pockets within the next 12–24 hours before forecast rain.`,
      recommendation: `1. Halt all overhead irrigation immediately to prevent extending leaf wetness duration.\n2. Avoid walking or operating machinery through wet plots to prevent mechanical spore dispersal.\n3. Verify field drains are open to prevent standing water at root ridges.\n4. If chemical or biological protection is part of your farm plan, consult certified guidelines before symptoms spread.`,
      expertConsultation: `Seek urgent guidance from a district horticultural officer or Krishi Vigyan Kendra (KVK) if water-soaked lesions or fungal spores are spotted.`,
      applicableCrops: [cropName],
      forecastPeriod,
      dataFreshness,
      icon: '🚨',
    });

    // Secondary moisture management advisory
    advisories.push({
      id: `adv-moisture-mgmt-${cropRisk.cropId}`,
      priority: 'watch',
      badge: 'Canopy Action',
      badgeColor: 'amber',
      category: 'Canopy Aeration & Moisture',
      title: 'Canopy Drying & Field Access Restriction',
      description: `Fungal and oomycete pathogens rely on liquid water films on the leaf surface to germinate and penetrate plant stomata.`,
      contributingConditions: 'Extended relative humidity (>80%) and dew persistence.',
      inspectionGuidance: 'Observe morning dew burn-off time. If foliage remains wet past 10:00 AM, risk increases significantly.',
      recommendation: 'Prune excess lower sucker foliage where agronomically recommended to encourage brisk air circulation through the crop canopy.',
      expertConsultation: 'Contact agricultural extension before applying any systemic treatments.',
      applicableCrops: [cropName],
      forecastPeriod,
      dataFreshness,
      icon: '💧',
    });
  }

  // =========================================================================
  // Case C: Moderate Disease Risk (Proactive Monitoring Advisory)
  // =========================================================================
  else if (riskCategory === RISK_CATEGORIES.MODERATE) {
    advisories.push({
      id: `adv-moderate-${cropRisk.cropId}`,
      priority: 'watch',
      badge: 'Scouting Watch',
      badgeColor: 'amber',
      category: 'Micro-Climatic Incubation Watch',
      title: `Heightened Monitoring: ${diseaseName} in ${cropName}`,
      description: `Current atmospheric parameters present moderate pathogen pressure. Conditions are not yet in an epidemic window, but localized micro-climates may support early lesion development.`,
      contributingConditions: `${weatherSnapshot}${cropRisk.contributingWeatherFactors?.slice(0, 2).join(' • ') || 'Moderate humidity and warm day temperatures.'}`,
      inspectionGuidance: `Schedule a field walk within the next 48 hours. Focus on windward field edges, low-lying depressions, and densely planted crop rows.`,
      recommendation: `1. Transition to morning-only drip or furrow irrigation so leaves dry completely before evening.\n2. Ensure balanced plant nutrition; avoid excessive late nitrogen applications that produce soft, succulent foliage.\n3. Keep sprayer equipment cleaned and calibrated in case weather deteriorates.`,
      expertConsultation: 'If lesions appear on more than 2% of surveyed plants, collect a physical sample in a clean paper envelope and take it to your nearest KVK.',
      applicableCrops: [cropName],
      forecastPeriod,
      dataFreshness,
      icon: '⚠️',
    });

    // Preventive cultural practice advisory
    advisories.push({
      id: `adv-cultural-prevention-${cropRisk.cropId}`,
      priority: 'routine',
      badge: 'Preventive Action',
      badgeColor: 'blue',
      category: 'Cultural Disease Management',
      title: 'Nutrient & Canopy Optimization',
      description: 'Balanced crop nutrition and ground aeration reduce plant stress and slow down pathogen incubation cycles.',
      contributingConditions: 'Intermittent damp conditions.',
      inspectionGuidance: 'Check leaf color uniformity and stem rigidity during regular field walkthroughs.',
      recommendation: 'Avoid high-dose nitrogen top-dressing during cloudy spells. Ensure adequate potassium and silica to strengthen epidermal cell walls.',
      expertConsultation: 'Consult soil testing labs or local agronomists for plot-specific fertilizer balancing.',
      applicableCrops: [cropName],
      forecastPeriod,
      dataFreshness,
      icon: '🌿',
    });
  }

  // =========================================================================
  // Case D: Low Disease Risk (Routine Preventive Guidance)
  // =========================================================================
  else {
    advisories.push({
      id: `adv-low-${cropRisk.cropId}`,
      priority: 'routine',
      badge: 'Low Risk',
      badgeColor: 'green',
      category: 'Baseline Preventive Guidance',
      title: `Favorable Weather: Low Immediate ${diseaseName} Threat`,
      description: `Forecast weather parameters (dry air and adequate canopy ventilation) are currently unfavorable for rapid ${diseaseName} spore germination in ${cropName}.`,
      contributingConditions: `${weatherSnapshot}${cropRisk.contributingWeatherFactors?.[0] || 'Dry conditions with relative humidity below danger thresholds.'}`,
      inspectionGuidance: 'Conduct routine weekly pest and disease scouting across 5–10 sample plants per acre.',
      recommendation: 'Use this favorable weather window to clear irrigation furrows, inspect drip emitters, and maintain record logs of crop development stages.',
      expertConsultation: 'Routine consultation recommended at seasonal growth transitions (e.g., flowering to fruit setting).',
      applicableCrops: [cropName],
      forecastPeriod,
      dataFreshness,
      icon: '✅',
    });

    advisories.push({
      id: `adv-preventive-irrigation-${cropRisk.cropId}`,
      priority: 'routine',
      badge: 'Best Practice',
      badgeColor: 'blue',
      category: 'Irrigation Scheduling',
      title: 'Efficient Water & Soil Health Management',
      description: 'Maintain deep, infrequent watering cycles to encourage deep root establishment while keeping topsoil and lower foliage dry.',
      contributingConditions: 'Optimal dry atmospheric spell.',
      inspectionGuidance: 'Check soil moisture at 15–20 cm depth before scheduling the next irrigation cycle.',
      recommendation: 'Irrigate during early morning hours. Inspect plant crowns for baseline vigor.',
      expertConsultation: 'Contact local irrigation extension specialists for crop water budgeting advice.',
      applicableCrops: [cropName],
      forecastPeriod,
      dataFreshness,
      icon: '💧',
    });
  }

  // =========================================================================
  // Case E: Cross-Evidence Advisory with Foliar Image Findings (If Available)
  // =========================================================================
  if (imageAnalysis && imageAnalysis.isSuitableSpecimen && imageAnalysis.hasUserSymptoms) {
    const topCandidate = imageAnalysis.candidates?.[0]?.name || 'Foliar Lesions';
    const isSymptomMatch = imageAnalysis.candidates?.length > 0;

    if (riskCategory === RISK_CATEGORIES.ELEVATED && isSymptomMatch) {
      advisories.unshift({
        id: 'adv-cross-concurrent',
        priority: 'urgent',
        badge: 'High Priority',
        badgeColor: 'red',
        category: 'Cross-Evidence Alert',
        title: `Concurrent Threat: Elevated Weather Risk + Matching Foliar Symptoms`,
        description: `CRITICAL ALIGNMENT: Both independent diagnostic signals converge. Your reported visual leaf symptoms correlate with ${topCandidate}, and the live Open-Meteo micro-climate is concurrently in the active incubation window for ${diseaseName}.`,
        contributingConditions: `Visual foliar symptoms align with forecast prolonged humidity (>85%).`,
        inspectionGuidance: `Isolate affected plants immediately. Check if symptoms are localized to low-lying rows or spreading across the entire canopy.`,
        recommendation: `1. Do NOT wait for further spread before taking protective cultural steps.\n2. Mark affected zones and flag them for quarantine.\n3. Take physical leaf samples to a local agricultural university or KVK diagnostic laboratory for formal microscopic confirmation.`,
        expertConsultation: `Call Kisan Call Centre (1800-180-1551) or visit your district agriculture office immediately with physical plant samples.`,
        applicableCrops: [cropName],
        forecastPeriod: 'Immediate (Next 12–24 Hours)',
        dataFreshness,
        icon: '🚨',
      });
    } else if (riskCategory === RISK_CATEGORIES.LOW && isSymptomMatch) {
      advisories.unshift({
        id: 'adv-cross-legacy',
        priority: 'watch',
        badge: 'Scouting Notice',
        badgeColor: 'amber',
        category: 'Cross-Evidence Analysis',
        title: `Visual Symptoms Present Under Currently Dry Weather`,
        description: `Visual leaf abnormalities (${topCandidate}) were reported, but current weather forecast is in the Low risk band. This typically indicates a legacy infection from an earlier rain spell, abiotic nutritional stress, or pest damage rather than an active new spore flush.`,
        contributingConditions: `Current air is dry, but leaf tissue shows physical lesions.`,
        inspectionGuidance: `Check whether lesions are actively expanding or have dried margins with clear borders. Inspect new young leaves for signs of healthy regrowth.`,
        recommendation: `1. Avoid panic spraying of fungicides while the atmospheric environment is dry.\n2. Verify if symptoms match secondary nutrient deficiencies (e.g. magnesium or potassium chlorosis).\n3. Re-evaluate if rain is forecast later in the week.`,
        expertConsultation: 'Consult an agronomist with a physical specimen to distinguish between fungal spots and nutritional chlorosis.',
        applicableCrops: [cropName],
        forecastPeriod: 'Current Observation',
        dataFreshness,
        icon: '🔍',
      });
    }
  }

  return advisories;
}
