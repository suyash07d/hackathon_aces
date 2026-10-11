import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageThemeProvider } from './context/LanguageThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageThemeProvider>
      <App />
    </LanguageThemeProvider>
  </StrictMode>,
)
