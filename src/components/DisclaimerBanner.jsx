import React from 'react';
import { IconInfo } from './Icons';

export default function DisclaimerBanner() {
  return (
    <div className="prototype-banner" role="region" aria-label="Prototype Notice">
      <div className="banner-content">
        <IconInfo size={16} className="banner-icon" />
        <p className="banner-message">
          <strong>Hackathon Demonstration Prototype:</strong> All weather telemetry, sensor readings, and disease threat levels shown are simulated sample datasets for demonstration purposes and are not real-time meteorological forecasts or scientifically validated diagnostic predictions.
        </p>
      </div>
    </div>
  );
}
