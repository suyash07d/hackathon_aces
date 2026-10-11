import { useContext } from 'react';
import { LanguageThemeContext } from './LanguageContextInstance';

export function useApp() {
  const context = useContext(LanguageThemeContext);
  if (!context) {
    throw new Error('useApp must be used within a LanguageThemeProvider');
  }
  return context;
}
