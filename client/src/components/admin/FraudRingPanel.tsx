import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Network, Users, Cpu, AlertTriangle } from 'lucide-react';

interface Ring {
  type: string;
  sharedValue: string;
  members: { id: string; name: string; city: string; riskScore: number }[];
}

export default function FraudRingPanel({ refreshKey }: { refreshKey: number }) {
  const [rings, setRings] = useState<Ring[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data: any = await api.get('/admin/ring-detection');
        setRings(data.rings || []);
      } catch {
        setRings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [refreshKey]);

  if (loading) {
    return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-48 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <Network size={18} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-200">Fraud Ring Detection</h2>
          <p className="text-xs text-slate-500">Accounts sharing device IDs or IP addresses</p>
        </div>
        <div className="ml-auto px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {rings.length} Ring{rings.length !== 1 ? 's' : ''} Found
        </div>
      </div>

      {rings.length === 0 ? (
        <div className="p-10 text-center">
          <Cpu size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No suspicious clusters detected</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {rings.map((ring, i) => (
            <div key={i} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  Shared {ring.type === 'deviceId' ? 'Device ID' : 'IP Address'}: {ring.sharedValue}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ring.members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <Users size={12} className="text-slate-500" />
                    <span className="text-xs font-medium text-slate-300">{m.name}</span>
                    <span className="text-[10px] text-slate-500">{m.city}</span>
                    <span className={`text-[10px] font-bold ${m.riskScore > 70 ? 'text-red-400' : 'text-amber-400'}`}>
                      {m.riskScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
