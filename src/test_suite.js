/**
 * Automated Verification Test Suite for Rain Maker
 * Tests all 5 phases:
 * 1. Low-risk vs Disease-favorable scenarios (Potato, Tomato, Rice, Wheat)
 * 2. Missing weather fields and API failures (ensuring safe non-low risk handling)
 * 3. Stale forecast handling
 * 4. Unsupported crop-disease combinations
 * 5. Harvested produce vs foliar leaf images
 * 6. Leaf submissions with zero symptoms (safeguard)
 * 7. Leaf submissions with symptoms (heuristic ranking)
 * 8. AI Provider unconfigured state verification
 * 9. Prioritized advisory generation & missing evidence handling
 * 10. End-to-end multi-factor cross-evidence synthesis
 */

import { estimateDiseaseRisk, RISK_CATEGORIES } from './services/diseaseRiskEngine.js';
import { generateFarmerAdvisories } from './services/advisoryService.js';
import { analyzeCropImage } from './services/imageAnalysisService.js';
import { handleCropVisionAnalysis } from '../server/cropVisionHandler.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('=== RAIN MAKER TEST SUITE EXECUTION ===\n');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 1: Disease-Favorable Weather Scenarios
  // -------------------------------------------------------------------------
  console.log('[Scenario 1] Disease-Favorable Weather Scenarios (Elevated Risk)');
  
  // Potato: 18°C, 92% RH, 12 consecutive wet hours
  const potatoFavorableHourly = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temperature: 17.5,
    humidity: 92,
    dewPoint: 16.5,
    precipitation: i === 3 ? 4.2 : 0,
  }));
  const potatoRiskElevated = estimateDiseaseRisk('potato', {
    isLive: true,
    fetchedAt: '10:00 AM',
    current: { temperature: 18, humidity: 90, precipitation: 0 },
    hourly: potatoFavorableHourly,
  });
  assert(potatoRiskElevated.riskCategory === RISK_CATEGORIES.ELEVATED, 'Potato evaluates to Elevated risk under sustained cool/humid weather');
  assert(potatoRiskElevated.targetDisease.includes('Late Blight'), 'Potato target disease is Late Blight');
  assert(potatoRiskElevated.contributingWeatherFactors.length >= 2, 'Contributing factors list populated');

  // Tomato: 24°C, 88% RH, rain
  const tomatoFavorableHourly = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temperature: 24.0,
    humidity: 88,
    dewPoint: 22.0,
    precipitation: 0.5,
  }));
  const tomatoRiskElevated = estimateDiseaseRisk('tomato', {
    isLive: true,
    current: { temperature: 24, humidity: 88, precipitation: 0.5 },
    hourly: tomatoFavorableHourly,
  });
  assert(tomatoRiskElevated.riskCategory === RISK_CATEGORIES.ELEVATED, 'Tomato evaluates to Elevated risk under warm humid weather');

  // Rice: 22°C, 92% RH, calm wind
  const riceFavorableHourly = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temperature: 22.0,
    humidity: 92,
    dewPoint: 21.0,
    precipitation: 0,
  }));
  const riceRiskElevated = estimateDiseaseRisk('rice', {
    isLive: true,
    current: { temperature: 22, humidity: 92, windSpeed: 6 },
    hourly: riceFavorableHourly,
  });
  assert(riceRiskElevated.riskCategory === RISK_CATEGORIES.ELEVATED, 'Rice evaluates to Elevated risk under nocturnal saturation');

  // Wheat: 12°C, 90% RH
  const wheatFavorableHourly = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temperature: 12.0,
    humidity: 90,
    dewPoint: 11.0,
    precipitation: 0,
  }));
  const wheatRiskElevated = estimateDiseaseRisk('wheat', {
    isLive: true,
    current: { temperature: 12, humidity: 90 },
    hourly: wheatFavorableHourly,
  });
  assert(wheatRiskElevated.riskCategory === RISK_CATEGORIES.ELEVATED, 'Wheat evaluates to Elevated risk under cool damp conditions');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 2: Low-Risk Weather Scenarios
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 2] Low-Risk Weather Scenarios');
  const dryHourly = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temperature: 30.0,
    humidity: 45,
    dewPoint: 12.0,
    precipitation: 0,
  }));
  const potatoRiskLow = estimateDiseaseRisk('potato', {
    isLive: true,
    current: { temperature: 30, humidity: 45 },
    hourly: dryHourly,
  });
  assert(potatoRiskLow.riskCategory === RISK_CATEGORIES.LOW, 'Potato evaluates to Low risk in hot dry weather');
  assert(potatoRiskLow.riskScore <= 30, 'Low risk score is bounded <= 30');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 3: Missing Weather & API Failures (Critical Safety Rule)
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 3] Missing Weather & API Failure Safety');
  const nullWeatherRisk = estimateDiseaseRisk('potato', null);
  assert(nullWeatherRisk.riskCategory === RISK_CATEGORIES.UNDETERMINED, 'Null weather returns Undetermined category, NEVER Low');
  assert(nullWeatherRisk.isDataIncomplete === true, 'isDataIncomplete is true');
  assert(nullWeatherRisk.riskScore === null, 'riskScore is null when weather is missing');

  const emptyWeatherRisk = estimateDiseaseRisk('tomato', {});
  assert(emptyWeatherRisk.riskCategory === RISK_CATEGORIES.UNDETERMINED, 'Empty weather object returns Undetermined category');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 4: Stale Forecast & Unsupported Crops
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 4] Stale Forecast & Unsupported Crops');
  const staleWeatherRisk = estimateDiseaseRisk('potato', {
    isLive: true,
    isStale: true,
    current: { temperature: 18, humidity: 88 },
    hourly: potatoFavorableHourly,
  });
  assert(staleWeatherRisk.isStale === true, 'Stale flag is preserved and recognized');

  const unsupportedCropRisk = estimateDiseaseRisk('cotton', { current: { temperature: 25, humidity: 60 } });
  assert(unsupportedCropRisk.provisionalStatus === 'Unsupported', 'Unsupported crop flagged with provisionalStatus = Unsupported');
  assert(unsupportedCropRisk.riskCategory === RISK_CATEGORIES.UNDETERMINED, 'Unsupported crop risk is Undetermined');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 5: Image Scanner — Harvested Produce vs Leaf Specimen
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 5] Harvested Produce Specimen Screening Guardrail');
  const tuberScan = await analyzeCropImage({
    cropId: 'potato',
    specimenType: 'harvested_produce',
    symptoms: ['brown_spots'],
    fileInfo: { name: 'harvested-tubers.jpg', size: 1024 * 500 },
  });
  assert(tuberScan.isSuitableSpecimen === false, 'Harvested produce declared unsuitable for foliar screening');
  assert(tuberScan.candidates.length === 0, 'No foliar candidates generated for harvested produce');
  assert(tuberScan.unsuitabilityNotice.includes('harvested produce'), 'Clear unsuitability notice provided');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 6: Image Scanner — Zero Symptoms Safeguard
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 6] Zero Reported Symptoms Safeguard');
  const zeroSymptomScan = await analyzeCropImage({
    cropId: 'potato',
    specimenType: 'leaf',
    symptoms: [],
    fileInfo: { name: 'living-leaf.jpg', size: 1024 * 500 },
  });
  assert(zeroSymptomScan.isSuitableSpecimen === true, 'Foliar leaf is suitable specimen');
  assert(zeroSymptomScan.hasUserSymptoms === false, 'hasUserSymptoms is false');
  assert(zeroSymptomScan.candidates.length === 0, 'Candidates array is strictly empty when zero symptoms reported (no guessing)');
  assert(zeroSymptomScan.severityEstimate.level.includes('Undetermined'), 'Severity marked Undetermined');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 7: Image Scanner — Leaf with Reported Symptoms
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 7] Leaf Specimen with User-Reported Symptoms');
  const symptomScan = await analyzeCropImage({
    cropId: 'potato',
    specimenType: 'leaf',
    symptoms: ['water_soaked', 'brown_spots'],
    fileInfo: { name: 'blight-leaf.jpg', size: 1024 * 500 },
  });
  assert(symptomScan.hasUserSymptoms === true, 'hasUserSymptoms is true');
  assert(symptomScan.candidates.length > 0, 'Candidates populated based on symptoms');
  assert(symptomScan.candidates[0].name.includes('Late Blight'), 'Late Blight ranked top for water-soaked + brown spots on potato');
  assert(symptomScan.isAiInference === false, 'isAiInference is strictly false (transparent heuristic)');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 8: Advisory Generation — Prioritization & Missing Data
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 8] Prioritized Farmer Advisories');
  const elevatedAdvisories = generateFarmerAdvisories({
    cropRisk: potatoRiskElevated,
    weather: { current: { temperature: 18, humidity: 90 } },
    cropName: 'Potato',
  });
  assert(elevatedAdvisories.length >= 2, 'Generated multiple advisories for elevated risk');
  assert(elevatedAdvisories[0].priority === 'urgent', 'Top advisory priority is urgent');
  assert(elevatedAdvisories[0].badge === 'Urgent Alert', 'Top advisory has Urgent Alert badge');
  assert(Boolean(elevatedAdvisories[0].expertConsultation), 'Expert consultation channel included');

  const incompleteDataAdvisories = generateFarmerAdvisories({
    cropRisk: nullWeatherRisk,
    weather: null,
    cropName: 'Potato',
  });
  assert(incompleteDataAdvisories[0].badge === 'Data Notice', 'Missing weather yields Data Notice advisory');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 9: Multi-Factor Cross-Evidence Synthesis Scenarios
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 9] Cross-Evidence Multi-Factor Synthesis');
  // Scenario A: Elevated Risk + Matching Symptoms -> Concurrent Threat
  const concurrentAdvisories = generateFarmerAdvisories({
    cropRisk: potatoRiskElevated,
    weather: { current: { temperature: 18, humidity: 90 } },
    cropName: 'Potato',
    imageAnalysis: symptomScan,
  });
  assert(concurrentAdvisories[0].category === 'Cross-Evidence Alert', 'Elevated weather + symptoms yields Cross-Evidence Concurrent Alert');
  assert(concurrentAdvisories[0].priority === 'urgent', 'Concurrent threat is urgent priority');

  // Scenario B: Low Risk + Symptoms -> Legacy / Abiotic Stress
  const legacyAdvisories = generateFarmerAdvisories({
    cropRisk: potatoRiskLow,
    weather: { current: { temperature: 30, humidity: 45 } },
    cropName: 'Potato',
    imageAnalysis: symptomScan,
  });
  assert(legacyAdvisories[0].category === 'Cross-Evidence Analysis', 'Low weather + symptoms yields Legacy/Abiotic Analysis advisory');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 10: Server Vision Handler Validation & Unconfigured Fallback
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 10] Server Vision Handler Validation & Fallback Guardrails');

  function createMockReqRes(body, method = 'POST') {
    let statusCode = 200;
    let responseData = null;
    return {
      req: { method, body },
      res: {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseData = data;
          return this;
        },
      },
      getStatusCode: () => statusCode,
      getData: () => responseData,
    };
  }

  // 10.1 Method not allowed
  const getReq = createMockReqRes({}, 'GET');
  await handleCropVisionAnalysis(getReq.req, getReq.res);
  assert(getReq.getStatusCode() === 405, 'Non-POST request returns 405 Method Not Allowed');
  assert(getReq.getData().error === 'METHOD_NOT_ALLOWED', 'Error code is METHOD_NOT_ALLOWED');

  // 10.2 Unsupported crop
  const badCropReq = createMockReqRes({ cropId: 'cotton', imageBase64: 'dGVzdA==' });
  await handleCropVisionAnalysis(badCropReq.req, badCropReq.res);
  assert(badCropReq.getStatusCode() === 400, 'Unsupported cropId returns 400 Bad Request');
  assert(badCropReq.getData().error === 'INVALID_CROP_TYPE', 'Error code is INVALID_CROP_TYPE');

  // 10.3 Missing image data
  const missingImgReq = createMockReqRes({ cropId: 'potato' });
  await handleCropVisionAnalysis(missingImgReq.req, missingImgReq.res);
  assert(missingImgReq.getStatusCode() === 400, 'Missing image returns 400 Bad Request');
  assert(missingImgReq.getData().error === 'MISSING_IMAGE_DATA', 'Error code is MISSING_IMAGE_DATA');

  // 10.4 Invalid MIME type
  const badMimeReq = createMockReqRes({ cropId: 'potato', imageBase64: 'dGVzdA==', mimeType: 'image/gif' });
  await handleCropVisionAnalysis(badMimeReq.req, badMimeReq.res);
  assert(badMimeReq.getStatusCode() === 400, 'Unsupported MIME type returns 400 Bad Request');
  assert(badMimeReq.getData().error === 'INVALID_MIME_TYPE', 'Error code is INVALID_MIME_TYPE');

  // 10.5 Server-side harvested produce screening
  const harvestedReq = createMockReqRes({ cropId: 'potato', specimenType: 'harvested_produce', imageBase64: 'dGVzdA==' });
  await handleCropVisionAnalysis(harvestedReq.req, harvestedReq.res);
  assert(harvestedReq.getStatusCode() === 200, 'Harvested produce returns 200 OK with unsuitability notice');
  assert(harvestedReq.getData().isSuitableSpecimen === false, 'Harvested produce marked isSuitableSpecimen = false on server');
  assert(harvestedReq.getData().candidates.length === 0, 'No candidate diseases proposed on server for harvested produce');

  // 10.6 Unconfigured GEMINI_API_KEY graceful 503 fallback
  const validFoliarReq = createMockReqRes({
    cropId: 'potato',
    specimenType: 'leaf',
    imageBase64: 'dGVzdA==',
    userSymptoms: ['water_soaked'],
  });
  // Ensure unconfigured test case by clearing or checking process.env.GEMINI_API_KEY
  const originalKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    await handleCropVisionAnalysis(validFoliarReq.req, validFoliarReq.res);
    assert(validFoliarReq.getStatusCode() === 503, 'Unconfigured GEMINI_API_KEY returns 503 Service Unavailable');
    assert(validFoliarReq.getData().error === 'GEMINI_API_KEY_NOT_CONFIGURED', 'Error code is GEMINI_API_KEY_NOT_CONFIGURED');
    assert(validFoliarReq.getData().fallbackToHeuristic === true, 'Response flags fallbackToHeuristic = true');
  } finally {
    if (originalKey !== undefined) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  }

  // -------------------------------------------------------------------------
  // TEST SCENARIO 11: Unrelated Non-Plant Image Safety Guardrail
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 11] Unrelated Image Safety Guardrail');
  const unrelatedScan = await analyzeCropImage({
    cropId: 'potato',
    specimenType: 'other',
    symptoms: ['brown_spots'],
    fileInfo: { name: 'car-photo.jpg', size: 1024 * 500 },
  });
  assert(unrelatedScan.isSuitableSpecimen === false, 'Non-plant image marked isSuitableSpecimen = false');
  assert(unrelatedScan.candidates.length === 0, 'No disease candidates generated for unrelated non-plant image');
  assert(Boolean(unrelatedScan.unsuitabilityNotice), 'Clear unsuitability notice provided for non-plant image');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 12: Healthy Asymptomatic Plant Foliage Guardrail
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 12] Healthy Asymptomatic Foliage Guardrail');
  const healthyScan = await analyzeCropImage({
    cropId: 'tomato',
    specimenType: 'leaf',
    symptoms: [],
    fileInfo: { name: 'healthy-green-leaf.jpg', size: 1024 * 300 },
  });
  assert(healthyScan.isHealthy === true, 'Asymptomatic leaf flagged as isHealthy = true');
  assert(healthyScan.candidates.length === 0, 'Candidates array strictly empty for healthy plant (zero guessing)');
  assert(Boolean(healthyScan.healthyExplanation), 'Healthy explanation provided');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 13: Conflicting Candidates & Symptom Overlap Warning
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 13] Conflicting Candidates & Symptom Overlap');
  const multiSymptomScan = await analyzeCropImage({
    cropId: 'potato',
    specimenType: 'leaf',
    symptoms: ['brown_spots', 'water_soaked'],
    fileInfo: { name: 'spotted-leaf.jpg', size: 1024 * 400 },
  });
  assert(multiSymptomScan.candidates.length >= 2, 'Multiple candidate diseases ranked for overlapping symptoms');
  assert(multiSymptomScan.conflictingCandidates === true, 'conflictingCandidates flagged true for overlapping symptom candidates');
  assert(Boolean(multiSymptomScan.uncertaintyExplanation), 'Uncertainty explanation explains symptom overlap across pathogens');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 14: Missing or Uncertain Evidence Tracking
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 14] Missing or Uncertain Evidence Tracking');
  assert(Boolean(multiSymptomScan.candidates[0].missingEvidence), 'Top candidate has missingEvidence field defined');
  assert(Array.isArray(multiSymptomScan.evidenceMissingOrUncertain), 'evidenceMissingOrUncertain is an array');
  assert(multiSymptomScan.evidenceMissingOrUncertain.length > 0, 'evidenceMissingOrUncertain has entries for lab culturing');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 15: Differential Comparison Between Similar Diseases
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 15] Differential Comparison');
  assert(Boolean(multiSymptomScan.candidates[0].differentialComparison), 'Top candidate includes differentialComparison with similar diseases');
  assert(multiSymptomScan.candidates[0].differentialComparison.includes('Blight') || multiSymptomScan.candidates[0].differentialComparison.includes('Early'), 'Differential comparison contrasts against related blight or spotting');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 16: Safe Cultural Practices & Chemical Pesticide Exclusion
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 16] Chemical Pesticide Exclusion & Farmer Safety');
  assert(Boolean(multiSymptomScan.chemicalDisclaimer), 'Explicit chemical disclaimer provided');
  assert(multiSymptomScan.chemicalDisclaimer.includes('Krishi Vigyan Kendra') || multiSymptomScan.chemicalDisclaimer.includes('chemical'), 'Chemical disclaimer advises consulting KVK/extension');
  const allRecommendationsText = (multiSymptomScan.recommendedNextSteps || []).concat(multiSymptomScan.culturalPractices || []).join(' ');
  assert(!allRecommendationsText.match(/\b\d+\s*(?:ml|gm|grams|kg|litres?|ppm)\b/i), 'Recommendations strictly exclude exact chemical pesticide dosages');

  // -------------------------------------------------------------------------
  // TEST SCENARIO 17: Server Vision Handler Healthy & Unrelated Validation
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 17] Server Vision Handler Healthy and Unrelated Guardrails');
  const serverUnrelatedReq = createMockReqRes({
    cropId: 'potato',
    specimenType: 'other',
    imageBase64: 'dGVzdA==',
    userSymptoms: [],
  });
  await handleCropVisionAnalysis(serverUnrelatedReq.req, serverUnrelatedReq.res);
  assert(serverUnrelatedReq.getStatusCode() === 200, 'Server returns 200 for non-foliar view');
  const serverUnrelatedData = serverUnrelatedReq.getData();
  assert(serverUnrelatedData.isSuitableSpecimen === false, 'Server flags isSuitableSpecimen = false for non-foliar view');
  assert(serverUnrelatedData.candidates.length === 0, 'Server provides 0 candidates for non-foliar view');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=== TEST SUITE RESULTS ===');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
