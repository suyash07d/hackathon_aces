// Sample data for Rain Maker prototype
// Clearly labeled simulated datasets for demonstration purposes only.

export const SAMPLE_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'Nashik Valley — Agri Station Alpha',
    state: 'Maharashtra',
    latitude: 19.9975,
    longitude: 73.7898,
    elevation: '584 m',
    soilType: 'Black Clay Loam',
    lastSynced: '10 mins ago (Simulated)',
    weather: {
      temperature: 24.2,
      tempUnit: '°C',
      tempMin: 18.0,
      tempMax: 29.5,
      humidity: 86,
      humidityUnit: '%',
      humidityTrend: '+4% vs yesterday',
      rainfall: 14.2,
      rainfallUnit: 'mm (last 24h)',
      rainfallProbability: '65%',
      windSpeed: 12.4,
      windUnit: 'km/h',
      windDirection: 'SSW',
      leafWetnessHours: 8.5,
      dewPoint: 21.6,
      pressure: 1012,
    },
    crops: {
      potato: {
        riskLevel: 'Medium',
        riskScore: 58,
        diseaseWatch: 'Late Blight (Phytophthora infestans)',
        stage: 'Tuber Initiation (Day 48)',
        microClimaticFactor: 'Relative humidity (>85%) combined with night dew persistence creates moderate spore incubation potential.',
        riskColor: '#d97706',
        riskBg: '#fef3c7',
        riskBorder: '#fde68a',
        vulnerabilities: [
          { name: 'Leaf Wetness Duration', value: '8.5 hrs', threshold: 'Critical > 6 hrs', alert: true },
          { name: 'Mean Canopy Temp', value: '21.4°C', threshold: 'Optimal for Blight: 15-22°C', alert: true },
          { name: 'Spore Spread Index', value: 'Moderate (Sample)', threshold: 'Threshold 60%', alert: false },
        ]
      },
      tomato: {
        riskLevel: 'High',
        riskScore: 82,
        diseaseWatch: 'Early Blight (Alternaria solani) & Septoria Leaf Spot',
        stage: 'Flowering & Fruit Setting',
        microClimaticFactor: 'Warm overcast daytime (26°C) paired with 86% RH significantly increases fungal sporulation risk.',
        riskColor: '#dc2626',
        riskBg: '#fee2e2',
        riskBorder: '#fca5a5',
        vulnerabilities: [
          { name: 'Canopy Humidity', value: '86%', threshold: 'Danger > 80%', alert: true },
          { name: 'Consecutive Wet Hours', value: '9.2 hrs', threshold: 'Threshold > 7 hrs', alert: true },
          { name: 'Lower Canopy Aeration', value: 'Restricted (Dense foliage)', threshold: 'Risk amplifier', alert: true },
        ]
      },
      rice: {
        riskLevel: 'Low',
        riskScore: 32,
        diseaseWatch: 'Rice Blast (Magnaporthe oryzae)',
        stage: 'Active Tillering',
        microClimaticFactor: 'Wind velocity (12 km/h) aids canopy drying; temperature remains above critical blast sporulation sweet spot.',
        riskColor: '#16a34a',
        riskBg: '#dcfce7',
        riskBorder: '#bbf7d0',
        vulnerabilities: [
          { name: 'Leaf Wetness Duration', value: '4.2 hrs', threshold: 'Blast danger > 10 hrs', alert: false },
          { name: 'Night Temperature', value: '19.8°C', threshold: 'Blast optimum 20-24°C', alert: false },
          { name: 'Canopy Nitrogen Status', value: 'Balanced (Sample)', threshold: 'Excess N amplifies', alert: false },
        ]
      },
      wheat: {
        riskLevel: 'Medium',
        riskScore: 48,
        diseaseWatch: 'Yellow / Stripe Rust (Puccinia striiformis)',
        stage: 'Stem Elongation / Flag Leaf',
        microClimaticFactor: 'Morning dew duration and mild daytime conditions warrant routine field scouting.',
        riskColor: '#d97706',
        riskBg: '#fef3c7',
        riskBorder: '#fde68a',
        vulnerabilities: [
          { name: 'Morning Dew Persistence', value: '5.8 hrs', threshold: 'Risk > 4 hrs', alert: true },
          { name: 'Day/Night Temp Spread', value: '11.5°C', threshold: 'Optimal rust window', alert: false },
          { name: 'Wind Spore Vector', value: 'Mild SSW (12 km/h)', threshold: 'Moderate vector', alert: false },
        ]
      }
    }
  },
  {
    id: 'loc-2',
    name: 'Pune Agri-Hub — Block 7',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    elevation: '560 m',
    soilType: 'Medium Black Soil',
    lastSynced: '25 mins ago (Simulated)',
    weather: {
      temperature: 28.5,
      tempUnit: '°C',
      tempMin: 21.2,
      tempMax: 33.0,
      humidity: 62,
      humidityUnit: '%',
      humidityTrend: '-5% vs yesterday',
      rainfall: 0.0,
      rainfallUnit: 'mm (last 24h)',
      rainfallProbability: '15%',
      windSpeed: 16.0,
      windUnit: 'km/h',
      windDirection: 'NW',
      leafWetnessHours: 2.1,
      dewPoint: 17.5,
      pressure: 1010,
    },
    crops: {
      potato: {
        riskLevel: 'Low',
        riskScore: 24,
        diseaseWatch: 'Late Blight',
        stage: 'Vegetative Growth',
        microClimaticFactor: 'Lower humidity (62%) and dry winds keep fungal spores largely dormant.',
        riskColor: '#16a34a',
        riskBg: '#dcfce7',
        riskBorder: '#bbf7d0',
        vulnerabilities: [
          { name: 'Leaf Wetness Duration', value: '2.1 hrs', threshold: 'Critical > 6 hrs', alert: false },
          { name: 'Ambient Humidity', value: '62%', threshold: 'Threshold 75%', alert: false },
        ]
      },
      tomato: {
        riskLevel: 'Medium',
        riskScore: 46,
        diseaseWatch: 'Bacterial Spot / Powdery Mildew',
        stage: 'Vegetative Stage',
        microClimaticFactor: 'Moderate temperatures and lower moisture reduce early blight, but monitor powdery mildew in shaded plots.',
        riskColor: '#d97706',
        riskBg: '#fef3c7',
        riskBorder: '#fde68a',
        vulnerabilities: [
          { name: 'Daytime Temperature', value: '28.5°C', threshold: 'Warm stress potential', alert: false },
          { name: 'Soil Surface Moisture', value: 'Moderate', threshold: 'Standard', alert: false },
        ]
      },
      rice: {
        riskLevel: 'Low',
        riskScore: 18,
        diseaseWatch: 'Sheath Blight',
        stage: 'Seedling / Nursery',
        microClimaticFactor: 'Dry conditions and brisk air circulation minimize disease pressure.',
        riskColor: '#16a34a',
        riskBg: '#dcfce7',
        riskBorder: '#bbf7d0',
        vulnerabilities: [
          { name: 'Humidity', value: '62%', threshold: 'Needs > 85% for infection', alert: false }
        ]
      },
      wheat: {
        riskLevel: 'Low',
        riskScore: 20,
        diseaseWatch: 'Brown Rust',
        stage: 'Tillering',
        microClimaticFactor: 'Favorable sunny weather with minimal dew buildup.',
        riskColor: '#16a34a',
        riskBg: '#dcfce7',
        riskBorder: '#bbf7d0',
        vulnerabilities: [
          { name: 'Dew Hours', value: '1.8 hrs', threshold: 'Safe < 3 hrs', alert: false }
        ]
      }
    }
  },
  {
    id: 'loc-3',
    name: 'Punjab Canals — Ludhiana Sector 3',
    state: 'Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
    elevation: '244 m',
    soilType: 'Alluvial Silt Loam',
    lastSynced: '1 hr ago (Simulated)',
    weather: {
      temperature: 21.0,
      tempUnit: '°C',
      tempMin: 14.5,
      tempMax: 26.2,
      humidity: 92,
      humidityUnit: '%',
      humidityTrend: '+8% vs yesterday',
      rainfall: 28.5,
      rainfallUnit: 'mm (last 24h)',
      rainfallProbability: '80%',
      windSpeed: 8.5,
      windUnit: 'km/h',
      windDirection: 'NE',
      leafWetnessHours: 11.2,
      dewPoint: 19.4,
      pressure: 1014,
    },
    crops: {
      potato: {
        riskLevel: 'High',
        riskScore: 88,
        diseaseWatch: 'Late Blight (Epidemic Watch - Sample)',
        stage: 'Full Canopy Closure',
        microClimaticFactor: 'Very high humidity (92%) and 11+ hours of canopy wetness constitute high-risk micro-climatic late blight conditions.',
        riskColor: '#dc2626',
        riskBg: '#fee2e2',
        riskBorder: '#fca5a5',
        vulnerabilities: [
          { name: 'Leaf Wetness', value: '11.2 hrs', threshold: 'High Risk > 8 hrs', alert: true },
          { name: 'Canopy RH', value: '92%', threshold: 'Severe > 90%', alert: true },
        ]
      },
      tomato: {
        riskLevel: 'High',
        riskScore: 85,
        diseaseWatch: 'Late Blight & Buck Eye Rot',
        stage: 'Fruit Formation',
        microClimaticFactor: 'Standing moisture and prolonged cloudy spell create ideal pathogen infection cycles.',
        riskColor: '#dc2626',
        riskBg: '#fee2e2',
        riskBorder: '#fca5a5',
        vulnerabilities: [
          { name: 'Standing Moisture', value: 'Elevated', threshold: 'High Rot Hazard', alert: true }
        ]
      },
      rice: {
        riskLevel: 'Medium',
        riskScore: 55,
        diseaseWatch: 'Bacterial Leaf Blight',
        stage: 'Booting Stage',
        microClimaticFactor: 'Continuous rain splashes can disperse bacterial inoculum between adjacent rows.',
        riskColor: '#d97706',
        riskBg: '#fef3c7',
        riskBorder: '#fde68a',
        vulnerabilities: [
          { name: 'Rain Splash Vector', value: 'Active', threshold: 'Dispersal Risk', alert: true }
        ]
      },
      wheat: {
        riskLevel: 'High',
        riskScore: 76,
        diseaseWatch: 'Stripe Rust & Powdery Mildew',
        stage: 'Grain Filling',
        microClimaticFactor: 'Cool, damp micro-climate inside dense crop canopies accelerates yellow stripe pustule formation.',
        riskColor: '#dc2626',
        riskBg: '#fee2e2',
        riskBorder: '#fca5a5',
        vulnerabilities: [
          { name: 'Cool/Humid Concurrency', value: 'High', threshold: 'Stripe Rust Factor', alert: true }
        ]
      }
    }
  }
];

