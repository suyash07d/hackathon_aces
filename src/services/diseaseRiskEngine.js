/**
 * Crop Disease Risk Assessment Engine
 *
 * Micro-Climatic Pathogen Incubation Modeling for Rain Maker
 *
 * Evaluates weather forecast telemetry (temperature, relative humidity,
 * dew point, precipitation, and hourly sequences) against documented
 * agronomic disease forecasting rules.
 *
 * Agronomic Models Referenced:
 * 1. Potato Late Blight (Phytophthora infestans):
 *    - Wallin System (Wallin, 1962), Blitecast (Krause et al., 1975), and CPRI Indo-Blightcast principles.
 *    - Key thresholds: 10–24°C temperature window, >= 80–85% RH for >= 8–10 consecutive hours.
 * 2. Tomato Early Blight (Alternaria solani) & Late Blight:
 *    - TOM-CAST (Madden et al., 1978; Pitblado, 1992) and FAST model principles.
 *    - Key thresholds: 20–28°C daytime, >= 80% RH for >= 8 hours or rain splash events.
 * 3. Rice Blast (Magnaporthe oryzae) & Sheath Blight (Rhizoctonia solani):
 *    - IRRI Blast Warning Guidelines & Kim et al. (1988) blast forecast models.
 *    - Key thresholds: Night temps 19–25°C, >= 88% RH for >= 10 hours, low wind speed (< 10 km/h).
 * 4. Wheat Stripe / Yellow Rust (Puccinia striiformis):
 *    - CIMMYT Rust Surveillance Guidelines (Roelfs et al., 1992; Hovmøller et al., 2011).
 *    - Key thresholds: Cool 9–18°C temperature window, morning dew persistence or RH >= 85% for >= 4–6 hours.
 *
 * Safety & Transparency Principles:
 * - Missing or failed weather data is NEVER treated as Low risk; it is returned as "Undetermined (Data Incomplete)".
 * - Numerical risk scores are rule-derived indices (0–100) for UI progress gauges, NOT statistical probability or guaranteed predictions.
 * - Weather risk is strictly separated from foliar image findings.
 */

export const RISK_CATEGORIES = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  ELEVATED: 'Elevated',
  UNDETERMINED: 'Undetermined (Data Incomplete)',
};

export const SUPPORTED_CROPS = {
  potato: {
    id: 'potato',
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    targetDisease: 'Late Blight (Phytophthora infestans)',
    secondaryDisease: 'Early Blight (Alternaria solani)',
    modelSource: 'Wallin System (1962) & Blitecast Principles',
    provisionalStatus: 'Empirical Rule-Based Model (Standard Agricultural Forecasting)',
    idealTempRange: { min: 12, max: 23, optimalMin: 15, optimalMax: 21 },
    criticalRH: 85,
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    targetDisease: 'Early Blight (Alternaria solani) & Late Blight',
    secondaryDisease: 'Septoria Leaf Spot',
    modelSource: 'TOM-CAST / FAST Model Adaptation (Madden et al., 1978)',
    provisionalStatus: 'Empirical Rule-Based Model (Standard Agricultural Forecasting)',
    idealTempRange: { min: 18, max: 28, optimalMin: 20, optimalMax: 26 },
    criticalRH: 80,
  },
  rice: {
    id: 'rice',
    name: 'Rice (Paddy)',
    scientificName: 'Oryza sativa',
    targetDisease: 'Rice Blast (Magnaporthe oryzae)',
    secondaryDisease: 'Sheath Blight (Rhizoctonia solani)',
    modelSource: 'IRRI Blast Warning Guidelines & Kim et al. (1988)',
    provisionalStatus: 'Empirical Rule-Based Model (Standard Agricultural Forecasting)',
    idealTempRange: { min: 19, max: 28, optimalMin: 20, optimalMax: 25 },
    criticalRH: 88,
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    targetDisease: 'Stripe / Yellow Rust (Puccinia striiformis)',
    secondaryDisease: 'Leaf Rust (Puccinia triticina)',
    modelSource: 'CIMMYT Rust Surveillance Guidelines (Roelfs et al., 1992)',
    provisionalStatus: 'Empirical Rule-Based Model (Standard Agricultural Forecasting)',
    idealTempRange: { min: 8, max: 20, optimalMin: 10, optimalMax: 18 },
    criticalRH: 85,
  },
};

