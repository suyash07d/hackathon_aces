/**
 * Client-Side Pre-Analysis Image Quality Inspection Utility
 * Inspects exposure (darkness), sharpness/edge variance (blur), and resolution.
 * Non-blocking: flags warnings so farmers can be guided without being locked out.
 */

export function checkImageQuality(imageElement) {
  return new Promise((resolve) => {
    try {
      if (!imageElement) {
        return resolve({ hasWarning: false });
      }

      const naturalWidth = imageElement.naturalWidth || imageElement.width || 0;
      const naturalHeight = imageElement.naturalHeight || imageElement.height || 0;

      // 1. Resolution Check
      const isLowRes = naturalWidth > 0 && (naturalWidth < 250 || naturalHeight < 250);

      // Create a small off-screen canvas for pixel inspection
      const SAMPLE_SIZE = 120;
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        return resolve({ hasWarning: isLowRes, isLowRes });
      }

      ctx.drawImage(imageElement, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const data = imgData.data;

      let totalLuminance = 0;
      const grayPixels = new Float32Array(SAMPLE_SIZE * SAMPLE_SIZE);

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard perceptual luminance formula
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        grayPixels[p] = lum;
      }

      const pixelCount = SAMPLE_SIZE * SAMPLE_SIZE;
      const avgLuminance = totalLuminance / pixelCount;

      // 2. Darkness Check (average luminance < 46 out of 255 is ~18%)
      const isDark = avgLuminance < 46;

      // 3. Blur Estimation using Laplacian edge variance
      // Compute 3x3 Laplacian: [0, 1, 0; 1, -4, 1; 0, 1, 0]
      let edgeSum = 0;
      let edgeSqSum = 0;
      let edgeCount = 0;

      for (let y = 1; y < SAMPLE_SIZE - 1; y++) {
        for (let x = 1; x < SAMPLE_SIZE - 1; x++) {
          const idx = y * SAMPLE_SIZE + x;
          const laplacian =
            grayPixels[idx - SAMPLE_SIZE] +
            grayPixels[idx + SAMPLE_SIZE] +
            grayPixels[idx - 1] +
            grayPixels[idx + 1] -
            4 * grayPixels[idx];

          edgeSum += laplacian;
          edgeSqSum += laplacian * laplacian;
          edgeCount++;
        }
      }

      const meanEdge = edgeSum / edgeCount;
      const edgeVariance = edgeSqSum / edgeCount - meanEdge * meanEdge;

      // Clean leaf shots with clear spots typically exhibit edge variance > 120.
      // An extremely blurred photo will have smooth transitions with edgeVariance < 85.
      const isBlurry = edgeVariance < 85 && !isDark;

      const hasWarning = isDark || isBlurry || isLowRes;

      resolve({
        hasWarning,
        isDark,
        isBlurry,
        isLowRes,
        avgLuminance: Math.round(avgLuminance),
        edgeVariance: Math.round(edgeVariance),
      });
    } catch (err) {
      console.warn('Image quality inspection exception, skipping non-blocking check:', err);
      resolve({ hasWarning: false });
    }
  });
}
