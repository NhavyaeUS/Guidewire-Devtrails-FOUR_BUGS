import { useState, useEffect } from 'react';
import { CloudRain, Sun, Thermometer, Wind, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

export default function WeatherPanel({ triggerSimulationUpdate }: { triggerSimulationUpdate: number }) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      const res = await api.get('/mock/current-conditions');
      setWeather(res);
    } catch (err) {
      console.error('Failed to fetch weather', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [triggerSimulationUpdate]);

  if (loading) return (
    <div className="glass-card p-6 h-48 animate-pulse flex items-center justify-center bg-teal-900/40 border border-teal-700/50">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            {weather?.condition?.toLowerCase().includes('rain') ? <CloudRain size={24} /> : <Sun size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold">{weather?.condition || 'Clear Skies'}</h3>
            <p className="text-sm text-teal-400 opacity-70 italic font-medium">Currently in {weather?.city}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-gradient">{weather?.temperature}°C</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-teal-950/40 rounded-2xl border border-teal-800/30">
          <Wind size={18} className="text-teal-400" />
          <div>
            <p className="text-[10px] text-teal-500/60 uppercase font-black">Wind Speed</p>
            <p className="text-sm font-bold">{weather?.windSpeed} km/h</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-teal-950/40 rounded-2xl border border-teal-800/30">
          <Thermometer size={18} className="text-teal-400" />
          <div>
            <p className="text-[10px] text-teal-500/60 uppercase font-black">Rain Chance</p>
            <p className="text-sm font-bold">{weather?.rainChance}%</p>
          </div>
        </div>
      </div>

      {weather?.currentDisruptions?.length > 0 && (
        <div className="mt-6 flex items-center gap-3 py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-pulse">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-500">Active Disruption: {weather.currentDisruptions[0].type} detected in {weather.currentDisruptions[0].zone}</p>
        </div>
      )}
    </div>
  );
}
