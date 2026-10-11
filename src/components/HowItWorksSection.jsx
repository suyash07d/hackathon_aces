import React from 'react';
import { 
  IconCloudRain, 
  IconActivity, 
  IconCamera, 
  IconShieldCheck, 
  IconArrowRight,
  IconSparkles,
  IconInfo
} from './Icons';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Hyper-Local Atmospheric Telemetry',
      badge: 'Live Open-Meteo',
      icon: IconCloudRain,
      iconTheme: 'step-icon-blue',
      description: 'Continuous ingestion of microclimate vectors including hourly air temperature, relative humidity, dew point depression, precipitation, and wind vectors across target agricultural zones in India.',
      tag: 'Macro-Forecast Layer'
    },
    {
      number: '02',
      title: 'Bio-Meteorological Incubation Engine',
      badge: 'Pathogen Epidemiology',
      icon: IconActivity,
      iconTheme: 'step-icon-amber',
      description: 'Algorithmic calculation of fungal and bacterial incubation windows (e.g. Smith Periods for Phytophthora infestans and blast humidity thresholds) before macroscopic lesions become visible.',
      tag: 'Pre-Symptomatic Window'
    },
    {
      number: '03',
      title: 'Google Gemini 3.5 Multimodal Vision',
      badge: 'Neural Canopy AI',
      icon: IconCamera,
      iconTheme: 'step-icon-green',
      description: 'Deep multimodal visual inspection of uploaded leaf photographs. Gemini detects concentric lesion patterns, margins, and chlorosis while filtering out non-foliar specimens (like harvested tubers).',
      tag: 'Pixel-Level Evidence'
    },
    {
      number: '04',
      title: 'Cross-Evidence Synthesis & Guidance',
      badge: 'Decision Support',
      icon: IconShieldCheck,
      iconTheme: 'step-icon-gold',
      description: 'Triangulation of microclimate incubation indices with observed foliar lesion evidence. Generates prioritized preventive cultural advisories and direct Krishi Vigyan Kendra (KVK) referral channels.',
      tag: 'Actionable Intervention'
    }
  ];

  return (
    <section className="how-it-works-section" id="how-it-works" aria-labelledby="how-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-badge-pill">
            <IconSparkles size={13} />
            <span>AGRITECH SYSTEM ARCHITECTURE</span>
          </div>
          <h2 id="how-heading" className="saas-section-title">
            The Rain Maker Diagnostic Pipeline
          </h2>
          <p className="saas-section-subtitle">
            How our four-stage multi-factor early warning architecture bridges atmospheric physics and phytopathology to protect crop yields.
          </p>
        </div>

        {/* 4-Step Cards Grid */}
        <div className="steps-pipeline-grid">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="step-pipeline-card reveal-on-scroll">
                <div className="step-card-top">
                  <span className="step-card-num">{step.number}</span>
                  <span className="step-card-badge">{step.badge}</span>
                </div>

                <div className={`step-card-icon-wrap ${step.iconTheme}`}>
                  <IconComponent size={24} />
                </div>

                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.description}</p>

                <div className="step-card-footer">
                  <span className="step-card-tag">{step.tag}</span>
                  {idx < steps.length - 1 && (
                    <span className="step-connector-arrow">
                      <IconArrowRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible AI & Scientific Safeguards Banner */}
        <div className="safeguards-showcase-box reveal-on-scroll">
          <div className="safeguards-icon-col">
            <IconInfo size={24} className="safeguards-info-icon" />
          </div>
          <div className="safeguards-content-col">
            <h4 className="safeguards-title">Scientific Guardrails & Responsible Agricultural AI</h4>
            <div className="safeguards-grid">
              <div className="safeguard-item">
                <strong className="safeguard-item-title">Transparent Heuristic Fallback</strong>
                <p className="safeguard-item-desc">
                  If cloud connectivity is interrupted or API keys are unconfigured, Rain Maker automatically falls back to defensible client-side agronomic pattern matching.
                </p>
              </div>
              <div className="safeguard-item">
                <strong className="safeguard-item-title">Specimen Suitability Screening</strong>
                <p className="safeguard-item-desc">
                  The system screens uploaded images for true foliar leaves, warning users when harvested produce (e.g. dug-up tubers) or distant field shots are uploaded.
                </p>
              </div>
              <div className="safeguard-item">
                <strong className="safeguard-item-title">Strict Pesticide Safety</strong>
                <p className="safeguard-item-desc">
                  Rain Maker emphasizes cultural and preventive sanitation. We never prescribe chemical dosage amounts, directing severe threats to certified KVK extension officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
