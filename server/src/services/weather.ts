import dotenv from 'dotenv';
dotenv.config();

const OWM_KEY = process.env.OPENWEATHERMAP_API_KEY;
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Bengaluru': { lat: 12.9716, lon: 77.5946 },
  'Delhi': { lat: 28.7041, lon: 77.1025 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
};

export async function getWeather(city: string): Promise<{
  temperature: number; feels_like: number; rainfall_mm_per_hour: number;
  weather_code: number; weather_description: string; humidity: number;
  aqi_index: number; wind_speed: number;
}> {
  const coords = CITY_COORDS[city];
  if (!coords || !OWM_KEY || OWM_KEY === 'your-openweathermap-api-key-here') {
    return getMockWeather(city);
  }

  try {
    const weatherRes = await fetch(`${OWM_BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_KEY}&units=metric`);
    const weatherData: any = await weatherRes.json();

    let aqi = 2;
    try {
      const aqiRes = await fetch(`${OWM_BASE}/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_KEY}`);
      const aqiData: any = await aqiRes.json();
      aqi = aqiData?.list?.[0]?.main?.aqi || 2;
    } catch {}

    return {
      temperature: weatherData.main?.temp || 30,
      feels_like: weatherData.main?.feels_like || 32,
      rainfall_mm_per_hour: weatherData.rain?.['1h'] || 0,
      weather_code: weatherData.weather?.[0]?.id || 800,
      weather_description: weatherData.weather?.[0]?.description || 'clear sky',
      humidity: weatherData.main?.humidity || 60,
      aqi_index: aqi,
      wind_speed: weatherData.wind?.speed || 3,
    };
  } catch (error) {
    console.error('Weather API failed, using mock:', error);
    return getMockWeather(city);
  }
}

function getMockWeather(city: string) {
  const defaults: Record<string, any> = {
    'Chennai': { temperature: 33, feels_like: 38, rainfall_mm_per_hour: 0, weather_code: 802, weather_description: 'scattered clouds', humidity: 75, aqi_index: 2, wind_speed: 4 },
    'Mumbai': { temperature: 31, feels_like: 36, rainfall_mm_per_hour: 0, weather_code: 801, weather_description: 'few clouds', humidity: 80, aqi_index: 3, wind_speed: 5 },
    'Bengaluru': { temperature: 28, feels_like: 30, rainfall_mm_per_hour: 0, weather_code: 800, weather_description: 'clear sky', humidity: 55, aqi_index: 2, wind_speed: 3 },
    'Delhi': { temperature: 35, feels_like: 40, rainfall_mm_per_hour: 0, weather_code: 800, weather_description: 'clear sky', humidity: 40, aqi_index: 4, wind_speed: 2 },
    'Hyderabad': { temperature: 34, feels_like: 37, rainfall_mm_per_hour: 0, weather_code: 801, weather_description: 'few clouds', humidity: 50, aqi_index: 3, wind_speed: 4 },
    'Pune': { temperature: 30, feels_like: 33, rainfall_mm_per_hour: 0, weather_code: 800, weather_description: 'clear sky', humidity: 45, aqi_index: 2, wind_speed: 3 },
  };
  return defaults[city] || defaults['Chennai'];
}

export function getScenarioWeather(city: string, scenario: string) {
  const base = getMockWeather(city);
  switch (scenario) {
    case 'heavy_rain':
      return { ...base, rainfall_mm_per_hour: 25, weather_code: 502, weather_description: 'heavy intensity rain', humidity: 95 };
    case 'extreme_heat':
      return { ...base, temperature: 44, feels_like: 48, weather_code: 800, weather_description: 'clear sky', humidity: 25 };
    case 'high_aqi':
      return { ...base, aqi_index: 5, weather_description: 'hazy' };
    default:
      return base;
  }
}
