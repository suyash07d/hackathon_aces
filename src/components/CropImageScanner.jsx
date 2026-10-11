import React, { useState, useRef, useEffect } from 'react';
import { 
  IconUpload, 
  IconCamera, 
  IconTrash, 
  IconCheck, 
  IconAlertCircle, 
  IconRefresh, 
  IconInfo, 
  IconShieldAlert,
  IconVolume,
  IconVolumeX,
  IconHistory,
  IconSparkles,
  IconWifiOff
} from './Icons';
import { 
  SYMPTOM_OPTIONS, 
  SPECIMEN_TYPES,
  SAMPLE_PRESET_IMAGES, 
  analyzeCropImage,
  checkBackendAiStatus 
} from '../services/imageAnalysisService';
import { checkImageQuality } from '../utils/imageQuality';
import { saveScanToHistory } from '../utils/scanHistory';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useApp } from '../context/useApp';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import { 
  getLocalizedDisease, 
  getLocalizedPathogen, 
  ALTERNATIVE_EXPLANATIONS_TRANSLATIONS 
} from '../i18n/diseaseTranslations';
import ScanHistoryDrawer from './ScanHistoryDrawer';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function CropImageScanner({ activeCropId, onCropChange, onAnalysisResultChange }) {
  const { t, language, setLanguage } = useApp();

  // Upload and form states
  const [selectedCrop, setSelectedCrop] = useState(activeCropId || 'potato');
  const [prevActiveCropId, setPrevActiveCropId] = useState(activeCropId);
  const [specimenType, setSpecimenType] = useState('leaf');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Image file states
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Payload, setBase64Payload] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Pre-analysis quality check state
  const [qualityCheck, setQualityCheck] = useState(null);
  const [dismissQualityWarning, setDismissQualityWarning] = useState(false);

  // Warning prompt state when user attempts to evaluate with 0 symptoms
  const [showNoSymptomsPrompt, setShowNoSymptomsPrompt] = useState(false);

  // Architecture blueprint drawer toggle
  const [showAiBackendInfo, setShowAiBackendInfo] = useState(false);

  // History drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Live Backend AI connectivity status
  const [backendAiStatus, setBackendAiStatus] = useState({ isOnline: false, geminiConfigured: false, model: null });

  // Offline network detection state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [progressStep, setProgressStep] = useState(0);

  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  // Text-To-Speech hook
  const { speak, stop: stopSpeech, isSpeaking, isSupported: isTtsSupported, voiceInfo } = useTextToSpeech(language);

  // Sync selectedCrop with activeCropId prop during render
  if (activeCropId && activeCropId !== prevActiveCropId) {
    setPrevActiveCropId(activeCropId);
    setSelectedCrop(activeCropId);
  }

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check backend Gemini status on mount
  useEffect(() => {
    checkBackendAiStatus().then((status) => {
      setBackendAiStatus(status);
    });
  }, []);

  // Cycling progress messages during active analysis (Features 1 & 7)
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setProgressStep((prev) => (prev + 1) % 4);
    }, 900);
    return () => {
      clearInterval(interval);
    };
  }, [isAnalyzing]);

  // Run image quality inspection whenever previewUrl changes
  useEffect(() => {
    if (!previewUrl) return;

    let ignore = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!ignore) {
        checkImageQuality(img).then((res) => {
          if (!ignore) {
            setQualityCheck(res);
          }
        });
      }
    };
    img.src = previewUrl;

    return () => {
      ignore = true;
    };
  }, [previewUrl]);


  // Handle file validation and loading
  const processFile = (inputFile) => {
    setUploadError(null);
    setDismissQualityWarning(false);

    if (!inputFile) return;

    if (!ALLOWED_TYPES.includes(inputFile.type.toLowerCase())) {
      setUploadError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (inputFile.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large (${(inputFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    setFile(inputFile);
    const objectUrl = URL.createObjectURL(inputFile);
    setPreviewUrl(objectUrl);

    // Read and optimize image for serverless transmission (max 1600px, JPEG 0.85)
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (!rawDataUrl || typeof rawDataUrl !== 'string') return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setBase64Payload(compressedDataUrl);
        } else {
          setBase64Payload(rawDataUrl);
        }
      };
      img.onerror = () => {
        setBase64Payload(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(inputFile);
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setBase64Payload(null);
    setUploadError(null);
    setQualityCheck(null);
    setDismissQualityWarning(false);
    setShowNoSymptomsPrompt(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle symptom pill
  const toggleSymptom = (symptomId) => {
    setShowNoSymptomsPrompt(false);
    setSelectedSymptoms((prev) => 
      prev.includes(symptomId) 
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  // Load a quick sample preset
  const handleSelectPreset = (preset) => {
    setSelectedCrop(preset.cropId);
    if (onCropChange) onCropChange(preset.cropId);
    setSpecimenType(preset.specimenType || 'leaf');
    setSelectedSymptoms(preset.symptoms);
    setNotes(preset.notes);
    setUploadError(null);
    setBase64Payload(null);
    setQualityCheck(null);
    setDismissQualityWarning(false);
    setShowNoSymptomsPrompt(false);

    // Create an inline sample canvas SVG preview for presets
    const sampleDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="${encodeURIComponent(preset.previewColor)}"/><circle cx="200" cy="150" r="80" fill="%23ffffff" fill-opacity="0.1"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="18" fill="%23ffffff">${encodeURIComponent(preset.title.split('—')[0])}</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%23e2e8f0">[Foliar Leaf Specimen Sample]</text></svg>`;

    setFile({
      name: `${preset.id}.jpg`,
      size: 1.2 * 1024 * 1024,
      type: 'image/jpeg',
    });
    setPreviewUrl(sampleDataUrl);
  };

  // Initiate analysis with validation
  const handleAnalyzeClick = () => {
    if (!file && !previewUrl) {
      setUploadError('Please select or upload a crop photo before starting the analysis.');
      return;
    }

    // If leaf specimen is selected but 0 symptoms are checked, warn the user
    if (specimenType === 'leaf' && selectedSymptoms.length === 0) {
      setShowNoSymptomsPrompt(true);
      return;
    }

    // Otherwise run directly
    executeAnalysis();
  };

  // Run analysis execution
  const executeAnalysis = async () => {
    setShowNoSymptomsPrompt(false);
    setIsAnalyzing(true);
    setUploadError(null);

    try {
      const result = await analyzeCropImage({
        cropId: selectedCrop,
        symptoms: selectedSymptoms,
        specimenType,
        notes,
        fileInfo: {
          name: file?.name || 'crop-sample.jpg',
          size: file?.size || 1024 * 1024,
          type: file?.type || 'image/jpeg',
          previewUrl,
          base64Payload,
        },
      });

      setAnalysisResult(result);
      onAnalysisResultChange?.(result);

      // Save to browser scan history (Feature 8)
      saveScanToHistory({
        cropId: selectedCrop,
        cropName: result.cropName,
        previewUrl,
        result,
        symptoms: selectedSymptoms,
      });
    } catch {
      setUploadError('Failed to complete symptom analysis. Please check network connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    stopSpeech();
    handleRemoveImage();
    setSelectedSymptoms([]);
    setSpecimenType('leaf');
    setNotes('');
    setShowNoSymptomsPrompt(false);
    setAnalysisResult(null);
    onAnalysisResultChange?.(null);
  };

  // Reload past scan from history drawer
  const handleLoadPastScan = (pastResult) => {
    if (!pastResult) return;
    setAnalysisResult(pastResult);
    if (pastResult.fileInfo?.previewUrl) {
      setPreviewUrl(pastResult.fileInfo.previewUrl);
    }
    if (pastResult.cropId) {
      setSelectedCrop(pastResult.cropId);
      if (onCropChange) onCropChange(pastResult.cropId);
    }
    if (pastResult.userReportedSymptoms) {
      // Keep symptoms aligned
    }
    onAnalysisResultChange?.(pastResult);
  };

  // Text-To-Speech speech synthesizer handler (Feature 6 & Requirement 3)
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (!analysisResult) return;

    const cropName = analysisResult.cropName;
    let topCandText = t('section2NoCandidates');
    if (analysisResult.candidates && analysisResult.candidates.length > 0) {
      const topCandObj = analysisResult.candidates[0];
      const locDisease = getLocalizedDisease(topCandObj.name, language);
      topCandText = locDisease.localizedName;
    }
    
    // Construct structured natural phrasing for farmer in active language
    let textToRead = `${t('reportHeading')}. ${cropName}. `;
    textToRead += `${t('section1ObservedTitle')}: ${analysisResult.specimenLabel}. `;
    
    if (analysisResult.hasUserSymptoms && analysisResult.userReportedSymptoms?.length > 0) {
      textToRead += `${t('section1Symptoms')} ${analysisResult.userReportedSymptoms.join(', ')}. `;
    }

    if (!analysisResult.isPlantCrop || analysisResult.validationStatus === 'unrelated_image') {
      textToRead += `${t('statusUnrelatedTitle')}. `;
    } else if (analysisResult.isHealthy) {
      textToRead += `${t('statusHealthyTitle')}. `;
    } else {
      textToRead += `${t('section2PossibleTitle')}: ${topCandText}. `;
    }

    textToRead += `${t('section5NextStepsTitle')}: ${t('actionStopWatering')} ${t('actionPruneLeaves')} `;
    textToRead += `${t('section6ExpertHelpTitle')}: ${t('kvkNotice')} ${t('kvkHelpline')}`;

    speak(textToRead);
  };

  // Helper to determine candidate qualitative evidence strength (Requirement 2)
  const getCandidateEvidence = (cand, isAiInference) => {
    if (isAiInference) {
      const tagLower = (cand.likelihoodTag || '').toLowerCase();
      if (tagLower.includes('primary')) {
        return {
          level: 3,
          label: t('evidenceStrong'),
          engine: t('evidenceGeminiVision'),
          cssClass: 'strength-strong',
        };
      }
      if (tagLower.includes('secondary')) {
        return {
          level: 2,
          label: t('evidenceModerate'),
          engine: t('evidenceGeminiVision'),
          cssClass: 'strength-moderate',
        };
      }
      return {
        level: 1,
        label: t('evidenceLow'),
        engine: t('evidenceGeminiVision'),
        cssClass: 'strength-low',
      };
    }

    const count = typeof cand.matchCount === 'number'
      ? cand.matchCount
      : (cand.matchedSymptoms?.length || 0);

    if (count >= 2) {
      return {
        level: 3,
        label: t('evidenceStrong'),
        engine: t('evidenceHeuristic'),
        cssClass: 'strength-strong',
      };
    }
    if (count === 1) {
      return {
        level: 2,
        label: t('evidenceModerate'),
        engine: t('evidenceHeuristic'),
        cssClass: 'strength-moderate',
      };
    }
    return {
      level: 1,
      label: t('evidenceLow'),
      engine: t('evidenceHeuristic'),
      cssClass: 'strength-low',
    };
  };

  // Progress status messages array
  const progressMessages = [
    t('scanStatus1'),
    t('scanStatus2'),
    t('scanStatus3'),
    t('scanStatus4'),
  ];

  // Helper for localized symptom label
  const getSymptomLabel = (symptomId) => {
    switch (symptomId) {
      case 'yellowing': return t('symYellowing');
      case 'brown_spots': return t('symBrownSpots');
      case 'water_soaked': return t('symWaterSoaked');
      case 'wilting': return t('symWilting');
      case 'white_powder': return t('symWhitePowder');
      case 'leaf_damage': return t('symLeafDamage');
      case 'curling': return t('symCurling');
      default: return symptomId;
    }
  };

  return (
    <section className="crop-scanner-section" id="crop-scanner-section" aria-labelledby="scanner-heading">
      {/* Offline Notice Banner if device loses network */}
      {!isOnline && (
        <div className="offline-warning-bar" role="alert">
          <IconWifiOff size={16} />
          <span>You are currently offline. Local heuristic inspection will continue without server vision.</span>
        </div>
      )}

      <div className="section-header-row">
        <div>
          <div className="title-with-pill">
            <h2 id="scanner-heading" className="section-title">
              {t('scannerTitle')}
            </h2>
            <span className="demo-pill">{t('scannerPrototypeMode')}</span>
          </div>
          <p className="section-subtitle">
            {t('scannerSubtitle')}
          </p>
        </div>

        <div className="scanner-header-badges-wrap">
          {/* History Drawer Trigger Button (Feature 8) */}
          <button
            type="button"
            className="btn-open-history"
            onClick={() => setIsHistoryOpen(true)}
            title={t('historyTitle')}
          >
            <IconHistory size={15} />
            <span>{t('navScanHistory')}</span>
          </button>

          {backendAiStatus.isOnline && backendAiStatus.geminiConfigured ? (
            <div className="scanner-header-badge badge-ai-configured">
              <span className="ai-dot dot-green"></span>
              <span>Gemini Vision AI: Connected ({backendAiStatus.model || 'Gemini 3.5 Flash'})</span>
            </div>
          ) : backendAiStatus.isOnline ? (
            <div className="scanner-header-badge badge-ai-unconfigured">
              <span className="ai-dot dot-amber"></span>
              <span>Backend Server: Online (GEMINI_API_KEY Not Set)</span>
            </div>
          ) : (
            <div className="scanner-header-badge badge-ai-unconfigured">
              <span className="ai-dot dot-gray"></span>
              <span>AI Vision Backend: Offline (Running Heuristic Mode)</span>
            </div>
          )}
          <button
            type="button"
            className="btn-toggle-ai-info"
            onClick={() => setShowAiBackendInfo(!showAiBackendInfo)}
            aria-expanded={showAiBackendInfo}
          >
            <IconInfo size={13} />
            <span>{showAiBackendInfo ? 'Hide Architecture' : 'AI Backend Architecture'}</span>
          </button>
        </div>
      </div>

      {/* AI Backend Integration Blueprint Drawer */}
      {showAiBackendInfo && (
        <div className="ai-backend-blueprint-card">
          <div className="blueprint-header">
            <IconInfo size={18} className="blueprint-icon" />
            <div className="blueprint-title-box">
              <strong className="blueprint-title">AI Vision Backend Architecture Specification</strong>
              <span className="blueprint-sub">Status: Connected to Google Gemini 3.5 Flash • Secure proxy pattern</span>
            </div>
          </div>
          <p className="blueprint-desc">
            To enable genuine computer-vision inference (replacing the transparent client-side heuristic pattern matcher), a secure server-side backend proxy is active at <code>POST /api/analyze-crop-vision</code> using Google official SDK. Client-side browsers never hold raw AI provider API keys.
          </p>
          <div className="blueprint-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Active Model:</span>
              <strong className="spec-val">Google Gemini 3.5 Flash (Multimodal Vision)</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">Proxy Endpoint:</span>
              <code className="spec-code">POST /api/analyze-crop-vision</code>
            </div>
            <div className="spec-item">
              <span className="spec-label">Required Secret:</span>
              <code className="spec-code">GEMINI_API_KEY</code> (Server-Side Environment Variable)
            </div>
            <div className="spec-item">
              <span className="spec-label">Payload Format:</span>
              <span className="spec-val">Multipart base64 image + cropId + userSymptoms</span>
            </div>
          </div>
        </div>
      )}

      {!analysisResult ? (
        /* UPLOAD & INPUT FORM */
        <div className="scanner-form-grid">
          {/* Left Column: Image Upload Area & Quality Guidance */}
          <div className="scanner-upload-col">
            {/* Image Quality & Suitability Guidelines Card */}
            <div className="photo-guidance-card">
              <div className="guidance-header">
                <IconCamera size={16} />
                <strong className="guidance-title">{t('guidanceTitle')}</strong>
              </div>
              <ul className="guidance-list">
                <li>
                  <span className="bullet-pass">✓</span>
                  <span>{t('guidanceRecommended')}</span>
                </li>
                <li>
                  <span className="bullet-fail">✕</span>
                  <span>{t('guidanceUnsuitable')}</span>
                </li>
              </ul>
              <div className="guidance-note">
                <IconInfo size={13} />
                <span>{t('guidanceNotice')}</span>
              </div>
            </div>

            {/* Dropzone Box with Live Scanning Laser Overlay (Feature 1) */}
            <div 
              className={`dropzone-box ${isDragging ? 'dropzone-dragging' : ''} ${previewUrl ? 'dropzone-has-image' : ''} ${isAnalyzing ? 'dropzone-analyzing' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="image-preview-wrapper" ref={imagePreviewRef}>
                  <img 
                    src={previewUrl} 
                    alt="Uploaded crop preview" 
                    className={`uploaded-image-preview ${isAnalyzing ? 'image-scanning-active' : ''}`}
                  />

                  {/* Corner HUD Reticles & Glowing Laser Scan Line (Feature 1) */}
                  <div className="scanner-hud-overlay">
                    <span className="hud-corner hud-top-left"></span>
                    <span className="hud-corner hud-top-right"></span>
                    <span className="hud-corner hud-bottom-left"></span>
                    <span className="hud-corner hud-bottom-right"></span>

                    {/* ONLY animate scanning line when isAnalyzing === true (Zero fake scanning) */}
                    {isAnalyzing && (
                      <div className="scanner-laser-container">
                        <div className="scanner-laser-line"></div>
                        <div className="scanner-reticle-crosshair"></div>
                        <div className="scanner-hud-glow"></div>
                        {/* Cycling Status Messages */}
                        <div className="scanner-status-pill-animated">
                          <IconSparkles size={14} className="sparkle-pulse" />
                          <span>{progressMessages[progressStep]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAnalyzing && (
                    <div className="preview-overlay-bar">
                      <div className="preview-file-details">
                        <strong className="preview-file-name">{file?.name}</strong>
                        <span className="preview-file-size">
                          {file?.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Sample Preset'}
                        </span>
                      </div>
                      <div className="preview-actions">
                        <button 
                          type="button" 
                          className="btn-preview-action btn-replace"
                          onClick={() => fileInputRef.current?.click()}
                          title={t('dropzoneReplace')}
                        >
                          <IconRefresh size={14} />
                          <span>{t('dropzoneReplace')}</span>
                        </button>
                        <button 
                          type="button" 
                          className="btn-preview-action btn-remove"
                          onClick={handleRemoveImage}
                          title={t('dropzoneRemove')}
                        >
                          <IconTrash size={14} />
                          <span>{t('dropzoneRemove')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="dropzone-empty-state">
                  <div className="dropzone-icon-circle">
                    <IconUpload size={28} />
                  </div>
                  <h3 className="dropzone-prompt">{t('dropzoneTitle')}</h3>
                  <p className="dropzone-sub">{t('dropzoneSub')}</p>
                  <button 
                    type="button" 
                    className="btn-browse-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconCamera size={16} />
                    <span>{t('dropzoneBrowse')}</span>
                  </button>
                </div>
              )}

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                style={{ display: 'none' }} 
                onChange={handleFileInputChange}
              />
            </div>

            {/* Non-Blocking Image Quality Assistance Card (Feature 5) */}
            {qualityCheck?.hasWarning && !dismissQualityWarning && !isAnalyzing && (
              <div className="image-quality-alert-card" role="alert">
                <div className="qa-header">
                  <IconAlertCircle size={17} className="qa-icon" />
                  <strong className="qa-title">{t('qualityWarningTitle')}</strong>
                </div>
                <div className="qa-body">
                  {qualityCheck.isDark && <p className="qa-text">• {t('qualityDark')}</p>}
                  {qualityCheck.isBlurry && <p className="qa-text">• {t('qualityBlurry')}</p>}
                  {qualityCheck.isLowRes && <p className="qa-text">• {t('qualityLowRes')}</p>}
                </div>
                <div className="qa-actions">
                  <button
                    type="button"
                    className="btn-qa-retake"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('qualityRetake')}
                  </button>
                  <button
                    type="button"
                    className="btn-qa-proceed"
                    onClick={() => setDismissQualityWarning(true)}
                  >
                    {t('qualityProceed')}
                  </button>
                </div>
              </div>
            )}

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="upload-error-box" role="alert">
                <IconAlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Quick Preset Buttons */}
            <div className="preset-samples-box">
              <span className="preset-heading">{t('samplePresetsTitle')}</span>
              <div className="preset-buttons-row">
                {SAMPLE_PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="preset-chip-btn"
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <span>{preset.title.split('—')[0]}</span>
                    <span className="preset-sub-crop">{preset.cropId}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Crop Selection & Symptom Checklists */}
          <div className="scanner-inputs-col">
            {/* Step 1: Crop Selection */}
            <div className="form-group">
              <label className="form-label">
                <span className="step-num">1</span>
                <span>{t('step1Crop')}</span>
              </label>
              <div className="crop-radio-group">
                {[
                  { id: 'potato', label: t('cropPotato'), icon: '🥔' },
                  { id: 'tomato', label: t('cropTomato'), icon: '🍅' },
                  { id: 'rice', label: t('cropRice'), icon: '🌾' },
                  { id: 'wheat', label: t('cropWheat'), icon: '🌱' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`crop-radio-btn ${selectedCrop === item.id ? 'crop-radio-active' : ''}`}
                    onClick={() => {
                      setSelectedCrop(item.id);
                      if (onCropChange) onCropChange(item.id);
                    }}
                  >
                    <span className="crop-radio-icon">{item.icon}</span>
                    <span className="crop-radio-text">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Specimen Subject Verification */}
            <div className="form-group">
              <label className="form-label">
                <span className="step-num">2</span>
                <span>{t('step2Specimen')}</span>
              </label>
              <div className="specimen-select-group">
                {SPECIMEN_TYPES.map((type) => {
                  let localizedLabel = type.label;
                  if (type.id === 'leaf') localizedLabel = t('step2Leaf');
                  if (type.id === 'harvested_produce') localizedLabel = t('step2Harvested');
                  if (type.id === 'other') localizedLabel = t('step2Other');

                  return (
                    <label 
                      key={type.id} 
                      className={`specimen-option-card ${specimenType === type.id ? 'specimen-active' : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="specimen-type" 
                        value={type.id} 
                        checked={specimenType === type.id}
                        onChange={(e) => setSpecimenType(e.target.value)}
                        className="specimen-radio-input"
                      />
                      <div className="specimen-text-box">
                        <strong className="specimen-name">{localizedLabel}</strong>
                        <span className="specimen-desc">{type.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {specimenType !== 'leaf' && (
                <div className="specimen-unsuitable-warning">
                  <IconAlertCircle size={16} />
                  <span>{t('specimenUnsuitableWarning')}</span>
                </div>
              )}
            </div>

            {/* Step 3: Observable Symptoms Multi-select */}
            <div className="form-group">
              <label className="form-label">
                <span className="step-num">3</span>
                <span>{t('step3Symptoms')}</span>
              </label>
              <p className="form-hint">{t('step3Hint')}</p>
              <div className="symptoms-pill-grid">
                {SYMPTOM_OPTIONS.map((opt) => {
                  const isChecked = selectedSymptoms.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`symptom-toggle-btn ${isChecked ? 'symptom-btn-active' : ''}`}
                      onClick={() => toggleSymptom(opt.id)}
                      aria-pressed={isChecked}
                    >
                      <span className="symptom-icon">{opt.icon}</span>
                      <span className="symptom-label">{getSymptomLabel(opt.id)}</span>
                      {isChecked && <IconCheck size={14} className="symptom-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Additional Field Observations */}
            <div className="form-group">
              <label htmlFor="additional-notes" className="form-label">
                <span className="step-num">4</span>
                <span>{t('step4Notes')}</span>
              </label>
              <textarea
                id="additional-notes"
                rows="2"
                className="notes-textarea"
                placeholder={t('step4Placeholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* No-Symptoms Confirmation Prompt */}
            {showNoSymptomsPrompt && (
              <div className="no-symptoms-prompt-box" role="alert">
                <div className="prompt-header">
                  <IconAlertCircle size={18} />
                  <strong>No Visible Symptoms Selected</strong>
                </div>
                <p className="prompt-message">
                  Our rule-based engine correlates diseases strictly with user-reported symptoms. Without symptom markers, specific disease candidates cannot be identified or ranked.
                </p>
                <div className="prompt-actions">
                  <button 
                    type="button" 
                    className="btn-prompt-select"
                    onClick={() => setShowNoSymptomsPrompt(false)}
                  >
                    Select Symptoms Above
                  </button>
                  <button 
                    type="button" 
                    className="btn-prompt-proceed"
                    onClick={executeAnalysis}
                  >
                    Proceed with No Symptoms (General Baseline)
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="analyze-action-strip">
              <button
                type="button"
                className="btn-submit-analyze"
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <IconRefresh size={18} className="spin-icon" />
                    <span>{progressMessages[progressStep]}</span>
                  </>
                ) : (
                  <>
                    <IconCamera size={18} />
                    <span>{t('btnEvaluate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STRUCTURED 5-SECTION FARMER-FRIENDLY REPORT DISPLAY (Features 2, 6, 9) */
        <div className="analysis-results-container reveal-smooth">
          {/* Results Top Header & Language Selector & TTS Read Aloud Control (Requirement 1 & 3) */}
          <div className="results-top-banner">
            <div className="banner-left">
              {analysisResult.isAiInference ? (
                <span className="badge-ai-mode">
                  <span className="ai-dot dot-green"></span>
                  Genuine Multimodal AI Inference • {analysisResult.aiModel || 'Gemini 3.5 Flash'}
                </span>
              ) : (
                <span className="badge-demo-mode">
                  Rule-Assisted Heuristic Match • Prototype Demo Mode
                </span>
              )}
              <h3 className="results-main-title">
                {t('reportHeading')} — {analysisResult.cropName}
              </h3>
              <p className="results-timestamp">{t('evaluatedAt')} {analysisResult.analyzedAt}</p>
            </div>

            <div className="results-top-actions">
              {/* Requirement 1: Result-Page Language Selector (English / Marathi / Hindi) */}
              <div className="results-lang-selector" aria-label={t('selectReportLang')}>
                <span className="results-lang-label">{t('selectReportLang')}</span>
                <div className="results-lang-btn-group" role="group">
                  {SUPPORTED_LANGUAGES.map((langItem) => (
                    <button
                      key={langItem.code}
                      type="button"
                      className={`results-lang-btn ${language === langItem.code ? 'active' : ''}`}
                      onClick={() => setLanguage(langItem.code)}
                      aria-pressed={language === langItem.code}
                    >
                      {langItem.nativeLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirement 3: Web Speech API Listen to Report Button with Voice Status */}
              <div className="results-tts-wrap">
                {isTtsSupported && (
                  <button
                    type="button"
                    className={`btn-tts-listen ${isSpeaking ? 'tts-speaking-active' : ''}`}
                    onClick={handleToggleSpeech}
                    title={isSpeaking ? t('stopListening') : t('listenReport')}
                  >
                    {isSpeaking ? (
                      <>
                        <IconVolumeX size={17} />
                        <span className="tts-pulse-bars">
                          <span className="bar"></span>
                          <span className="bar"></span>
                          <span className="bar"></span>
                        </span>
                        <span>{t('stopListening')}</span>
                      </>
                    ) : (
                      <>
                        <IconVolume size={17} />
                        <span>{t('listenReport')}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Voice Status Indicator Pill */}
                {isTtsSupported && voiceInfo?.note && (
                  <span
                    className={`voice-status-pill ${voiceInfo.isExactMatch ? 'voice-exact' : 'voice-fallback'}`}
                    title={voiceInfo.note}
                  >
                    {voiceInfo.isExactMatch ? '✓ ' : 'ℹ️ '}
                    {voiceInfo.isExactMatch ? t('ttsVoiceExact') : t('ttsVoiceFallback')}
                  </span>
                )}
                {!isTtsSupported && (
                  <span className="voice-status-pill voice-unsupported" title={t('ttsVoiceUnavailable')}>
                    ⚠️ {t('ttsVoiceUnavailable')}
                  </span>
                )}
              </div>

              <button 
                type="button" 
                className="btn-analyze-another"
                onClick={handleReset}
              >
                <IconCamera size={16} />
                <span>{t('btnAnalyzeAnother')}</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: WHAT WAS OBSERVED (प्रत्यक्ष काय निरीक्षण केले गेले) */}
          <div className="farmer-report-section section-noticed">
            <div className="frs-header">
              <span className="frs-number">1</span>
              <div>
                <h4 className="frs-title">{t('section1ObservedTitle')}</h4>
                <p className="frs-sub">{t('section1ObservedSub')}</p>
              </div>
            </div>

            <div className="frs-grid-split">
              {/* Submitted Image Preview & Metadata */}
              <div className="frs-image-card">
                <div className="result-image-box">
                  {analysisResult.fileInfo.previewUrl ? (
                    <img 
                      src={analysisResult.fileInfo.previewUrl} 
                      alt={`Submitted ${analysisResult.cropName} specimen`}
                      className="result-image-img" 
                    />
                  ) : (
                    <div className="no-image-placeholder">No image preview available</div>
                  )}
                </div>
                <div className="evidence-meta">
                  <div className="meta-row">
                    <span className="meta-label">{t('specimenMetaLabel')}</span>
                    <span className={`specimen-tag ${analysisResult.isSuitableSpecimen ? 'tag-suitable' : 'tag-unsuitable'}`}>
                      {analysisResult.specimenLabel}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">{t('targetCropMetaLabel')}</span>
                    <strong className="meta-val">{analysisResult.cropName}</strong>
                  </div>
                  {analysisResult.identifiedSpecies && (
                    <div className="meta-row">
                      <span className="meta-label">{t('speciesIdentifiedLabel')}</span>
                      <span className="meta-val species-identified-val">
                        {analysisResult.identifiedSpecies}
                        {analysisResult.speciesMatchesTarget ? (
                          <span className="species-match-pill pill-match" title={t('speciesMatchNotice')}> ✓</span>
                        ) : (
                          <span className="species-match-pill pill-mismatch" title={t('speciesMismatchNotice')}> ℹ️</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Observed Findings Detail */}
              <div className="frs-findings-card">
                <strong className="findings-heading">{t('section1Symptoms')}</strong>
                <div className="psb-chips-wrap">
                  {analysisResult.userReportedSymptoms && analysisResult.userReportedSymptoms.length > 0 ? (
                    analysisResult.userReportedSymptoms.map((sym, idx) => (
                      <span key={idx} className="psb-chip">
                        ✓ {sym}
                      </span>
                    ))
                  ) : (
                    <div className="psb-no-symptoms-callout">
                      <span>⚠️ {t('section1NoSymptoms')}</span>
                    </div>
                  )}
                </div>

                {/* Model-Observed Visual Features (From Vision AI or Visual Analysis) */}
                {((analysisResult.observedVisualFeatures && analysisResult.observedVisualFeatures.length > 0) ||
                  (analysisResult.visualEvidencePresent && analysisResult.visualEvidencePresent.length > 0)) && (
                  <div className="model-features-inner">
                    <strong className="findings-heading model-heading">
                      <IconSparkles size={14} />
                      <span>{t('section1VisualFeatures')}</span>
                    </strong>
                    <ul className="model-features-list">
                      {(analysisResult.observedVisualFeatures || analysisResult.visualEvidencePresent).map((feat, idx) => (
                        <li key={idx}>
                          <span className="feat-bullet">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Farmer Observation note */}
                {analysisResult.userNotes && analysisResult.userNotes !== 'None provided' && (
                  <div className="farmer-note-callout">
                    <span className="notes-label">{t('farmerObservationLabel')}</span>
                    <p className="notes-body">"{analysisResult.userNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: POSSIBLE ISSUE & CANDIDATE DISEASES (संभाव्य रोग व लक्षणे) */}
          <div className="farmer-report-section section-meaning">
            <div className="frs-header">
              <span className="frs-number">2</span>
              <div>
                <h4 className="frs-title">{t('section2PossibleTitle')}</h4>
                <p className="frs-sub">{t('section2PossibleSub')}</p>
              </div>
            </div>

            {/* State A: Unrelated Image / Non-Plant Object */}
            {(!analysisResult.isPlantCrop || analysisResult.validationStatus === 'unrelated_image') && (
              <div className="unrelated-image-banner" role="alert">
                <IconAlertCircle size={24} className="unrelated-icon" />
                <div className="unrelated-content">
                  <strong className="unrelated-title">{t('statusUnrelatedTitle')}</strong>
                  <p className="unrelated-desc">{t('statusUnrelatedDesc')}</p>
                  <p className="unrelated-guidance">
                    👉 <em>{t('guidanceRecommended')}</em>
                  </p>
                </div>
              </div>
            )}

            {/* State B: Visibly Healthy Foliage */}
            {analysisResult.isHealthy && (
              <div className="healthy-foliage-banner" role="status">
                <IconCheck size={24} className="healthy-icon" />
                <div className="healthy-content">
                  <strong className="healthy-title">{t('statusHealthyTitle')}</strong>
                  <p className="healthy-desc">
                    {analysisResult.healthyExplanation || t('statusHealthyDesc')}
                  </p>
                  <span className="healthy-badge">Zero Disease Candidates Detected • Baseline Monitoring</span>
                </div>
              </div>
            )}

            {/* State C: Unsuitable Harvested Produce */}
            {analysisResult.isPlantCrop && !analysisResult.isSuitableSpecimen && analysisResult.validationStatus === 'harvested_produce' && (
              <div className="unsuitable-specimen-banner" role="alert">
                <IconAlertCircle size={22} className="unsuitable-icon" />
                <div className="unsuitable-text-box">
                  <strong className="unsuitable-title">{t('section2UnsuitableNotice')}</strong>
                  <p className="unsuitable-desc">{analysisResult.unsuitabilityNotice}</p>
                </div>
              </div>
            )}

            {/* State D: Conflicting Candidates / Symptom Overlap Warning */}
            {analysisResult.conflictingCandidates && (
              <div className="conflicting-candidates-banner" role="alert">
                <IconAlertCircle size={20} className="conflict-icon" />
                <div className="conflict-content">
                  <strong className="conflict-title">{t('conflictingCandidatesTitle')}</strong>
                  <p className="conflict-desc">{t('conflictingCandidatesNotice')}</p>
                </div>
              </div>
            )}

            {/* Disease Candidates List with Defensible Qualitative Evidence Indicators */}
            {analysisResult.candidates && analysisResult.candidates.length > 0 ? (
              <div className="candidates-grid">
                {analysisResult.candidates.map((cand, idx) => {
                  const locDisease = getLocalizedDisease(cand.name, language);
                  const locPathogen = getLocalizedPathogen(cand.pathogen || cand.pathogenType, language);
                  const evidence = getCandidateEvidence(cand, analysisResult.isAiInference);

                  return (
                    <div key={idx} className="candidate-card">
                      <div className="candidate-header">
                        <div className="candidate-title-block">
                          <h5 className="candidate-name">{locDisease.displayName}</h5>
                          {locPathogen && (
                            <span className="candidate-pathogen">{locPathogen}</span>
                          )}
                        </div>

                        {/* Defensible Qualitative Evidence Strength Badge & Visual Meter */}
                        <div className={`evidence-badge-container ${evidence.cssClass}`} title={t('diagnosticsConfidenceNotice')}>
                          <div className="evidence-meter-dots" aria-hidden="true">
                            <span className={`meter-dot ${evidence.level >= 1 ? 'dot-active' : ''}`}></span>
                            <span className={`meter-dot ${evidence.level >= 2 ? 'dot-active' : ''}`}></span>
                            <span className={`meter-dot ${evidence.level >= 3 ? 'dot-active' : ''}`}></span>
                          </div>
                          <div className="evidence-badge-text">
                            <span className="evidence-badge-strength">{evidence.label}</span>
                            <span className="evidence-badge-engine">{evidence.engine}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="candidate-details">
                        {/* Why this candidate was suggested */}
                        <div className="why-suggested-box">
                          <div className="why-suggested-title">
                            <IconSparkles size={14} className="why-sparkle" />
                            <span>{t('whySuggestedHeading')}</span>
                          </div>
                          <div className="why-suggested-content">
                            {analysisResult.isAiInference ? (
                              <>
                                <p className="why-text-lead">{t('whySuggestedGemini')}</p>
                                {cand.visualRationale && (
                                  <p className="why-rationale-quote">"{cand.visualRationale}"</p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="why-text-lead">
                                  {t('whySuggestedHeuristic', {
                                    count: cand.matchCount || cand.matchedSymptoms?.length || 0,
                                    symptoms: (cand.matchedSymptoms || []).join(', ') || t('section1NoSymptoms'),
                                  })}
                                </p>
                                {cand.visualRationale && (
                                  <p className="why-rationale-quote">{cand.visualRationale}</p>
                                )}
                                <div className="heuristic-transparency-callout">
                                  <IconInfo size={13} />
                                  <span>{t('heuristicDisclaimer')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Localized Disease Phytopathological Description */}
                        {(locDisease.description || cand.supportingVisualSigns) && (
                          <div className="detail-item">
                            <span className="item-label">{t('section2Description')}</span>
                            <p className="item-text">{locDisease.description || cand.supportingVisualSigns}</p>
                          </div>
                        )}

                        {/* Distinguishing Characteristics */}
                        {cand.distinguishingCharacteristics && (
                          <div className="detail-item">
                            <span className="item-label">{t('distinguishingFeatures')}</span>
                            <p className="item-text">{cand.distinguishingCharacteristics}</p>
                          </div>
                        )}

                        {/* Favorable Microclimate */}
                        {(cand.favorableConditions || cand.favorableCondition) && (
                          <div className="detail-item">
                            <span className="item-label">{t('favorableConditions')}</span>
                            <p className="item-text">{cand.favorableConditions || cand.favorableCondition}</p>
                          </div>
                        )}

                        {/* Candidate Uncertainty Notice */}
                        <div className="candidate-uncertainty-alert">
                          <IconAlertCircle size={13} />
                          <span>{t('candUncertaintyNotice')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (!analysisResult.isHealthy && analysisResult.isPlantCrop && analysisResult.isSuitableSpecimen) ? (
              <div className="no-candidates-card">
                <h5 className="no-cand-title">No Candidate Disease Ranking Available</h5>
                <p className="no-cand-desc">{t('section2NoCandidates')}</p>
              </div>
            ) : null}
          </div>

          {/* SECTION 3: EVIDENCE & DIFFERENTIAL COMPARISON (पुरावा आणि रोगांमधील फरक) */}
          <div className="farmer-report-section section-evidence">
            <div className="frs-header">
              <span className="frs-number">3</span>
              <div>
                <h4 className="frs-title">{t('section3EvidenceTitle')}</h4>
                <p className="frs-sub">{t('section3EvidenceSub')}</p>
              </div>
            </div>

            <div className="evidence-comparison-grid">
              {/* Evidence Present Breakdown */}
              <div className="evidence-panel panel-present">
                <div className="panel-header">
                  <IconCheck size={16} className="panel-icon icon-pass" />
                  <strong>{t('evidencePresentTitle')}</strong>
                </div>
                <ul className="evidence-list">
                  {analysisResult.userReportedSymptoms && analysisResult.userReportedSymptoms.length > 0 ? (
                    analysisResult.userReportedSymptoms.map((sym, sIdx) => (
                      <li key={sIdx}>
                        <span className="bullet-pass">✓</span>
                        <span>{sym} (User reported)</span>
                      </li>
                    ))
                  ) : null}
                  {(analysisResult.observedVisualFeatures || []).map((feat, fIdx) => (
                    <li key={`feat-${fIdx}`}>
                      <span className="bullet-pass">✓</span>
                      <span>{feat} (Observed in photo)</span>
                    </li>
                  ))}
                  {(!analysisResult.userReportedSymptoms?.length && !analysisResult.observedVisualFeatures?.length) && (
                    <li className="empty-evidence-msg">
                      <span>{t('section1NoSymptoms')}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Missing or Uncertain Evidence Panel */}
              <div className="evidence-panel panel-missing">
                <div className="panel-header">
                  <IconAlertCircle size={16} className="panel-icon icon-warn" />
                  <strong>{t('evidenceMissingTitle')}</strong>
                </div>
                <ul className="evidence-list">
                  {analysisResult.candidates && analysisResult.candidates.length > 0 && analysisResult.candidates[0].missingEvidence ? (
                    <li>
                      <span className="bullet-warn">⚠️</span>
                      <span>{analysisResult.candidates[0].missingEvidence}</span>
                    </li>
                  ) : null}
                  {(analysisResult.evidenceMissingOrUncertain || []).map((mItem, mIdx) => (
                    <li key={mIdx}>
                      <span className="bullet-warn">⚠️</span>
                      <span>{mItem}</span>
                    </li>
                  ))}
                  {(!analysisResult.evidenceMissingOrUncertain?.length && !analysisResult.candidates?.[0]?.missingEvidence) && (
                    <li>
                      <span className="bullet-warn">⚠️</span>
                      <span>Microscopic pathogen sporulation and bacterial streaming cannot be confirmed without laboratory culture or PCR assay.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Differential Comparison Callout */}
            {analysisResult.candidates && analysisResult.candidates.length > 0 && analysisResult.candidates[0].differentialComparison && (
              <div className="differential-box">
                <div className="diff-header">
                  <IconInfo size={16} />
                  <strong>{t('differentialTitle')}</strong>
                </div>
                <p className="diff-text">{analysisResult.candidates[0].differentialComparison}</p>
              </div>
            )}

            {/* Alternative Non-Disease or Abiotic Explanations */}
            <div className="alternative-explanations-card">
              <div className="alt-exp-header">
                <IconInfo size={15} />
                <strong>{t('alternativeExplanationsTitle')}</strong>
              </div>
              <ul className="alt-exp-list">
                {(analysisResult.alternativeExplanations && analysisResult.alternativeExplanations.length > 0
                  ? analysisResult.alternativeExplanations
                  : (ALTERNATIVE_EXPLANATIONS_TRANSLATIONS[language] || ALTERNATIVE_EXPLANATIONS_TRANSLATIONS.en)
                ).map((altExp, aIdx) => (
                  <li key={aIdx}>
                    <span className="alt-bullet">•</span>
                    <span>{altExp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SECTION 4: DIAGNOSTIC CONFIDENCE & KNOWN LIMITATIONS (निदानाची विश्वासार्हता व मर्यादा) */}
          <div className="farmer-report-section section-confidence">
            <div className="frs-header">
              <span className="frs-number">4</span>
              <div>
                <h4 className="frs-title">{t('section4ConfidenceTitle')}</h4>
                <p className="frs-sub">{t('section4ConfidenceSub')}</p>
              </div>
            </div>

            <div className="confidence-details-card">
              <div className="confidence-principle">
                <IconInfo size={18} className="conf-icon" />
                <div className="conf-principle-text">
                  <strong className="principle-title">Scientific Integrity & Calibration Principle:</strong>
                  <p className="principle-desc">{t('diagnosticsConfidenceNotice')}</p>
                </div>
              </div>

              <div className="limitations-grid">
                <div className="limitation-item">
                  <span className="lim-badge">Visual Inference Limit</span>
                  <p className="lim-text">
                    Field photographs assess surface lesion morphology. They cannot test plant sap, fungal DNA, or internal vascular browning.
                  </p>
                </div>
                <div className="limitation-item">
                  <span className="lim-badge">Incubation Latency</span>
                  <p className="lim-text">
                    Fungal mycelia may incubate within leaf mesophyll cells for 3–7 days before visible necrotic lesions emerge macroscopically.
                  </p>
                </div>
                <div className="limitation-item">
                  <span className="lim-badge">Abiotic Mimics</span>
                  <p className="lim-text">
                    Potassium deficiency, herbicide drift, and extreme heat scorch frequently mimic fungal blight patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: RECOMMENDED NEXT STEPS (सुरक्षित मशागत पद्धती) */}
          <div className="farmer-report-section section-action-now">
            <div className="frs-header">
              <span className="frs-number">5</span>
              <div>
                <h4 className="frs-title">{t('section5NextStepsTitle')}</h4>
                <p className="frs-sub">{t('section5NextStepsSub')}</p>
              </div>
            </div>

            {/* Non-Chemical Safe Cultural Interventions */}
            <div className="action-cards-grid">
              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-blue">💧</span>
                  <strong>{t('actionIrrigationHeading')}</strong>
                </div>
                <p className="action-card-text">{t('actionStopWatering')}</p>
              </div>

              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-red">✂️</span>
                  <strong>{t('actionSanitationHeading')}</strong>
                </div>
                <p className="action-card-text">{t('actionPruneLeaves')}</p>
              </div>

              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-amber">🧼</span>
                  <strong>{t('actionSterilizationHeading')}</strong>
                </div>
                <p className="action-card-text">{t('actionSanitizeTools')}</p>
              </div>

              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-green">🌬️</span>
                  <strong>{t('actionAerationHeading')}</strong>
                </div>
                <p className="action-card-text">{t('actionImproveAeration')}</p>
              </div>
            </div>

            {/* Field Monitoring Checkpoints */}
            <div className="checkpoints-list">
              <div className="checkpoint-row">
                <div className="cp-badge">🌅 {t('checkpointDawn')}</div>
                <div className="cp-desc">
                  <strong>{t('checkpointDawnLabel')}</strong> {t('checkUndersides')}
                </div>
              </div>
              <div className="checkpoint-row">
                <div className="cp-badge">💨 {t('checkpointWind')}</div>
                <div className="cp-desc">
                  <strong>{t('checkpointWindLabel')}</strong> {t('checkDownwind')}
                </div>
              </div>
              <div className="checkpoint-row">
                <div className="cp-badge">⏱️ {t('checkpointDew')}</div>
                <div className="cp-desc">
                  <strong>{t('checkpointDewLabel')}</strong> {t('checkDewDuration')}
                </div>
              </div>
            </div>

            {/* CRITICAL FARMER SAFETY RULE: Chemical Pesticide Warning */}
            <div className="chemical-safety-warning-banner" role="alert">
              <IconShieldAlert size={22} className="chem-safety-icon" />
              <div className="chem-safety-content">
                <strong className="chem-safety-title">{t('chemicalSafetyHeading')}</strong>
                <p className="chem-safety-desc">
                  {analysisResult.chemicalDisclaimer || t('chemicalSafetyNotice')}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 6: WHEN TO SEEK EXPERT HELP (तज्ज्ञांचा सल्ला कधी घ्यावा) */}
          <div className="farmer-report-section section-get-help">
            <div className="frs-header">
              <span className="frs-number">6</span>
              <div>
                <h4 className="frs-title">{t('section6ExpertHelpTitle')}</h4>
                <p className="frs-sub">{t('section6ExpertHelpSub')}</p>
              </div>
            </div>

            <div className="escalation-box">
              <strong className="escalation-title">{t('escalationHeading')}</strong>
              <ul className="escalation-list">
                <li><span className="bullet-esc">⚠️</span> {t('escalationTrigger1')}</li>
                <li><span className="bullet-esc">⚠️</span> {t('escalationTrigger2')}</li>
                <li><span className="bullet-esc">⚠️</span> {t('escalationTrigger3')}</li>
                {(analysisResult.escalationTriggers || []).map((trig, tIdx) => (
                  <li key={`trig-${tIdx}`}><span className="bullet-esc">⚠️</span> {trig}</li>
                ))}
              </ul>
            </div>

            {/* Official KVK & Expert Consultation Notice */}
            <div className="expert-kvk-banner">
              <div className="kvk-top">
                <IconShieldAlert size={22} className="kvk-icon" />
                <div>
                  <strong className="kvk-heading">{t('kvkNoticeHeading')}</strong>
                  <p className="kvk-p">
                    {analysisResult.expertConsultationGuidance?.recommendation || t('kvkNotice')}
                  </p>
                </div>
              </div>
              <div className="kvk-phone-badge">
                <span>📞</span>
                <strong>
                  {analysisResult.expertConsultationGuidance?.contactChannels || t('kvkHelpline')}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Scan History Drawer (Feature 8) */}
      <ScanHistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectScan={handleLoadPastScan}
      />
    </section>
  );
}
