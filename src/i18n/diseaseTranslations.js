/**
 * Disease & Phytopathology Multilingual Knowledge Translation Engine
 * Translates candidate disease names, pathogen types, descriptions, and abiotic mimics.
 * Preserves scientific pathogen names in Latin italics/parentheses.
 * Provides clear fallbacks when translations are not found.
 */

export const DISEASE_DICTIONARY = {
  // Late Blight
  'late blight': {
    en: 'Late Blight',
    mr: 'लेट ब्लाइट / उशिरा येणारा करपा',
    hi: 'लेट ब्लाइट / पिछेती झुलसा',
    scientific: 'Phytophthora infestans',
    description: {
      en: 'Causes large, dark, water-soaked lesions that spread rapidly in cool, humid weather with white sporulation on leaf undersides.',
      mr: 'थंड आणि दमट हवामानात पानांवर वेगाने पसरणारे काळपट भिजलेले चट्टे तयार करतो; पानांच्या खाली पांढरी बुरशी येते.',
      hi: 'ठंडे और नम मौसम में पत्तियों पर तेजी से फैलने वाले काले-भूरे भीगे धब्बे बनाता है; पत्तियों के नीचे सफेद फफूंद दिखती है.',
    },
  },

  // Early Blight
  'early blight': {
    en: 'Early Blight',
    mr: 'अर्ली ब्लाइट / लवकर येणारा करपा',
    hi: 'अर्ली ब्लाइट / अगेती झुलसा',
    scientific: 'Alternaria solani',
    description: {
      en: 'Produces dry, dark brown circular spots with concentric target-board rings, primarily on mature lower foliage.',
      mr: 'जुन्या खालच्या पानांवर लाकडाच्या चकतीसारखे गोलाकार तपकिरी रिंग असलेले सुके डाग निर्माण करतो.',
      hi: 'निचली पुरानी पत्तियों पर गहरे कत्थई रंग के छल्लेदार गोल सूखे धब्बे पैदा करता है.',
    },
  },

  // Bacterial Wilt
  'bacterial wilt': {
    en: 'Bacterial Wilt / Brown Rot',
    mr: 'जिवाणूजन्य मर / तपकिरी कुज',
    hi: 'जीवाणु उकठा / भूरा विगलन',
    scientific: 'Ralstonia solanacearum',
    description: {
      en: 'Causes rapid daytime foliage wilting despite moist soil and vascular browning in stems.',
      mr: 'जमिनीत ओलावा असतानाही दुपारच्या वेळी झाडाची पाने वेगाने कोमेजतात आणि खोडातील शिरा तपकिरी होतात.',
      hi: 'मिट्टी में पर्याप्त नमी के बावजूद पौधे तेजी से मुरझाते हैं और तने के भीतर भूरापन आता है.',
    },
  },

  // Septoria Leaf Spot
  'septoria leaf spot': {
    en: 'Septoria Leaf Spot',
    mr: 'सेप्टोरिया पानावरील ठिपके',
    hi: 'सेप्टोरिया पत्ती धब्बा रोग',
    scientific: 'Septoria lycopersici',
    description: {
      en: 'Forms numerous small circular spots with grey centers and dark margins on lower canopy foliage.',
      mr: 'खालच्या पानांवर राखाडी केंद्र आणि गडद कडा असलेले असंख्य लहान गोलाकार डाग तयार करतो.',
      hi: 'निचली पत्तियों पर धूसर केंद्र और गहरे किनारे वाले कई छोटे गोल धब्बे बनाता है.',
    },
  },

  // Blossom End Rot
  'blossom end rot': {
    en: 'Blossom End Rot',
    mr: 'ब्लॉसम एंड रॉट (कॅल्शियम कमतरता)',
    hi: 'ब्लॉसम एंड रॉट (कैल्शियम कमी विकार)',
    scientific: 'Physiological Calcium Deficiency',
    description: {
      en: 'Physiological disorder caused by calcium deficiency and fluctuating soil moisture, not a fungal infection.',
      mr: 'कॅल्शियमची कमतरता आणि सिंचनातील चढ-उतार यांमुळे होणारा शारीरिक विकार; ही बुरशी नाही.',
      hi: 'कैल्शियम की कमी और सिंचाई में उतार-चढ़ाव से होने वाला दैहिक विकार; यह कोई फफूंद नहीं है.',
    },
  },

  // Rice Blast
  'rice blast': {
    en: 'Rice Blast',
    mr: 'भातावरील करपा (राईस ब्लास्ट)',
    hi: 'धान का झुलसा रोग / ब्लास्ट',
    scientific: 'Magnaporthe oryzae',
    description: {
      en: 'Forms diamond or spindle-shaped lesions with ash-grey centers and brown borders on leaves.',
      mr: 'पानांवर राखाडी केंद्र आणि तपकिरी कडा असलेले बदामी किंवा सुईच्या आकाराचे चट्टे तयार करतो.',
      hi: 'पत्तियों पर राख जैसे केंद्र और कत्थई किनारे वाले नुकीले (स्पिंडल) आकार के धब्बे बनाता है.',
    },
  },

  // Brown Spot Rice
  'brown spot': {
    en: 'Brown Spot',
    mr: 'भातावरील तपकिरी ठिपके',
    hi: 'धान का भूरा धब्बा रोग',
    scientific: 'Bipolaris oryzae',
    description: {
      en: 'Circular to oval brown lesions on leaf blades, commonly associated with nutrient-deficient soil.',
      mr: 'पानांवर गोलाकार ते लंबगोलाकार तपकिरी डाग, सामान्यतः पोषक घटकांची कमतरता असलेल्या जमिनीत आढळतात.',
      hi: 'पत्तियों पर गोल से अंडाकार कत्थई धब्बे, आमतौर पर पोषक तत्वों की कमी वाली मिट्टी में देखे जाते हैं.',
    },
  },

  // Bacterial Leaf Blight
  'bacterial leaf blight': {
    en: 'Bacterial Leaf Blight',
    mr: 'जिवाणूजन्य पानांवरील करपा',
    hi: 'जीवाणु पत्ती झुलसा',
    scientific: 'Xanthomonas oryzae',
    description: {
      en: 'Causes water-soaked yellowing stripes along leaf margins with wavy borders that dry into straw color.',
      mr: 'पानांच्या कडांवर पिवळसर-करडे लांबट पट्टे तयार करतो, जे सुकल्यावर पेंढ्यासारखे दिसतात.',
      hi: 'पत्तियों के किनारों पर लहरदार पानी जैसे भीगे पीले पट्टे बनाता है जो सूखकर भूसे जैसे हो जाते हैं.',
    },
  },

  // Yellow / Stripe Rust
  'yellow / stripe rust': {
    en: 'Yellow / Stripe Rust',
    mr: 'पिवळा तांबेरा (स्ट्राइप रस्ट)',
    hi: 'पीला रतुआ / स्ट्राइप रस्ट',
    scientific: 'Puccinia striiformis',
    description: {
      en: 'Forms bright yellow-orange pustule stripes parallel to leaf veins that rub off onto fingers as powdery dust.',
      mr: 'पानांच्या शिरांना समांतर पिवळसर-केशरी पट्ट्यांमध्ये बुरशीचे ठिपके येतात जे बोटांना पिवळी पावडर म्हणून लागतात.',
      hi: 'पत्तियों की नसों के समानांतर चमकीले पीले-नारंगी पट्टे बनते हैं जो छूने पर पीले पाउडर की तरह लगते हैं.',
    },
  },

  // Brown / Leaf Rust
  'brown / leaf rust': {
    en: 'Brown / Leaf Rust',
    mr: 'तपकिरी तांबेरा (लीफ रस्ट)',
    hi: 'भूरा रतुआ / पत्ती रतुआ',
    scientific: 'Puccinia triticina',
    description: {
      en: 'Scattered small round to oval orange-brown pustules on upper leaf surface.',
      mr: 'पानाच्या वरच्या बाजूवर विखुरलेले लहान गोलाकार नारंगी-तपकिरी रंगाचे पुटकुळ्यांसारखे डाग.',
      hi: 'पत्तियों की ऊपरी सतह पर बिखरे हुए छोटे गोल से अंडाकार नारंगी-कत्थई दानेदार धब्बे.',
    },
  },

  // Powdery Mildew
  'powdery mildew': {
    en: 'Powdery Mildew',
    mr: 'गव्हावरील भुरी रोग (पावडरी मिल्ड्यू)',
    hi: 'चूर्णिल आसिता / पाउडरी मिल्ड्यू',
    scientific: 'Blumeria graminis',
    description: {
      en: 'White to light grey powdery fungal patches on lower leaves and stems that turn dull grey with age.',
      mr: 'पानांवर आणि खोडावर पांढऱ्या ते हलक्या राखाडी रंगाचे पावडरीसारखे चट्टे, जे नंतर राखाडी होतात.',
      hi: 'निचली पत्तियों और तनों पर सफेद से हल्के धूसर रंग के आटे जैसे चूर्णिल धब्बे.',
    },
  },
};