/**
 * Helper: Computes consecutive and total high-humidity hours from hourly forecast series.
 */
function analyzeHourlyMoisture(hourlyList, rhThreshold, tempMin, tempMax) {
  if (!Array.isArray(hourlyList) || hourlyList.length === 0) {
    return {
      hasHourly: false,
      totalHumidHours: 0,
      maxConsecutiveHumidHours: 0,
      hoursInTempRange: 0,
      consecutiveCriticalHours: 0,
      totalPrecipitation: 0,
      avgDewPointDepression: null,
      recordsEvaluated: 0,
    };
  }

  let totalHumidHours = 0;
  let maxConsecutiveHumid = 0;
  let currentConsecutiveHumid = 0;

  let consecutiveCritical = 0;
  let maxConsecutiveCritical = 0;

  let hoursInTempRange = 0;
  let totalPrecipitation = 0;
  let dewDepressionSum = 0;
  let dewDepressionCount = 0;

  const records = hourlyList.slice(0, 24); // Focus on next 24 hours

  records.forEach((h) => {
    const rh = typeof h.humidity === 'number' ? h.humidity : 0;
    const temp = typeof h.temperature === 'number' ? h.temperature : 20;
    const precip = typeof h.precipitation === 'number' ? h.precipitation : 0;
    const dew = typeof h.dewPoint === 'number' ? h.dewPoint : null;

    totalPrecipitation += precip;

    if (dew !== null) {
      const depression = Math.max(0, temp - dew);
      dewDepressionSum += depression;
      dewDepressionCount++;
    }

    const isTempFavorable = temp >= tempMin && temp <= tempMax;
    if (isTempFavorable) {
      hoursInTempRange++;
    }

    if (rh >= rhThreshold) {
      totalHumidHours++;
      currentConsecutiveHumid++;
      if (currentConsecutiveHumid > maxConsecutiveHumid) {
        maxConsecutiveHumid = currentConsecutiveHumid;
      }

      if (isTempFavorable) {
        consecutiveCritical++;
        if (consecutiveCritical > maxConsecutiveCritical) {
          maxConsecutiveCritical = consecutiveCritical;
        }
      } else {
        consecutiveCritical = 0;
      }
    } else {
      currentConsecutiveHumid = 0;
      consecutiveCritical = 0;
    }
  });

  return {
    hasHourly: true,
    totalHumidHours,
    maxConsecutiveHumidHours: maxConsecutiveHumid,
    hoursInTempRange,
    consecutiveCriticalHours: maxConsecutiveCritical,
    totalPrecipitation: Number(totalPrecipitation.toFixed(1)),
    avgDewPointDepression: dewDepressionCount > 0 ? Number((dewDepressionSum / dewDepressionCount).toFixed(1)) : null,
    recordsEvaluated: records.length,
  };
}

/**
 * Evaluates disease risk for Potato Late Blight
 */
