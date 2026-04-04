import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { FileText, User, MapPin, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface Claim {
  id: string;
  worker: { name: string; city: string; riskTier: string };
  trigger: { triggerType: string; city: string; zone: string; startedAt: string };
  calculatedPayout: number;
  status: string;
  fraudScore: number;
}

export default function ClaimsTable({ limit, refreshKey, onAction }: { limit?: number; refreshKey: number; onAction: () => void }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const data = await api.get(`/admin/claims${statusFilter ? `?status=${statusFilter}` : ''}`) as any;
        setClaims(limit ? data.claims.slice(0, limit) : data.claims);
      } catch (err) {
        console.error('Failed to fetch claims', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [refreshKey, statusFilter, limit]);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/claims/${id}`, { status });
      onAction();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold tracking-wider uppercase rounded-full border border-emerald-500/20"><CheckCircle2 size={12} /> Paid</span>;
      case 'approved': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold tracking-wider uppercase rounded-full border border-blue-500/20"><CheckCircle2 size={12} /> Approved</span>;
      case 'flagged': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold tracking-wider uppercase rounded-full border border-amber-500/20"><AlertTriangle size={12} /> Flagged</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold tracking-wider uppercase rounded-full border border-red-500/20"><XCircle size={12} /> Rejected</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-bold tracking-wider uppercase rounded-full border border-slate-500/20"><Clock size={12} /> Pending</span>;
    }
  };

  if (loading) return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-96 animate-pulse" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-amber-500" />
          <h2 className="font-bold text-slate-200">Claims History</h2>
        </div>
        {!limit && (
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950/50 border border-slate-800 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="auto-triggered">Auto-Triggered</option>
          <option value="approved">Approved</option>
          <option value="flagged">Flagged</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800">
              <th className="px-6 py-4">Worker</th>
              <th className="px-6 py-4">Trigger</th>
              <th className="px-6 py-4">Payout</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/20 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                      <User size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{c.worker.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className={`w-1 h-1 rounded-full ${c.worker.riskTier === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {c.worker.riskTier} Tier
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300 capitalize">{c.trigger.triggerType.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-500 opacity-80 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {c.trigger.city}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-slate-100">₹{c.calculatedPayout?.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  {getStatusBadge(c.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {(c.status === 'auto-triggered' || c.status === 'flagged') ? (
                    <div className="flex justify-end gap-2">
                      <button 
                         onClick={() => handleAction(c.id, 'rejected')}
                         className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-all"
                         title="Reject Claim"
                      >
                        <XCircle size={18} />
                      </button>
                      <button 
                         onClick={() => handleAction(c.id, 'approved')}
                         className="p-1.5 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-500 rounded-lg transition-all"
                         title="Approve Claim"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-bold tracking-wider uppercase">Finalized</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
