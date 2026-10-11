import React, { useState, useRef } from 'react';
import { 
  IconCamera, 
  IconCheck, 
  IconAlertCircle, 
  IconRefresh, 
  IconTrash, 
  IconSparkles 
} from './Icons';
import { 
  getTrackedCrops, 
  addFollowUpToTracker, 
  deleteTrackedCrop, 
  clearAllTrackedCrops 
} from '../utils/recoveryTracker';
import { useApp } from '../context/useApp';

export default function CropRecoveryTracker({ _activeCropId, _currentScanResult, _liveWeather }) {
  const { t } = useApp();
  const [trackedRecords, setTrackedRecords] = useState(() => getTrackedCrops());
  const [selectedRecordId, setSelectedRecordId] = useState(() => {
    const records = getTrackedCrops();
    return records.length > 0 ? records[0].id : null;
  });

  // New follow-up upload states
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [followUpPreview, setFollowUpPreview] = useState(null);
  const [followUpSymptoms, setFollowUpSymptoms] = useState([]);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);

  const fileInputRef = useRef(null);

  // Refresh records from localStorage
  const refreshRecords = () => {
    const records = getTrackedCrops();
    setTrackedRecords(records);
    if (records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(records[0].id);
    }
  };

  const activeRecord = trackedRecords.find((r) => r.id === selectedRecordId) || trackedRecords[0] || null;

  // Handle follow-up file selection
  const handleFollowUpFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setEvalError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const url = URL.createObjectURL(selected);
    setFollowUpPreview(url);
    setEvalError(null);
  };

  // Submit follow-up scan for comparison
  const handleSubmitFollowUp = async () => {
    if (!activeRecord) return;
    if (!followUpPreview) {
      setEvalError('Please upload a follow-up leaf photo to evaluate recovery.');
      return;
    }

    setIsEvaluating(true);
    setEvalError(null);

    try {
      // Build dummy result object for tracker comparison
      const fakeResult = {
        isPlantCrop: true,
        isSuitableSpecimen: true,
        validationStatus: 'valid_foliar',
        isHealthy: followUpSymptoms.length === 0,
        candidates: activeRecord.baselineScan?.topCandidate ? [{ name: activeRecord.baselineScan.topCandidate }] : [],
        observedVisualFeatures: followUpSymptoms.map(s => `Follow-up observed marker: ${s}`),
      };

      await addFollowUpToTracker({
        recordId: activeRecord.id,
        previewUrl: followUpPreview,
        result: fakeResult,
        symptoms: followUpSymptoms,
        notes: followUpNotes,
        actionsTaken: followUpActions,
      });

      refreshRecords();
      setIsAddingFollowUp(false);
      setFollowUpPreview(null);
      setFollowUpSymptoms([]);
      setFollowUpNotes('');
      setFollowUpActions('');
    } catch (err) {
      setEvalError(err.message || 'Failed to evaluate follow-up scan.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDeleteRecord = (id) => {
    if (confirm('Are you sure you want to delete this tracked crop timeline?')) {
      const updated = deleteTrackedCrop(id);
      setTrackedRecords(updated);
      if (selectedRecordId === id) {
        setSelectedRecordId(updated[0]?.id || null);
      }
    }
  };

  // Status color pill helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'improving':
        return { label: '🌱 Improving', cssClass: 'status-pill-improving' };
      case 'stable':
        return { label: '⚖️ Stable / Contained', cssClass: 'status-pill-stable' };
      case 'worsening':
        return { label: '⚠️ Worsening / Spreading', cssClass: 'status-pill-worsening' };
      case 'inconclusive':
      default:
        return { label: 'ℹ️ Monitoring Active', cssClass: 'status-pill-baseline' };
    }
  };

  return (
    <div className="recovery-tracker-container" id="recovery-tracker">
      <div className="tracker-header-strip">
        <div>
          <div className="tracker-badge-pill">
            <IconSparkles size={13} />
            <span>{t('trackerBadge') || 'LONGITUDINAL MONITORING SENTINEL'}</span>
          </div>
          <h3 className="tracker-main-title">
            {t('trackerTitle') || 'Crop Recovery Timeline & Follow-up Tracker'}
          </h3>
          <p className="tracker-subtitle">
            {t('trackerSubtitle') || 'Monitor foliar healing progression over 3–14 days after executing recommended cultural interventions.'}
          </p>
        </div>

        {trackedRecords.length > 0 && (
          <button
            type="button"
            className="btn-clear-tracker"
            onClick={() => {
              if (confirm('Clear all tracked crop timelines?')) {
                clearAllTrackedCrops();
                setTrackedRecords([]);
                setSelectedRecordId(null);
              }
            }}
          >
            <IconTrash size={14} />
            <span>{t('clearAll') || 'Clear History'}</span>
          </button>
        )}
      </div>

      {trackedRecords.length === 0 ? (
        <div className="tracker-empty-card">
          <div className="tracker-empty-icon">🌱</div>
          <h4 className="tracker-empty-title">
            {t('trackerEmptyHeading') || 'No Crop Recovery Timelines Active'}
          </h4>
          <p className="tracker-empty-desc">
            {t('trackerEmptyDesc') || 'When you scan a leaf in the AI Crop Scanner above, click "Track This Crop in Recovery Tracker" to establish your baseline and monitor healing after cultural interventions.'}
          </p>
        </div>
      ) : (
        <div className="tracker-workspace-grid">
          {/* Left Column: Tracked Crop Selector List */}
          <div className="tracker-sidebar-list">
            <h5 className="sidebar-heading">Monitored Crop Plots ({trackedRecords.length})</h5>
            <div className="record-cards-stack">
              {trackedRecords.map((rec) => {
                const isSelected = rec.id === (activeRecord?.id);
                const badge = getStatusBadge(rec.currentStatus);
                return (
                  <div
                    key={rec.id}
                    className={`record-select-card ${isSelected ? 'active-record' : ''}`}
                    onClick={() => setSelectedRecordId(rec.id)}
                  >
                    <div className="record-thumb-box">
                      {rec.baselineScan?.thumbnail ? (
                        <img src={rec.baselineScan.thumbnail} alt={rec.cropName} className="rec-thumb-img" />
                      ) : (
                        <div className="rec-thumb-placeholder">🌿</div>
                      )}
                    </div>
                    <div className="record-info-box">
                      <strong className="rec-crop-title">{rec.cropName}</strong>
                      <span className="rec-candidate-name">{rec.baselineScan?.topCandidate}</span>
                      <div className="rec-meta-row">
                        <span className={`rec-status-badge ${badge.cssClass}`}>{badge.label}</span>
                        <span className="rec-date-text">{rec.createdDateFormatted}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Timeline Progression & Comparison */}
          {activeRecord && (
            <div className="tracker-detail-col">
              <div className="active-record-hero-card">
                <div className="arh-header">
                  <div>
                    <h4 className="arh-title">
                      {activeRecord.cropName} — Plot Recovery Sentinel
                    </h4>
                    <span className="arh-established">
                      Started: {activeRecord.createdDateFormatted} • Remind Date: {activeRecord.remindDateFormatted}
                    </span>
                  </div>
                  <div className="arh-actions">
                    <button
                      type="button"
                      className="btn-add-followup"
                      onClick={() => setIsAddingFollowUp(!isAddingFollowUp)}
                    >
                      <IconCamera size={15} />
                      <span>{isAddingFollowUp ? 'Cancel Follow-Up' : '+ Add Follow-Up Scan'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-delete-single-track"
                      onClick={() => handleDeleteRecord(activeRecord.id)}
                      title="Delete this record"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>

                {/* Follow-up upload drawer / form */}
                {isAddingFollowUp && (
                  <div className="followup-upload-panel reveal-smooth">
                    <h5 className="fup-heading">Upload Follow-Up Crop Photo (After Field Actions)</h5>
                    <p className="fup-sub">
                      Take a photo of the same leaf or plant row in similar daytime lighting to evaluate lesion changes.
                    </p>

                    <div className="fup-form-grid">
                      <div className="fup-dropzone" onClick={() => fileInputRef.current?.click()}>
                        {followUpPreview ? (
                          <img src={followUpPreview} alt="Follow-up preview" className="fup-preview-img" />
                        ) : (
                          <div className="fup-dz-empty">
                            <IconCamera size={24} />
                            <span>Click to choose follow-up photo</span>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFollowUpFile}
                        />
                      </div>

                      <div className="fup-inputs-col">
                        <label className="fup-label">Actions taken since baseline:</label>
                        <input
                          type="text"
                          className="fup-text-input"
                          placeholder="e.g. Switched to morning drip, pruned 4 lower leaves"
                          value={followUpActions}
                          onChange={(e) => setFollowUpActions(e.target.value)}
                        />

                        <label className="fup-label">Field observations / notes:</label>
                        <textarea
                          rows="2"
                          className="fup-textarea"
                          placeholder="e.g. Spots appear drier, no new spots on top leaves"
                          value={followUpNotes}
                          onChange={(e) => setFollowUpNotes(e.target.value)}
                        />

                        {evalError && (
                          <div className="fup-error">
                            <IconAlertCircle size={15} />
                            <span>{evalError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          className="btn-submit-comparison"
                          onClick={handleSubmitFollowUp}
                          disabled={isEvaluating}
                        >
                          {isEvaluating ? (
                            <>
                              <IconRefresh size={16} className="spin-icon" />
                              <span>Evaluating Recovery...</span>
                            </>
                          ) : (
                            <>
                              <IconCheck size={16} />
                              <span>Compare & Record Follow-Up</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Side-by-Side Timeline Progression */}
                <div className="timeline-progression-wrap">
                  <h5 className="timeline-heading">Visual Recovery Progression</h5>

                  <div className="timeline-cards-row">
                    {/* Stage 1: Baseline */}
                    <div className="timeline-card baseline-card">
                      <div className="tc-header">
                        <span className="tc-tag tc-baseline-tag">Baseline Scan</span>
                        <span className="tc-date">{activeRecord.baselineScan?.timestamp}</span>
                      </div>
                      <div className="tc-img-wrap">
                        {activeRecord.baselineScan?.thumbnail ? (
                          <img src={activeRecord.baselineScan.thumbnail} alt="Baseline" className="tc-img" />
                        ) : (
                          <div className="tc-no-img">No Image</div>
                        )}
                      </div>
                      <div className="tc-body">
                        <strong className="tc-title">{activeRecord.baselineScan?.topCandidate}</strong>
                        <span className="tc-severity">{activeRecord.baselineScan?.severity}</span>
                        {activeRecord.actionsTaken && (
                          <div className="tc-actions-box">
                            <span className="tc-actions-label">Actions Executed:</span>
                            <p className="tc-actions-text">"{activeRecord.actionsTaken}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 2..N: Follow-Up Scans */}
                    {activeRecord.followUpScans && activeRecord.followUpScans.map((fup, idx) => {
                      const fBadge = getStatusBadge(fup.comparison?.status);
                      return (
                        <div key={fup.id} className="timeline-card followup-card">
                          <div className="tc-header">
                            <span className="tc-tag tc-followup-tag">Follow-Up #{idx + 1}</span>
                            <span className="tc-date">{fup.timestamp}</span>
                          </div>
                          <div className="tc-img-wrap">
                            {fup.thumbnail ? (
                              <img src={fup.thumbnail} alt={`Follow-up ${idx + 1}`} className="tc-img" />
                            ) : (
                              <div className="tc-no-img">No Image</div>
                            )}
                          </div>
                          <div className="tc-body">
                            <span className={`rec-status-badge ${fBadge.cssClass}`}>{fBadge.label}</span>
                            <div className="tc-diff-box">
                              <span className="tc-actions-label">Observed Differences:</span>
                              <ul className="tc-diff-list">
                                {(fup.comparison?.differences || []).map((diff, dIdx) => (
                                  <li key={dIdx}>• {diff}</li>
                                ))}
                              </ul>
                            </div>
                            {fup.notes && (
                              <div className="tc-actions-box">
                                <span className="tc-actions-label">Notes:</span>
                                <p className="tc-actions-text">"{fup.notes}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