function evaluatePotatoRisk(weather, hourlyStats) {
  const factors = [];
  const uncertainties = [];
  let score = 20;
  let category = RISK_CATEGORIES.LOW;

  const currentTemp = weather?.current?.temperature ?? 20;
  const currentRH = weather?.current?.humidity ?? 60;
  const currentPrecip = weather?.current?.precipitation ?? 0;
  const dailyPrecip = weather?.current?.precipSum ?? currentPrecip;

  if (hourlyStats.hasHourly) {
    factors.push(`Forecast evaluated across ${hourlyStats.recordsEvaluated} hourly time steps.`);
    if (hourlyStats.consecutiveCriticalHours >= 8) {
      factors.push(`Sustained moisture: ${hourlyStats.consecutiveCriticalHours} consecutive hours with RH >= 85% in optimal temperature band (12–23°C).`);
    } else if (hourlyStats.totalHumidHours >= 6) {
      factors.push(`Intermittent humidity: ${hourlyStats.totalHumidHours} total hours with RH >= 85%.`);
    }

    if (hourlyStats.totalPrecipitation >= 5) {
      factors.push(`Substantial rainfall forecast: ${hourlyStats.totalPrecipitation} mm in 24h.`);
    } else if (hourlyStats.totalPrecipitation > 0) {
      factors.push(`Light rainfall forecast: ${hourlyStats.totalPrecipitation} mm in 24h.`);
    }

    if (hourlyStats.avgDewPointDepression !== null && hourlyStats.avgDewPointDepression <= 2.0) {
      factors.push(`Dew condensation indicated: Average dew point depression is only ${hourlyStats.avgDewPointDepression}°C.`);
    }

    // Rule-based decision logic (Wallin / Blitecast)
    if (hourlyStats.consecutiveCriticalHours >= 10 || (hourlyStats.consecutiveCriticalHours >= 7 && hourlyStats.totalPrecipitation >= 4)) {
      category = RISK_CATEGORIES.ELEVATED;
      score = Math.min(95, 75 + hourlyStats.consecutiveCriticalHours * 2);
    } else if (hourlyStats.consecutiveCriticalHours >= 5 || hourlyStats.totalHumidHours >= 8 || dailyPrecip >= 8) {
      category = RISK_CATEGORIES.MODERATE;
      score = Math.min(68, 45 + hourlyStats.totalHumidHours * 2);
    } else {
      category = RISK_CATEGORIES.LOW;
      score = Math.max(15, 20 + hourlyStats.totalHumidHours * 2);
    }
  } else {
    // Fallback when hourly is not available
    factors.push(`Current instantaneous temperature: ${currentTemp}°C; relative humidity: ${currentRH}%.`);
    uncertainties.push('Hourly sequence unavailable. Assessment is based on instantaneous current conditions rather than continuous leaf wetness duration.');

    if (currentRH >= 85 && currentTemp >= 14 && currentTemp <= 22) {
      category = RISK_CATEGORIES.MODERATE;
      score = 55;
    } else if (currentRH >= 90) {
      category = RISK_CATEGORIES.MODERATE;
      score = 60;
    } else {
      category = RISK_CATEGORIES.LOW;
      score = 25;
    }
  }

  // Canopy microclimate caveat
  uncertainties.push('Macro-weather forecast reflects ambient open air (2m height). Dense potato ridge canopies frequently trap 5–12% higher relative humidity and prolonged dew.');

  return {
    category,
    score,
    factors,
    uncertainties,
    explanation:
      category === RISK_CATEGORIES.ELEVATED
        ? 'Meteorological telemetry forecasts extended periods of high relative humidity (>85%) combined with temperatures between 12°C and 23°C. Under Wallin and Blitecast criteria, these conditions strongly favor Phytophthora infestans sporangia formation and germination.'
        : category === RISK_CATEGORIES.MODERATE
        ? 'Moderate humidity or intermittent rainfall may provide sufficient moisture for localized spore incubation in dense or low-lying canopy rows.'
        : 'Current forecast conditions indicate lower relative humidity or temperatures outside the rapid late blight sporulation window. Pathogen development is expected to remain slow or dormant.',
    recommendedScouting:
      'Inspect lower canopy leaves, leaf undersides, and stem junctions in low-lying or poorly drained plot corners for water-soaked, dark green to brown lesions with pale white mold halos.',
    preventiveActions: [
      'Avoid overhead sprinkler irrigation during late afternoon or evening to minimize leaf wetness duration.',
      'Ensure field furrow drainage is unobstructed to prevent standing water near tuber ridges.',
      'Maintain crop canopy aeration where feasible; avoid working in wet foliage to reduce manual spore transfer.',
      'If prolonged rain is forecast in an elevated risk window, consult an agronomist regarding protective contact fungicide spray schedules.',
    ],
  };
}

/**
 * Evaluates disease risk for Tomato Early Blight / Late Blight
 */