export const SAMPLE_CROPS = [
  {
    id: 'potato',
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    icon: '🥔',
    season: 'Rabi / Spring',
    primaryThreat: 'Late Blight & Early Blight',
    idealTemp: '16°C – 22°C',
    criticalRH: '> 80%',
    scoutingFocus: 'Lower leaf undersides and stem junctions for dark, water-soaked patches.'
  },
  {
    id: 'tomato',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    icon: '🍅',
    season: 'Year-round',
    primaryThreat: 'Early Blight, Septoria & Anthracnose',
    idealTemp: '20°C – 28°C',
    criticalRH: '> 75%',
    scoutingFocus: 'Target concentric target-board rings on older basal foliage.'
  },
  {
    id: 'rice',
    name: 'Rice (Paddy)',
    scientificName: 'Oryza sativa',
    icon: '🌾',
    season: 'Kharif / Monsoon',
    primaryThreat: 'Blast, Brown Spot & Sheath Blight',
    idealTemp: '22°C – 32°C',
    criticalRH: '> 85%',
    scoutingFocus: 'Diamond or spindle-shaped lesions with gray/whitish centers on leaves.'
  },
  {
    id: 'wheat',
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    icon: '🌱',
    season: 'Rabi / Winter',
    primaryThreat: 'Yellow (Stripe) Rust, Brown Rust & Karnal Bunt',
    idealTemp: '15°C – 24°C',
    criticalRH: '> 70%',
    scoutingFocus: 'Bright yellow powdery stripes parallel to leaf veins.'
  }
];

