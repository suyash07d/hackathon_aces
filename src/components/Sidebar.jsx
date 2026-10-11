import React from 'react';
import { 
  IconCloudRain, 
  IconLeaf, 
  IconActivity, 
  IconShieldAlert, 
  IconInfo, 
  IconX,
  IconCamera
} from './Icons';

export default function Sidebar({ isOpen, onClose, activeTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Farmer Dashboard', icon: IconActivity, badge: 'Live Demo' },
    { id: 'scanner', label: 'Image Symptom Scanner', icon: IconCamera, badge: 'New' },
    { id: 'crops', label: 'Crop Sentinel', icon: IconLeaf },
    { id: 'weather', label: 'Micro-Climate Feed', icon: IconCloudRain },
    { id: 'risk', label: 'Risk Analyzer', icon: IconShieldAlert },
    { id: 'advisories', label: 'Actionable Advisories', icon: IconInfo },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="brand-icon-wrapper">
              <IconCloudRain size={24} className="brand-rain-icon" />
              <IconLeaf size={14} className="brand-leaf-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-title">Rain Maker</span>
              <span className="brand-tagline">Micro-Climatic Early Warning</span>
            </div>
          </div>

          <button 
            type="button" 
            className="mobile-close-btn" 
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="sidebar-status-pill">
          <span className="pulse-dot"></span>
          <span className="status-label">Station Prototype (Demo)</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onClose) onClose();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <IconComponent size={19} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="prototype-disclaimer-box">
            <div className="disclaimer-title">
              <IconInfo size={15} />
              <span>Hackathon Prototype</span>
            </div>
            <p className="disclaimer-text">
              All micro-climate feeds and disease threat calculations are simulated sample benchmarks for farmer decision-support modeling.
            </p>
          </div>
          <div className="sidebar-version">
            <span>Rain Maker v0.1-preview</span>
          </div>
        </div>
      </aside>
    </>
  );
}
