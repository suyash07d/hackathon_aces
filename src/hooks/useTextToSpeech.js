import { useState, useEffect, useRef, useCallback } from 'react';

export function useTextToSpeech(language = 'en') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Cancel speech whenever language changes
  useEffect(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [language, isSpeaking]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower, clear conversational pace for farmers
    utterance.pitch = 1.0;

    // Select suitable voice
    const voices = synthRef.current.getVoices() || [];
    let chosenVoice = null;

    if (language === 'mr') {
      chosenVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('mr')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
        voices.find((v) => v.lang.toLowerCase().includes('in'));
      utterance.lang = chosenVoice ? chosenVoice.lang : 'hi-IN';
    } else if (language === 'hi') {
      chosenVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
        voices.find((v) => v.lang.toLowerCase().includes('in'));
      utterance.lang = chosenVoice ? chosenVoice.lang : 'hi-IN';
    } else {
      chosenVoice =
        voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      utterance.lang = chosenVoice ? chosenVoice.lang : 'en-US';
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    try {
      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis trigger failed:', err);
      setIsSpeaking(false);
    }
  }, [language]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
