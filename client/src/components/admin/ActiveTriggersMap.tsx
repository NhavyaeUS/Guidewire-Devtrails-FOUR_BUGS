import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { MapPin, Users, CloudRain, Thermometer, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Trigger {
  id: string;
  triggerType: string;
  city: string;
  zone: string;
  severityLevel: string;
  startedAt: string;
  affectedPolicies: number;
}

export default function ActiveTriggersMap({ refreshKey }: { refreshKey: number }) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTriggers = async () => {
      try {
        const data = await api.get('/admin/active-triggers') as any;
        setTriggers(data.triggers);
      } catch (err) {
        console.error('Failed to fetch triggers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTriggers();
  }, [refreshKey]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'heavy_rain': return <CloudRain className="text-blue-400" size={18} />;
      case 'extreme_heat': return <Thermometer className="text-rose-400" size={18} />;
      case 'aqi': return <Wind className="text-emerald-400" size={18} />;
      case 'flood': return <AlertTriangle className="text-amber-400" size={18} />;
      default: return <ShieldCheck className="text-teal-400" size={18} />;
    }
  };

  if (loading) return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-64 animate-pulse" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-amber-500" />
          <h2 className="font-bold text-slate-200">Active Disruption Map</h2>
        </div>
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
          Live Status
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <th className="px-5 py-3 border-b border-slate-800">Trigger</th>
              <th className="px-5 py-3 border-b border-slate-800">Location</th>
              <th className="px-5 py-3 border-b border-slate-800">Start Time</th>
              <th className="px-5 py-3 border-b border-slate-800 text-right">Affected Policies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {triggers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-500 italic text-sm">
                  No active disruptions detected across all zones.
                </td>
              </tr>
            ) : (
              triggers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      {getIcon(t.triggerType)}
                      <span className="capitalize">{t.triggerType.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-300">{t.city}</div>
                    <div className="text-[10px] text-slate-500">{t.zone}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-xs text-slate-400">
                      {new Date(t.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full">
                      <Users size={12} />
                      {t.affectedPolicies}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