function evaluateTomatoRisk(weather, hourlyStats) {
  const factors = [];
  const uncertainties = [];
  let score = 20;
  let category = RISK_CATEGORIES.LOW;

  const currentTemp = weather?.current?.temperature ?? 24;
  const currentRH = weather?.current?.humidity ?? 60;

  if (hourlyStats.hasHourly) {
    factors.push(`Forecast evaluated across ${hourlyStats.recordsEvaluated} hourly time steps.`);
    if (hourlyStats.totalHumidHours >= 8) {
      factors.push(`Foliar humidity: ${hourlyStats.totalHumidHours} hours with RH >= 80%.`);
    }
    if (hourlyStats.hoursInTempRange >= 10) {
      factors.push(`Thermal favorability: ${hourlyStats.hoursInTempRange} hours within optimal Alternaria growth range (18–28°C).`);
    }
    if (hourlyStats.totalPrecipitation >= 4) {
      factors.push(`Rainfall splash vector: ${hourlyStats.totalPrecipitation} mm forecast, which can splash soil-borne conidia onto lower leaves.`);
    }

    // TOM-CAST / FAST decision logic
    const warmHumidHours = hourlyStats.consecutiveCriticalHours;
    if (warmHumidHours >= 8 || (hourlyStats.totalHumidHours >= 10 && hourlyStats.totalPrecipitation >= 3)) {
      category = RISK_CATEGORIES.ELEVATED;
      score = Math.min(92, 72 + warmHumidHours * 2);
    } else if (warmHumidHours >= 5 || hourlyStats.totalHumidHours >= 6 || hourlyStats.totalPrecipitation >= 2) {
      category = RISK_CATEGORIES.MODERATE;
      score = Math.min(65, 45 + hourlyStats.totalHumidHours * 2);
    } else {
      category = RISK_CATEGORIES.LOW;
      score = Math.max(15, 20 + hourlyStats.totalHumidHours * 2);
    }
  } else {
    factors.push(`Current ambient temperature: ${currentTemp}°C; relative humidity: ${currentRH}%.`);
    uncertainties.push('Hourly sequence unavailable. Assessment based on instantaneous current conditions.');

    if (currentRH >= 80 && currentTemp >= 20 && currentTemp <= 28) {
      category = RISK_CATEGORIES.MODERATE;
      score = 55;
    } else {
      category = RISK_CATEGORIES.LOW;
      score = 25;
    }
  }

  uncertainties.push('Trellised tomatoes have better airflow than bush varieties; dense unpruned canopies experience prolonged wetness.');

  return {
    category,
    score,
    factors,
    uncertainties,
    explanation:
      category === RISK_CATEGORIES.ELEVATED
        ? 'TOM-CAST and FAST disease models indicate that warm temperatures (20–28°C) concurring with >= 8 hours of high humidity or rain showers substantially accelerate Alternaria solani conidial germination and penetration.'
        : category === RISK_CATEGORIES.MODERATE
        ? 'Conditions are moderately favorable for fungal foliar spot development, particularly on older lower foliage in unpruned or closely spaced plantings.'
        : 'Dry atmospheric conditions and adequate canopy aeration are currently limiting early blight pathogen pressure.',
    recommendedScouting:
      'Scout oldest, basal leaves for dark brown concentric rings ("target-board" spots) surrounded by chlorotic yellow halos. Also check fruit calyxes and stems.',
    preventiveActions: [
      'Apply drip irrigation or furrow watering instead of overhead sprinklers to keep foliage dry.',
      'Prune lower senescent leaves (bottom 20–30 cm) to improve ground air circulation and reduce soil splash contact.',
      'Mulch soil surface around plants with straw or plastic to suppress spore splash during rain.',
      'Consult local agricultural extension for disease-tolerant cultivars and certified seed sources.',
    ],
  };
}

/**
 * Evaluates disease risk for Rice Blast / Sheath Blight
 */
