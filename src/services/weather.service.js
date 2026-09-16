import { ENV } from '../config/env.js';

/**
 * Service to fetch real-time weather or return realistic fallback data
 */
export const getWeatherForCity = async (city = 'Jakarta') => {
  const apiKey = ENV.OPENWEATHER_API_KEY;
  const targetCity = city.trim() || 'Jakarta';

  // 1. If OpenWeatherMap API key is provided, attempt live fetch
  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        targetCity
      )}&units=metric&lang=id&appid=${apiKey}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const temp = Math.round(data.main.temp);
        const condition = data.weather[0]?.main || 'Clear';
        const description = data.weather[0]?.description || 'cerah';
        const icon = data.weather[0]?.icon || '01d';

        const isRain = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle');
        const isCold = temp < 24;
        const isHot = temp >= 30;

        return {
          city: data.name || targetCity,
          temperature: temp,
          condition,
          description,
          icon,
          isRain,
          isCold,
          isHot,
          source: 'openweathermap_api',
        };
      }
    } catch (apiError) {
      console.warn('[WEATHER] Failed to connect to OpenWeather API, using fallback:', apiError.message);
    }
  }

  // 2. Intelligent, realistic fallback (Standard tropical climate)
  const defaultTemp = 28;
  return {
    city: targetCity,
    temperature: defaultTemp,
    condition: 'Clouds',
    description: 'sebagian berawan',
    icon: '03d',
    isRain: false,
    isCold: false,
    isHot: false,
    source: 'fallback',
  };
};