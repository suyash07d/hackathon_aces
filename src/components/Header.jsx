import React from 'react';
import { IconMapPin, IconMenu, IconRefresh } from './Icons';

export default function Header({ 
  locations, 
  selectedLocationId, 
  onSelectLocation, 
  onOpenMobileMenu 
}) {
  const currentLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          type="button" 
          className="mobile-menu-toggle" 
          onClick={onOpenMobileMenu}
          aria-label="Open navigation sidebar"
        >
          <IconMenu size={22} />
        </button>

        <div className="header-titles">
          <div className="title-row">
            <h1 className="header-main-title">Farm Advisory & Crop Sentinel</h1>
            <span className="demo-pill">Simulated Data Environment</span>
          </div>
          <p className="header-subtitle">
            Welcome back. Monitor micro-climatic pathogen risk indicators across your crop plots.
          </p>
        </div>
      </div>

      <div className="header-right">
        <div className="location-selector-card">
          <label htmlFor="station-select" className="location-label">
            <IconMapPin size={15} className="location-pin-icon" />
            <span>Target Agri Station:</span>
          </label>
          <div className="select-wrapper">
            <select
              id="station-select"
              value={selectedLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="location-select"
              aria-label="Select micro-climatic agri station location"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.state})
                </option>
              ))}
            </select>
          </div>
          <div className="station-meta-strip">
            <span className="station-meta-item">Elev: {currentLocation.elevation}</span>
            <span className="station-meta-divider">•</span>
            <span className="station-meta-item">Soil: {currentLocation.soilType}</span>
            <span className="station-meta-divider">•</span>
            <span className="station-meta-item sync-time">
              <IconRefresh size={11} className="sync-icon" />
              {currentLocation.lastSynced}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