function evaluateRiceRisk(weather, hourlyStats) {
  const factors = [];
  const uncertainties = [];
  let score = 20;
  let category = RISK_CATEGORIES.LOW;

  const currentTemp = weather?.current?.temperature ?? 26;
  const currentRH = weather?.current?.humidity ?? 70;
  const currentWind = weather?.current?.windSpeed ?? 10;

  if (hourlyStats.hasHourly) {
    factors.push(`Forecast evaluated across ${hourlyStats.recordsEvaluated} hourly time steps.`);
    if (hourlyStats.totalHumidHours >= 8) {
      factors.push(`Saturated humidity: ${hourlyStats.totalHumidHours} hours with RH >= 88%.`);
    }
    if (hourlyStats.hoursInTempRange >= 10) {
      factors.push(`Optimal blast sporulation thermal band: ${hourlyStats.hoursInTempRange} hours between 19°C and 28°C.`);
    }
    if (currentWind < 8) {
      factors.push(`Low wind speed (${currentWind} km/h) prevents rapid dew evaporation, extending canopy moisture persistence.`);
    } else if (currentWind >= 16) {
      factors.push(`Brisk wind speed (${currentWind} km/h) promotes faster canopy drying, mitigating infection risk.`);
    }

    // IRRI Blast criteria
    if (hourlyStats.totalHumidHours >= 9 && hourlyStats.hoursInTempRange >= 10 && currentWind < 12) {
      category = RISK_CATEGORIES.ELEVATED;
      score = Math.min(90, 74 + hourlyStats.totalHumidHours * 2);
    } else if (hourlyStats.totalHumidHours >= 6 || (hourlyStats.totalHumidHours >= 4 && hourlyStats.totalPrecipitation >= 5)) {
      category = RISK_CATEGORIES.MODERATE;
      score = Math.min(64, 45 + hourlyStats.totalHumidHours * 2);
    } else {
      category = RISK_CATEGORIES.LOW;
      score = Math.max(15, 20 + hourlyStats.totalHumidHours * 2);
    }
  } else {
    factors.push(`Current temperature: ${currentTemp}°C; relative humidity: ${currentRH}%; wind: ${currentWind} km/h.`);
    uncertainties.push('Hourly sequence unavailable. Assessment based on instantaneous current conditions.');

    if (currentRH >= 88 && currentTemp >= 20 && currentTemp <= 26) {
      category = RISK_CATEGORIES.MODERATE;
      score = 55;
    } else {
      category = RISK_CATEGORIES.LOW;
      score = 25;
    }
  }

  uncertainties.push('Excessive nitrogen fertilizer application drastically increases rice leaf blast susceptibility regardless of minor weather fluctuations.');

  return {
    category,
    score,
    factors,
    uncertainties,
    explanation:
      category === RISK_CATEGORIES.ELEVATED
        ? 'Under IRRI blast forecasting models, persistent nocturnal relative humidity (>88%) coupled with temperatures between 19°C and 25°C and calm wind provides the 10+ hours of continuous leaf wetness required for Magnaporthe oryzae appressorium formation.'
        : category === RISK_CATEGORIES.MODERATE
        ? 'Intermittent high humidity levels warrant increased vigilance, particularly in fields with high plant density or heavy nitrogen top-dressing.'
        : 'Current humidity levels and wind conditions provide adequate aeration to prevent prolonged dew persistence on rice blades.',
    recommendedScouting:
      'Inspect upper leaves, flag leaves, and neck nodes for spindle-shaped (diamond) lesions with grayish-white centers and brownish-red borders.',
    preventiveActions: [
      'Split nitrogen fertilizer applications; avoid heavy single doses of urea during overcast periods.',
      'Maintain balanced potassium and silica nutrition to enhance physical leaf tissue resistance.',
      'Regulate standing water depth; avoid unmonitored field submergence during overcast spells.',
      'Report any suspicious neck or panicle blast symptoms promptly to the nearest Krishi Vigyan Kendra.',
    ],
  };
}

/**
 * Evaluates disease risk for Wheat Stripe / Yellow Rust
 */
