/**
 * Server-Side Farmer Assistant Handler
 *
 * Multilingual agricultural conversation agent powered by Google Gemini 3.5 Flash.
 * Supports English, Hindi, and Marathi with strict agricultural safety guardrails:
 * - Emphasizes cultural sanitation and microclimate management.
 * - Strictly excludes fabricated chemical pesticide dosages.
 * - Contextualized with the farmer's live weather telemetry and latest crop scan.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getRuleBasedAssistantResponse({ userQuery, cropName, weatherDesc, language }) {
  const qLower = userQuery.toLowerCase();
  let reply = '';
  let quickChips = [];

  if (language === 'mr') {
    if (qLower.includes('पाणी') || qLower.includes('सिंचन')) {
      reply = `तुमच्या ${cropName} पिकासाठी सकाळच्या वेळी झाडाच्या बुंध्याशी पाणी देणे सर्वात सुरक्षित आहे. दुपारनंतर किंवा संध्याकाळी तुषार सिंचन टाळा, कारण पानांवर पाणी राहिल्यास करपा किंवा बुरशी झपाट्याने वाढते.`;
      quickChips = ['पाने छाटायची का?', 'केव्हीके (KVK) संपर्क क्रमांक काय?', 'हवामान कसे आहे?'];
    } else if (qLower.includes('औषध') || qLower.includes('फवारणी') || qLower.includes('रासायनिक')) {
      reply = `कृषी सुरक्षेच्या नियमांनुसार आम्ही थेट रासायनिक औषधांची मात्रा सुचवत नाही. कृपया पानांचा नमुना घेऊन जवळच्या कृषी विज्ञान केंद्रात (KVK) संपर्क साधा किंवा किसान कॉल सेंटर (1800-180-1551) वर विनामूल्य कॉल करा. सध्या रोगट पाने कापून शेताबाहेर नष्ट करा.`;
      quickChips = ['सुरक्षित मशागत काय करावी?', 'सकाळचे सिंचन कसे करावे?', 'लक्षणे कशी ओळखावी?'];
    } else {
      reply = `नमस्कार शेतकरी बंधू! तुमच्या ${cropName} पिकाबाबत मी मदत करू शकतो. सध्याच्या दमट हवामानात पानांवर दव जास्त वेळ राहू देऊ नका. शेतातील तण काढून हवा खेळती ठेवा.`;
      quickChips = ['पाणी कधी द्यावे?', 'रोग कसा ओळखावा?', 'तज्ज्ञांचा सल्ला कधी घ्यावा?'];
    }
  } else if (language === 'hi') {
    if (qLower.includes('पानी') || qLower.includes('सिंचाई')) {
      reply = `आपकी ${cropName} फसल के लिए सुबह के समय जड़ क्षेत्र में सिंचाई करना सबसे सुरक्षित है। शाम को स्प्रिंकलर से पानी देने से बचें ताकि पत्तियों पर रात भर नमी न रहे।`;
      quickChips = ['रोगग्रस्त पत्तियां हटाएं?', 'KVK हेल्पलाइन नंबर क्या है?', 'मौसम का प्रभाव क्या है?'];
    } else if (qLower.includes('दवा') || qLower.includes('छिड़काव') || qLower.includes('केमिकल')) {
      reply = `सुरक्षा मानकों के तहत हम सीधे रासायनिक कीटनाशकों की मात्रा की सिफारिश नहीं करते। सही और प्रमाणित सलाह के लिए अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या किसान कॉल सेंटर (1800-180-1551) पर संपर्क करें।`;
      quickChips = ['प्राकृतिक रोकथाम क्या है?', 'सिंचाई का सही समय?', 'लक्षण कैसे जांचें?'];
    } else {
      reply = `नमस्ते किसान भाई! मैं आपकी ${cropName} फसल की देखभाल में सहायता कर सकता हूँ। सुबह के समय पत्तियों के नीचे फफूंद की जांच करें और खेत में जलभराव न होने दें।`;
      quickChips = ['सिंचाई कब करें?', 'पत्तियों की छंटाई कैसे करें?', 'विशेषज्ञ से कब संपर्क करें?'];
    }
  } else {
    if (qLower.includes('water') || qLower.includes('irrigation')) {
      reply = `For your ${cropName} plot, morning root-zone or drip irrigation is recommended. Avoid late afternoon overhead sprinkling because leaf wetness exceeding 6 hours accelerates fungal sporulation.`;
      quickChips = ['Should I prune leaves?', 'What is the KVK helpline?', 'Explain weather risk'];
    } else if (qLower.includes('chemical') || qLower.includes('spray') || qLower.includes('pesticide')) {
      reply = `To protect farmer safety and crop integrity, Rain Maker never prescribes synthetic chemical dosages without laboratory verification. Please visit your nearest Krishi Vigyan Kendra (KVK) with a physical leaf sample, or call the Kisan Call Centre at 1800-180-1551. Focus on cultural sanitation right now.`;
      quickChips = ['What cultural steps can I take?', 'How to prune diseased leaves?', 'When to escalate?'];
    } else {
      reply = `Hello! I am your Rain Maker Crop Assistant. For your ${cropName} field under current microclimatic conditions (${weatherDesc}), ensure good canopy aeration and scout leaf undersides at dawn for water-soaked lesions.`;
      quickChips = ['What should I avoid doing?', 'Explain latest scan results', 'How to contact KVK'];
    }
  }

  return { reply, quickChips };
}

export async function handleFarmerAssistant(req, res) {
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
    message = '',
    conversationHistory = [],
    cropContext = {},
    language = 'en',
  } = body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'MISSING_MESSAGE',
      message: 'A message string is required.',
    });
  }

  const userQuery = message.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  // Context strings
  const cropName = cropContext.cropName || cropContext.cropId || 'Crop';
  const weatherDesc = cropContext.weather
    ? `Temp ${cropContext.weather.temp ?? '22'}°C, Humidity ${cropContext.weather.humidity ?? '70'}%, Rain ${cropContext.weather.rain ?? '0'}mm (${cropContext.weather.locationName || 'Local Farm'})`
    : 'Local weather telemetry unavailable';
  const scanFindings = cropContext.latestScan
    ? `Latest Leaf Scan: ${cropContext.latestScan.topCandidate || 'General screening'} (Severity: ${cropContext.latestScan.severity || 'Normal'}, Symptoms: ${(cropContext.latestScan.symptoms || []).join(', ') || 'None'})`
    : 'No active leaf scan performed yet';

  // Fallback response if GEMINI_API_KEY is not configured
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    const fallback = getRuleBasedAssistantResponse({ userQuery, cropName, weatherDesc, language });
    return res.status(200).json({
      success: true,
      isAiInference: false,
      reply: fallback.reply,
      quickChips: fallback.quickChips,
    });
  }

  // Execute Gemini Assistant with Agricultural Extension Prompt
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const langInstruction = language === 'mr'
      ? 'Respond strictly in clear, natural, respectful Marathi (मराठी). Use simple terms suitable for Maharashtra farmers.'
      : language === 'hi'
      ? 'Respond strictly in warm, clear, conversational Hindi (हिंदी). Use practical vocabulary familiar to North and Central Indian farmers.'
      : 'Respond in clear, practical English.';

    const systemPrompt = `You are Rain Maker's empathetic, highly knowledgeable AI Agricultural Extension Specialist assisting smallholder farmers in India.
${langInstruction}

Current Farmer & Field Context:
- Active Crop: ${cropName}
- Live Weather Telemetry: ${weatherDesc}
- Latest Foliar Scan Findings: ${scanFindings}

CRITICAL AGRICULTURAL SAFETY GUARDRAILS:
1. STRICT CHEMICAL EXCLUSION: NEVER invent synthetic pesticide brand names or application dosages (e.g. no "spray 2ml/L of Mancozeb").
2. RECOMMEND SAFE CULTURAL PRACTICES: Focus on morning root-zone watering, pruning blighted lower canopy leaves during dry hours, tool sterilization, and field aeration.
3. EXTENSION REFERRAL: For chemical treatments, recommend taking a leaf sample in a paper envelope to their local Krishi Vigyan Kendra (KVK) or calling the Kisan Call Centre (1800-180-1551).
4. KEEP ANSWERS CONCISE: Smallholder farmers need clear, 2–4 sentence actionable points. Do not write lengthy essays.

Return ONLY valid JSON matching this schema:
{
  "reply": string (conversational response to read aloud or display),
  "quickChips": string[] (exactly 3 short, relevant follow-up questions the farmer can tap next, in the same language)
}`;

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
    let responseText = null;

    const recentHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0
      ? 'Recent Conversation Context:\n' + conversationHistory.slice(-4).map((m) => `${m.role === 'user' ? 'Farmer' : 'Assistant'}: ${m.text}`).join('\n') + '\n\n'
      : '';

    for (const model of candidateModels) {
      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${recentHistory}Farmer Query: ${userQuery}` }],
          },
        ];

        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Gemini assistant model ${model} failed: ${err.message}`);
      }
    }

    if (!responseText) {
      throw new Error('Gemini assistant failed to generate a response.');
    }

    const stripped = responseText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(stripped);

    return res.status(200).json({
      success: true,
      isAiInference: true,
      reply: parsed.reply || 'Your crop inquiry has been processed.',
      quickChips: Array.isArray(parsed.quickChips) ? parsed.quickChips.slice(0, 3) : [],
    });
  } catch (err) {
    console.warn('Gemini Assistant API unavailable, providing transparent rule-based fallback:', err.message || err);
    const fallback = getRuleBasedAssistantResponse({ userQuery, cropName, weatherDesc, language });
    return res.status(200).json({
      success: true,
      isAiInference: false,
      fallbackToHeuristic: true,
      reply: fallback.reply,
      quickChips: fallback.quickChips,
    });
  }
}
