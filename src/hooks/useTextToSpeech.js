import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Text-to-Speech hook utilizing native Web Speech API (window.speechSynthesis).
 * 
 * Fixes speech lifecycle bug where isSpeaking state change triggered cancellation effect.
 * Handles asynchronous voice loading via onvoiceschanged event.
 * Selects suitable voices for English, Marathi, and Hindi without false availability claims.
 * Synchronizes play/stop state with start, end, and error utterance events.
 */
export function useTextToSpeech(language = 'en') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [speechError, setSpeechError] = useState(null);

  const synthRef = useRef(null);
  const prevLangRef = useRef(language);
  const activeUtteranceRef = useRef(null);

  // Check Web Speech API availability
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Initialize and load voices
  useEffect(() => {
    if (!isSupported) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      try {
        const available = synthRef.current ? synthRef.current.getVoices() : [];
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch (err) {
        console.warn('Error loading speechSynthesis voices:', err);
      }
    };

    // Load initial voices (synchronous if already cached)
    loadVoices();

    // Listen for asynchronous voice population
    if (synthRef.current) {
      if ('onvoiceschanged' in synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      try {
        synthRef.current.addEventListener('voiceschanged', loadVoices);
      } catch {
        // Fallback for environments where addEventListener is not implemented on synth
      }
    }

    return () => {
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
          if ('onvoiceschanged' in synthRef.current) {
            synthRef.current.onvoiceschanged = null;
          }
          synthRef.current.removeEventListener?.('voiceschanged', loadVoices);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [isSupported]);

  // Derive best voice based on current language and available voices
  const voiceInfo = useMemo(() => {
    if (!isSupported || voices.length === 0) {
      return {
        voice: null,
        isExactMatch: false,
        voiceName: '',
        note: isSupported ? 'Loading available system voices...' : 'Speech synthesis not supported',
      };
    }

    let exact = null;
    let fallback = null;
    let note = '';

    if (language === 'mr') {
      // Look for Marathi voices (mr-IN, mr)
      exact = voices.find((v) => v.lang.toLowerCase().startsWith('mr'));
      if (exact) {
        note = `Native Marathi voice: ${exact.name}`;
      } else {
        // Safe fallback: Devanagari Hindi voice or Indian English
        fallback =
          voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
          voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
          voices.find((v) => v.lang.toLowerCase().includes('in')) ||
          voices[0];
        note = fallback
          ? `Marathi voice not installed on device; using ${fallback.name} (${fallback.lang})`
          : 'No compatible voice found';
      }
    } else if (language === 'hi') {
      // Look for Hindi voices (hi-IN, hi)
      exact = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
      if (exact) {
        note = `Native Hindi voice: ${exact.name}`;
      } else {
        fallback =
          voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
          voices.find((v) => v.lang.toLowerCase().includes('in')) ||
          voices[0];
        note = fallback
          ? `Hindi voice not installed on device; using ${fallback.name}`
          : 'No compatible voice found';
      }
    } else {
      // English: Prefer Indian English (en-IN), then en-US/en-GB
      exact =
        voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (exact) {
        note = `English voice: ${exact.name} (${exact.lang})`;
      } else {
        fallback = voices[0];
        note = fallback ? `Using system default: ${fallback.name}` : 'No voice found';
      }
    }

    const selected = exact || fallback;
    return {
      voice: selected,
      isExactMatch: Boolean(exact),
      voiceName: selected ? selected.name : '',
      note,
    };
  }, [language, voices, isSupported]);

  // Cancel speech ONLY when language actually changes
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch {
          // ignore
        }
      }
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }
  }, [language]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false);
    activeUtteranceRef.current = null;
  }, []);

  const speak = useCallback((text) => {
    if (!synthRef.current || !text) {
      setSpeechError('Speech synthesis is not available.');
      return;
    }

    // Cancel any current utterance before starting new speech
    try {
      synthRef.current.cancel();
    } catch {
      // ignore
    }

    setSpeechError(null);

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utterance;

    utterance.rate = 0.92; // Clear, comfortable conversational pace
    utterance.pitch = 1.0;

    // Apply voice if selected
    if (voiceInfo.voice) {
      utterance.voice = voiceInfo.voice;
      utterance.lang = voiceInfo.voice.lang;
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Synchronize play/stop lifecycle strictly via events
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeechError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      // 'canceled' or 'interrupted' are normal stops
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('SpeechSynthesisUtterance error:', event.error);
        setSpeechError(`Speech error: ${event.error}`);
      }
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };

    try {
      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis speak() failed:', err);
      setSpeechError('Failed to start speech output.');
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }
  }, [language, voiceInfo.voice]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    voiceInfo,
    speechError,
  };
}
