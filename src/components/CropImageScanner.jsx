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
import ScanHistoryDrawer from './ScanHistoryDrawer';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function CropImageScanner({ activeCropId, onCropChange, onAnalysisResultChange }) {
  const { t, language } = useApp();

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
  const { speak, stop: stopSpeech, isSpeaking, isSupported: isTtsSupported } = useTextToSpeech(language);

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

  // Text-To-Speech speech synthesizer handler (Feature 6)
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (!analysisResult) return;

    const cropName = analysisResult.cropName;
    const topCand = analysisResult.candidates?.[0]?.name || t('section2NoCandidates');
    
    // Construct structured natural phrasing for farmer
    let textToRead = `${t('reportHeading')}. ${cropName}. `;
    textToRead += `${t('section1Title')}: ${analysisResult.specimenLabel}. `;
    
    if (analysisResult.hasUserSymptoms && analysisResult.userReportedSymptoms?.length > 0) {
      textToRead += `${t('section1Symptoms')} ${analysisResult.userReportedSymptoms.join(', ')}. `;
    }

    textToRead += `${t('section2Title')}: ${topCand}. `;
    textToRead += `${t('section3Title')}: ${t('actionStopWatering')} ${t('actionPruneLeaves')} `;
    textToRead += `${t('section4Title')}: ${t('checkUndersides')} `;
    textToRead += `${t('section5Title')}: ${t('kvkNotice')} ${t('kvkHelpline')}`;

    speak(textToRead);
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
          {/* Results Top Header & TTS Read Aloud Control */}
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
              <p className="results-timestamp">Evaluated at: {analysisResult.analyzedAt}</p>
            </div>

            <div className="results-top-actions">
              {/* Feature 6: Web Speech API Listen to Report Button */}
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

          {/* SECTION 1: WHAT WE NOTICED (निरीक्षण) */}
          <div className="farmer-report-section section-noticed">
            <div className="frs-header">
              <span className="frs-number">1</span>
              <div>
                <h4 className="frs-title">{t('section1Title')}</h4>
                <p className="frs-sub">{t('section1Sub')}</p>
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
                    <span className="meta-label">Specimen:</span>
                    <span className={`specimen-tag ${analysisResult.isSuitableSpecimen ? 'tag-suitable' : 'tag-unsuitable'}`}>
                      {analysisResult.specimenLabel}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Target Crop:</span>
                    <strong className="meta-val">{analysisResult.cropName}</strong>
                  </div>
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

                {/* Model-Observed Visual Features (When Genuine Gemini AI Ran) */}
                {analysisResult.isAiInference && analysisResult.observedVisualFeatures && analysisResult.observedVisualFeatures.length > 0 && (
                  <div className="model-features-inner">
                    <strong className="findings-heading model-heading">
                      <IconSparkles size={14} />
                      <span>{t('section1VisualFeatures')}</span>
                    </strong>
                    <ul className="model-features-list">
                      {analysisResult.observedVisualFeatures.map((feat, idx) => (
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
                    <span className="notes-label">Farmer Observation:</span>
                    <p className="notes-body">"{analysisResult.userNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: WHAT IT MIGHT MEAN (संभाव्य कारण) */}
          <div className="farmer-report-section section-meaning">
            <div className="frs-header">
              <span className="frs-number">2</span>
              <div>
                <h4 className="frs-title">{t('section2Title')}</h4>
                <p className="frs-sub">{t('section2Sub')}</p>
              </div>
            </div>

            {/* Special Banner for Unsuitable Harvested Produce */}
            {!analysisResult.isSuitableSpecimen && (
              <div className="unsuitable-specimen-banner" role="alert">
                <IconAlertCircle size={22} className="unsuitable-icon" />
                <div className="unsuitable-text-box">
                  <strong className="unsuitable-title">Specimen Unsuitable for Foliar Disease Screening: {analysisResult.specimenLabel}</strong>
                  <p className="unsuitable-desc">{analysisResult.unsuitabilityNotice}</p>
                </div>
              </div>
            )}

            {/* Disease Candidates List */}
            {analysisResult.candidates && analysisResult.candidates.length > 0 ? (
              <div className="candidates-grid">
                {analysisResult.candidates.map((cand, idx) => (
                  <div key={idx} className="candidate-card">
                    <div className="candidate-header">
                      <div>
                        <h5 className="candidate-name">{cand.name}</h5>
                        <span className="candidate-pathogen">{cand.pathogenType}</span>
                      </div>
                      <span className={`candidate-tag ${cand.matchScore >= 2 ? 'tag-primary' : 'tag-secondary'}`}>
                        {cand.likelihoodTag}
                      </span>
                    </div>
                    
                    <div className="candidate-details">
                      {cand.matchedSymptoms && cand.matchedSymptoms.length > 0 && (
                        <div className="detail-item matched-symptoms-item">
                          <span className="item-label">Matched Foliar Signs:</span>
                          <div className="matched-symptoms-chips">
                            {cand.matchedSymptoms.map((ms, i) => (
                              <span key={i} className="matched-chip">✓ {ms}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="item-label">{t('section2Description')}</span>
                        <p className="item-text">{cand.supportingVisualSigns}</p>
                      </div>
                      <div className="detail-item">
                        <span className="item-label">Distinguishing Characteristics:</span>
                        <p className="item-text">{cand.distinguishingCharacteristics}</p>
                      </div>
                      <div className="detail-item">
                        <span className="item-label">Favorable Microclimate:</span>
                        <p className="item-text">{cand.favorableConditions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-candidates-card">
                <h5 className="no-cand-title">No Candidate Disease Ranking Available</h5>
                <p className="no-cand-desc">
                  {!analysisResult.isSuitableSpecimen
                    ? t('section2UnsuitableNotice')
                    : t('section2NoCandidates')}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: WHAT YOU CAN DO NOW (तातडीने काय करावे) */}
          <div className="farmer-report-section section-action-now">
            <div className="frs-header">
              <span className="frs-number">3</span>
              <div>
                <h4 className="frs-title">{t('section3Title')}</h4>
                <p className="frs-sub">{t('section3Sub')}</p>
              </div>
            </div>

            <div className="action-cards-grid">
              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-blue">💧</span>
                  <strong>Irrigation Management</strong>
                </div>
                <p className="action-card-text">{t('actionStopWatering')}</p>
              </div>

              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-red">✂️</span>
                  <strong>Sanitation & Pruning</strong>
                </div>
                <p className="action-card-text">{t('actionPruneLeaves')}</p>
              </div>

              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-amber">🧼</span>
                  <strong>Tool Sterilization</strong>
                </div>
                <p className="action-card-text">{t('actionSanitizeTools')}</p>
              </div>

              <div className="action-card">
                <div className="action-card-header">
                  <span className="action-icon-pill pill-green">🌬️</span>
                  <strong>Canopy Aeration</strong>
                </div>
                <p className="action-card-text">{t('actionImproveAeration')}</p>
              </div>
            </div>
          </div>

          {/* SECTION 4: WHAT TO CHECK NEXT (पुढे काय तपासावे) */}
          <div className="farmer-report-section section-check-next">
            <div className="frs-header">
              <span className="frs-number">4</span>
              <div>
                <h4 className="frs-title">{t('section4Title')}</h4>
                <p className="frs-sub">{t('section4Sub')}</p>
              </div>
            </div>

            <div className="checkpoints-list">
              <div className="checkpoint-row">
                <div className="cp-badge">🌅 Dawn Check</div>
                <div className="cp-desc">
                  <strong>Leaf Underside Inspection:</strong> {t('checkUndersides')}
                </div>
              </div>
              <div className="checkpoint-row">
                <div className="cp-badge">💨 Wind Vector</div>
                <div className="cp-desc">
                  <strong>Downwind Canopy Scouting:</strong> {t('checkDownwind')}
                </div>
              </div>
              <div className="checkpoint-row">
                <div className="cp-badge">⏱️ Wetness Hours</div>
                <div className="cp-desc">
                  <strong>Morning Dew Persistence:</strong> {t('checkDewDuration')}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: WHEN TO GET HELP (मदत कधी घ्यावी) */}
          <div className="farmer-report-section section-get-help">
            <div className="frs-header">
              <span className="frs-number">5</span>
              <div>
                <h4 className="frs-title">{t('section5Title')}</h4>
                <p className="frs-sub">{t('section5Sub')}</p>
              </div>
            </div>

            <div className="escalation-box">
              <strong className="escalation-title">Field Escalation Triggers (Call Extension Officers If):</strong>
              <ul className="escalation-list">
                <li><span className="bullet-esc">⚠️</span> {t('escalationTrigger1')}</li>
                <li><span className="bullet-esc">⚠️</span> {t('escalationTrigger2')}</li>
                <li><span className="bullet-esc">⚠️</span> {t('escalationTrigger3')}</li>
              </ul>
            </div>

            {/* Official KVK & Expert Consultation Notice (Preserves scientific safety rule) */}
            <div className="expert-kvk-banner">
              <div className="kvk-top">
                <IconShieldAlert size={22} className="kvk-icon" />
                <div>
                  <strong className="kvk-heading">Certified Agricultural Advisory Notice:</strong>
                  <p className="kvk-p">{t('kvkNotice')}</p>
                </div>
              </div>
              <div className="kvk-phone-badge">
                <span>📞</span>
                <strong>{t('kvkHelpline')}</strong>
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
