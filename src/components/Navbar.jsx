import React, { useState, useEffect } from 'react';
import { 
  IconCloudRain, 
  IconLeaf, 
  IconMapPin, 
  IconCamera, 
  IconMenu, 
  IconX, 
  IconChevronDown,
  IconSparkles,
  IconSun,
  IconMoon,
  IconHistory,
  IconGlobe
} from './Icons';
import { useApp } from '../context/useApp';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';

export default function Navbar({ 
  locations = [], 
  selectedLocationId, 
  onSelectLocation,
  backendAiStatus = { isOnline: false, geminiConfigured: false },
  onOpenHistory
}) {
  const { language, setLanguage, theme, toggleTheme, t } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Track active section for navbar indicators
      const sections = ['weather', 'risk', 'scanner', 'synthesis', 'advisories', 'how-it-works'];
      const scrollPos = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navLinks = [
    { id: 'weather', label: t('navMicroclimate') },
    { id: 'risk', label: t('navRiskEngine') },
    { id: 'scanner', label: t('navScanner') },
    { id: 'synthesis', label: t('navSynthesis') },
    { id: 'advisories', label: t('navAdvisories') },
    { id: 'how-it-works', label: t('navHowItWorks') },
  ];

  return (
    <>
      <header className={`saas-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Brand Logo */}
          <a 
            href="#hero" 
            className="navbar-brand"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="navbar-brand-icon">
              <IconCloudRain size={22} className="navbar-rain-icon" />
              <IconLeaf size={13} className="navbar-leaf-icon" />
            </div>
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">
                {t('appName')}<span className="gold-dot">.</span>
              </span>
              <span className="navbar-brand-tagline">{t('appTagline')}</span>
            </div>
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="navbar-nav-desktop" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`navbar-nav-link ${activeSection === link.id ? 'active' : ''}`}
                onClick={() => scrollTo(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="navbar-actions">
            {/* Language Selector Dropdown (Feature 3) */}
            <div className="navbar-lang-picker" title={t('language')}>
              <IconGlobe size={14} className="lang-icon" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="navbar-lang-select"
                aria-label={t('language')}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Accessible Dark / Light Mode Toggle Button (Feature 4) */}
            <button
              type="button"
              className="navbar-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? t('themeLight') : t('themeDark')}
              aria-label={t('toggleTheme')}
            >
              {theme === 'dark' ? (
                <IconSun size={17} className="theme-icon sun-icon" />
              ) : (
                <IconMoon size={17} className="theme-icon moon-icon" />
              )}
            </button>

            {/* Scan History Trigger (Feature 8) */}
            {onOpenHistory && (
              <button
                type="button"
                className="navbar-history-btn"
                onClick={onOpenHistory}
                title={t('navScanHistory')}
                aria-label={t('navScanHistory')}
              >
                <IconHistory size={16} />
              </button>
            )}

            {/* Live AI Status Pill */}
            <div 
              className={`navbar-status-pill ${
                backendAiStatus.isOnline && backendAiStatus.geminiConfigured
                  ? 'status-ai-live'
                  : 'status-ai-ready'
              }`}
              title={
                backendAiStatus.isOnline && backendAiStatus.geminiConfigured
                  ? `Gemini 3.5 Multimodal AI active`
                  : 'Agronomic heuristic mode active'
              }
            >
              <span className="pulse-indicator-dot"></span>
              <span className="status-pill-text">
                {backendAiStatus.isOnline && backendAiStatus.geminiConfigured ? (
                  <>
                    <IconSparkles size={11} className="sparkle-icon" />
                    <span>Gemini 3.5</span>
                  </>
                ) : (
                  <span>{t('aiHeuristics')}</span>
                )}
              </span>
            </div>

            {/* Station Dropdown */}
            {locations.length > 0 && (
              <div className="navbar-station-select-wrap">
                <IconMapPin size={14} className="navbar-station-pin" />
                <select
                  value={selectedLocationId}
                  onChange={(e) => onSelectLocation(e.target.value)}
                  className="navbar-station-select"
                  aria-label="Select agricultural telemetry station"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.state})
                    </option>
                  ))}
                </select>
                <IconChevronDown size={12} className="navbar-select-chevron" />
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              className="navbar-cta-btn"
              onClick={() => scrollTo('scanner')}
            >
              <IconCamera size={16} />
              <span>{t('scanFoliage')}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <IconX size={22} /> : <IconMenu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-menu" role="dialog" aria-modal="true">
          <div className="mobile-menu-inner">
            {/* Mobile Language and Theme Row */}
            <div className="mobile-utility-strip">
              <div className="mobile-lang-row">
                <span className="mobile-util-label">{t('language')}:</span>
                <div className="mobile-lang-buttons">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`mobile-lang-btn ${language === lang.code ? 'lang-active' : ''}`}
                      onClick={() => setLanguage(lang.code)}
                    >
                      {lang.nativeLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mobile-theme-row">
                <button
                  type="button"
                  className="mobile-theme-btn"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
                  <span>{theme === 'dark' ? t('themeLight') : t('themeDark')}</span>
                </button>
              </div>
            </div>

            <div className="mobile-menu-station">
              <label className="mobile-station-label">
                <IconMapPin size={14} />
                <span>{t('monitoredZone')}</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  onSelectLocation(e.target.value);
                  setIsMobileMenuOpen(false);
                }}
                className="mobile-station-select"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.state})
                  </option>
                ))}
              </select>
            </div>

            <nav className="mobile-nav-links">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className={`mobile-nav-link ${activeSection === link.id ? 'active' : ''}`}
                  onClick={() => scrollTo(link.id)}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <button
              type="button"
              className="mobile-cta-btn"
              onClick={() => scrollTo('scanner')}
            >
              <IconCamera size={18} />
              <span>{t('launchScanner')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
