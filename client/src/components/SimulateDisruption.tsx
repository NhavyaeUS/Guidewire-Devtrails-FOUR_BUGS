import { useState } from 'react';
import { CloudRain, Thermometer, Wind, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { api } from '../api/client';

export default function SimulateDisruption({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeType, setActiveType] = useState('');

  const simulate = async (type: string) => {
    setLoading(true);
    setActiveType(type);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res: any = await api.post('/claims/simulate', { triggerType: type });
      onComplete();
      const msg = res?.message || `Simulated ${type.replace(/_/g, ' ')}. Gemini processed your claim!`;
      setSuccessMessage(msg);
      setTimeout(() => {
        setSuccessMessage('');
        setShowOptions(false);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Simulation failed — check that the server is running.');
    } finally {
      setLoading(false);
      setActiveType('');
    }
  };

  const clearSimulation = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await api.post('/claims/clear-simulation');
      onComplete();
      setSuccessMessage('All simulation data cleared successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to clear simulation.');
    } finally {
      setLoading(false);
    }
  };

  if (!showOptions) {
    return (
      <button 
        onClick={() => setShowOptions(true)}
        className="w-full py-4 glass-card border-dashed border-teal-500/50 hover:border-amber-500/50 hover:bg-teal-800/40 transition-all group"
      >
        <span className="flex items-center justify-center gap-2 text-teal-400 group-hover:text-amber-500 font-bold tracking-tight">
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
          Simulate Environmental Disruption
        </span>
      </button>
    );
  }

  return (
    <div className="glass-card p-6 border-amber-500/30 animate-scale-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-500" />
          Disruption Simulator
        </h3>
        <button onClick={() => setShowOptions(false)} className="text-teal-500 hover:text-teal-300 text-xs font-bold uppercase transition-colors">
          Cancel
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold text-center">
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold text-center">
          ❌ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'heavy_rain', name: 'Heavy Rain', icon: CloudRain, color: 'text-blue-500' },
          { id: 'extreme_heat', name: 'Extreme Heat', icon: Thermometer, color: 'text-orange-500' },
          { id: 'flood', name: 'Flood Alert', icon: AlertTriangle, color: 'text-red-500' },
          { id: 'aqi', name: 'Poor Air Quality', icon: Wind, color: 'text-gray-500' },
        ].map((item) => (
          <button
            key={item.id}
            disabled={loading}
            onClick={() => simulate(item.id)}
            className="flex flex-col items-center gap-3 p-4 bg-teal-950/50 hover:bg-teal-900/50 border border-teal-800/30 rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
          >
            <item.icon size={28} className={item.color} strokeWidth={1.5} />
            <span className="text-sm font-bold text-teal-100">{item.name}</span>
          </button>
        ))}
      </div>

      <button
        disabled={loading}
        onClick={clearSimulation}
        className="w-full mt-6 py-3.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-xl text-teal-400 text-sm font-bold transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin mx-auto" strokeWidth={3} />
        ) : (
          'Clear All Disruption Triggers'
        )}
      </button>
    </div>
  );
}
