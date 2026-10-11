import React from 'react';
import { IconCloudRain, IconLeaf } from './Icons';

export default function Footer() {
  const scrollTo = (id) => {
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
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="saas-footer" id="footer" aria-label="Footer">
      <div className="footer-container">
        {/* Top Footer Grid */}
        <div className="footer-top-row">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="footer-brand-logo">
              <div className="footer-brand-icon">
                <IconCloudRain size={20} className="footer-rain-icon" />
                <IconLeaf size={12} className="footer-leaf-icon" />
              </div>
              <span className="footer-brand-name">
                Rain Maker<span className="gold-dot">.</span>
              </span>
            </div>
            <p className="footer-mission">
              Micro-Climatic Crop Disease Early Warning System. Empowering farmers and extension specialists with predictive bio-meteorological infection telemetry and multimodal leaf vision.
            </p>
            <div className="footer-badge-strip">
              <span className="footer-tech-pill">Open-Meteo Forecast API</span>
              <span className="footer-tech-pill">Google Gemini 3.5 Flash</span>
              <span className="footer-tech-pill">ICAR/KVK Framework</span>
            </div>
          </div>

          {/* Quick Anchor Navigation */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">System Sentinel</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => scrollTo('weather')} className="footer-link-btn">
                  Microclimate Telemetry
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('risk')} className="footer-link-btn">
                  Bio-Meteorological Risk Engine
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('scanner')} className="footer-link-btn">
                  AI Foliar Symptom Scanner
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('synthesis')} className="footer-link-btn">
                  Cross-Evidence Synthesis
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('advisories')} className="footer-link-btn">
                  Field Advisories & Action Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Supported Indian Crops & Zones */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Monitored Agro-Climatic Zones</h4>
            <ul className="footer-info-list">
              <li>
                <strong>Nashik Plot, Maharashtra</strong>
                <span>Potato & Tomato (Kharif/Rabi)</span>
              </li>
              <li>
                <strong>Agra Belt, Uttar Pradesh</strong>
                <span>Potato Late Blight Sentinels</span>
              </li>
              <li>
                <strong>Burdwan Rice Bowl, West Bengal</strong>
                <span>Rice Blast & Sheath Blight</span>
              </li>
              <li>
                <strong>Karnal Tract, Haryana</strong>
                <span>Wheat Rust Surveillance</span>
              </li>
            </ul>
          </div>

          {/* Extension & Emergency Escalation */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Extension Support</h4>
            <div className="footer-kvk-box">
              <strong className="footer-kvk-title">Kisan Call Centre (KCC)</strong>
              <p className="footer-kvk-phone">Toll-Free: 1800-180-1551</p>
              <p className="footer-kvk-desc">
                For laboratory verification of suspected foliar blights, visit your district Krishi Vigyan Kendra (KVK) with a sealed fresh leaf sample.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Bar */}
        <div className="footer-bottom-row">
          <p className="footer-copyright">
            © 2026 Rain Maker AgriTech. Built for the Agricultural Innovation Hackathon.
          </p>
          <p className="footer-disclaimer-note">
            Disclaimer: AI vision observations and atmospheric risk indexes provide decision-support guidance. They do not constitute certified laboratory diagnostics or chemical pesticide prescriptions.
          </p>
        </div>
      </div>
    </footer>
  );
}
