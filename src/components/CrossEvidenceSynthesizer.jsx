import React from 'react';
import { 
  IconShieldAlert, 
  IconShieldCheck, 
  IconLeaf, 
  IconInfo 
} from './Icons';
import { RISK_CATEGORIES } from '../services/diseaseRiskEngine.js';

export default function CrossEvidenceSynthesizer({ 
  cropRisk, 
  imageAnalysis, 
  cropName, 
  locationName 
}) {
  const weatherRiskCategory = cropRisk?.riskCategory || RISK_CATEGORIES.UNDETERMINED;
  const isWeatherIncomplete = Boolean(cropRisk?.isDataIncomplete);
  const targetDisease = cropRisk?.targetDisease || 'Target Crop Pathogen';

  // Determine state of image evidence
  const hasImage = Boolean(imageAnalysis);
  const isSuitableSpecimen = imageAnalysis?.isSuitableSpecimen ?? false;
  const hasUserSymptoms = imageAnalysis?.hasUserSymptoms ?? false;
  const candidateDiseases = imageAnalysis?.candidates || [];
  const topCandidate = candidateDiseases[0]?.name || null;

  // Synthesize multi-factor assessment
  let synthesisType = 'baseline';
  let badgeText = 'Baseline Vigilance';
  let badgeColor = 'green';
  let title = 'Single-Stream Assessment (Weather Risk Only)';
  let explanation = '';
  let actionRecommendation = '';

  if (isWeatherIncomplete) {
    synthesisType = 'incomplete';
    badgeText = 'Telemetry Incomplete';
    badgeColor = 'amber';
    title = 'Weather Telemetry Incomplete — Visual Inspection Essential';
    explanation = `Live weather forecast telemetry is currently unavailable from Open-Meteo. Pathogen incubation conditions cannot be calculated. Cross-evidence synthesis is running in offline mode.`;
    actionRecommendation = 'Conduct direct manual field scouting across 10 random plants. Do not assume missing weather data means safe conditions.';
  } else if (!hasImage) {
    // No image scanned yet
    if (weatherRiskCategory === RISK_CATEGORIES.ELEVATED) {
      synthesisType = 'pre-symptomatic';
      badgeText = 'Pre-Symptomatic Window';
      badgeColor = 'amber';
      title = `Elevated Atmospheric Vulnerability for ${targetDisease}`;
      explanation = `The micro-climate forecast in ${locationName} indicates temperatures and prolonged humidity have reached levels that accelerate ${targetDisease} incubation. No crop image or foliar symptoms have been uploaded yet.`;
      actionRecommendation = `You are currently in an ideal PRE-SYMPTOMATIC PREVENTIVE WINDOW. Take cultural actions (halt overhead watering, clear furrow drainage) before symptoms visibly emerge in the canopy. Upload a leaf photo below if you suspect early spots.`;
    } else if (weatherRiskCategory === RISK_CATEGORIES.MODERATE) {
      synthesisType = 'monitoring';
      badgeText = 'Scouting Window';
      badgeColor = 'blue';
      title = `Moderate Pathogen Incubation Window`;
      explanation = `Atmospheric moisture provides intermittent spore germination opportunities for ${targetDisease}. No crop image has been analyzed.`;
      actionRecommendation = `Inspect lower canopy leaves during routine scouting. If you notice unusual spots or chlorosis, use the Crop Image Scanner below for symptom matching.`;
    } else {
      synthesisType = 'baseline';
      badgeText = 'Low Environmental Pressure';
      badgeColor = 'green';
      title = `Unfavorable Pathogen Micro-Climate`;
      explanation = `Ambient humidity and temperatures are currently suppressing rapid spore germination for ${targetDisease} in ${cropName}.`;
      actionRecommendation = `Maintain standard irrigation and field hygiene. If any leaf abnormalities are observed, scan a foliar photo below to cross-check.`;
    }
  } else if (!isSuitableSpecimen) {
    // Unsuitable specimen (e.g. harvested produce)
    synthesisType = 'unsuitable-specimen';
    badgeText = 'Specimen Incompatible';
    badgeColor = 'red';
    title = 'Foliar Weather Risk Paused: Non-Foliar Specimen Uploaded';
    explanation = `The uploaded image depicts harvested produce or a non-foliar view. The Rain Maker early warning engine is calibrated for living foliar canopy blights. Weather-based canopy risk cannot be correlated with post-harvest produce.`;
    actionRecommendation = 'Photograph an attached, living leaf from the field plot to evaluate canopy disease risk.';
  } else if (!hasUserSymptoms) {
    // Leaf uploaded with 0 symptoms
    if (weatherRiskCategory === RISK_CATEGORIES.ELEVATED) {
      synthesisType = 'pre-symptomatic';
      badgeText = 'Pre-Symptomatic Alert';
      badgeColor = 'amber';
      title = `Elevated Micro-Climate Risk + Healthy/Asymptomatic Leaf Reported`;
      explanation = `CRITICAL WINDOW: The ambient weather forecast strongly favors ${targetDisease} development, but you reported zero visible foliar symptoms on your photo. This suggests your crop is currently in the pre-symptomatic incubation phase or that infection has not yet taken hold.`;
      actionRecommendation = `Proactive cultural protection is most effective right now. Aerate crop rows, ensure drainage is open, avoid working in damp foliage, and inspect lower canopy leaves again in 48 hours.`;
    } else {
      synthesisType = 'baseline';
      badgeText = 'Asymptomatic Status';
      badgeColor = 'green';
      title = `Low Weather Pressure + No Foliar Symptoms Reported`;
      explanation = `Neither atmospheric conditions nor visual leaf observations indicate active disease pressure on ${cropName} in ${locationName}.`;
      actionRecommendation = 'Continue routine weekly crop monitoring and standard irrigation schedules.';
    }
  } else {
    // Leaf uploaded with symptoms
    if (weatherRiskCategory === RISK_CATEGORIES.ELEVATED && candidateDiseases.length > 0) {
      synthesisType = 'concurrent';
      badgeText = 'Concurrent Threat';
      badgeColor = 'red';
      title = `Concurrent Threat: Elevated Weather Risk + Matching Foliar Symptoms`;
      explanation = `HIGH CONVERGENCE: Both independent diagnostic streams align. Your reported foliar symptoms correlate with ${topCandidate}, and the local Open-Meteo telemetry is concurrently forecasting sustained humidity and temperatures favorable for ${targetDisease}.`;
      actionRecommendation = `1. Isolate the affected plot section immediately.\n2. Do NOT enter wet rows to prevent manual spore dissemination.\n3. Take physical leaf samples to your local Krishi Vigyan Kendra (KVK) or extension agronomist for laboratory confirmation.`;
    } else if (weatherRiskCategory === RISK_CATEGORIES.LOW && candidateDiseases.length > 0) {
      synthesisType = 'legacy-or-abiotic';
      badgeText = 'Legacy / Abiotic Stress';
      badgeColor = 'blue';
      title = `Foliar Symptoms Present Under Currently Dry Weather`;
      explanation = `Visual foliar symptoms (${topCandidate}) were observed, but current meteorological parameters are dry. This pattern frequently indicates: (a) a legacy infection initiated during an earlier wet period, (b) abiotic nutritional stress (such as magnesium or potassium deficiency), or (c) sunscald.`;
      actionRecommendation = `Avoid indiscriminate fungicide spraying while atmospheric humidity is low. Verify soil fertility and inspect whether lesions are expanding or dry and static.`;
    } else {
      synthesisType = 'moderate-alignment';
      badgeText = 'Active Monitoring';
      badgeColor = 'amber';
      title = `Moderate Micro-Climate Risk with Observable Symptoms`;
      explanation = `Moderate weather pressure coincides with user-reported visual symptoms (${topCandidate}). Pathogen spread is possible if humidity rises.`;
      actionRecommendation = `Monitor lesion margins daily. Ensure morning-only irrigation so foliage dries rapidly before evening.`;
    }
  }

  const getBadgeClass = (color) => {
    switch (color) {
      case 'red':
        return 'badge-red';
      case 'amber':
        return 'badge-amber';
      case 'blue':
        return 'badge-blue';
      case 'green':
      default:
        return 'badge-green';
    }
  };

  return (
    <section className="cross-evidence-section" aria-labelledby="cross-evidence-heading">
      <div className="section-header-row">
        <div>
          <div className="title-with-pill">
            <h2 id="cross-evidence-heading" className="section-title">
              Multi-Factor Evidence Synthesis
            </h2>
            <span className={`synthesis-badge ${getBadgeClass(badgeColor)}`}>
              {badgeText}
            </span>
          </div>
          <p className="section-subtitle">
            Correlating live Open-Meteo micro-climate risk with plant-level foliar observations.
          </p>
        </div>
        <div className="synthesis-meta-tag">
          <IconInfo size={13} />
          <span>Independent Dual-Signal Synthesis</span>
        </div>
      </div>

      <div className="cross-evidence-card">
        {/* Signal comparison columns */}
        <div className="signals-comparison-grid">
          {/* Signal 1: Weather Micro-Climate Engine */}
          <div className="signal-box">
            <div className="signal-header">
              <span className="signal-num">Signal 1</span>
              <span className="signal-name">Micro-Climate Risk Engine</span>
            </div>
            <div className="signal-status-row">
              <span className="signal-val-label">Risk Category:</span>
              <strong className={`signal-status-val status-${weatherRiskCategory.toLowerCase().split(' ')[0]}`}>
                {weatherRiskCategory}
              </strong>
            </div>
            <div className="signal-details">
              <div className="sig-detail-row">
                <span>Target Pathogen:</span>
                <strong>{targetDisease}</strong>
              </div>
              <div className="sig-detail-row">
                <span>Forecast Source:</span>
                <strong>{cropRisk?.dataFreshness || 'Open-Meteo'}</strong>
              </div>
              <div className="sig-detail-row">
                <span>Model Basis:</span>
                <span className="sig-basis">{cropRisk?.scientificBasis || 'Agronomic Heuristics'}</span>
              </div>
            </div>
          </div>

          {/* Synthesis Bridge Operator */}
          <div className="synthesis-operator-box">
            <span className="operator-icon">➕</span>
            <span className="operator-text">CORRELATED WITH</span>
          </div>

          {/* Signal 2: Foliar Symptom Observations */}
          <div className="signal-box">
            <div className="signal-header">
              <span className="signal-num">Signal 2</span>
              <span className="signal-name">Foliar Specimen & Symptoms</span>
            </div>
            <div className="signal-status-row">
              <span className="signal-val-label">Observation Status:</span>
              <strong className="signal-status-val">
                {!hasImage
                  ? 'No Photo Analyzed Yet'
                  : !isSuitableSpecimen
                  ? 'Unsuitable Specimen'
                  : hasUserSymptoms
                  ? `${candidateDiseases.length} Disease Candidates Matched`
                  : 'Asymptomatic (No Symptoms Reported)'}
              </strong>
            </div>
            <div className="signal-details">
              <div className="sig-detail-row">
                <span>Specimen View:</span>
                <strong>{imageAnalysis?.specimenLabel || 'Pending Upload'}</strong>
              </div>
              <div className="sig-detail-row">
                <span>Top Candidate:</span>
                <strong>{topCandidate || 'None'}</strong>
              </div>
              <div className="sig-detail-row">
                <span>Inference Mode:</span>
                <span className="sig-basis">Transparent Rule Matcher (Demo)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Synthesized Conclusion Box */}
        <div className={`synthesis-result-panel panel-${synthesisType}`}>
          <div className="synthesis-result-header">
            {synthesisType === 'concurrent' ? (
              <IconShieldAlert size={22} className="synth-icon synth-icon-alert" />
            ) : synthesisType === 'pre-symptomatic' ? (
              <IconLeaf size={22} className="synth-icon synth-icon-watch" />
            ) : (
              <IconShieldCheck size={22} className="synth-icon synth-icon-check" />
            )}
            <div className="synth-title-box">
              <h3 className="synth-title">{title}</h3>
              <span className="synth-sub">Plot: {cropName} • Station: {locationName}</span>
            </div>
          </div>

          <p className="synth-explanation">{explanation}</p>

          <div className="synth-action-box">
            <span className="synth-action-tag">Recommended Strategic Response:</span>
            <p className="synth-action-text">{actionRecommendation}</p>
          </div>

          {/* Uncertainty & Boundary Guardrail */}
          <div className="synth-boundary-notice">
            <IconInfo size={14} className="boundary-icon" />
            <p className="boundary-text">
              <strong>Transparency Guardrail:</strong> Rain Maker strictly avoids merging independent signals into a single unscientific &quot;black box&quot; score. A high-risk weather forecast does not automatically infect a crop, and a visual symptom match does not replace laboratory culture or PCR testing. Always confirm high-risk alerts with your local agricultural extension service.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
