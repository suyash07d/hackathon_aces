/**
 * Crop Recovery Tracker Storage & Comparison Utility
 *
 * Manages multi-scan crop recovery timelines in localStorage.
 * Enables smallholder farmers to track foliar recovery across 3–14 days
 * after executing recommended cultural interventions.
 *
 * Safety & Storage Efficiency:
 * - Rejects non-plant or unsuitable scans from entering the tracker.
 * - Compresses thumbnails to <12KB using micro-canvas to prevent localStorage quota overflows.
 * - Handles comparison evaluation (Improving, Stable, Worsening, Inconclusive).
 */

const STORAGE_KEY = 'rainmaker_recovery_tracker';
const MAX_TRACKED_RECORDS = 10;

/**
 * Creates a micro JPEG data-URL (150px) to prevent localStorage quota overflow.
 */
function createMicroThumbnail(sourceUrl) {
  return new Promise((resolve) => {
    if (!sourceUrl) return resolve(null);
    if (typeof document === 'undefined') return resolve(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const TARGET_W = 160;
        const aspect = (img.naturalHeight || img.height) / (img.naturalWidth || img.width || 1);
        const targetH = Math.round(TARGET_W * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_W;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, TARGET_W, targetH);
          const thumb = canvas.toDataURL('image/jpeg', 0.65);
          resolve(thumb);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = sourceUrl;
  });
}

/**
 * Retrieves all tracked crop records from localStorage.
 */
export function getTrackedCrops() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse tracked crops from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new baseline crop scan to the recovery tracker.
 */
export async function saveBaselineToTracker({
  cropId,
  cropName,
  previewUrl,
  result,
  symptoms = [],
  farmerNotes = '',
  actionsTaken = '',
  remindDays = 4,
  weatherSnapshot = null,
}) {
  // CRITICAL GUARDRAIL: Rejected, non-plant, or unsuitable scans must never enter the tracker!
  if (
    !result ||
    result.isPlantCrop === false ||
    result.isSuitableSpecimen === false ||
    result.validationStatus === 'unrelated_image' ||
    result.validationStatus === 'harvested_produce'
  ) {
    throw new Error('Only verified, suitable crop foliage scans can be tracked in the Recovery Tracker.');
  }

  const existing = getTrackedCrops();
  const thumbnail = await createMicroThumbnail(previewUrl || result?.fileInfo?.previewUrl);

  const topCandidate = result?.candidates?.[0]?.name || (result?.isHealthy ? 'Healthy Foliage' : 'General Foliar Inspection');
  const severity = result?.severityEstimate?.level || 'Active Monitoring';

  const now = new Date();
  const remindDate = new Date(now.getTime() + remindDays * 24 * 60 * 60 * 1000);

  const newRecord = {
    id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cropId,
    cropName: cropName || (cropId.charAt(0).toUpperCase() + cropId.slice(1)),
    createdAt: now.toISOString(),
    createdDateFormatted: now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    remindDays,
    remindDateIso: remindDate.toISOString(),
    remindDateFormatted: remindDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    initialNotes: farmerNotes.trim() || 'Baseline scan registered.',
    actionsTaken: actionsTaken.trim() || 'Cultural field sanitation initiated.',
    weatherSnapshot: weatherSnapshot ? {
      temp: weatherSnapshot.current?.temperature_2m ?? weatherSnapshot.temperature ?? null,
      humidity: weatherSnapshot.current?.relative_humidity_2m ?? weatherSnapshot.relativeHumidity ?? null,
      rain: weatherSnapshot.current?.precipitation ?? weatherSnapshot.precipitation ?? null,
    } : null,
    baselineScan: {
      timestamp: now.toLocaleString(),
      timestampIso: now.toISOString(),
      thumbnail,
      topCandidate,
      severity,
      symptoms,
      isAiInference: Boolean(result?.isAiInference),
      aiModel: result?.aiModel || null,
      observedVisualFeatures: result?.observedVisualFeatures || [],
      candidatePathogen: result?.candidates?.[0]?.pathogen || null,
    },
    followUpScans: [],
    currentStatus: 'baseline_active', // 'baseline_active' | 'improving' | 'stable' | 'worsening' | 'inconclusive'
    statusLabel: 'Baseline Established (Monitoring In Progress)',
  };

  const updated = [newRecord, ...existing].slice(0, MAX_TRACKED_RECORDS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    // If quota exceeded, drop oldest records
    console.warn('Storage quota warning in recovery tracker, pruning older records:', err);
    const pruned = [newRecord, ...existing.slice(0, 3)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    return pruned;
  }

  return updated;
}

/**
 * Analyzes difference between baseline and follow-up scans.
 */
export function evaluateFoliarComparison({ baseline, followUp, userNotes = '' }) {
  if (!baseline || !followUp) {
    return {
      status: 'inconclusive',
      statusLabel: 'Inconclusive (Missing Comparison Data)',
      differences: ['Baseline or follow-up scan data is missing.'],
      recommendations: ['Capture a clear, well-lit follow-up leaf photo to evaluate recovery.'],
    };
  }

  const baselineSymptoms = baseline.symptoms || [];
  const followUpSymptoms = followUp.symptoms || [];

  const removedSymptoms = baselineSymptoms.filter((s) => !followUpSymptoms.includes(s));
  const newSymptoms = followUpSymptoms.filter((s) => !baselineSymptoms.includes(s));
  const retainedSymptoms = baselineSymptoms.filter((s) => followUpSymptoms.includes(s));

  let status = 'stable';
  let statusLabel = 'Stable (Lesion Progression Halted)';
  const differences = [];
  const recommendations = [];

  if (followUp.isHealthy || (baselineSymptoms.length > 0 && followUpSymptoms.length === 0)) {
    status = 'improving';
    statusLabel = 'Significantly Improving (Foliage Cleared)';
    differences.push('No active foliar symptoms declared on follow-up scan.');
    differences.push('Canopy indicates remission of primary lesion spread.');
    recommendations.push('Maintain morning root-zone irrigation and continue preventive canopy hygiene.');
  } else if (removedSymptoms.length > 0 && newSymptoms.length === 0) {
    status = 'improving';
    statusLabel = 'Improving (Symptom Load Decreasing)';
    differences.push(`Resolved symptoms: ${removedSymptoms.join(', ')}.`);
    differences.push('Lesion margins appear localized; spread has not jumped to new foliar markers.');
    recommendations.push('Continue existing cultural management. Do NOT resume overhead sprinkler irrigation.');
  } else if (newSymptoms.length > 0) {
    status = 'worsening';
    statusLabel = 'Worsening (New Symptoms Emerging)';
    differences.push(`Newly observed symptom markers: ${newSymptoms.join(', ')}.`);
    if (newSymptoms.includes('wilting') || newSymptoms.includes('water_soaked')) {
      differences.push('Severe progression: Rapid water-soaking or vascular wilting detected.');
    }
    recommendations.push('Inspect main stem nodes and root crowns immediately for vascular invasion.');
    recommendations.push('Contact your local Krishi Vigyan Kendra (KVK) or Kisan Call Centre (1800-180-1551) with a physical leaf sample.');
  } else if (retainedSymptoms.length > 0) {
    status = 'stable';
    statusLabel = 'Stable (Existing Lesions Contained)';
    differences.push(`Persistent symptoms: ${retainedSymptoms.join(', ')}.`);
    differences.push('Lesion area appears stable with no newly declared symptom types.');
    recommendations.push('Keep inspecting the underside of leaves at dawn for renewed sporulation.');
    recommendations.push('Ensure crop rows remain well-weeded to maintain dry canopy airflow.');
  } else {
    status = 'inconclusive';
    statusLabel = 'Inconclusive (Baseline Check)';
    differences.push('Symptom counts identical with no distinct morphological shift reported.');
    recommendations.push('Perform another photographic check in 3 days.');
  }

  if (userNotes && userNotes.trim()) {
    differences.push(`Farmer observation: ${userNotes.trim()}`);
  }

  return {
    status,
    statusLabel,
    differences,
    recommendations,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Adds a follow-up scan to an existing tracked crop record.
 */
export async function addFollowUpToTracker({
  recordId,
  previewUrl,
  result,
  symptoms = [],
  notes = '',
  actionsTaken = '',
}) {
  // CRITICAL GUARDRAIL: Rejected scans must not be added as follow-up
  if (
    !result ||
    result.isPlantCrop === false ||
    result.isSuitableSpecimen === false ||
    result.validationStatus === 'unrelated_image'
  ) {
    throw new Error('Only verified, suitable crop foliage images can be used for recovery comparison.');
  }

  const existing = getTrackedCrops();
  const index = existing.findIndex((r) => r.id === recordId);
  if (index === -1) {
    throw new Error('Tracked crop record not found.');
  }

  const record = existing[index];
  const thumbnail = await createMicroThumbnail(previewUrl || result?.fileInfo?.previewUrl);

  const comparison = evaluateFoliarComparison({
    baseline: record.baselineScan,
    followUp: {
      symptoms,
      isHealthy: Boolean(result?.isHealthy),
      candidates: result?.candidates || [],
      observedVisualFeatures: result?.observedVisualFeatures || [],
    },
    userNotes: notes,
  });

  const now = new Date();
  const newFollowUp = {
    id: `follow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now.toLocaleString(),
    timestampIso: now.toISOString(),
    thumbnail,
    symptoms,
    notes: notes.trim() || 'Follow-up inspection recorded.',
    actionsTaken: actionsTaken.trim() || '',
    isAiInference: Boolean(result?.isAiInference),
    aiModel: result?.aiModel || null,
    comparison,
  };

  const updatedRecord = {
    ...record,
    followUpScans: [...(record.followUpScans || []), newFollowUp],
    currentStatus: comparison.status,
    statusLabel: comparison.statusLabel,
    lastComparedAt: now.toISOString(),
  };

  const updatedList = [...existing];
  updatedList[index] = updatedRecord;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Failed to update recovery tracker in localStorage:', err);
  }

  return updatedList;
}

/**
 * Deletes a tracked crop record by ID.
 */
export function deleteTrackedCrop(recordId) {
  const existing = getTrackedCrops();
  const updated = existing.filter((r) => r.id !== recordId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete tracked crop record:', err);
  }
  return updated;
}

/**
 * Clears all tracked crop records.
 */
export function clearAllTrackedCrops() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear recovery tracker:', err);
  }
  return [];
}
