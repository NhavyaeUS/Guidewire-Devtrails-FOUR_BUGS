import { useState, useEffect } from 'react';
import { Sparkles, MapPin, IndianRupee, BellRing, Cpu, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';

export default function PredictivePanel({ refreshKey = 0 }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPredictions() {
      setLoading(true);
      try {
        const res = await api.get('/admin/predictions');
        setData(res);
      } catch (err) {
        console.error('Failed to load predictions', err);
      } finally {
        setLoading(false);
      }
    }
    loadPredictions();
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 border-2 border-transparent border-t-amber-500 rounded-full animate-spin" />
          <Cpu className="absolute inset-0 m-auto text-amber-500" size={24} />
        </div>
        <h3 className="text-slate-300 font-medium mb-2">Claude AI Predictor</h3>
        <p className="text-xs text-slate-500 max-w-[200px]">Analyzing weather forecasts and historical claims variance...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/50 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-indigo-900/30 flex items-center justify-between bg-indigo-950/20">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={18} />
          <h2 className="font-bold text-slate-100">AI Weekly Forecast</h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 bg-indigo-900/40 px-2 py-1 rounded">Next 7 Days</span>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-rose-500" />
            High Risk Geographies
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.high_risk_cities?.map((city: string) => (
              <span key={city} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                {city}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IndianRupee size={12} className="text-amber-500" /> Expected Liability
            </h3>
            <div className="text-xl font-bold font-mono text-slate-200">₹{data.estimated_payout_liability?.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert size={12} className="text-blue-500" /> Recommended Reserve
            </h3>
            <div className="text-xl font-bold font-mono text-slate-200">₹{data.recommended_reserve?.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-auto pt-5 border-t border-indigo-900/20 mt-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BellRing size={14} className="text-indigo-400" />
            Operational Suggestion
          </h3>
          <p className="text-sm text-indigo-200/90 leading-relaxed bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 italic">
            "{data.operational_suggestion}"
          </p>
        </div>
      </div>
    </div>
  );
}
