import React from 'react';
import { 
  IconCamera, 
  IconCloudRain, 
  IconArrowDown, 
  IconShieldAlert, 
  IconActivity, 
  IconMapPin, 
  IconSparkles,
  IconLeaf
} from './Icons';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

export default function HeroSection({
  activeLocation,
  activeCrop,
  cropRiskAssessment,
  liveWeather,
  backendAiStatus
}) {
  const currentTemp = liveWeather?.current?.temperature ?? activeLocation?.weather?.temperature ?? 24;
  const currentHumidity = liveWeather?.current?.humidity ?? activeLocation?.weather?.humidity ?? 78;
  const riskScore = cropRiskAssessment?.riskScore ?? 25;

  const animatedTemp = useAnimatedCounter(currentTemp, 1200);
  const animatedHumidity = useAnimatedCounter(currentHumidity, 1200);
  const animatedRisk = useAnimatedCounter(riskScore, 1400);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const getRiskBadgeClass = (category) => {
    switch (category) {
      case 'Elevated':
        return 'hero-badge-high';
      case 'Moderate':
        return 'hero-badge-medium';
      case 'Undetermined (Data Incomplete)':
        return 'hero-badge-incomplete';
      case 'Low':
      default:
        return 'hero-badge-low';
    }
  };

  return (
    <section className="hero-section" id="hero" aria-label="Hero Introduction">
      {/* Background Image Container with Gradient Overlays */}
      <div className="hero-bg-media">
        <img 
          src="/hero-farmer.jpg" 
          alt="Indian farmer inspecting healthy green crop leaves at golden hour"
          className="hero-bg-img"
          loading="eager"
        />
        <div className="hero-overlay-dark"></div>
        <div className="hero-overlay-ambient"></div>
      </div>

      <div className="hero-content-container">
        {/* Eyebrow Pill */}
        <div className="hero-pill-badge">
          <IconSparkles size={13} className="hero-pill-sparkle" />
          <span>PRECISION AGTECH SENTINEL • MULTI-MODAL EARLY WARNING</span>
        </div>

        {/* Headline */}
        <h1 className="hero-headline">
          Predict Crop Epidemics <br />
          <span className="hero-headline-gold">Before Spores Take Root.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-description">
          Triangulating hyper-local Open-Meteo microclimate telemetry, epidemiological pathogen incubation models, and genuine Google Gemini 3.5 multimodal vision to safeguard smallholder crop yields across India.
        </p>

        {/* Hero Action Buttons */}
        <div className="hero-cta-group">
          <button 
            type="button" 
            className="hero-btn-primary"
            onClick={() => scrollTo('scanner')}
          >
            <IconCamera size={19} />
            <span>Inspect Crop Foliage</span>
          </button>

          <button 
            type="button" 
            className="hero-btn-secondary"
            onClick={() => scrollTo('weather')}
          >
            <IconCloudRain size={19} />
            <span>Live Microclimate Telemetry</span>
          </button>
        </div>

        {/* Ambient Floating Live Metric SaaS Cards */}
        <div className="hero-telemetry-grid">
          {/* Card 1: Active Agri Station */}
          <div className="hero-stat-card">
            <div className="hero-stat-header">
              <span className="hero-stat-icon-wrap stat-icon-blue">
                <IconMapPin size={16} />
              </span>
              <span className="hero-stat-label">Telemetry Station</span>
            </div>
            <div className="hero-stat-body">
              <strong className="hero-stat-value">{activeLocation?.name || 'Agri Zone'}</strong>
              <span className="hero-stat-sub">
                {animatedTemp}°C • {animatedHumidity}% RH
              </span>
            </div>
          </div>

          {/* Card 2: Monitored Crop Plot */}
          <div className="hero-stat-card">
            <div className="hero-stat-header">
              <span className="hero-stat-icon-wrap stat-icon-green">
                <IconLeaf size={16} />
              </span>
              <span className="hero-stat-label">Active Crop Plot</span>
            </div>
            <div className="hero-stat-body">
              <strong className="hero-stat-value">
                {activeCrop?.name} {activeCrop?.icon}
              </strong>
              <div className="hero-stat-badge-row">
                <span className={`hero-stat-pill ${getRiskBadgeClass(cropRiskAssessment?.riskCategory)}`}>
                  {cropRiskAssessment?.riskCategory || 'Low'} Risk
                  {cropRiskAssessment?.riskScore !== null ? ` (${animatedRisk})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Target Disease Vulnerability */}
          <div className="hero-stat-card">
            <div className="hero-stat-header">
              <span className="hero-stat-icon-wrap stat-icon-gold">
                <IconShieldAlert size={16} />
              </span>
              <span className="hero-stat-label">Incubation Watch</span>
            </div>
            <div className="hero-stat-body">
              <strong className="hero-stat-value text-truncate">
                {cropRiskAssessment?.targetDisease || 'General Canopy Watch'}
              </strong>
              <span className="hero-stat-sub">
                Bio-meteorological spore threshold
              </span>
            </div>
          </div>

          {/* Card 4: AI Diagnostic Engine */}
          <div className="hero-stat-card">
            <div className="hero-stat-header">
              <span className="hero-stat-icon-wrap stat-icon-emerald">
                <IconActivity size={16} />
              </span>
              <span className="hero-stat-label">Diagnostic Pipeline</span>
            </div>
            <div className="hero-stat-body">
              <strong className="hero-stat-value">
                {backendAiStatus?.isOnline && backendAiStatus?.geminiConfigured
                  ? 'Gemini 3.5 Multimodal'
                  : 'Automated Heuristic Engine'}
              </strong>
              <span className="hero-stat-sub">
                {backendAiStatus?.isOnline && backendAiStatus?.geminiConfigured
                  ? 'Live Neural Vision Ready'
                  : 'Transparent Rule Matcher'}
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          type="button" 
          className="hero-scroll-indicator"
          onClick={() => scrollTo('weather')}
          aria-label="Scroll down to telemetry section"
        >
          <span className="scroll-indicator-text">Explore System Sentinel</span>
          <span className="scroll-chevron-bounce">
            <IconArrowDown size={18} />
          </span>
        </button>
      </div>
    </section>
  );
}