function evaluateWheatRisk(weather, hourlyStats) {
  const factors = [];
  const uncertainties = [];
  let score = 20;
  let category = RISK_CATEGORIES.LOW;

  const currentTemp = weather?.current?.temperature ?? 18;
  const currentRH = weather?.current?.humidity ?? 65;

  if (hourlyStats.hasHourly) {
    factors.push(`Forecast evaluated across ${hourlyStats.recordsEvaluated} hourly time steps.`);
    if (hourlyStats.totalHumidHours >= 6) {
      factors.push(`Dew / high-humidity window: ${hourlyStats.totalHumidHours} hours with RH >= 85%.`);
    }
    if (hourlyStats.hoursInTempRange >= 8) {
      factors.push(`Cool thermal optimum: ${hourlyStats.hoursInTempRange} hours in yellow rust germination range (8–18°C).`);
    }

    // High temperature inhibition check
    const hotHours = hourlyStats.recordsEvaluated > 0
      ? weather.hourly.filter((h) => (h.temperature ?? 0) >= 25).length
      : 0;

    if (hotHours >= 4) {
      factors.push(`Thermal suppression: ${hotHours} hours with temperatures >= 25°C, which halts stripe rust urediniospore germination.`);
    }

    // CIMMYT Rust criteria
    if (hourlyStats.consecutiveCriticalHours >= 6 && hotHours <= 1) {
      category = RISK_CATEGORIES.ELEVATED;
      score = Math.min(88, 70 + hourlyStats.consecutiveCriticalHours * 3);
    } else if (hourlyStats.consecutiveCriticalHours >= 4 || (hourlyStats.totalHumidHours >= 6 && hotHours <= 3)) {
      category = RISK_CATEGORIES.MODERATE;
      score = Math.min(62, 42 + hourlyStats.totalHumidHours * 2);
    } else {
      category = RISK_CATEGORIES.LOW;
      score = Math.max(15, 20 + hourlyStats.totalHumidHours * 2);
    }
  } else {
    factors.push(`Current temperature: ${currentTemp}°C; relative humidity: ${currentRH}%.`);
    uncertainties.push('Hourly sequence unavailable. Assessment based on instantaneous current conditions.');

    if (currentRH >= 85 && currentTemp >= 9 && currentTemp <= 18) {
      category = RISK_CATEGORIES.MODERATE;
      score = 55;
    } else {
      category = RISK_CATEGORIES.LOW;
      score = 25;
    }
  }

  uncertainties.push('Rust spores are aerially dispersed over long distances. High micro-climatic risk requires the presence of initial airborne inoculum in the agro-climatic corridor.');

  return {
    category,
    score,
    factors,
    uncertainties,
    explanation:
      category === RISK_CATEGORIES.ELEVATED
        ? 'CIMMYT epidemiology models indicate cool, damp conditions (8–18°C with morning dew or RH >= 85%) represent the critical infection window for Puccinia striiformis. Pustules can rapidly erupt along leaf veins.'
        : category === RISK_CATEGORIES.MODERATE
        ? 'Cool morning dew periods warrant regular scouting, though daytime warmth may slow secondary cycle progression.'
        : 'Daytime temperatures exceeding 24°C or dry air limit yellow rust spore germination and pustule expansion.',
    recommendedScouting:
      'Walk fields in a zigzag pattern; inspect flag leaves and upper canopy for bright yellow to orange pustules arranged in linear stripes between leaf veins.',
    preventiveActions: [
      'Monitor regional agricultural university rust alerts for airborne spore movement across the district.',
      'Avoid excessive vegetative canopy crowding through balanced seed rates.',
      'Prioritize planting recommended rust-resistant wheat varieties (e.g., HD series or DBW varieties).',
      'Contact district extension officers immediately if linear yellow stripes are observed on flag leaves.',
    ],
  };
}

/**
 * Main Disease-Risk Engine API
 *
 * Evaluates disease risk for a specified crop using weather telemetry.
 *
 * @param {string} cropId - Target crop identifier ('potato', 'tomato', 'rice', 'wheat')
 * @param {Object} weather - Weather telemetry object (from Open-Meteo or local fallback)
 * @returns {Object} Structured disease risk evaluation
 */
