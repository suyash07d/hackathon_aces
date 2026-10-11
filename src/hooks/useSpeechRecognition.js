import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Web Speech Recognition (Speech-to-Text).
 * Supports English (en-IN), Hindi (hi-IN), and Marathi (mr-IN) with fallback.
 */
export function useSpeechRecognition(lang = 'en', onTranscriptChange = null) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported] = useState(() => (
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  ));

  const recognitionRef = useRef(null);
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  // Map app language code to BCP-47 speech recognition locale
  const getSpeechLocale = useCallback((appLang) => {
    switch (appLang) {
      case 'mr':
        return 'mr-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (typeof onTranscriptChangeRef.current === 'function') {
          onTranscriptChangeRef.current(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone permission in your browser.');
        } else if (event.error === 'no-speech') {
          setError('No speech was detected. Please try speaking again.');
        } else {
          setError(`Speech recognition encountered an issue (${event.error}).`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      recognitionRef.current.lang = getSpeechLocale(lang);
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      // If already started, stop then restart
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [getSpeechLocale, isSupported, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
