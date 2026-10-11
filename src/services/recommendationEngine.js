/**
 * Rain Maker - Dynamic Farmer Recommendation Engine
 *
 * Generates tailored, case-specific, safe cultural practices, field inspection
 * checkpoints, and escalation triggers based on:
 * 1. Validated candidate disease & pathogen type (Oomycete, Fungus, Bacterium, Abiotic)
 * 2. Observed foliar symptoms & visual features
 * 3. Live regional weather telemetry (temperature, relative humidity, rainfall)
 * 4. Specific crop type (Potato, Tomato, Rice, Wheat)
 *
 * Safety Mandate:
 * - NEVER prescribes chemical pesticide dosages or unregistered synthetic brand names.
 * - Explains WHY each cultural practice applies and WHAT TO AVOID.
 * - Provides targeted plant part checkpoints to distinguish leading candidates.
 * - Outlines case-specific escalation triggers and KVK referral instructions.
 */

export function generateCropRecommendations({
  _cropId = 'potato',
  candidate = null,
  candidates = [],
  symptoms = [],
  weather = null,
  isHealthy = false,
  isSuitableSpecimen = true,
  isPlantCrop = true,
  language = 'en',
}) {
  if (!isPlantCrop || !isSuitableSpecimen) {
    return {
      whatYouCanDoNow: [],
      whatToCheckNext: [],
      whenToGetHelp: {
        triggers: [],
        referralGuidance: language === 'mr' 
          ? 'अयोग्य किंवा इतर छायाचित्रांवर रोग विश्लेषण केले जात नाही. कृपया शेतातील जिवंत पानांचे स्पष्ट छायाचित्र काढा.'
          : language === 'hi'
          ? 'गैर-फसल या अन्य तस्वीरों पर रोग विश्लेषण नहीं किया जा सकता। कृपया खेत में जीवित पत्ती का स्पष्ट फोटो लें।'
          : 'Analysis cannot be performed on non-plant or unsuitable photos. Please take a clear photo of living crop leaves in your field.',
        helpline: '1800-180-1551',
      },
    };
  }

  // Weather context
  const currentHumidity = weather?.current?.relative_humidity_2m ?? weather?.relativeHumidity ?? 65;
  const currentTemp = weather?.current?.temperature_2m ?? weather?.temperature ?? 22;
  const isHumid = currentHumidity > 75;
  const isWarm = currentTemp > 24;

  // Pathogen classification
  const topCandidate = candidate || (candidates && candidates.length > 0 ? candidates[0] : null);
  const pathogenType = (topCandidate?.pathogen || topCandidate?.pathogenType || '').toLowerCase();
  const isLateBlight = topCandidate?.name?.toLowerCase().includes('late blight');
  const isEarlyBlight = topCandidate?.name?.toLowerCase().includes('early blight');
  const isBacterialWilt = topCandidate?.name?.toLowerCase().includes('bacterial') || pathogenType.includes('bacteri');
  const isPowderyMildew = topCandidate?.name?.toLowerCase().includes('powdery') || symptoms.includes('white_powder');
  const isRust = topCandidate?.name?.toLowerCase().includes('rust');
  const isChewingDamage = symptoms.includes('leaf_damage');
  const isPureChlorosis = symptoms.includes('yellowing') && !symptoms.includes('brown_spots') && !symptoms.includes('water_soaked');

  // -------------------------------------------------------------------------
  // 1. WHAT YOU CAN DO NOW (Dynamic Cultural Interventions)
  // -------------------------------------------------------------------------
  const whatYouCanDoNow = [];

  if (isHealthy) {
    whatYouCanDoNow.push({
      id: 'healthy-monitoring',
      category: language === 'mr' ? 'नियमित निरीक्षण' : language === 'hi' ? 'नियमित निगरानी' : 'Canopy Monitoring',
      icon: '🌿',
      urgency: 'Routine',
      action: language === 'mr' 
        ? 'पिकांची नियमित पाहणी चालू ठेवा; दर ३-४ दिवसांनी शेतात वेगवेगळ्या ठिकाणच्या १० झाडांची तपासणी करा.'
        : language === 'hi'
        ? 'नियमित फसल निगरानी जारी रखें; हर ३-४ दिन में खेत में अलग-अलग जगहों पर १० पौधों की जांच करें।'
        : 'Continue routine scouting: inspect 10 random plants across your field every 3–4 days.',
      rationale: language === 'mr'
        ? 'सध्या पिकावर रोगाची कोणतीही सक्रिय लक्षणे आढळलेली नाहीत. नियमित पाहणीमुळे संभाव्य रोगाचा प्रादुर्भाव सुरुवातीलाच ओळखता येतो.'
        : language === 'hi'
        ? 'वर्तमान में कोई सक्रिय रोग लक्षण नहीं पाए गए हैं। नियमित जांच से किसी भी प्रारंभिक संक्रमण को समय पर पकड़ा जा सकता है।'
        : 'No active pathogen lesions were detected. Routine scouting catches early spore arrivals before widespread field infection.',
      whatToAvoid: language === 'mr'
        ? 'निरोगी पिकांवर अनावश्यक रासायनिक बुरशीनाशकांची फवारणी करू नका.'
        : language === 'hi'
        ? 'स्वस्थ पत्तियों पर अनावश्यक रासायनिक कवकनाशी या कीटनाशक का छिड़काव न करें।'
        : 'Do NOT apply chemical fungicides or pesticides to visibly healthy foliage.',
    });

    whatYouCanDoNow.push({
      id: 'healthy-irrigation',
      category: language === 'mr' ? 'पाणी व्यवस्थापन' : language === 'hi' ? 'सिंचाई प्रबंधन' : 'Irrigation Hygiene',
      icon: '💧',
      urgency: 'Routine',
      action: language === 'mr'
        ? 'सकाळच्या वेळी जमिनीलगत पाणी द्या, जेणेकरून दुपारपर्यंत जमिनीवरील अतिरिक्त ओलावा वाळून जाईल.'
        : language === 'hi'
        ? 'सुबह के समय जड़ क्षेत्र में सिंचाई करें ताकि दोपहर तक मिट्टी की अतिरिक्त नमी सूख जाए।'
        : 'Irrigate early in the morning at the root zone so excess surface moisture dries before nightfall.',
      rationale: language === 'mr'
        ? 'रात्रीच्या वेळी पानांवर जास्त वेळ ओलावा राहिल्यास हवेतील बुरशीचे बीजाणू रुजण्यास पोषक वातावरण तयार होते.'
        : language === 'hi'
        ? 'रात भर पत्तियों पर नमी रहने से फंगल बीजाणुओं के अंकुरण का खतरा बढ़ जाता है।'
        : 'Leaves remaining wet through cool nights create the primary incubation trigger for airborne fungal spores.',
      whatToAvoid: language === 'mr'
        ? 'संध्याकाळी उशिरा तुषार (स्प्रिंकलर) सिंचन करणे टाळा.'
        : language === 'hi'
        ? 'देर शाम स्प्रिंकलर से पानी देने से बचें।'
        : 'Do NOT run overhead sprinklers in late afternoon or evening.',
    });
  } else if (isLateBlight || (pathogenType.includes('oomycete') && symptoms.includes('water_soaked'))) {
    whatYouCanDoNow.push({
      id: 'late-blight-irrigation',
      category: language === 'mr' ? 'पाणी व्यवस्थापन' : language === 'hi' ? 'सिंचाई प्रबंधन' : 'Water Management',
      icon: '💧',
      urgency: 'Immediate',
      action: language === 'mr'
        ? 'तुषार (स्प्रिंकलर) सिंचन तात्काळ बंद करा. केवळ सकाळी ठिबक किंवा पाटपाणी द्या.'
        : language === 'hi'
        ? 'स्प्रिंकलर से पानी देना तुरंत रोकें। केवल सुबह के समय ड्रिप या नाली से सिंचाई करें।'
        : 'Halt all overhead sprinkler irrigation immediately. Switch to early-morning drip or furrow irrigation.',
      rationale: language === 'mr'
        ? 'करपा रोगाचे (फायटोप्थोरा) बीजाणू पानांवरील पाण्याच्या थेंबांमधून पोहून नवीन पानांमध्ये प्रवेश करतात.'
        : language === 'hi'
        ? 'लेट ब्लाइट (फाइटोफ्थोरा) के बीजाणु पानी की बूंदों के माध्यम से तैरकर स्वस्थ पत्तियों को संक्रमित करते हैं।'
        : 'Phytophthora zoospores swim through water films on leaves. Eliminating foliar wetness halts spore movement and infection.',
      whatToAvoid: language === 'mr'
        ? 'दुपारी किंवा संध्याकाळी सिंचन करू नका, आणि शेतातील चारींमध्ये पाणी साचू देऊ नका.'
        : language === 'hi'
        ? 'देर दोपहर सिंचाई न करें और खेत में पानी का जमाव न होने दें।'
        : 'Do NOT irrigate late in the day. Do NOT leave standing water in furrows.',
    });

    whatYouCanDoNow.push({
      id: 'late-blight-sanitation',
      category: language === 'mr' ? 'रोगट पाने छाटणी' : language === 'hi' ? 'संक्रमित पत्तियों की छंटाई' : 'Canopy Sanitation',
      icon: '✂️',
      urgency: 'Immediate',
      action: language === 'mr'
        ? 'दुपारी ऊन असताना खालील रोगट पाने काळजीपूर्वक कापून पिशवीत भरा व शेताबाहेर नेऊन नष्ट करा.'
        : language === 'hi'
        ? 'दोपहर के समय जब पत्तियां सूखी हों, रोगग्रस्त निचली पत्तियों को सावधानी से काटकर नष्ट करें।'
        : 'Prune severely blighted lower leaves during dry midday hours; seal them in bags and remove from the field.',
      rationale: language === 'mr'
        ? 'जमिनीजवळील पानांवर सर्वात जास्त दमटपणा असतो व तेथूनच रोगाचा प्रसार वरच्या पानांवर होतो.'
        : language === 'hi'
        ? 'निचली पत्तियां जमीन की नमी के संपर्क में रहती हैं और संक्रमण का मुख्य केंद्र बनती हैं।'
        : 'Lower leaves touching damp soil maintain 90%+ relative humidity, acting as spore multiplication zones.',
      whatToAvoid: language === 'mr'
        ? 'सकाळी दव असताना पाने कापू नका (ओल्या हातांनी रोग इतर झाडांना पसरतो). कापलेली पाने शेतात किंवा खतखड्ड्यात टाकू नका.'
        : language === 'hi'
        ? 'सुबह ओस में छंटाई न करें (गीले हाथों से संक्रमण फैलता है)। पत्तियों को खेत या खाद के गड्ढे में न छोड़ें।'
        : 'Do NOT prune while leaves are wet with morning dew. Do NOT discard blighted leaves in furrows or compost.',
    });

    whatYouCanDoNow.push({
      id: 'late-blight-aeration',
      category: language === 'mr' ? 'हवा खेळती ठेवणे' : language === 'hi' ? 'हवादार कैनोपी' : 'Canopy Aeration',
      icon: '🌬️',
      urgency: 'Important',
      action: language === 'mr'
        ? 'झाडांमधील तण काढून टाका आणि वाफ्यांमध्ये हवा खेळती राहील याची काळजी घ्या.'
        : language === 'hi'
        ? 'पंक्तियों के बीच से खरपतवार हटाएं ताकि फसल के बीच हवा का आवागमन सुचारू रहे।'
        : 'Thoroughly weed along crop ridges and stake heavy vines to increase airflow through the canopy.',
      rationale: language === 'mr'
        ? 'हवा खेळती राहिल्याने पानांवरील दव लवकर वाळते आणि बुरशीची वाढ रोखली जाते.'
        : language === 'hi'
        ? 'अच्छी हवा से पत्तियों पर ओस जल्दी सूखती है और फंगल विकास रुकता है।'
        : 'Adequate ventilation reduces leaf boundary layer humidity below the 85% threshold required for sporulation.',
      whatToAvoid: language === 'mr'
        ? 'जास्त प्रमाणात युरिया/नायट्रोजन खते देणे टाळा, यामुळे पाने जास्त मऊ व रोगास बळी पडतात.'
        : language === 'hi'
        ? 'अतिरिक्त नाइट्रोजन खाद न डालें, जिससे पत्तियां कोमल होकर रोग के प्रति अधिक संवेदनशील हो जाती हैं।'
        : 'Do NOT apply heavy nitrogen fertilizer top-dressing during blight conditions.',
    });
  } else if (isEarlyBlight || (pathogenType.includes('fung') && symptoms.includes('brown_spots'))) {
    whatYouCanDoNow.push({
      id: 'early-blight-sanitation',
      category: language === 'mr' ? 'जुनी पाने काढणे' : language === 'hi' ? 'पुरानी पत्तियां हटाना' : 'Debris Sanitation',
      icon: '✂️',
      urgency: 'Immediate',
      action: language === 'mr'
        ? 'ज्या जुन्या पानांवर गोलाकार तपकिरी ठिपके आहेत ती पाने छाटून शेताबाहेर खड्ड्यात गाडून टाका.'
        : language === 'hi'
        ? 'जिन पुरानी निचली पत्तियों पर गोल भूरे छल्लेदार धब्बे हैं, उन्हें हटाकर खेत से दूर दबा दें।'
        : 'Prune mature lower leaves displaying concentric target spots and dispose of them outside the field perimeter.',
      rationale: language === 'mr'
        ? 'अल्टरनेरिया बुरशी प्रामुख्याने जुन्या पानांवर वाढते आणि तेथून हवेच्या झोताने वरच्या पानांवर उडते.'
        : language === 'hi'
        ? 'अल्टरनेरिया कवक मुख्य रूप से निचली पुरानी पत्तियों में पनपता है और हवा से ऊपर फैलता है।'
        : 'Alternaria sporulates heavily on senescing lower leaves; removing them removes the primary spore inoculum.',
      whatToAvoid: language === 'mr'
        ? 'पाने तोडून शेताच्या बांधावर किंवा पाण्याच्या चारीत टाकू नका.'
        : language === 'hi'
        ? 'कटी हुई पत्तियों को खेत की मेड़ या नालियों में न फेंकें।'
        : 'Do NOT drop trimmed diseased leaves onto soil beds or mulch.',
    });

    whatYouCanDoNow.push({
      id: 'early-blight-irrigation',
      category: language === 'mr' ? 'सिंचन शिस्त' : language === 'hi' ? 'सिंचाई समय' : 'Irrigation Timing',
      icon: '💧',
      urgency: 'Important',
      action: language === 'mr'
        ? 'पाणी देताना पानांवर मातीचे शिंतोडे उडणार नाहीत याची काळजी घ्या; सकाळी पाणी द्या.'
        : language === 'hi'
        ? 'पानी देते समय मिट्टी के छींटे पत्तियों पर न पड़ने दें; सुबह के समय सिंचाई करें।'
        : 'Irrigate to avoid water splashing soil onto lower foliage; prefer morning furrow runs.',
      rationale: language === 'mr'
        ? 'मातीत सुप्त असणारे बुरशीचे बीजाणू पाण्याच्या शिंतोड्यांसोबत पानांवर उडून रोगाचा फैलाव करतात.'
        : language === 'hi'
        ? 'मिट्टी में मौजूद बीजाणु पानी के छींटों के साथ पत्तियों पर चिपककर नया संक्रमण शुरू करते हैं।'
        : 'Rain and sprinkler splashes transfer soil-borne Alternaria conidia directly onto lower leaves.',
      whatToAvoid: language === 'mr'
        ? 'दुपारच्या कडक उन्हात किंवा संध्याकाळी पाने ओली होतील असे पाणी देऊ नका.'
        : language === 'hi'
        ? 'शाम को पत्तियों को गीला करने वाली सिंचाई न करें।'
        : 'Do NOT apply irrigation late in the evening.',
    });
  } else if (isBacterialWilt) {
    whatYouCanDoNow.push({
      id: 'bacterial-rogue',
      category: language === 'mr' ? 'रोगट झाडे उपटणे' : language === 'hi' ? 'संक्रमित पौधे उखाड़ना' : 'Plant Isolation',
      icon: '⚠️',
      urgency: 'Immediate',
      action: language === 'mr'
        ? 'कोमेजलेली झाडे मुळांसह आणि आजूबाजूच्या मातीसह उपटून शेताबाहेर नष्ट करा.'
        : language === 'hi'
        ? 'मुरझाए हुए पौधों को जड़ों और आस-पास की मिट्टी सहित उखाड़कर खेत से बाहर नष्ट करें।'
        : 'Rogue (uproot) severely wilted plants with their root balls and dispose of them outside the farm.',
      rationale: language === 'mr'
        ? 'जिवाणू झाडाच्या रक्तवाहिन्यांमध्ये (झायलेम) असतात. केवळ पाने कापून हा रोग थांबत नाही.'
        : language === 'hi'
        ? 'जीवाणु पौधे की संवहनी नलिकाओं में होते हैं। केवल पत्तियां काटने से यह रोग ठीक नहीं होता।'
        : 'Ralstonia bacteria colonize vascular xylem bundles and soil; leaf pruning cannot cure systemic vascular wilts.',
      whatToAvoid: language === 'mr'
        ? 'कोमेजलेल्या झाडांची पाने कापू नका व त्याच कात्रीने निरोगी झाडे कापू नका! एका ओळीतून दुसऱ्या ओळीत वाहणारे पाणी टाळा.'
        : language === 'hi'
        ? 'मुरझाए पौधे काटकर वही औजार स्वस्थ पौधों पर इस्तेमाल न करें। नालियों के बहाव से पानी स्वस्थ पौधों तक न जाने दें।'
        : 'Do NOT prune wilted leaves and reuse tools on healthy plants. Do NOT allow furrow runoff to flow into healthy rows.',
    });

    whatYouCanDoNow.push({
      id: 'bacterial-hygiene',
      category: language === 'mr' ? 'औजारे निर्जंतुकीकरण' : language === 'hi' ? 'औजारों की सफाई' : 'Tool Sanitation',
      icon: '🧼',
      urgency: 'Immediate',
      action: language === 'mr'
        ? 'खुरपी, विळा आणि हात साबणाच्या पाण्याने किंवा सॅनिटायझरने स्वच्छ धुवा.'
        : language === 'hi'
        ? 'खुरपी, हसिया और हाथों को साबुन के पानी या सैनिटाइज़र से अच्छी तरह साफ करें।'
        : 'Disinfect farm tools and sickles with 70% alcohol or diluted bleach before working in adjacent rows.',
      rationale: language === 'mr'
        ? 'जिवाणूंचा रस औजारांवर लागून निरोगी झाडांच्या मुळांना किंवा खोडाला जखमा झाल्यास रोग पसरतो.'
        : language === 'hi'
        ? 'औजारों पर लगा जीवाणु रस स्वस्थ पौधों की छंटाई के दौरान घावों के जरिए संक्रमण फैलाता है।'
        : 'Bacterial ooze is easily transmitted to healthy plant stems via contaminated cutting blades.',
      whatToAvoid: language === 'mr'
        ? 'ओल्या जमिनीत नांगरणी किंवा आंतरमशागत करू नका ज्यामुळे मुळांना जखमा होतील.'
        : language === 'hi'
        ? 'गीली मिट्टी में जुताई या निराई न करें जिससे जड़ों को चोट पहुंचे।'
        : 'Do NOT cultivate wet soil aggressively, which injures roots and provides bacterial entry points.',
    });
  } else if (isPowderyMildew) {
    whatYouCanDoNow.push({
      id: 'powdery-sunlight',
      category: language === 'mr' ? 'सूर्यप्रकाश व्यवस्थापन' : language === 'hi' ? 'धूप की व्यवस्था' : 'Sunlight Exposure',
      icon: '☀️',
      urgency: 'Important',
      action: language === 'mr'
        ? 'झाडांमधील सावली देणारे तण काढा आणि सकाळचे ऊन झाडांच्या मधोमध पोहोचेल अशी व्यवस्था करा.'
        : language === 'hi'
        ? 'छायादार खरपतवार हटाएं और सुबह की धूप पौधों के भीतरी हिस्से तक पहुंचे ऐसा प्रबंधन करें।'
        : 'Prune excess foliage and remove weeds to ensure morning sunlight penetrates into inner canopy layers.',
      rationale: language === 'mr'
        ? 'भुरी बुरशी सावलीत आणि उष्ण-दमट हवेत झपाट्याने वाढते. कडक सूर्यप्रकाशामुळे बुरशीची वाढ खुंटते.'
        : language === 'hi'
        ? 'पाउडरी मिल्ड्यू छायादार और नम स्थानों में तेजी से फैलता है। सीधी धूप इसके विकास को धीमा करती है।'
        : 'Powdery mildew conidia thrive in shaded, warm microclimates; direct UV sunlight inhibits conidial germination.',
      whatToAvoid: language === 'mr'
        ? 'पावडर दिसणाऱ्या पानांवर जोराने पाण्याचे फवारे मारू नका (यामुळे कोरडे बीजाणू हवेत उडून इतरत्र पसरतात).'
        : language === 'hi'
        ? 'सफेद पाउडर वाली पत्तियों पर तेज पानी का छिड़काव न करें (इससे सूखे बीजाणु हवा में उड़कर फैलते हैं)।'
        : 'Do NOT spray forceful water jets onto dry powdery patches, which dislodges airborne conidia.',
    });
  } else if (isRust) {
    whatYouCanDoNow.push({
      id: 'rust-pustule-hygiene',
      category: language === 'mr' ? 'तांबेरा नियंत्रण' : language === 'hi' ? 'गेरुआ नियंत्रण' : 'Rust Management',
      icon: '🍂',
      urgency: 'Important',
      action: language === 'mr'
        ? 'तांबेरा आलेली खालील पाने कापा आणि तुषार सिंचन बंद ठेवा.'
        : language === 'hi'
        ? 'गेरुआ के धब्बों वाली निचली पत्तियों को हटाएं और स्प्रिंकलर का प्रयोग न करें।'
        : 'Prune lower leaves bearing rust pustules and suspend overhead sprinkler irrigation.',
      rationale: language === 'mr'
        ? 'तांबेरा बुरशीचे बीजाणू पानांवरील ओलाव्यामुळे वेगाने निरोगी झाडांवर पसरतात.'
        : language === 'hi'
        ? 'गेरुआ के बीजाणु पत्तियों पर नमी रहने से तेजी से फैलते हैं।'
        : `Rust pustules discharge powdery spores that germinate in canopy moisture${isWarm ? ' and warm air' : ''}.`,
      whatToAvoid: language === 'mr'
        ? 'दुपारी जोराचा वारा असताना कोरडी पाने कापू नका.'
        : language === 'hi'
        ? 'तेज हवा के समय सूखी पत्तियों की छंटाई न करें।'
        : 'Do NOT prune dry infected foliage during strong winds.',
    });
  } else if (isChewingDamage) {
    whatYouCanDoNow.push({
      id: 'chewing-scouting',
      category: language === 'mr' ? 'कीड निरीक्षण' : language === 'hi' ? 'कीट निरीक्षण' : 'Pest Inspection',
      icon: '🐛',
      urgency: 'Important',
      action: language === 'mr'
        ? 'संध्याकाळी किंवा सकाळी पानांच्या खालच्या बाजूला आणि खोडाजवळ अळ्या किंवा किडे आहेत का ते तपासा.'
        : language === 'hi'
        ? 'शाम या सुबह पत्तियों के नीचे और तने के पास इल्लियों या कीटों की जांच करें।'
        : 'Inspect leaf undersides and the soil surface near the stem base at dusk for cutworms or leaf-eating caterpillars.',
      rationale: language === 'mr'
        ? 'फाटलेली किंवा कुरतडलेली पाने ही बुरशीमुळे नव्हे तर किडींमुळे होतात. यासाठी बुरशीनाशक फवारून फायदा होत नाही.'
        : language === 'hi'
        ? 'कटी-फटी पत्तियां फफूंद से नहीं बल्कि कीटों के खाने से होती हैं। इस पर फफूंदनाशक का कोई असर नहीं होता।'
        : 'Ragged holes and chewed leaf margins are physical insect feeding injuries, not infectious microbial blights.',
      whatToAvoid: language === 'mr'
        ? 'कुरतडलेल्या पानांवर बुरशीनाशके फवारू नका किंवा पाणी देणे बंद करू नका.'
        : language === 'hi'
        ? 'कीट क्षति के लिए रासायनिक फफूंदनाशक न छिड़कें।'
        : 'Do NOT apply chemical fungicides or withhold plant watering for chewing insect damage.',
    });
  } else if (isPureChlorosis) {
    whatYouCanDoNow.push({
      id: 'chlorosis-soil',
      category: language === 'mr' ? 'माती व अन्नद्रव्ये' : language === 'hi' ? 'मिट्टी व पोषक तत्व' : 'Nutrient & Drainage',
      icon: '🌱',
      urgency: 'Important',
      action: language === 'mr'
        ? 'जमिनीत पाणी साचले आहे का ते तपासा आणि खत व्यवस्थापनाचा आढावा घ्या.'
        : language === 'hi'
        ? 'जांचें कि क्या खेत में जलभराव है और खाद देने के समय की समीक्षा करें।'
        : 'Check soil moisture saturation and evaluate recent nitrogen and iron/magnesium nutrient application schedules.',
      rationale: language === 'mr'
        ? 'ठिपके नसताना केवळ पिवळे पडणे हे बहुतांश वेळा अन्नद्रव्यांची कमतरता किंवा मुळांमध्ये पाणी साचल्यामुळे होते.'
        : language === 'hi'
        ? 'बिना धब्बों के पीलापन अक्सर पोषक तत्वों की कमी या जड़ क्षेत्र में अधिक पानी से होता है।'
        : 'Generalized chlorosis without necrotic spots is typically abiotic nutritional deficiency or root waterlogging.',
      whatToAvoid: language === 'mr'
        ? 'केवळ पाने पिवळी पडली म्हणून लगेच बुरशीनाशक औषधे फवारू नका.'
        : language === 'hi'
        ? 'केवल पीली पत्तियों के लिए कवकनाशी का छिड़काव न करें।'
        : 'Do NOT spray synthetic fungicides for physiological leaf chlorosis.',
    });
  } else {
    // Default safe cultural baseline
    whatYouCanDoNow.push({
      id: 'default-irrigation',
      category: language === 'mr' ? 'सिंचन शिस्त' : language === 'hi' ? 'सिंचाई सावधानी' : 'Irrigation Practice',
      icon: '💧',
      urgency: 'Important',
      action: language === 'mr'
        ? 'सकाळच्या वेळी जमिनीलगत पाणी द्या; पानांवर पाणी पडू देऊ नका.'
        : language === 'hi'
        ? 'सुबह के समय केवल जड़ क्षेत्र में पानी दें; पत्तियों को गीला न होने दें।'
        : 'Irrigate at the ground level in the early morning; keep canopy foliage as dry as possible.',
      rationale: language === 'mr'
        ? 'बहुतेक वनस्पती रोग पानांवर पाणी साचून राहिल्यामुळे पसरतात.'
        : language === 'hi'
        ? 'अधिकांश वनस्पति रोग पत्तियों पर लंबे समय तक नमी रहने से पनपते हैं।'
        : 'Limiting leaf wetness duration is the universally effective defense against foliar pathogens.',
      whatToAvoid: language === 'mr'
        ? 'संध्याकाळी उशिरा पाणी देणे टाळा.'
        : language === 'hi'
        ? 'देर शाम सिंचाई करने से बचें।'
        : 'Do NOT irrigate in late afternoon or evening.',
    });

    whatYouCanDoNow.push({
      id: 'default-sanitation',
      category: language === 'mr' ? 'स्वच्छता' : language === 'hi' ? 'स्वच्छता' : 'Field Sanitation',
      icon: '✂️',
      urgency: 'Important',
      action: language === 'mr'
        ? 'ज्या पानांवर डाग किंवा वाळलेपणा जास्त आहे अशी खालील पाने काढून शेताबाहेर टाका.'
        : language === 'hi'
        ? 'अत्यधिक धब्बेदार या सूखी निचली पत्तियों को हटाकर खेत से बाहर करें।'
        : 'Remove severely spotted or withered lower leaves and dispose of them outside the plot.',
      rationale: language === 'mr'
        ? 'खालील पाने काढून टाकल्याने हवा खेळती राहते व रोगाचे प्रमाण कमी होते.'
        : language === 'hi'
        ? 'निचली पत्तियां हटाने से हवा का प्रवाह बढ़ता है और संक्रमण का दबाव घटता है।'
        : 'Canopy thinning lowers internal relative humidity and removes pathogen inoculum.',
      whatToAvoid: language === 'mr'
        ? 'कापलेली रोगट पाने शेतातच टाकू नका.'
        : language === 'hi'
        ? 'रोगग्रस्त पत्तियों को खेत में न छोड़ें।'
        : 'Do NOT leave diseased leaf clippings in furrows or mulch.',
    });
  }

  // -------------------------------------------------------------------------
  // 2. WHAT TO CHECK NEXT (Targeted Checkpoints Distinguishing Candidates)
  // -------------------------------------------------------------------------
  const whatToCheckNext = [];

  // Checkpoint 1: Undersides at Dawn
  whatToCheckNext.push({
    plantPart: language === 'mr' ? 'पानांची मागची बाजू (पहाटे)' : language === 'hi' ? 'पत्ती की निचली सतह (सुबह)' : 'Leaf Undersides at Dawn',
    targetSign: language === 'mr'
      ? 'पानांच्या खाली पांढरी किंवा करडी बुरशीची लव (कापूस) दिसते का?'
      : language === 'hi'
      ? 'पत्ती के नीचे सफेद या भूरी फफूंद का बारीक रोआं दिखता है?'
      : 'White or grayish velvety fungal down surrounding water-soaked lesion borders',
    confirmsIf: language === 'mr'
      ? 'पांढरी लव दिसल्यास: करपा रोग (लेट ब्लाइट / फायटोप्थोरा) सक्रिय असल्याचे दर्शवते.'
      : language === 'hi'
      ? 'सफेद रोआं दिखने पर: लेट ब्लाइट (फाइटोफ्थोरा) संक्रमण की पुष्टि करता है।'
      : 'Confirms active sporulating Late Blight (Phytophthora infestans)',
    refutesIf: language === 'mr'
      ? 'कोणतीही लव न दिसता ठिपके कोरडे व छल्लेदार असल्यास: अर्ली ब्लाइट किंवा अल्टरनेरिया असण्याची शक्यता.'
      : language === 'hi'
      ? 'कोई रोआं न होकर धब्बे सूखे और छल्लेदार हों तो: अर्ली ब्लाइट (अल्टरनेरिया) का संकेत।'
      : 'Dry spots with concentric rings without mold indicate Early Blight (Alternaria)',
    timing: language === 'mr' ? 'सूर्योदयानंतर १ तासाच्या आत (दव असताना)' : language === 'hi' ? 'सूर्योदय के १ घंटे के भीतर (ओस रहने तक)' : 'Within 1 hour of sunrise while morning dew persists',
  });

  // Checkpoint 2: Stems & Petioles
  whatToCheckNext.push({
    plantPart: language === 'mr' ? 'देठ आणि मुख्य खोड' : language === 'hi' ? 'डंठल और मुख्य तना' : 'Main Stem & Petioles',
    targetSign: language === 'mr'
      ? 'खोडावर काळे, काळपट-तपकिरी लांबट पट्टे किंवा डाग पसरत आहेत का?'
      : language === 'hi'
      ? 'तने पर काले या गहरे भूरे पानीदार घाव फैल रहे हैं?'
      : 'Dark brown to black water-soaked lesions expanding along stem nodes and petioles',
    confirmsIf: language === 'mr'
      ? 'खोडावर डाग पसरल्यास: रोग संपूर्ण झाडात पसरत असून तातडीने कृषी तज्ज्ञांचा सल्ला आवश्यक आहे.'
      : language === 'hi'
      ? 'तने पर घाव फैलने पर: संक्रमण पूरे पौधे में फैल रहा है और तुरंत विशेषज्ञ परामर्श जरूरी है।'
      : 'Confirms aggressive systemic blight requiring immediate containment',
    refutesIf: language === 'mr'
      ? 'डाग केवळ पानांवरच मर्यादित राहिल्यास: रोग स्थानिक असून पानांची छाटणी प्रभावी ठरू शकते.'
      : language === 'hi'
      ? 'घाव केवल पत्तियों तक सीमित रहने पर: संक्रमण स्थानीय है और छंटाई से संभल सकता है।'
      : 'Lesions confined strictly to older leaf lamina indicate localized foliar stress',
    timing: language === 'mr' ? 'दुपारी शेतात फिरताना' : language === 'hi' ? 'दोपहर में खेत का निरीक्षण करते समय' : 'Midday during routine field inspection',
  });

  // Checkpoint 3: Stem Collar & Root Crown
  whatToCheckNext.push({
    plantPart: language === 'mr' ? 'जमिनीलगतचे खोड व मुळे' : language === 'hi' ? 'तने का निचला हिस्सा और जड़ें' : 'Stem Collar & Root Crown',
    targetSign: language === 'mr'
      ? 'जमिनीत पुरेसा ओलावा असूनही झाडे भर दुपारी मान टाकत आहेत का?'
      : language === 'hi'
      ? 'मिट्टी में नमी होने के बावजूद पौधे दोपहर में मुरझा रहे हैं?'
      : 'Rapid daytime foliar wilting despite adequate soil moisture in the root zone',
    confirmsIf: language === 'mr'
      ? 'ओल्या जमिनीत कोमेजत असल्यास: जिवाणूजन्य मर (बॅक्टेरियल विल्ट) किंवा मुळकुज असण्याची शक्यता.'
      : language === 'hi'
      ? 'गीली मिट्टी में मुरझाने पर: जीवाणु विल्ट (बैक्टीरियल विल्ट) या जड़ सड़न का संकेत।'
      : 'Confirms vascular wilt (Ralstonia) or root rot rather than simple leaf spot',
    refutesIf: language === 'mr'
      ? 'केवळ जुनी पाने सुकत असून वरचे शेंडे ताजेतवाने असल्यास: सामान्य पानांचे वय किंवा अन्नद्रव्य कमतरता.'
      : language === 'hi'
      ? 'केवल पुरानी पत्तियां सूखने और शीर्ष भाग हरा रहने पर: सामान्य पत्ती आयु या पोषण की कमी।'
      : 'Turgid upper shoots with lower yellowing indicate normal senescence or nutrient stress',
    timing: language === 'mr' ? 'दुपारी १२ ते ३ दरम्यान (कडक उन्हात)' : language === 'hi' ? 'दोपहर १२ से ३ के बीच (कड़ी धूप में)' : 'Between 12 PM – 3 PM under peak sunlight',
  });

  // -------------------------------------------------------------------------
  // 3. WHEN TO GET HELP (Case-Specific Escalation Triggers)
  // -------------------------------------------------------------------------
  const triggers = [];

  if (isLateBlight || isHumid) {
    triggers.push(
      language === 'mr'
        ? 'जर पुढील ४८ तासांत डाग १०% पेक्षा जास्त झाडांवर झपाट्याने पसरले.'
        : language === 'hi'
        ? 'यदि अगले ४८ घंटों में धब्बे १०% से अधिक पौधों पर तेजी से फैल जाएं।'
        : 'If water-soaked spots spread across more than 10% of field plants within 48 hours.'
    );
  }

  if (isBacterialWilt || symptoms.includes('wilting')) {
    triggers.push(
      language === 'mr'
        ? 'जर जमिनीत पाणी असूनही झाडे सलग २ दिवस दुपारी कोमेजून खाली मान टाकत राहिली.'
        : language === 'hi'
        ? 'यदि मिट्टी में नमी होने पर भी पौधे लगातार २ दिन दोपहर में मुरझाते रहें।'
        : 'If plants continue wilting rapidly during warm daylight hours despite moist soil.'
    );
  }

  triggers.push(
    language === 'mr'
      ? 'जर डाग काळे पडून झाडाच्या मुख्य खोडावर किंवा नवीन शेंड्यांवर पसरू लागले.'
      : language === 'hi'
      ? 'यदि धब्बे काले होकर पौधे के मुख्य तने या नए शीर्ष पर फैलने लगें।'
      : 'If necrotic lesions turn black and advance into stem nodes or growing shoot tips.'
  );

  const referralGuidance = language === 'mr'
    ? 'शेतातील ३-५ प्रातिनिधिक रोगट पाने (हिरवी कड असलेली) कोरड्या कागदी लिफाफ्यात ठेवा (प्लास्टिक पिशवी वापरू नका) आणि २४ तासांच्या आत जवळच्या कृषी विज्ञान केंद्रात (KVK) किंवा तालुका कृषी अधिकाऱ्यांकडे दाखवा.'
    : language === 'hi'
    ? 'खेत से ३-५ रोगग्रस्त पत्तियां (जिनके किनारे हरे हों) एक सूखे कागजी लिफाफे में रखें (प्लास्टिक बैग न लें) और २४ घंटे के भीतर नजदीकी कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी को दिखाएं।'
    : 'Collect 3–5 representative leaves with active green margins, place them in a dry paper envelope (do NOT seal in plastic), and take them to your nearest Krishi Vigyan Kendra (KVK) within 24 hours.';

  return {
    whatYouCanDoNow,
    whatToCheckNext,
    whenToGetHelp: {
      triggers,
      referralGuidance,
      helpline: '1800-180-1551 (Toll-Free Kisan Call Centre)',
    },
  };
}
