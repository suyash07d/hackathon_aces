import React, { useState, useEffect } from 'react';
import { 
  IconCloudRain, 
  IconLeaf, 
  IconMapPin, 
  IconCamera, 
  IconMenu, 
  IconX, 
  IconChevronDown,
  IconSparkles
} from './Icons';

export default function Navbar({ 
  locations = [], 
  selectedLocationId, 
  onSelectLocation,
  backendAiStatus = { isOnline: false, geminiConfigured: false }
}) {
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
    { id: 'weather', label: 'Microclimate' },
    { id: 'risk', label: 'Risk Engine' },
    { id: 'scanner', label: 'AI Vision Scanner' },
    { id: 'synthesis', label: 'Cross-Evidence' },
    { id: 'advisories', label: 'Advisories' },
    { id: 'how-it-works', label: 'How It Works' },
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
                Rain Maker<span className="gold-dot">.</span>
              </span>
              <span className="navbar-brand-tagline">AgriTech Sentinel</span>
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
                    <span>Gemini 3.5 AI</span>
                  </>
                ) : (
                  <span>Sentinel Heuristics</span>
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
              <span>Scan Foliage</span>
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
            <div className="mobile-menu-station">
              <label className="mobile-station-label">
                <IconMapPin size={14} />
                <span>Monitored Agri Zone:</span>
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
              <span>Launch AI Crop Scanner</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
