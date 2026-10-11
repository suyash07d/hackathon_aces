import { useState, useMemo, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import WeatherMetrics from './components/WeatherMetrics';
import CropHealthSection from './components/CropHealthSection';
import CropImageScanner from './components/CropImageScanner';
import CropRecoveryTracker from './components/CropRecoveryTracker';
import VoiceFarmerAssistant from './components/VoiceFarmerAssistant';
import CrossEvidenceSynthesizer from './components/CrossEvidenceSynthesizer';
import AdvisorySection from './components/AdvisorySection';
import HowItWorksSection from './components/HowItWorksSection';
import Footer from './components/Footer';
import DisclaimerBanner from './components/DisclaimerBanner';
import ScanHistoryDrawer from './components/ScanHistoryDrawer';
import { fetchOpenMeteoWeather } from './services/weatherService';
import { estimateDiseaseRisk } from './services/diseaseRiskEngine.js';
import { generateFarmerAdvisories } from './services/advisoryService.js';
import { checkBackendAiStatus } from './services/imageAnalysisService.js';
import { useScrollReveal } from './hooks/useScrollReveal';
import { useApp } from './context/useApp';
import { 
  SAMPLE_LOCATIONS, 
  SAMPLE_CROPS 
} from './data/sampleData';
import { IconMapPin, IconActivity, IconCloudRain, IconShieldAlert, IconCamera, IconInfo } from './components/Icons';
import './App.css';

function App() {
  const { t, language } = useApp();
  const [selectedLocationId, setSelectedLocationId] = useState('loc-1');
  const [selectedCropId, setSelectedCropId] = useState('potato');

  // Live Weather API state
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherApiError, setWeatherApiError] = useState(null);

  // Crop image analysis state (shared across system)
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null);

  // Global scan history drawer open state (accessible via Navbar or Scanner)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Live Backend AI connectivity status
  const [backendAiStatus, setBackendAiStatus] = useState({ 
    isOnline: false, 
    geminiConfigured: false, 
    model: null 
  });

  // Enable scroll reveal animations across sections
  useScrollReveal();

  // Check backend Gemini status on mount
  useEffect(() => {
    checkBackendAiStatus().then((status) => {
      setBackendAiStatus(status);
    });
  }, []);

  // Active Location Data
  const activeLocation = useMemo(() => {
    return SAMPLE_LOCATIONS.find((loc) => loc.id === selectedLocationId) || SAMPLE_LOCATIONS[0];
  }, [selectedLocationId]);

  // Active Crop Info
  const activeCrop = useMemo(() => {
    return SAMPLE_CROPS.find((crop) => crop.id === selectedCropId) || SAMPLE_CROPS[0];
  }, [selectedCropId]);

  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefreshWeather = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  // Synchronize weather state with Open-Meteo API when location or refreshCount changes
  useEffect(() => {
    let ignore = false;
    const { latitude, longitude } = activeLocation;

    if (!latitude || !longitude) {
      return;
    }

    Promise.resolve().then(() => {
      if (!ignore) {
        setIsLoadingWeather(true);
        setWeatherApiError(null);
      }
    });

    fetchOpenMeteoWeather(latitude, longitude)
      .then((data) => {
        if (!ignore) {
          setLiveWeather(data);
          setIsLoadingWeather(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.warn('Weather fetch encountered an issue, falling back to simulated baseline:', err);
          setWeatherApiError(err.message || 'Unable to fetch Open-Meteo forecast data.');
          setIsLoadingWeather(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeLocation, refreshCount]);

  // Dedicated Disease Risk Assessment for Selected Crop (evaluated from live weather)
  const activeCropRiskAssessment = useMemo(() => {
    return estimateDiseaseRisk(selectedCropId, liveWeather);
  }, [selectedCropId, liveWeather]);

  // Dynamic Risk Map for all crops in the current location (for crop tabs grid)
  const allCropsRiskMap = useMemo(() => {
    const map = {};
    SAMPLE_CROPS.forEach((crop) => {
      map[crop.id] = estimateDiseaseRisk(crop.id, liveWeather);
    });
    return map;
  }, [liveWeather]);

  // Dedicated Farmer Advisories (synthesizing risk assessment, weather, and image findings)
  const farmerAdvisories = useMemo(() => {
    return generateFarmerAdvisories({
      cropRisk: activeCropRiskAssessment,
      weather: liveWeather,
      cropName: activeCrop.name,
      imageAnalysis: imageAnalysisResult,
    });
  }, [activeCropRiskAssessment, liveWeather, activeCrop.name, imageAnalysisResult]);

  // Handler for selecting past scan from history drawer
  const handleSelectPastScan = useCallback((pastResult) => {
    if (!pastResult) return;
    setImageAnalysisResult(pastResult);
    if (pastResult.cropId) {
      setSelectedCropId(pastResult.cropId);
    }
    // Scroll down to the scanner report
    const scannerEl = document.getElementById('scanner');
    if (scannerEl) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = scannerEl.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div className="saas-app-layout">
      {/* 1. Transparent / Glass-Effect Sticky Navbar */}
      <Navbar 
        locations={SAMPLE_LOCATIONS}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
        backendAiStatus={backendAiStatus}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
      />

      {/* 2. Full-Screen Cinematic Hero Section */}
      <HeroSection 
        activeLocation={activeLocation}
        activeCrop={activeCrop}
        cropRiskAssessment={activeCropRiskAssessment}
        liveWeather={liveWeather}
        backendAiStatus={backendAiStatus}
      />

      {/* 3. Top Prototype Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 4. Progressive Content Sections */}
      <main className="saas-main-flow">
        {/* SECTION 1: LIVE WEATHER & MICRO-CLIMATE TELEMETRY */}
        <section className="saas-section" id="weather" aria-labelledby="weather-section-heading">
          <div className="section-container">
            <div className="saas-section-header reveal-on-scroll">
              <div className="section-badge-pill pill-blue">
                <IconCloudRain size={13} />
                <span>{t('weatherBadge')}</span>
              </div>
              <h2 id="weather-section-heading" className="saas-section-title">
                {t('weatherTitle')}
              </h2>
              <p className="saas-section-subtitle">
                {t('weatherSubtitle', { location: activeLocation.name, state: activeLocation.state })}
              </p>
            </div>

            {/* In-Section Quick Location Bar */}
            <div className="section-location-bar reveal-on-scroll">
              <div className="slb-left">
                <IconMapPin size={16} className="slb-icon" />
                <span className="slb-label">{t('switchStation')}</span>
              </div>
              <div className="slb-pills">
                {SAMPLE_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className={`slb-pill-btn ${selectedLocationId === loc.id ? 'active' : ''}`}
                    onClick={() => setSelectedLocationId(loc.id)}
                  >
                    <span>{loc.name}</span>
                    <span className="slb-pill-state">({loc.state})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="reveal-on-scroll">
              <WeatherMetrics 
                weather={activeLocation.weather}
                liveWeather={liveWeather}
                isLoading={isLoadingWeather}
                apiError={weatherApiError}
                onRetry={handleRefreshWeather}
                locationName={activeLocation.name}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: CROP DISEASE RISK OVERVIEW */}
        <section className="saas-section section-bg-subtle" id="risk" aria-labelledby="risk-section-heading">
          <div className="section-container">
            <div className="saas-section-header reveal-on-scroll">
              <div className="section-badge-pill pill-gold">
                <IconShieldAlert size={13} />
                <span>{t('riskBadge')}</span>
              </div>
              <h2 id="risk-section-heading" className="saas-section-title">
                {t('riskTitle')}
              </h2>
              <p className="saas-section-subtitle">
                {t('riskSubtitle')}
              </p>
            </div>

            <div className="reveal-on-scroll">
              <CropHealthSection 
                crops={SAMPLE_CROPS}
                selectedCropId={selectedCropId}
                onSelectCrop={setSelectedCropId}
                locationCropData={activeLocation.crops}
                cropRiskAssessment={activeCropRiskAssessment}
                allCropsRiskMap={allCropsRiskMap}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: AI CROP IMAGE SCANNER */}
        <section className="saas-section" id="scanner" aria-labelledby="scanner-section-heading">
          <div className="section-container">
            <div className="saas-section-header reveal-on-scroll">
              <div className="section-badge-pill pill-green">
                <IconCamera size={13} />
                <span>{t('scannerBadge')}</span>
              </div>
              <h2 id="scanner-section-heading" className="saas-section-title">
                {t('scannerTitle')}
              </h2>
              <p className="saas-section-subtitle">
                {t('scannerSubtitle')}
              </p>
            </div>

            <div className="reveal-on-scroll">
              <CropImageScanner 
                activeCropId={selectedCropId}
                onCropChange={setSelectedCropId}
                onAnalysisResultChange={setImageAnalysisResult}
                liveWeather={liveWeather}
                onOpenTracker={() => {
                  const el = document.getElementById('recovery-tracker-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3B: CROP RECOVERY TIMELINE TRACKER (Priority 4 Feature) */}
        <section className="saas-section section-bg-subtle" id="recovery-tracker-section" aria-labelledby="tracker-section-heading">
          <div className="section-container reveal-on-scroll">
            <CropRecoveryTracker 
              activeCropId={selectedCropId}
              currentScanResult={imageAnalysisResult}
              liveWeather={liveWeather}
            />
          </div>
        </section>

        {/* SECTION 4: CROSS-EVIDENCE ANALYSIS */}
        <section className="saas-section section-bg-subtle" id="synthesis" aria-labelledby="synthesis-section-heading">
          <div className="section-container">
            <div className="saas-section-header reveal-on-scroll">
              <div className="section-badge-pill pill-indigo">
                <IconActivity size={13} />
                <span>{t('crossEvidenceBadge')}</span>
              </div>
              <h2 id="synthesis-section-heading" className="saas-section-title">
                {t('crossEvidenceTitle')}
              </h2>
              <p className="saas-section-subtitle">
                {t('crossEvidenceSubtitle')}
              </p>
            </div>

            <div className="reveal-on-scroll">
              <CrossEvidenceSynthesizer 
                cropRisk={activeCropRiskAssessment}
                imageAnalysis={imageAnalysisResult}
                cropName={activeCrop.name}
                locationName={activeLocation.name}
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: FARMER ADVISORIES AND RECOMMENDED ACTIONS */}
        <section className="saas-section" id="advisories" aria-labelledby="advisories-section-heading">
          <div className="section-container">
            <div className="saas-section-header reveal-on-scroll">
              <div className="section-badge-pill pill-emerald">
                <IconInfo size={13} />
                <span>{t('advisoriesBadge')}</span>
              </div>
              <h2 id="advisories-section-heading" className="saas-section-title">
                {t('advisoriesTitle')}
              </h2>
              <p className="saas-section-subtitle">
                {t('advisoriesSubtitle')}
              </p>
            </div>

            <div className="reveal-on-scroll">
              <AdvisorySection 
                advisories={farmerAdvisories}
                selectedCropName={activeCrop.name}
                dataFreshness={activeCropRiskAssessment.dataFreshness}
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: HOW RAIN MAKER WORKS */}
        <HowItWorksSection />
      </main>

      {/* 5. Deep Forest Green SaaS Footer */}
      <Footer />

      {/* Global Scan History Drawer (Feature 8) */}
      <ScanHistoryDrawer 
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onSelectScan={handleSelectPastScan}
      />

      {/* Voice-First Multilingual Farmer Assistant Widget (Priority 7) */}
      <VoiceFarmerAssistant 
        key={language}
        currentCropId={selectedCropId}
        currentCropName={activeCrop.name}
        latestScan={imageAnalysisResult}
        liveWeather={liveWeather}
        activeLocationName={activeLocation.name}
      />
    </div>
  );
}

export default App;
