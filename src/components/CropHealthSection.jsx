import React from 'react';
import { 
  IconShieldAlert, 
  IconShieldCheck, 
  IconLeaf, 
  IconInfo 
} from './Icons';
import { useApp } from '../context/useApp';

export default function CropHealthSection({ 
  crops, 
  selectedCropId, 
  onSelectCrop, 
  locationCropData = {},
  cropRiskAssessment = null,
  allCropsRiskMap = {}
}) {
  const { t } = useApp();
  const currentCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  // Determine active risk data: prioritize live cropRiskAssessment if available
  const hasLiveRisk = Boolean(cropRiskAssessment);
  const isDataIncomplete = Boolean(cropRiskAssessment?.isDataIncomplete);
  const activeRiskCategory = hasLiveRisk 
    ? cropRiskAssessment.riskCategory 
    : (locationCropData[selectedCropId]?.riskLevel || 'Low');
  const activeRiskScore = hasLiveRisk 
    ? cropRiskAssessment.riskScore 
    : (locationCropData[selectedCropId]?.riskScore ?? 20);
  const activeDiseaseWatch = hasLiveRisk 
    ? cropRiskAssessment.targetDisease 
    : (locationCropData[selectedCropId]?.diseaseWatch || 'General Canopy Health');
  const activeExplanation = hasLiveRisk 
    ? cropRiskAssessment.explanation 
    : (locationCropData[selectedCropId]?.microClimaticFactor || 'Conditions remain within normal vegetative ranges.');
  const activeFactors = hasLiveRisk 
    ? cropRiskAssessment.contributingWeatherFactors 
    : [];
  const activeUncertainties = hasLiveRisk 
    ? cropRiskAssessment.uncertaintyWarnings 
    : [];

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'High':
      case 'Elevated':
        return 'risk-badge-high';
      case 'Medium':
      case 'Moderate':
        return 'risk-badge-medium';
      case 'Undetermined (Data Incomplete)':
        return 'risk-badge-incomplete';
      case 'Low':
      default:
        return 'risk-badge-low';
    }
  };

  const getGaugeFillClass = (level) => {
    switch (level) {
      case 'High':
      case 'Elevated':
        return 'risk-fill-high';
      case 'Medium':
      case 'Moderate':
        return 'risk-fill-medium';
      default:
        return 'risk-fill-low';
    }
  };

  const getLocalizedRiskCategory = (category) => {
    switch (category) {
      case 'Elevated':
      case 'High':
        return t('riskElevated');
      case 'Moderate':
      case 'Medium':
        return t('riskModerate');
      case 'Undetermined (Data Incomplete)':
        return t('riskUndetermined');
      case 'Low':
      default:
        return t('riskLow');
    }
  };

  const getLocalizedCropName = (cropId, fallbackName) => {
    switch (cropId) {
      case 'potato': return t('cropPotato');
      case 'tomato': return t('cropTomato');
      case 'rice': return t('cropRice');
      case 'wheat': return t('cropWheat');
      default: return fallbackName;
    }
  };

  return (
    <section className="crop-health-section" aria-labelledby="crop-health-heading">
      <div className="section-header-row">
        <div>
          <h2 id="crop-health-heading" className="section-title">
            {t('riskTitle')}
          </h2>
          <p className="section-subtitle">
            {t('riskSubtitle')}
          </p>
        </div>
        <div className="sample-data-badge">
          <IconInfo size={13} />
          <span>{hasLiveRisk ? cropRiskAssessment.scientificBasis : 'Demo / Sample Risk Values'}</span>
        </div>
      </div>

      {/* Selectable Crop Pills/Cards */}
      <div className="crop-tabs-grid" role="tablist" aria-label="Crop selection tabs">
        {crops.map((crop) => {
          const isSelected = crop.id === selectedCropId;
          const liveCropRisk = allCropsRiskMap[crop.id];
          const fallbackRisk = locationCropData[crop.id] || { riskLevel: 'Low', riskScore: 0, diseaseWatch: 'Foliar Health' };
          
          const riskLabel = liveCropRisk 
            ? getLocalizedRiskCategory(liveCropRisk.riskCategory)
            : `${getLocalizedRiskCategory(fallbackRisk.riskLevel)} (Demo)`;
          const diseaseLabel = liveCropRisk 
            ? liveCropRisk.targetDisease.split('(')[0].trim() 
            : fallbackRisk.diseaseWatch;
          const badgeClass = getRiskBadgeClass(liveCropRisk ? liveCropRisk.riskCategory : fallbackRisk.riskLevel);

          return (
            <button
              key={crop.id}
              role="tab"
              aria-selected={isSelected}
              className={`crop-tab-card ${isSelected ? 'crop-tab-selected' : ''}`}
              onClick={() => onSelectCrop(crop.id)}
            >
              <div className="crop-tab-top">
                <span className="crop-icon-large" role="img" aria-label={crop.name}>
                  {crop.icon}
                </span>
                <span className={`risk-pill ${badgeClass}`}>
                  {riskLabel}
                </span>
              </div>
              <div className="crop-tab-info">
                <h3 className="crop-name">{getLocalizedCropName(crop.id, crop.name)}</h3>
                <span className="crop-sci-name">{crop.scientificName}</span>
              </div>
              <div className="crop-tab-footer">
                <span className="crop-threat-label">Watch:</span>
                <span className="crop-threat-value">{diseaseLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Crop Deep-Dive Detail Panel */}
      <div className="crop-detail-panel">
        <div className="detail-panel-left">
          <div className="crop-header-summary">
            <div className="crop-title-group">
              <span className="detail-crop-avatar">{currentCrop.icon}</span>
              <div>
                <h3 className="detail-crop-heading">
                  {getLocalizedCropName(currentCrop.id, currentCrop.name)} — Pathogen Incubation Assessment
                </h3>
                <span className="detail-crop-sub">
                  Target: <strong>{activeDiseaseWatch}</strong> • Basis: {hasLiveRisk ? cropRiskAssessment.scientificBasis : 'Agronomic Rules'}
                </span>
              </div>
            </div>
            
            <div className={`risk-status-banner ${getRiskBadgeClass(activeRiskCategory)}`}>
              {activeRiskCategory === 'Elevated' || activeRiskCategory === 'High' ? (
                <IconShieldAlert size={22} />
              ) : (
                <IconShieldCheck size={22} />
              )}
              <div className="banner-text">
                <span className="banner-title">
                  {getLocalizedRiskCategory(activeRiskCategory)} {hasLiveRisk ? '(Live Weather Model)' : '(Sample Simulation)'}
                </span>
                <span className="banner-sub">
                  Target Disease: <strong>{activeDiseaseWatch}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Risk Level Gauge Bar */}
          <div className="risk-meter-box">
            <div className="meter-label-row">
              <span className="meter-label">Empirical Pathogen Incubation Index:</span>
              <span className="meter-value">
                {activeRiskScore !== null ? (
                  <><strong>{activeRiskScore}</strong> / 100 (Heuristic Index)</>
                ) : (
                  <strong>{isDataIncomplete ? 'Data Incomplete (Telemetry Offline)' : 'Data Incomplete'}</strong>
                )}
              </span>
            </div>
            
            <div className="risk-progress-track" role="progressbar" aria-valuenow={activeRiskScore ?? 0} aria-valuemin="0" aria-valuemax="100">
              {activeRiskScore !== null ? (
                <div 
                  className={`risk-progress-fill ${getGaugeFillClass(activeRiskCategory)}`}
                  style={{ width: `${activeRiskScore}%` }}
                />
              ) : (
                <div className="risk-progress-fill risk-fill-incomplete" style={{ width: '100%' }} />
              )}
            </div>

            <div className="risk-legend-row">
              <span className="legend-marker marker-low">
                <span className="legend-dot dot-low"></span> {t('riskLow')} (0–40)
              </span>
              <span className="legend-marker marker-medium">
                <span className="legend-dot dot-medium"></span> {t('riskModerate')} (41–70)
              </span>
              <span className="legend-marker marker-high">
                <span className="legend-dot dot-high"></span> {t('riskElevated')} (71–100)
              </span>
            </div>
          </div>

          {/* Micro-Climatic Correlation Explanation */}
          <div className="micro-climate-explanation">
            <h4 className="explanation-title">
              <IconLeaf size={16} />
              <span>Micro-Climatic Pathogen Driver:</span>
            </h4>
            <p className="explanation-body">
              {activeExplanation}
            </p>
          </div>

          {/* Contributing Weather Factors Strip */}
          {activeFactors.length > 0 && (
            <div className="contributing-factors-box">
              <span className="factors-label">{t('contributingFactors')}:</span>
              <ul className="factors-list">
                {activeFactors.map((factor, idx) => (
                  <li key={idx}>
                    <span className="factor-bullet">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Uncertainty Warnings */}
          {activeUncertainties.length > 0 && (
            <div className="uncertainties-notice-box">
              <span className="uncertainties-label">{t('uncertaintyNotice')}:</span>
              <ul className="uncertainties-list">
                {activeUncertainties.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right side: Key Micro-Climatic Vulnerability Parameters */}
        <div className="detail-panel-right">
          <h4 className="vulnerabilities-title">Plot Scouting Thresholds</h4>
          <div className="scouting-tip-box">
            <span className="scouting-tag">Recommended Scouting Focus</span>
            <p className="scouting-text">
              {hasLiveRisk ? cropRiskAssessment.recommendedScouting : currentCrop.scoutingFocus}
            </p>
          </div>

          {/* Preventive Actions List */}
          {hasLiveRisk && cropRiskAssessment.preventiveActions && (
            <div className="preventive-actions-mini-card">
              <span className="checklist-heading">Proactive Cultural Steps:</span>
              <ul className="mini-actions-list">
                {cropRiskAssessment.preventiveActions.slice(0, 3).map((act, i) => (
                  <li key={i}>
                    <span className="check-bullet">✓</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
