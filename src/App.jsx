import { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WeatherMetrics from './components/WeatherMetrics';
import CropHealthSection from './components/CropHealthSection';
import CropImageScanner from './components/CropImageScanner';
import CrossEvidenceSynthesizer from './components/CrossEvidenceSynthesizer';
import AdvisorySection from './components/AdvisorySection';
import DisclaimerBanner from './components/DisclaimerBanner';
import { fetchOpenMeteoWeather } from './services/weatherService';
import { estimateDiseaseRisk } from './services/diseaseRiskEngine.js';
import { generateFarmerAdvisories } from './services/advisoryService.js';
import { 
  SAMPLE_LOCATIONS, 
  SAMPLE_CROPS 
} from './data/sampleData';
import './App.css';

function App() {
  const [selectedLocationId, setSelectedLocationId] = useState('loc-1');
  const [selectedCropId, setSelectedCropId] = useState('potato');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live Weather API state
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherApiError, setWeatherApiError] = useState(null);

  // Crop image analysis state (shared across dashboard)
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null);

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

  // PHASE 1: Dedicated Disease Risk Assessment for Selected Crop (evaluated from live weather)
  const activeCropRiskAssessment = useMemo(() => {
    return estimateDiseaseRisk(selectedCropId, liveWeather);
  }, [selectedCropId, liveWeather]);

  // Dynamic Risk Map for all crops in the current location (for the crop tabs grid)
  const allCropsRiskMap = useMemo(() => {
    const map = {};
    SAMPLE_CROPS.forEach((crop) => {
      map[crop.id] = estimateDiseaseRisk(crop.id, liveWeather);
    });
    return map;
  }, [liveWeather]);

  // PHASE 2 & 4: Dedicated Farmer Advisories (synthesizing risk assessment, weather, and image findings)
  const farmerAdvisories = useMemo(() => {
    return generateFarmerAdvisories({
      cropRisk: activeCropRiskAssessment,
      weather: liveWeather,
      cropName: activeCrop.name,
      imageAnalysis: imageAnalysisResult,
    });
  }, [activeCropRiskAssessment, liveWeather, activeCrop.name, imageAnalysisResult]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'scanner') {
      const el = document.getElementById('crop-scanner-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'crops') {
      const el = document.getElementById('crop-health-heading');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'weather') {
      const el = document.getElementById('weather-metrics-heading');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'risk') {
      const el = document.getElementById('cross-evidence-heading') || document.getElementById('crop-health-heading');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'advisories') {
      const el = document.getElementById('advisory-heading');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Executive Badge class helper
  const getExecBadgeClass = (category) => {
    switch (category) {
      case 'Elevated':
        return 'exec-badge-high';
      case 'Moderate':
        return 'exec-badge-medium';
      case 'Undetermined (Data Incomplete)':
        return 'exec-badge-incomplete';
      case 'Low':
      default:
        return 'exec-badge-low';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Area */}
      <div className="main-viewport">
        {/* Top Sample Prototype Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Global Dashboard Header & Location Selector */}
        <Header 
          locations={SAMPLE_LOCATIONS}
          selectedLocationId={selectedLocationId}
          onSelectLocation={setSelectedLocationId}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="dashboard-content-container">
          {/* Executive Quick Stats Banner */}
          <div className="executive-summary-strip">
            <div className="exec-item">
              <span className="exec-label">Monitored Agri Zone</span>
              <strong className="exec-val">{activeLocation.name}</strong>
            </div>
            <div className="exec-divider"></div>
            <div className="exec-item">
              <span className="exec-label">Selected Crop Plot</span>
              <strong className="exec-val">{activeCrop.name} ({activeCrop.icon})</strong>
            </div>
            <div className="exec-divider"></div>
            <div className="exec-item">
              <span className="exec-label">Disease Early Warning Status</span>
              <span className={`exec-badge ${getExecBadgeClass(activeCropRiskAssessment.riskCategory)}`}>
                {activeCropRiskAssessment.riskCategory} Risk
                {activeCropRiskAssessment.riskScore !== null ? ` (${activeCropRiskAssessment.riskScore} Index)` : ''}
              </span>
            </div>
            <div className="exec-divider"></div>
            <div className="exec-item">
              <span className="exec-label">Incubation Vulnerability Watch</span>
              <span className="exec-threat">{activeCropRiskAssessment.targetDisease}</span>
            </div>
          </div>

          {/* Core Module 1: Weather & Micro-Climate Metrics (Real API + Hourly Forecast) */}
          <WeatherMetrics 
            weather={activeLocation.weather}
            liveWeather={liveWeather}
            isLoading={isLoadingWeather}
            apiError={weatherApiError}
            onRetry={handleRefreshWeather}
            locationName={activeLocation.name}
          />

          {/* Core Module 2: Crop Health & Disease Risk Assessment Engine (Live Agronomic Rules) */}
          <CropHealthSection 
            crops={SAMPLE_CROPS}
            selectedCropId={selectedCropId}
            onSelectCrop={setSelectedCropId}
            locationCropData={activeLocation.crops}
            cropRiskAssessment={activeCropRiskAssessment}
            allCropsRiskMap={allCropsRiskMap}
          />

          {/* Core Module 3: Crop Image & Foliar Symptom Analyzer (Demo Mode with AI Architecture Blueprint) */}
          <CropImageScanner 
            activeCropId={selectedCropId}
            onCropChange={setSelectedCropId}
            onAnalysisResultChange={setImageAnalysisResult}
          />

          {/* Core Module 4: Multi-Factor Evidence Synthesizer (Cross-Correlating Weather Risk + Foliar Findings) */}
          <CrossEvidenceSynthesizer 
            cropRisk={activeCropRiskAssessment}
            imageAnalysis={imageAnalysisResult}
            cropName={activeCrop.name}
            locationName={activeLocation.name}
          />

          {/* Core Module 5: Prioritized Preventive Advisories & Action Plans */}
          <AdvisorySection 
            advisories={farmerAdvisories}
            selectedCropName={activeCrop.name}
            dataFreshness={activeCropRiskAssessment.dataFreshness}
          />
        </main>

        {/* Dashboard Footer */}
        <footer className="dashboard-footer">
          <div className="footer-content">
            <div className="footer-left">
              <strong>Rain Maker</strong> — Micro-Climatic Crop Disease Early Warning System
              <p className="footer-credit">Built for Agricultural Innovation Hackathon • Open-Meteo Integration • Multi-Factor Agronomic Risk Modeling</p>
            </div>
            <div className="footer-right">
              <span className="footer-badge">Rain Maker Full Integration</span>
              <span className="footer-sub">Live Atmospheric Models • Disease Risk Engine • Farmer Advisories</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
