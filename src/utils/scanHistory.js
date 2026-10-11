/**
 * Local Browser Scan History Storage Utility
 * Manages saved scan history in localStorage under 'rainmaker_scan_history'.
 * Thumbnails are scaled down to 120px to prevent quota overflows.
 */

const STORAGE_KEY = 'rainmaker_scan_history';
const MAX_HISTORY_ITEMS = 10;

export function getScanHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse scan history from localStorage:', err);
    return [];
  }
}

/**
 * Generate a tiny thumbnail (<10KB) from image URL or base64
 */
function createMicroThumbnail(sourceUrl) {
  return new Promise((resolve) => {
    if (!sourceUrl) return resolve(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const TARGET_W = 120;
        const aspect = (img.naturalHeight || img.height) / (img.naturalWidth || img.width || 1);
        const targetH = Math.round(TARGET_W * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_W;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, TARGET_W, targetH);
          const thumb = canvas.toDataURL('image/jpeg', 0.6);
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

export async function saveScanToHistory({ cropId, cropName, previewUrl, result, symptoms = [] }) {
  try {
    const history = getScanHistory();
    const thumbnail = await createMicroThumbnail(previewUrl || result?.fileInfo?.previewUrl);

    const topCandidate = result?.candidates?.[0]?.name || (result?.isSuitableSpecimen ? 'No Candidate Identified' : 'Unsuitable Specimen');
    const severity = result?.severityEstimate?.level || 'Undetermined';

    const newEntry = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleString(),
      timestampIso: new Date().toISOString(),
      cropId,
      cropName,
      thumbnail,
      topCandidate,
      severity,
      symptoms,
      isAiInference: Boolean(result?.isAiInference),
      aiModel: result?.aiModel || null,
      fullResult: result, // stored so user can reload and review report
    };

    // Prepend new scan and cap at MAX_HISTORY_ITEMS
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save scan to localStorage history:', err);
    return getScanHistory();
  }
}

export function deleteScanFromHistory(id) {
  try {
    const history = getScanHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete scan from localStorage:', err);
    return getScanHistory();
  }
}

export function clearAllScanHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.warn('Failed to clear scan history:', err);
    return [];
  }
}
