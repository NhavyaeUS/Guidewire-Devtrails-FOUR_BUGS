import { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Cpu, Crosshair } from 'lucide-react';
import { api } from '../../api/client';

export default function FraudQueue({ refreshKey, onAction }: { refreshKey?: number, onAction?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
      setLoading(true);
      try {
        const res = await api.get('/admin/fraud-queue');
        setItems(res.claims || []);
      } catch (err) {
        console.error('Failed to load fraud queue', err);
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, [refreshKey]);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/claims/${id}`, { status, note: `Admin review: manual ${status}` });
      if (onAction) onAction();
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading fraud queue...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <ShieldAlert size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Zero Active Alerts</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-[300px]">The AI review model has not flagged any recent claims for manual inspection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(claim => (
        <div key={claim.id} className="bg-slate-900 border border-rose-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(225,29,72,0.05)] flex flex-col">
          <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 flex justify-between items-start">
            <div className="flex items-center gap-2">
              <AlertOctagon size={18} className="text-rose-500 animate-pulse" />
              <h3 className="font-bold text-slate-100">Review Required</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-rose-500">{claim.fraudScore}<span className="text-sm text-rose-500/50">/100</span></div>
              <div className="text-[10px] uppercase font-bold text-rose-400">Threat Score</div>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-800">
              <div>
                <div className="font-bold text-slate-200 text-lg">{claim.worker.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{claim.worker.city} • <span className="capitalize">{claim.worker.platform}</span></div>
              </div>
              <div className="text-right">
                <div className="font-bold font-mono text-slate-200">₹{claim.calculatedPayout}</div>
                <div className="text-xs text-slate-500 mt-0.5">Claim Amt</div>
              </div>
            </div>

            <div className="mb-5 flex-1">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                <Cpu size={12} className="text-amber-500" /> AI Diagnostic
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 border-l-2 border-l-amber-500">
                "{claim.fraudResult?.explanation || 'Location mismatch detected during parametric event window.'}"
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 rounded bg-slate-950/50 text-xs border border-slate-800 flex justify-between">
                  <span className="text-slate-500">Event</span>
                  <span className="font-medium text-slate-300 capitalize">{claim.trigger.triggerType.replace('_', ' ')}</span>
                </div>
                <div className="p-2 rounded bg-slate-950/50 text-xs border border-slate-800 flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-medium text-slate-300">{claim.hoursCovered} hrs</span>
                </div>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleAction(claim.id, 'rejected')}
                className="py-2.5 rounded-lg border border-rose-500/50 text-rose-500 hover:bg-rose-500/10 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Crosshair size={16} /> REJECT
              </button>
              <button
                onClick={() => handleAction(claim.id, 'approved')}
                className="py-2.5 rounded-lg border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> APPROVE
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
