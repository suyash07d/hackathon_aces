import React from 'react';
import { 
  IconThermometer, 
  IconDroplets, 
  IconCloudRain, 
  IconWind, 
  IconInfo,
  IconRefresh,
  IconClock,
  IconSun,
  IconAlertCircle,
  IconWifiOff
} from './Icons';
import { useApp } from '../context/useApp';

export default function WeatherMetrics({ 
  weather, 
  liveWeather, 
  isLoading, 
  apiError, 
  onRetry,
  locationName 
}) {
  const { t } = useApp();

  // Determine if using live API data or fallback
  const isLive = Boolean(liveWeather && !apiError);
  
  // Current values to display
  const currentTemp = isLive ? liveWeather.current.temperature : weather.temperature;
  const currentHumidity = isLive ? liveWeather.current.humidity : weather.humidity;
  const currentRain = isLive ? liveWeather.current.precipitation : weather.rainfall;
  const currentWindSpeed = isLive ? liveWeather.current.windSpeed : weather.windSpeed;
  const currentWindDir = isLive ? liveWeather.current.windDirection : weather.windDirection;
  const currentPressure = isLive ? liveWeather.current.surfacePressure : weather.pressure;
  const currentDescription = isLive ? liveWeather.current.weatherDescription : 'Simulated Sensor Feed';
  const tempMin = isLive ? liveWeather.current.tempMin : weather.tempMin;
  const tempMax = isLive ? liveWeather.current.tempMax : weather.tempMax;
  const precipProb = isLive ? `${liveWeather.current.precipProbMax}%` : weather.rainfallProbability;
  const hourlyData = isLive ? (liveWeather.hourly || []) : [];

  const isHighHumidity = currentHumidity >= 80;
  const hasRain = currentRain > 0;

  return (
    <section className="weather-section" aria-labelledby="weather-metrics-heading">
      {/* Section Header */}
      <div className="section-header-row">
        <div>
          <div className="title-with-pill">
            <h2 id="weather-metrics-heading" className="section-title">
              {t('weatherTitle')}
            </h2>
            {isLive ? (
              <span className="live-api-tag" title="Connected to Open-Meteo Forecast API">
                <span className="live-ping-dot"></span>
                {t('weatherLiveTag')}
              </span>
            ) : (
              <span className="sample-data-badge">
                <IconInfo size={13} />
                <span>{t('weatherSimulatedTag')}</span>
              </span>
            )}
          </div>
          <p className="section-subtitle">
            Regional atmospheric observations for {locationName}. Compare macro-weather against disease spore thresholds.
          </p>
        </div>

        <div className="weather-header-actions">
          {isLive && (
            <span className="weather-sync-badge">
              Synced: {liveWeather.fetchedAt}
            </span>
          )}
          <button 
            type="button" 
            className="refresh-weather-btn" 
            onClick={onRetry} 
            disabled={isLoading}
            aria-label="Refresh weather data"
            title="Fetch latest forecast from Open-Meteo"
          >
            <IconRefresh size={14} className={isLoading ? 'spin-icon' : ''} />
            <span>{isLoading ? t('loading') : t('retry')}</span>
          </button>
        </div>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="api-error-card" role="alert">
          <div className="error-icon-box">
            <IconWifiOff size={20} />
          </div>
          <div className="error-content">
            <strong className="error-title">Open-Meteo Live API Connection Notice</strong>
            <p className="error-message">
              {apiError} Displaying fallback simulated sensor baseline so your workflow is not interrupted.
            </p>
          </div>
          <button 
            type="button" 
            className="error-retry-btn" 
            onClick={onRetry}
            disabled={isLoading}
          >
            <IconRefresh size={14} className={isLoading ? 'spin-icon' : ''} />
            <span>{t('retry')}</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton Indicator */}
      {isLoading && (
        <div className="weather-loading-bar" aria-live="polite">
          <span className="loading-pulse-indicator"></span>
          <span>Fetching live atmospheric forecast from Open-Meteo API...</span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className={`metrics-grid ${isLoading ? 'metrics-grid-loading' : ''}`}>
        {/* Temperature Card */}
        <div className="metric-card metric-card-temp">
          <div className="metric-top">
            <span className="metric-label">{t('weatherTemp')}</span>
            <div className="metric-icon-circle icon-temp">
              <IconThermometer size={20} />
            </div>
          </div>
          <div className="metric-body">
            <div className="metric-primary-value">
              <span className="value-number">{currentTemp !== null && currentTemp !== undefined ? currentTemp : '--'}</span>
              <span className="value-unit">°C</span>
            </div>
            <span className="metric-subtext">
              Condition: <strong>{currentDescription}</strong>
            </span>
          </div>
          <div className="metric-footer">
            <div className="metric-split-row">
              <span className="metric-hint">Min: {tempMin}°C • Max: {tempMax}°C</span>
              {isLive && liveWeather.current.apparentTemperature !== undefined && (
                <span className="metric-feels-like">Feels: {liveWeather.current.apparentTemperature}°C</span>
              )}
            </div>
          </div>
        </div>

        {/* Relative Humidity Card */}
        <div className={`metric-card metric-card-humidity ${isHighHumidity ? 'metric-card-alert' : ''}`}>
          <div className="metric-top">
            <span className="metric-label">{t('weatherHumidity')}</span>
            <div className="metric-icon-circle icon-humidity">
              <IconDroplets size={20} />
            </div>
          </div>
          <div className="metric-body">
            <div className="metric-primary-value">
              <span className="value-number">{currentHumidity !== null && currentHumidity !== undefined ? currentHumidity : '--'}</span>
              <span className="value-unit">%</span>
            </div>
            <span className="metric-subtext">
              {isLive ? 'Atmospheric Moisture Level (2m height)' : weather.humidityTrend}
            </span>
          </div>
          <div className="metric-footer">
            <span className={`status-badge-inline ${isHighHumidity ? 'badge-amber' : 'badge-green'}`}>
              {isHighHumidity ? '⚠️ Spore Germination Hazard (>80%)' : '✓ Normal Canopy Moisture'}
            </span>
          </div>
        </div>

        {/* Precipitation Card */}
        <div className="metric-card metric-card-rain">
          <div className="metric-top">
            <span className="metric-label">{t('weatherRainfall')}</span>
            <div className="metric-icon-circle icon-rain">
              <IconCloudRain size={20} />
            </div>
          </div>
          <div className="metric-body">
            <div className="metric-primary-value">
              <span className="value-number">{currentRain !== null && currentRain !== undefined ? currentRain : '0.0'}</span>
              <span className="value-unit">mm</span>
            </div>
            <span className="metric-subtext">
              Precipitation Probability: <strong>{precipProb}</strong>
            </span>
          </div>
          <div className="metric-footer">
            <span className="metric-hint">
              {hasRain ? 'Active splash dispersal potential' : 'Dry canopy conditions'}
            </span>
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="metric-card metric-card-wind">
          <div className="metric-top">
            <span className="metric-label">{t('weatherWind')}</span>
            <div className="metric-icon-circle icon-wind">
              <IconWind size={20} />
            </div>
          </div>
          <div className="metric-body">
            <div className="metric-primary-value">
              <span className="value-number">{currentWindSpeed !== null && currentWindSpeed !== undefined ? currentWindSpeed : '--'}</span>
              <span className="value-unit">km/h</span>
            </div>
            <span className="metric-subtext">
              Vector: <strong>{currentWindDir}</strong>
            </span>
          </div>
          <div className="metric-footer">
            <span className="metric-hint">
              {currentWindSpeed > 15 ? 'High spore drift vector active' : 'Calm / Favorable spraying window'}
            </span>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Information for Temperature & Humidity Trends */}
      {isLive && hourlyData.length > 0 && (
        <div className="hourly-forecast-module">
          <div className="hourly-header">
            <div className="hourly-title-box">
              <IconClock size={16} />
              <h3 className="hourly-title">{t('weatherHourlyHeading')}</h3>
            </div>
            <span className="hourly-subtitle">
              {t('weatherHourlySub')}
            </span>
          </div>

          <div className="hourly-scroll-strip" tabIndex="0" aria-label="Hourly forecast cards">
            {hourlyData.map((hour, idx) => (
              <div 
                key={idx} 
                className={`hourly-card ${hour.isSporeCritical ? 'hourly-card-critical' : ''}`}
              >
                <span className="hour-time">{hour.time}</span>
                <div className="hour-icon-box">
                  {hour.precipitation > 0 ? (
                    <IconCloudRain size={18} className="hour-rain-icon" />
                  ) : hour.temperature > 25 ? (
                    <IconSun size={18} className="hour-sun-icon" />
                  ) : (
                    <IconDroplets size={18} className="hour-drop-icon" />
                  )}
                </div>
                <div className="hour-temp">
                  <strong>{Math.round(hour.temperature)}°C</strong>
                </div>
                <div className="hour-humidity-row">
                  <span className={`hour-rh-pill ${hour.isSporeCritical ? 'rh-critical' : 'rh-normal'}`}>
                    {hour.humidity}% RH
                  </span>
                </div>
                {hour.dewPoint !== null && (
                  <span className="hour-dew">Dew: {Math.round(hour.dewPoint)}°C</span>
                )}
                {hour.precipProbability > 0 && (
                  <span className="hour-pop">💧 {hour.precipProbability}%</span>
                )}
              </div>
            ))}
          </div>

          <div className="hourly-legend-note">
            <span className="legend-chip chip-critical">Highlighted Red (&gt;80% RH):</span>
            <span>Critical spore germination window when prolonged over consecutive nocturnal hours.</span>
          </div>
        </div>
      )}

      {/* Atmospheric vs Microclimate Distinction Callout */}
      <div className="macro-vs-micro-box">
        <div className="mvm-header">
          <IconAlertCircle size={16} className="mvm-icon" />
          <h4 className="mvm-title">Macro-Atmospheric vs. Farm Canopy Micro-Climate Distinction</h4>
        </div>
        <p className="mvm-body">
          {isLive ? (
            <>
              <strong>Data Source Attribution:</strong> The weather metrics above are fetched in real-time from the <strong>Open-Meteo Weather API</strong> based on geographic coordinates ({liveWeather.coordinates.latitude}°N, {liveWeather.coordinates.longitude}°E). Note: Regional forecast models reflect open-air atmospheric conditions at 2m/10m elevation. True in-canopy microclimate (prolonged leaf moisture, boundary-layer humidity inside dense crop foliage) may be higher and should be confirmed via plot inspection.
            </>
          ) : (
            <>
              <strong>Simulated Data Notice:</strong> Currently rendering a baseline benchmark. Weather conditions alone do not establish a confirmed disease diagnosis. All disease vulnerability levels remain exploratory prototype indices.
            </>
          )}
        </p>
      </div>

      {/* Auxiliary Micro-Climate Indicators Strip */}
      <div className="micro-climate-strip">
        <div className="micro-strip-item">
          <span className="strip-label">Estimated Leaf Wetness Proxy:</span>
          <strong className="strip-value">{weather.leafWetnessHours} hours</strong>
          <span className="strip-note">(Simulated canopy sensor benchmark)</span>
        </div>
        <div className="micro-strip-divider">|</div>
        <div className="micro-strip-item">
          <span className="strip-label">{t('weatherPressure')}:</span>
          <strong className="strip-value">{currentPressure} hPa</strong>
        </div>
        {isLive && (
          <>
            <div className="micro-strip-divider">|</div>
            <div className="micro-strip-item">
              <span className="strip-label">Station Coordinates:</span>
              <strong className="strip-value">
                {liveWeather.coordinates.latitude}° N, {liveWeather.coordinates.longitude}° E
              </strong>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