/**
 * Pathogen classification translations
 */
export const PATHOGEN_TYPE_TRANSLATIONS = {
  'Oomycete / Water Mold': {
    en: 'Oomycete / Water Mold',
    mr: 'बुरशीसदृश सूक्ष्मजीव (Oomycete)',
    hi: 'जल फफूंद (Oomycete)',
  },
  'Fungus': {
    en: 'Fungus',
    mr: 'बुरशीजन्य रोगकारक',
    hi: 'फफूंद रोगकारक',
  },
  'Bacterium': {
    en: 'Bacterium',
    mr: 'जिवाणूजन्य रोगकारक',
    hi: 'जीवाणु रोगकारक',
  },
  'Physiological Disorder': {
    en: 'Physiological Disorder',
    mr: 'शरीरक्रियात्मक विकार / पोषण कमतरता',
    hi: 'दैहिक विकार / पोषण की कमी',
  },
};

/**
 * Finds matching localized disease information from raw name.
 * Handles strings like "Late Blight (Phytophthora infestans)" or "Late Blight".
 * Preserves scientific pathogen name.
 */
export function getLocalizedDisease(rawName, language = 'en') {
  if (!rawName || typeof rawName !== 'string') {
    return {
      displayName: rawName || '',
      scientificName: '',
      description: '',
      isTranslated: false,
    };
  }

  // Extract scientific name in parentheses if present
  let scientificName = '';
  let commonName = rawName.trim();

  const parenMatch = rawName.match(/\(([^)]+)\)/);
  if (parenMatch) {
    scientificName = parenMatch[1].trim();
    commonName = rawName.replace(/\([^)]+\)/, '').trim();
  }

  // Lookup in dictionary
  const key = commonName.toLowerCase();
  let found = null;

  for (const [dictKey, data] of Object.entries(DISEASE_DICTIONARY)) {
    if (key.includes(dictKey) || dictKey.includes(key)) {
      found = data;
      break;
    }
  }

  if (found) {
    const localizedName = found[language] || found.en || commonName;
    const resolvedScientific = scientificName || found.scientific || '';
    const localizedDesc = found.description?.[language] || found.description?.en || '';

    const displayName = resolvedScientific
      ? `${localizedName} (${resolvedScientific})`
      : localizedName;

    return {
      displayName,
      localizedName,
      scientificName: resolvedScientific,
      description: localizedDesc,
      isTranslated: Boolean(found[language]),
    };
  }

  // Fallback if not found: preserve raw name
  return {
    displayName: rawName,
    localizedName: commonName,
    scientificName,
    description: '',
    isTranslated: false,
  };
}