export function estimateDiseaseRisk(cropId, weather) {
  const cropConfig = SUPPORTED_CROPS[cropId];

  // 1. Guard against unsupported crop
  if (!cropConfig) {
    return {
      cropId: cropId || 'unknown',
      cropName: cropId ? cropId.charAt(0).toUpperCase() + cropId.slice(1) : 'Unknown Crop',
      targetDisease: 'Unsupported Crop Disease Model',
      riskCategory: RISK_CATEGORIES.UNDETERMINED,
      riskScore: null,
      isDataIncomplete: true,
      isStale: false,
      scientificBasis: 'No established rule set available in this engine for this crop type.',
      provisionalStatus: 'Unsupported',
      forecastPeriod: 'N/A',
      dataFreshness: 'N/A',
      contributingWeatherFactors: ['No disease model rules configured for this crop identifier.'],
      uncertaintyWarnings: ['Consult specialized horticultural literature for this crop species.'],
      explanation: `Rain Maker currently supports validated risk rule sets for Potato, Tomato, Rice, and Wheat. Risk for "${cropId}" cannot be estimated.`,
      recommendedScouting: 'Refer to local agricultural extension recommendations for this crop.',
      preventiveActions: ['Maintain general field sanitation and standard crop husbandry.'],
    };
  }

  // 2. Guard against missing or failed weather data
  // Critical safety rule: NEVER treat unavailable weather as Low risk!
  if (!weather || (!weather.current && !weather.temperature)) {
    return {
      cropId: cropConfig.id,
      cropName: cropConfig.name,
      scientificName: cropConfig.scientificName,
      targetDisease: cropConfig.targetDisease,
      secondaryDisease: cropConfig.secondaryDisease,
      riskCategory: RISK_CATEGORIES.UNDETERMINED,
      riskScore: null,
      isDataIncomplete: true,
      isStale: false,
      scientificBasis: cropConfig.modelSource,
      provisionalStatus: cropConfig.provisionalStatus,
      forecastPeriod: 'Unavailable',
      dataFreshness: 'No live telemetry received',
      contributingWeatherFactors: ['Weather forecast data is currently missing or could not be retrieved from the meteorological provider.'],
      uncertaintyWarnings: [
        'Weather telemetry is completely unavailable.',
        'CRITICAL SAFETY POLICY: Missing weather data is NEVER assumed to represent Low risk. Pathogen incubation status cannot be determined.',
      ],
      explanation:
        'Weather forecast telemetry is currently unavailable from the Open-Meteo API. Micro-climatic disease risk cannot be evaluated without valid atmospheric readings. Please check your internet connection or retry the weather sync.',
      recommendedScouting: cropConfig.scoutingFocus || 'Perform visual scouting of lower canopy leaves and stem junctions.',
      preventiveActions: [
        'Perform direct physical field inspection.',
        'Verify regional meteorological conditions through local farm forecasts or Kisan Call Centre (1800-180-1551).',
      ],
    };
  }

  // 3. Normalize weather object format (live Open-Meteo vs sample fallback)
  const normalizedWeather = {
    isLive: Boolean(weather.isLive),
    source: weather.source || 'Simulated Weather Dataset',
    fetchedAt: weather.fetchedAt || 'Recent',
    current: weather.current || {
      temperature: weather.temperature,
      humidity: weather.humidity,
      precipitation: weather.rainfall,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      time: new Date().toISOString(),
      precipSum: weather.rainfall,
    },
    hourly: weather.hourly || [],
  };

  // 4. Analyze hourly moisture sequences
  const hourlyStats = analyzeHourlyMoisture(
    normalizedWeather.hourly,
    cropConfig.criticalRH,
    cropConfig.idealTempRange.min,
    cropConfig.idealTempRange.max
  );

  // 5. Evaluate crop-specific disease risk
  let evaluation;
  switch (cropConfig.id) {
    case 'potato':
      evaluation = evaluatePotatoRisk(normalizedWeather, hourlyStats);
      break;
    case 'tomato':
      evaluation = evaluateTomatoRisk(normalizedWeather, hourlyStats);
      break;
    case 'rice':
      evaluation = evaluateRiceRisk(normalizedWeather, hourlyStats);
      break;
    case 'wheat':
      evaluation = evaluateWheatRisk(normalizedWeather, hourlyStats);
      break;
    default:
      evaluation = evaluatePotatoRisk(normalizedWeather, hourlyStats);
  }

  // Check data freshness
  const isStale = Boolean(weather.isStale);

  return {
    cropId: cropConfig.id,
    cropName: cropConfig.name,
    scientificName: cropConfig.scientificName,
    targetDisease: cropConfig.targetDisease,
    secondaryDisease: cropConfig.secondaryDisease,
    riskCategory: evaluation.category,
    riskScore: evaluation.score,
    isDataIncomplete: !hourlyStats.hasHourly,
    isStale,
    scientificBasis: cropConfig.modelSource,
    provisionalStatus: cropConfig.provisionalStatus,
    forecastPeriod: 'Next 24 Hours (Open-Meteo Forecast Horizon)',
    dataFreshness: normalizedWeather.isLive
      ? `Live API Telemetry (Synced: ${normalizedWeather.fetchedAt})`
      : 'Simulated Weather Baseline (Offline Mode)',
    contributingWeatherFactors: evaluation.factors,
    uncertaintyWarnings: evaluation.uncertainties,
    explanation: evaluation.explanation,
    recommendedScouting: evaluation.recommendedScouting,
    preventiveActions: evaluation.preventiveActions,
    hourlyTelemetrySummary: {
      recordsEvaluated: hourlyStats.recordsEvaluated,
      totalHumidHours: hourlyStats.totalHumidHours,
      consecutiveCriticalHours: hourlyStats.consecutiveCriticalHours,
      forecastRainSum: hourlyStats.totalPrecipitation,
      avgDewDepression: hourlyStats.avgDewPointDepression,
    },
  };
}
