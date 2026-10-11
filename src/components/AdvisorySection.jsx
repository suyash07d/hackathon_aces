import React, { useState } from 'react';
import { IconLeaf, IconInfo } from './Icons';
import { useApp } from '../context/useApp';

export default function AdvisorySection({ 
  advisories = [], 
  selectedCropName = 'Potato',
  dataFreshness = null 
}) {
  const { t } = useApp();
  const [filterCropOnly, setFilterCropOnly] = useState(false);

  const displayedAdvisories = filterCropOnly
    ? advisories.filter((adv) => adv.applicableCrops && adv.applicableCrops.includes(selectedCropName))
    : advisories;

  const getBadgeClass = (color) => {
    switch (color) {
      case 'red':
        return 'badge-red';
      case 'amber':
        return 'badge-amber';
      case 'blue':
        return 'badge-blue';
      case 'green':
        return 'badge-green';
      default:
        return 'badge-slate';
    }
  };

  return (
    <section className="advisory-section" id="advisory-heading" aria-labelledby="advisory-section-title">
      <div className="section-header-row">
        <div>
          <h2 id="advisory-section-title" className="section-title">
            {t('advisoriesTitle')}
          </h2>
          <p className="section-subtitle">
            {t('advisoriesSubtitle')}
          </p>
        </div>
        <div className="advisory-controls">
          {dataFreshness && (
            <span className="advisory-freshness-tag">
              <IconInfo size={12} />
              <span>{dataFreshness}</span>
            </span>
          )}
          <button
            type="button"
            className={`filter-toggle-btn ${filterCropOnly ? 'btn-active' : ''}`}
            onClick={() => setFilterCropOnly(!filterCropOnly)}
            aria-pressed={filterCropOnly}
          >
            <IconLeaf size={14} />
            <span>
              {filterCropOnly 
                ? t('showingOnly', { crop: selectedCropName }) 
                : t('filterForCrop', { crop: selectedCropName })}
            </span>
          </button>
        </div>
      </div>

      <div className="advisories-grid">
        {displayedAdvisories.map((advisory) => (
          <article 
            key={advisory.id} 
            className={`advisory-card ${advisory.priority === 'urgent' ? 'card-urgent' : ''}`}
          >
            <div className="advisory-card-top">
              <span className="advisory-icon" role="img" aria-hidden="true">
                {advisory.icon || '🌱'}
              </span>
              <div className="advisory-tags">
                <span className={`advisory-badge ${getBadgeClass(advisory.badgeColor)}`}>
                  {advisory.badge}
                </span>
                <span className="advisory-category">{advisory.category}</span>
              </div>
            </div>

            <h3 className="advisory-card-title">{advisory.title}</h3>
            <p className="advisory-card-desc">{advisory.description}</p>

            {/* Contributing Weather Conditions */}
            {advisory.contributingConditions && (
              <div className="advisory-conditions-box">
                <span className="adv-sub-label">Contributing Weather Factors:</span>
                <p className="adv-sub-text">{advisory.contributingConditions}</p>
              </div>
            )}

            {/* Inspection Guidance (What & When to Scout) */}
            {advisory.inspectionGuidance && (
              <div className="advisory-scout-box">
                <span className="adv-scout-tag">Targeted Inspection Timing:</span>
                <p className="adv-scout-text">{advisory.inspectionGuidance}</p>
              </div>
            )}

            {/* Action Box */}
            <div className="advisory-action-box">
              <span className="action-tag">Recommended Action:</span>
              <p className="action-text">{advisory.recommendation}</p>
            </div>

            {/* Expert Consultation Notice */}
            {advisory.expertConsultation && (
              <div className="advisory-expert-note">
                <span className="expert-tag">When to seek expert advice:</span>
                <p className="expert-desc">{advisory.expertConsultation}</p>
              </div>
            )}

            <div className="advisory-card-footer">
              <div className="crops-footer-left">
                <span className="crops-label">Applicable:</span>
                <div className="crops-pills">
                  {advisory.applicableCrops ? advisory.applicableCrops.map((crop) => (
                    <span 
                      key={crop} 
                      className={`crop-chip ${crop === selectedCropName ? 'chip-highlight' : ''}`}
                    >
                      {crop}
                    </span>
                  )) : (
                    <span className="crop-chip chip-highlight">{selectedCropName}</span>
                  )}
                </div>
              </div>

              {advisory.forecastPeriod && (
                <span className="adv-period-pill">{advisory.forecastPeriod}</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {displayedAdvisories.length === 0 && (
        <div className="no-advisories-card">
          <p>No specific filtered alerts for {selectedCropName}. Showing all general preventive guidelines.</p>
          <button 
            type="button" 
            className="btn-text-action" 
            onClick={() => setFilterCropOnly(false)}
          >
            Reset Filter
          </button>
        </div>
      )}
    </section>
  );
}
