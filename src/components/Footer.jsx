import React from 'react';
import { IconCloudRain, IconLeaf } from './Icons';
import { useApp } from '../context/useApp';

export default function Footer() {
  const { t } = useApp();

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
                {t('appName')}<span className="gold-dot">.</span>
              </span>
            </div>
            <p className="footer-mission">
              {t('footerMission')}
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
                  {t('navMicroclimate')}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('risk')} className="footer-link-btn">
                  {t('navRiskEngine')}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('scanner')} className="footer-link-btn">
                  {t('navScanner')}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('synthesis')} className="footer-link-btn">
                  {t('navSynthesis')}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('advisories')} className="footer-link-btn">
                  {t('navAdvisories')}
                </button>
              </li>
            </ul>
          </div>

          {/* Agricultural Extension Contacts */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Agricultural Support</h4>
            <div className="footer-contact-block">
              <span className="contact-label">Kisan Call Center (KCC):</span>
              <strong className="contact-val">1800-180-1551</strong>
              <span className="contact-hint">Toll-Free (All Indian States)</span>
            </div>
            <div className="footer-contact-block">
              <span className="contact-label">Research Standards:</span>
              <span className="contact-val">Indian Council of Agricultural Research (ICAR)</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="footer-bottom-row">
          <p className="footer-copyright">
            {t('footerCopyright')}
          </p>
          <span className="footer-arch-tag">
            Production Vercel Serverless Ready • Built with Vite & React 19
          </span>
        </div>
      </div>
    </footer>
  );
}
