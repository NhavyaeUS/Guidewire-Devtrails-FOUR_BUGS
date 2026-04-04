import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AlertTriangle, User, ShieldAlert, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface FraudClaim {
  id: string;
  worker: { name: string; city: string; riskScore: number; riskTier: string };
  trigger: { triggerType: string; startedAt: string };
  calculatedPayout: number;
  fraudScore: number;
  fraudFlags: string;
  status: string;
}

export default function FraudQueue({ refreshKey, onAction }: { refreshKey: number; onAction: () => void }) {
  const [claims, setClaims] = useState<FraudClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFraudQueue = async () => {
      try {
        const data = await api.get('/admin/fraud-queue') as any;
        setClaims(data.claims);
      } catch (err) {
        console.error('Failed to fetch fraud queue', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFraudQueue();
  }, [refreshKey]);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/claims/${id}`, { status });
      onAction();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  if (loading) return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-96 animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <ShieldAlert size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">High Risk Fraud Queue</h2>
            <p className="text-xs text-slate-500 tracking-wide font-medium">Claims flagged for manual review</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {claims.length} Items Pending
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-slate-300 font-bold">Queue All Clear</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">No claims currently meet the threshold for automated fraud flags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {claims.map((c) => {
            const isSelected = selectedId === c.id;
            const flags = JSON.parse(c.fraudFlags || '[]');
            return (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all">
                <div 
                  className={`p-5 flex items-center justify-between cursor-pointer ${isSelected ? 'bg-slate-800/50' : 'hover:bg-slate-800/20'}`}
                  onClick={() => setSelectedId(isSelected ? null : c.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 ${c.fraudScore > 80 ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                        <ShieldAlert size={24} />
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-xl">
                        {c.fraudScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {c.worker.name}
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-bold uppercase tracking-widest">₹{c.calculatedPayout?.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 capitalize"><AlertTriangle size={10} className="text-amber-500" /> {c.trigger.triggerType.replace('_', ' ')}</span>
                        <span className="flex items-center gap-1"><User size={10} /> {c.worker.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Fraud Risk</span>
                      <span className={`text-xs font-black ${c.fraudScore > 80 ? 'text-red-500' : 'text-amber-500'}`}>{c.fraudScore > 80 ? 'CRITICAL' : 'ELEVATED'}</span>
                    </div>
                    <ChevronRight size={20} className={`text-slate-700 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isSelected && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800 animate-slide-up">
                    <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/50 mb-4">
                      <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-3">
                        <ShieldAlert size={14} /> AI Analysis Reasoning
                      </div>
                      <ul className="space-y-2">
                        {flags.length > 0 ? flags.map((flag: string, i: number) => (
                          <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            {flag}
                          </li>
                        )) : (
                          <li className="text-sm text-slate-500 italic">No specific flags reported, manual verification required for score mismatch.</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleAction(c.id, 'rejected')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-500 border border-slate-800 hover:border-red-500/30 rounded-lg text-xs font-bold transition-all shadow-lg"
                      >
                        <XCircle size={16} /> REJECT CLAIM
                      </button>
                      <button 
                         onClick={() => handleAction(c.id, 'approved')}
                         className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-950/20 active:scale-95"
                      >
                        <CheckCircle2 size={16} /> APPROVE CLAIM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