/**
 * Translates pathogen type safely with fallback
 */
export function getLocalizedPathogen(rawPathogen, language = 'en') {
  if (!rawPathogen) return '';
  const match = PATHOGEN_TYPE_TRANSLATIONS[rawPathogen];
  if (match && match[language]) {
    return match[language];
  }
  return rawPathogen;
}

/**
 * Translates common abiotic/alternative explanations
 */
export const ALTERNATIVE_EXPLANATIONS_TRANSLATIONS = {
  mr: [
    'पानावरील दृश्य लक्षणे नायट्रोजन किंवा मॅग्नेशियमच्या कमतरतेसारख्या अजैविक विकारांसारखी दिसू शकतात.',
    'सुरुवातीच्या संसर्ग काळात जिवाणू आणि बुरशीच्या डागांचे स्वरूप एकमेकांशी मिळतेजुळते असू शकते.',
    'उन्हाचा चटका, खतांचे दुष्परिणाम किंवा सूक्ष्म किडींमुळेही पानाच्या कडा जळू शकतात.',
  ],
  hi: [
    'पत्तियों के लक्षण नाइट्रोजन या मैग्नीशियम की कमी जैसे अजैविक विकारों से मिलते-जुलते हो सकते हैं.',
    'शुरुआती संक्रमण चरण में जीवाणु और फफूंद के घाव एक जैसे दिखाई दे सकते हैं.',
    'धूप का तेज प्रभाव, उर्वरक के अत्यधिक छिड़काव या कीटों के कारण भी पत्ती सूख सकती है.',
  ],
  en: [
    'Visual foliar symptoms can closely mimic abiotic physiological disorders, including nitrogen chlorosis or magnesium deficiency.',
    'Bacterial and fungal necrotic lesions can have overlapping appearances during initial infection phases.',
    'Sun scorch, chemical fertilizer burn, or micro-pest damage can also cause foliar margin browning.',
  ],
};
