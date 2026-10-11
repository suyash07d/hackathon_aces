import React, { useState, useRef } from 'react';
import { 
  IconUpload, 
  IconCamera, 
  IconTrash, 
  IconCheck, 
  IconAlertCircle, 
  IconRefresh, 
  IconInfo, 
  IconShieldAlert
} from './Icons';
import { 
  SYMPTOM_OPTIONS, 
  SPECIMEN_TYPES,
  SAMPLE_PRESET_IMAGES, 
  analyzeCropImage 
} from '../services/imageAnalysisService';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function CropImageScanner({ activeCropId, onCropChange, onAnalysisResultChange }) {
  // Upload and form states
  const [selectedCrop, setSelectedCrop] = useState(activeCropId || 'potato');
  const [specimenType, setSpecimenType] = useState('leaf');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Image file states
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Warning prompt state when user attempts to evaluate with 0 symptoms
  const [showNoSymptomsPrompt, setShowNoSymptomsPrompt] = useState(false);

  // Architecture blueprint drawer toggle
  const [showAiBackendInfo, setShowAiBackendInfo] = useState(false);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  // Handle file validation and loading
  const processFile = (inputFile) => {
    setUploadError(null);

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
    setUploadError(null);
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
        },
      });
      setAnalysisResult(result);
      onAnalysisResultChange?.(result);
    } catch {
      setUploadError('Failed to complete symptom analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    handleRemoveImage();
    setSelectedSymptoms([]);
    setSpecimenType('leaf');
    setNotes('');
    setShowNoSymptomsPrompt(false);
    setAnalysisResult(null);
    onAnalysisResultChange?.(null);
  };

  return (
    <section className="crop-scanner-section" id="crop-scanner-section" aria-labelledby="scanner-heading">
      <div className="section-header-row">
        <div>
          <div className="title-with-pill">
            <h2 id="scanner-heading" className="section-title">
              Crop Image & Foliar Symptom Analyzer
            </h2>
            <span className="demo-pill">Prototype Evaluation Mode</span>
          </div>
          <p className="section-subtitle">
            Upload an affected foliar photo and select observed visual symptoms for rule-assisted disease screening.
          </p>
        </div>

        <div className="scanner-header-badges-wrap">
          <div className="scanner-header-badge badge-ai-unconfigured">
            <span className="ai-dot dot-gray"></span>
            <span>AI Vision Provider: Unconfigured (Running Heuristic Mode)</span>
          </div>
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

      {/* AI Backend Integration Blueprint Drawer (Phase 3 Transparency) */}
      {showAiBackendInfo && (
        <div className="ai-backend-blueprint-card">
          <div className="blueprint-header">
            <IconInfo size={18} className="blueprint-icon" />
            <div className="blueprint-title-box">
              <strong className="blueprint-title">AI Vision Backend Architecture Specification</strong>
              <span className="blueprint-sub">Status: Unconfigured in local repository • Secure proxy pattern required</span>
            </div>
          </div>
          <p className="blueprint-desc">
            To enable genuine computer-vision inference (replacing the transparent client-side heuristic pattern matcher), a secure server-side backend proxy must be deployed. In accordance with safety rules, client-side browsers must never hold raw AI provider API keys.
          </p>
          <div className="blueprint-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Recommended Model:</span>
              <strong className="spec-val">Google Gemini 1.5 Flash / Pro (Multimodal Vision)</strong>
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
          <div className="blueprint-schema-box">
            <span className="schema-title">Target Structured JSON Response Schema:</span>
            <pre className="schema-code">
{`{
  "observedFeatures": ["concentric dark brown rings", "chlorotic yellow halo on lower leaf"],
  "tentativeCandidates": [{ "disease": "Early Blight", "pathogen": "Alternaria solani", "certainty": "Tentative Visual Match" }],
  "specimenSuitability": { "isFoliar": true, "viewType": "canopy_leaf", "qualityOk": true },
  "visualUncertainties": ["Early blight lesions can visually mimic Septoria spots at onset"],
  "fieldNextSteps": ["Verify under 10x hand lens for concentric ridges", "Do not spray without physical sample check"]
}`}
            </pre>
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
                <strong className="guidance-title">Foliar Photo Guidelines & Suitability:</strong>
              </div>
              <ul className="guidance-list">
                <li>
                  <span className="bullet-pass">✓</span>
                  <strong>Recommended:</strong> Close-up, well-lit photo of an affected living leaf or stem showing distinct spots, yellowing, or lesions.
                </li>
                <li>
                  <span className="bullet-fail">✕</span>
                  <strong>Unsuitable for Foliar Screening:</strong> Photos of harvested produce (e.g. harvested potatoes, picked tomatoes), whole-field vistas, blurry shots, or healthy foliage without visible symptoms.
                </li>
              </ul>
              <div className="guidance-note">
                <IconInfo size={13} />
                <span>Notice: This prototype does not execute automatic computer-vision pixel classification. You are responsible for verifying that your uploaded image depicts plant foliage.</span>
              </div>
            </div>

            {/* Dropzone Box */}
            <div 
              className={`dropzone-box ${isDragging ? 'dropzone-dragging' : ''} ${previewUrl ? 'dropzone-has-image' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="image-preview-wrapper">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded crop preview" 
                    className="uploaded-image-preview"
                  />
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
                        title="Choose another image"
                      >
                        <IconRefresh size={14} />
                        <span>Replace</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn-preview-action btn-remove"
                        onClick={handleRemoveImage}
                        title="Remove image"
                      >
                        <IconTrash size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dropzone-empty-state">
                  <div className="dropzone-icon-circle">
                    <IconUpload size={28} />
                  </div>
                  <h3 className="dropzone-prompt">Drag & drop crop leaf photo here</h3>
                  <p className="dropzone-sub">
                    Supports JPG, JPEG, PNG, WEBP (Max 10 MB)
                  </p>
                  <button 
                    type="button" 
                    className="btn-browse-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconCamera size={16} />
                    <span>Browse Device Files</span>
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

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="upload-error-box" role="alert">
                <IconAlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Quick Preset Buttons */}
            <div className="preset-samples-box">
              <span className="preset-heading">Or try tested foliar sample presets:</span>
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
                <span>Target Crop Species:</span>
              </label>
              <div className="crop-radio-group">
                {[
                  { id: 'potato', label: 'Potato', icon: '🥔' },
                  { id: 'tomato', label: 'Tomato', icon: '🍅' },
                  { id: 'rice', label: 'Rice', icon: '🌾' },
                  { id: 'wheat', label: 'Wheat', icon: '🌱' },
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
                <span>Image Subject View (Self-Declared by User):</span>
              </label>
              <div className="specimen-select-group">
                {SPECIMEN_TYPES.map((type) => (
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
                      <strong className="specimen-name">{type.label}</strong>
                      <span className="specimen-desc">{type.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              {specimenType !== 'leaf' && (
                <div className="specimen-unsuitable-warning">
                  <IconAlertCircle size={16} />
                  <span>
                    <strong>Notice:</strong> Foliar disease screening cannot evaluate harvested produce (e.g. potatoes/tubers) or non-foliar views. If you proceed, the tool will report an unsuitable specimen notice rather than foliar disease candidates.
                  </span>
                </div>
              )}
            </div>

            {/* Step 3: Observable Symptoms Multi-select */}
            <div className="form-group">
              <label className="form-label">
                <span className="step-num">3</span>
                <span>Observed Visual Foliar Symptoms (User-Reported):</span>
              </label>
              <p className="form-hint">
                Select visual signs you observe on the plant. If no symptoms are visible, you may proceed with an explicit no-symptoms baseline.
              </p>
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
                      <span className="symptom-label">{opt.label}</span>
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
                <span>Additional Field Observations (Optional):</span>
              </label>
              <textarea
                id="additional-notes"
                rows="2"
                className="notes-textarea"
                placeholder="e.g., Lower canopy affected; symptoms appeared after heavy rain; recent bio-spray applied 3 days ago..."
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
                    <span>Evaluating Symptom Markers...</span>
                  </>
                ) : (
                  <>
                    <IconCamera size={18} />
                    <span>Evaluate Disease Candidates (Demo)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STRUCTURED RESULTS DISPLAY */
        <div className="analysis-results-container">
          <div className="results-top-banner">
            <div className="banner-left">
              <span className="badge-demo-mode">Prototype Demo Assessment</span>
              <h3 className="results-main-title">
                Symptom Evaluation for {analysisResult.cropName}
              </h3>
              <p className="results-timestamp">Evaluated at: {analysisResult.analyzedAt}</p>
            </div>
            <button 
              type="button" 
              className="btn-analyze-another"
              onClick={handleReset}
            >
              <IconCamera size={16} />
              <span>Analyze Another Image</span>
            </button>
          </div>

          {/* Prominent Symptom Evidence Banner at Top */}
          <div className="prominent-symptoms-banner">
            <div className="psb-header">
              <IconInfo size={16} />
              <strong className="psb-title">User-Reported Observable Symptoms:</strong>
              <span className="psb-source-tag">Source: User Selection (Not extracted by computer-vision)</span>
            </div>
            <div className="psb-chips-wrap">
              {analysisResult.userReportedSymptoms && analysisResult.userReportedSymptoms.length > 0 ? (
                analysisResult.userReportedSymptoms.map((sym, idx) => (
                  <span key={idx} className="psb-chip">
                    {sym}
                  </span>
                ))
              ) : (
                <div className="psb-no-symptoms-callout">
                  <span>⚠️ No visible foliar symptoms were selected by the user.</span>
                </div>
              )}
            </div>
          </div>

          {/* Transparency Disclaimer Box */}
          <div className="transparency-callout">
            <IconInfo size={18} className="transparency-icon" />
            <p className="transparency-text">
              {analysisResult.transparencyDisclaimer}
            </p>
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

          {/* Special Banner when Foliar Leaf uploaded but 0 symptoms reported */}
          {analysisResult.isSuitableSpecimen && !analysisResult.hasUserSymptoms && (
            <div className="insufficient-evidence-banner" role="alert">
              <IconAlertCircle size={22} className="insufficient-icon" />
              <div className="insufficient-text-box">
                <strong className="insufficient-title">Insufficient Evidence for Disease Candidate Ranking</strong>
                <p className="insufficient-desc">
                  No visible foliar symptoms were selected. Our rule-based matching engine will not invent, assume, or guess disease candidates without reported symptom markers. General preventive crop maintenance is recommended below.
                </p>
              </div>
            </div>
          )}

          <div className="results-content-split">
            {/* Left: Uploaded Photo & User Findings */}
            <div className="results-evidence-card">
              <h4 className="evidence-heading">Uploaded Image & Submission Details</h4>
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
                  <span className="meta-label">File Name:</span>
                  <span className="meta-val">{analysisResult.fileInfo.name}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">File Size:</span>
                  <span className="meta-val">{analysisResult.fileInfo.sizeFormatted}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Target Crop:</span>
                  <strong className="meta-val">{analysisResult.cropName}</strong>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Specimen Type:</span>
                  <span className={`specimen-tag ${analysisResult.isSuitableSpecimen ? 'tag-suitable' : 'tag-unsuitable'}`}>
                    {analysisResult.specimenLabel}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Pixel Analysis:</span>
                  <span className="meta-val meta-note">Not processed by AI vision</span>
                </div>
              </div>

              {analysisResult.userNotes && analysisResult.userNotes !== 'None provided' && (
                <div className="evidence-notes-section">
                  <span className="notes-label">Farmer Observation:</span>
                  <p className="notes-body">"{analysisResult.userNotes}"</p>
                </div>
              )}
            </div>

            {/* Right: Disease Candidates, Severity, and Next Steps */}
            <div className="results-diagnostic-card">
              {/* Severity Estimate Banner */}
              <div className="severity-banner">
                <IconShieldAlert size={20} className="severity-icon" />
                <div>
                  <strong className="severity-level">{analysisResult.severityEstimate.level}</strong>
                  <p className="severity-desc">{analysisResult.severityEstimate.description}</p>
                </div>
              </div>

              {/* Disease Candidates List (ONLY rendered when candidates exist!) */}
              {analysisResult.candidates && analysisResult.candidates.length > 0 ? (
                <div className="candidates-list-block">
                  <div className="candidates-title-box">
                    <h4 className="block-title">
                      Rule-Assisted Possibilities for {analysisResult.cropName} (Based on User Symptoms):
                    </h4>
                    <span className="block-sub">
                      Agronomic pattern matches correlated with your selected symptoms. These are exploratory possibilities for field scouting, NOT confirmed or image-detected diagnoses.
                    </span>
                  </div>

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
                              <span className="item-label">Correlated User Symptoms:</span>
                              <div className="matched-symptoms-chips">
                                {cand.matchedSymptoms.map((ms, i) => (
                                  <span key={i} className="matched-chip">✓ {ms}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="detail-item">
                            <span className="item-label">Supporting Visual Signs:</span>
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
                </div>
              ) : (
                <div className="no-candidates-card">
                  <h4 className="no-cand-title">No Candidate Disease Ranking Available</h4>
                  <p className="no-cand-desc">
                    {!analysisResult.isSuitableSpecimen
                      ? 'Foliar disease pattern matching requires living foliage. Please upload a clear photo of an affected leaf to inspect candidate diseases.'
                      : 'Because no foliar symptoms were selected, no disease candidates were matched. If symptoms are present on your crop, re-evaluate and select the observed signs.'}
                  </p>
                </div>
              )}

              {/* Uncertainty & Abiotic Confounding Factors */}
              <div className="uncertainty-block">
                <h4 className="uncertainty-title">Diagnostic Uncertainty & Abiotic Mimics</h4>
                <ul className="uncertainty-list">
                  {analysisResult.uncertaintyFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Practical Crop-Care Next Steps */}
              <div className="next-steps-block">
                <h4 className="next-steps-title">Recommended Cautious Field Next Steps</h4>
                <ul className="steps-list">
                  {analysisResult.recommendedNextSteps.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-bullet">✓</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Agricultural Expert Consultation Box */}
              <div className="expert-consult-box">
                <h4 className="expert-title">When to Consult an Agricultural Pathologist</h4>
                <p className="expert-text">
                  {analysisResult.expertConsultationGuidance.recommendation}
                </p>
                <div className="expert-contact-badge">
                  <span>Helpline:</span>
                  <strong>{analysisResult.expertConsultationGuidance.contactChannels}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
