import { useState, useEffect } from 'react';
import { CloudRain, Sun, Activity, Wind, AlertTriangle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from './SkeletonLoader';

interface WeatherStatus {
  weather: {
    temperature: number;
    feels_like: number;
    rainfall_mm_per_hour: number;
    weather_code: number;
    weather_description: string;
    humidity: number;
    aqi_index: number;
    wind_speed: number;
  };
  triggers: string[];
}

export default function WeatherPanel({ triggerSimulationUpdate = 0 }) {
  const { worker } = useAuth();
  const [data, setData] = useState<WeatherStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await api.get('/claims/weather-status');
        setData(res);
      } catch (err) {
        console.error('Failed to fetch weather', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [triggerSimulationUpdate]); // Re-fetch when simulation fires

  if (loading || !data) return <CardSkeleton />;

  const { weather, triggers } = data;
  const isDanger = triggers.length > 0;
  
  // Amber thresholds (watch zones)
  const isHighRain = weather.rainfall_mm_per_hour > 5 && weather.rainfall_mm_per_hour < 15;
  const isHighHeat = weather.feels_like >= 38 && weather.feels_like < 42;
  const isHighAqi = weather.aqi_index === 3;
  const isWarning = !isDanger && (isHighRain || isHighHeat || isHighAqi);

  const getStatusColor = () => {
    if (isDanger) return 'bg-red-500/20 border-red-500/50 text-red-500';
    if (isWarning) return 'bg-amber-500/20 border-amber-500/50 text-amber-500';
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
  };

  const getStatusBg = () => {
    if (isDanger) return 'from-red-950/40 to-teal-900/40';
    if (isWarning) return 'from-amber-950/40 to-teal-900/40';
    return 'from-emerald-950/20 to-teal-900/40';
  };

  const getAqiLabel = (index: number) => {
    switch(index) {
      case 1: return 'Good';
      case 2: return 'Moderate';
      case 3: return 'Poor';
      case 4: return 'Unhealthy';
      case 5: return 'Severe';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`glass-card p-5 relative overflow-hidden bg-gradient-to-br ${getStatusBg()} transition-colors duration-1000`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="font-bold text-lg mb-1">{worker?.city} Live</h3>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor()} backdrop-blur-md`}>
            {isDanger ? (
              <><AlertTriangle size={12} className="animate-pulse" /> Trigger Active</>
            ) : isWarning ? (
              <><AlertCircle size={12} /> Watch Zone</>
            ) : (
              <><Activity size={12} /> All Clear</>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tighter flex items-start justify-end gap-1">
            {Math.round(weather.temperature)}<span className="text-xl text-teal-400/60 font-light mt-0.5">°C</span>
          </div>
          <p className="text-xs text-teal-300 capitalize mt-1">
            {weather.weather_description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 relative z-10 mt-6 pt-5 border-t border-teal-800/30">
        <div className="flex flex-col items-center">
          <div className={`p-2 rounded-lg mb-2 ${weather.rainfall_mm_per_hour >= 15 ? 'bg-red-500/20 text-red-400' : isHighRain ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-800/40 text-teal-400'}`}>
            <CloudRain size={16} />
          </div>
          <span className="text-xs font-semibold">{weather.rainfall_mm_per_hour}</span>
          <span className="text-[9px] text-teal-500 uppercase mt-0.5">mm/hr</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={`p-2 rounded-lg mb-2 ${weather.feels_like >= 42 ? 'bg-red-500/20 text-red-400' : isHighHeat ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-800/40 text-teal-400'}`}>
            <Sun size={16} />
          </div>
          <span className="text-xs font-semibold">{Math.round(weather.feels_like)}°</span>
          <span className="text-[9px] text-teal-500 uppercase mt-0.5">Feels</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={`p-2 rounded-lg mb-2 ${weather.aqi_index >= 4 ? 'bg-red-500/20 text-red-400' : weather.aqi_index === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-800/40 text-teal-400'}`}>
            <Activity size={16} />
          </div>
          <span className="text-xs font-semibold">{getAqiLabel(weather.aqi_index)}</span>
          <span className="text-[9px] text-teal-500 uppercase mt-0.5">AQI</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-lg mb-2 bg-teal-800/40 text-teal-400">
            <Wind size={16} />
          </div>
          <span className="text-xs font-semibold">{weather.wind_speed}</span>
          <span className="text-[9px] text-teal-500 uppercase mt-0.5">m/s</span>
        </div>
      </div>
    </div>
  );
}
