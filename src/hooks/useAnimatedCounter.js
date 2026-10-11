import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to smoothly animate a numeric counter on change.
 * Respects `prefers-reduced-motion: reduce`.
 */
export function useAnimatedCounter(targetValue, duration = 1000) {
  const isNumeric = typeof targetValue === 'number' && !isNaN(targetValue);
  const [displayValue, setDisplayValue] = useState(isNumeric ? targetValue : 0);
  const prevValueRef = useRef(displayValue);

  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!isNumeric || prefersReducedMotion) {
      return;
    }

    const start = prevValueRef.current;
    const end = targetValue;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easedProgress);
      setDisplayValue(current);
      prevValueRef.current = current;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
        prevValueRef.current = end;
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, duration, isNumeric, prefersReducedMotion]);

  if (!isNumeric || prefersReducedMotion) {
    return targetValue;
  }

  return displayValue;
}
