/**
 * Open-Meteo Weather Service
 * Free open-access meteorological forecast API integration.
 * Fetches real weather observations and hourly forecasts for agricultural monitoring.
 */

// Cardinal wind direction helper
export function getWindDirectionCardinals(deg) {
  if (deg === null || deg === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return `${directions[index]} (${Math.round(deg)}°)`;
}

// WMO Weather interpretation code mapping
export function getWeatherDescription(code) {
  const codeMap = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return codeMap[code] || 'Cloudy';
}

/**
 * Fetch real weather data from Open-Meteo API
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} timezone 
 * @returns {Promise<Object>}
 */
export async function fetchOpenMeteoWeather(latitude, longitude, timezone = 'auto') {
  if (!latitude || !longitude) {
    throw new Error('Valid geographic coordinates (latitude and longitude) are required.');
  }

  const endpoint = new URL('https://api.open-meteo.com/v1/forecast');
  endpoint.searchParams.set('latitude', latitude.toString());
  endpoint.searchParams.set('longitude', longitude.toString());
  endpoint.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code'
  );
  endpoint.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code'
  );
  endpoint.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max'
  );
  endpoint.searchParams.set('forecast_days', '2');
  endpoint.searchParams.set('timezone', timezone);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo API responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error('Incomplete weather payload received from Open-Meteo API.');
    }

    // Process current weather
    const current = {
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      windDirection: getWindDirectionCardinals(data.current.wind_direction_10m),
      windDirectionDeg: data.current.wind_direction_10m,
      surfacePressure: data.current.surface_pressure,
      weatherCode: data.current.weather_code,
      weatherDescription: getWeatherDescription(data.current.weather_code),
      time: data.current.time,
      tempMax: data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m,
      tempMin: data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m,
      precipProbMax: data.daily?.precipitation_probability_max?.[0] ?? 0,
      precipSum: data.daily?.precipitation_sum?.[0] ?? data.current.precipitation,
    };

    // Process hourly forecast (next 24 hours starting from current hour)
    const hourlyList = [];
    if (data.hourly && Array.isArray(data.hourly.time)) {
      const times = data.hourly.time;
      const nowIso = new Date().toISOString();
      
      // Find starting index closest to now
      let startIndex = times.findIndex((t) => t >= nowIso.substring(0, 13));
      if (startIndex === -1) startIndex = 0;

      const endIndex = Math.min(startIndex + 24, times.length);

      for (let i = startIndex; i < endIndex; i++) {
        const timeStr = times[i];
        const dateObj = new Date(timeStr);
        const formattedHour = isNaN(dateObj.getTime())
          ? timeStr.split('T')[1] || timeStr
          : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        const rh = data.hourly.relative_humidity_2m[i];
        const temp = data.hourly.temperature_2m[i];
        const dew = data.hourly.dew_point_2m ? data.hourly.dew_point_2m[i] : null;
        const precipProb = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0;
        const precipAmount = data.hourly.precipitation ? data.hourly.precipitation[i] : 0;
        const wCode = data.hourly.weather_code ? data.hourly.weather_code[i] : 0;

        hourlyList.push({
          time: formattedHour,
          rawIso: timeStr,
          temperature: temp,
          humidity: rh,
          dewPoint: dew,
          precipProbability: precipProb,
          precipitation: precipAmount,
          weatherCode: wCode,
          weatherDescription: getWeatherDescription(wCode),
          isSporeCritical: rh >= 80, // High RH threshold critical for spore germination
        });
      }
    }

    return {
      isLive: true,
      source: 'Open-Meteo Weather Forecast API',
      attribution: 'Weather data provided by Open-Meteo.com (CC BY 4.0)',
      coordinates: {
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        timezone: data.timezone,
      },
      current,
      hourly: hourlyList,
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Weather API request timed out (10s). Please check your internet connection.');
    }
    throw err;
  }
}