export const SAMPLE_ADVISORIES = [
  {
    id: 'adv-1',
    category: 'Immediate Field Action',
    badge: 'High Priority (Sample)',
    badgeColor: 'amber',
    icon: '🚨',
    title: 'Canopy Inspection in Low-Lying Plots',
    description: 'Walk diagonally across the field during early morning. Inspect lower leaf canopies in depressions where water and humidity linger.',
    applicableCrops: ['Potato', 'Tomato'],
    recommendation: 'Check undersides of leaves for faint white fungal sporulation ring before morning dew evaporates.'
  },
  {
    id: 'adv-2',
    category: 'Preventive Water & Humidity Management',
    badge: 'Cultural Practice (Sample)',
    badgeColor: 'blue',
    icon: '💧',
    title: 'Irrigation Timing & Drainage Adjustment',
    description: 'Avoid late afternoon or evening overhead irrigation which prolongs leaf wetness hours through the night.',
    applicableCrops: ['Potato', 'Tomato', 'Wheat'],
    recommendation: 'Switch to early morning furrow or drip irrigation. Clear furrow ends to prevent waterlogging.'
  },
  {
    id: 'adv-3',
    category: 'Agronomic Preventive Spray Window',
    badge: 'Weather Window (Sample)',
    badgeColor: 'green',
    icon: '🛡️',
    title: 'Optimal Preventive Bio-Control Spray Window',
    description: 'Current sample wind speeds (under 15 km/h) and overcast forecast suggest a suitable morning window for approved organic or preventive protective contact sprays.',
    applicableCrops: ['Potato', 'Tomato', 'Rice', 'Wheat'],
    recommendation: 'Ensure thorough coverage on lower leaf undersides. Re-evaluate if precipitation exceeds 10mm.'
  },
  {
    id: 'adv-4',
    category: 'Sanitation & Hygiene',
    badge: 'Routine Maintenance (Sample)',
    badgeColor: 'slate',
    icon: '✂️',
    title: 'Physical Rogueing of Severely Infected Plants',
    description: 'Carefully excise and bag early isolated infected foliage rather than composting nearby, preventing secondary aerial spore dispersal.',
    applicableCrops: ['Potato', 'Tomato'],
    recommendation: 'Sanitize pruning shears with 70% alcohol solution between distinct field blocks.'
  }
];
