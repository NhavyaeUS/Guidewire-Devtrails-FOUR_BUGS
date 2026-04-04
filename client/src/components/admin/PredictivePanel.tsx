import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { TrendingUp, MapPin, ShieldAlert, Sparkles, AlertTriangle, ArrowRightCircle } from 'lucide-react';

interface Prediction {
  high_risk_cities: string[];
  estimated_payout_liability: number;
  recommended_reserve: number;
  operational_suggestion: string;
}

export default function PredictivePanel({ refreshKey }: { refreshKey: number }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await api.get('/admin/predictions') as any;
        setPrediction(data);
      } catch (err) {
        console.error('Failed to fetch predictions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [refreshKey]);

  if (loading) return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-96 animate-pulse" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-amber-500" />
          <h2 className="font-bold text-slate-200">AI Weekly Forecast</h2>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-80">
          Powered by Claude-Sonnet-4
        </p>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* High Risk Cities */}
        <section>
          <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-3">
            <AlertTriangle size={14} /> Critical Zones Next Week
          </div>
          <div className="flex flex-wrap gap-2">
            {prediction?.high_risk_cities.map((city, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-lg text-xs font-bold shadow-lg shadow-rose-950/20">
                <MapPin size={12} />
                {city}
              </div>
            ))}
          </div>
        </section>

        {/* Financial Exposure */}
        <section className="grid grid-cols-1 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 group hover:border-slate-700 transition-colors">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <TrendingUp size={12} /> Estimated Payout Liability
            </p>
            <h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">₹{prediction?.estimated_payout_liability.toLocaleString()}</h3>
          </div>
          
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 group hover:border-slate-700 transition-colors">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldAlert size={12} /> Recommended Reserve
            </p>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-500 transition-colors">₹{prediction?.recommended_reserve.toLocaleString()}</h3>
          </div>
        </section>

        {/* Operational Suggestion */}
        <section className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:blur-3xl transition-all" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2.5">
              <Sparkles size={14} /> Operational Strategy
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {prediction?.operational_suggestion}
            </p>
          </div>
        </section>
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-center">
        <button className="flex items-center gap-2 text-slate-500 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all">
          Generate Full Report <ArrowRightCircle size={14} />
        </button>
      </div>
    </div>
  );
}
