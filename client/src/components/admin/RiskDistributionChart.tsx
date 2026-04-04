import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Activity } from 'lucide-react';

interface Bucket { label: string; count: number; color: string; bg: string; border: string }

export default function RiskDistributionChart({ refreshKey }: { refreshKey: number }) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data: any = await api.get('/admin/risk-distribution');
        const dist = data.distribution || {};
        const b: Bucket[] = [
          { label: 'Low Risk', count: dist.low || 0, color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30' },
          { label: 'Monitor', count: dist.medium || 0, color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30' },
          { label: 'High Risk', count: dist.high || 0, color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/30' },
        ];
        setBuckets(b);
        setTotal((dist.low || 0) + (dist.medium || 0) + (dist.high || 0));
      } catch {
        setBuckets([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [refreshKey]);

  if (loading) {
    return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-40 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <Activity size={18} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-200">Risk Distribution</h2>
          <p className="text-xs text-slate-500">{total} workers in system</p>
        </div>
      </div>

      <div className="space-y-3">
        {buckets.map(b => {
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          return (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-bold ${b.color}`}>{b.label}</span>
                <span className="text-slate-400">{b.count} workers ({pct}%)</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className={`h-full ${b.bg} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
