import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertOctagon, Shield, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

export default function ClaimsTable({ limit, refreshKey, onAction }: { limit?: number, refreshKey?: number, onAction?: () => void }) {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      try {
        const query = filter !== 'all' ? `?status=${filter}` : '';
        const res = await api.get(`/admin/claims${query}`);
        setClaims(limit ? res.claims.slice(0, limit) : res.claims);
      } catch (err) {
        console.error('Failed to load claims', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClaims();
  }, [filter, refreshKey, limit]);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/claims/${id}`, { status, note: 'Admin overridden' });
      if (onAction) onAction();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-bold border border-emerald-500/20">Paid</span>;
      case 'approved': return <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] uppercase font-bold border border-blue-500/20">Processing</span>;
      case 'flagged': return <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold border border-amber-500/20 flex items-center gap-1"><AlertOctagon size={10} /> Flagged</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 text-[10px] uppercase font-bold border border-rose-500/20">Rejected</span>;
      default: return <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={18} />
          <h2 className="font-bold text-slate-100">Claims Ledger</h2>
        </div>
        
        {!limit && (
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md text-xs py-1.5 pl-3 pr-8 text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Claims</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <th className="font-medium p-4">Worker / Policy</th>
              <th className="font-medium p-4">Event Trigger</th>
              <th className="font-medium p-4 text-right">Coverage</th>
              <th className="font-medium p-4 text-center">Status</th>
              {!limit && <th className="font-medium p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><Loader2 size={24} className="animate-spin text-slate-500 mx-auto" /></td></tr>
            ) : claims.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No claims found matching criteria.</td></tr>
            ) : claims.map(claim => (
              <tr key={claim.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                      {claim.worker?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-200">{claim.worker?.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{claim.worker?.city} • {claim.worker?.riskTier} Risk</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-300 capitalize">{claim.trigger?.triggerType.replace('_', ' ')}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{format(new Date(claim.trigger?.startedAt), 'MMM d, h:mm a')}</div>
                </td>
                <td className="p-4 text-right">
                  <div className="text-sm font-bold text-teal-400 font-mono tracking-tight">₹{claim.calculatedPayout}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{claim.hoursCovered} hrs</div>
                </td>
                <td className="p-4 text-center">
                  {getStatusBadge(claim.status)}
                </td>
                {!limit && (
                  <td className="p-4 text-right align-middle">
                    {claim.status === 'flagged' ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleAction(claim.id, 'approved')} className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Approve">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => handleAction(claim.id, 'rejected')} className="p-1.5 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" title="Reject">
                          <AlertOctagon size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">None</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
