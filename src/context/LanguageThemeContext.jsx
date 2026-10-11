import React, { useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { LanguageThemeContext } from './LanguageContextInstance';

export function LanguageThemeProvider({ children }) {
  // 1. Language state with localStorage persistence
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('rainmaker_language');
      if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
        return saved;
      }
    } catch (e) {
      console.warn('LocalStorage language read error:', e);
    }
    return 'en';
  });

  const setLanguage = useCallback((langCode) => {
    if (['en', 'mr', 'hi'].includes(langCode)) {
      setLanguageState(langCode);
      try {
        localStorage.setItem('rainmaker_language', langCode);
      } catch (e) {
        console.warn('LocalStorage language save error:', e);
      }
    }
  }, []);

  // 2. Theme state with localStorage persistence and HTML attribute synchronization
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('rainmaker_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {
      console.warn('LocalStorage theme read error:', e);
    }
    return 'dark'; // Forest green SaaS dark mode default
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('rainmaker_theme', theme);
    } catch (e) {
      console.warn('Theme attribute sync error:', e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // 3. Translation resolver helper
  const t = useCallback((key, replacements = {}) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    const fallbackDict = TRANSLATIONS.en;
    
    let text = langDict[key] ?? fallbackDict[key] ?? key;

    // Apply template replacements like {location} or {count}
    if (typeof text === 'string' && replacements && typeof replacements === 'object') {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  }, [language]);

  const value = {
    language,
    setLanguage,
    theme,
    toggleTheme,
    t,
  };

  return (
    <LanguageThemeContext.Provider value={value}>
      {children}
    </LanguageThemeContext.Provider>
  );
}
