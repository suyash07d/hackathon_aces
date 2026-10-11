import React from 'react';
import { IconInfo } from './Icons';
import { useApp } from '../context/useApp';

export default function DisclaimerBanner() {
  const { t } = useApp();
  return (
    <div className="prototype-banner" role="region" aria-label="Prototype Notice">
      <div className="banner-content">
        <IconInfo size={16} className="banner-icon" />
        <p className="banner-message">
          <strong>{t('appName')} Demonstration:</strong> {t('disclaimerText')}
        </p>
      </div>
    </div>
  );
}
