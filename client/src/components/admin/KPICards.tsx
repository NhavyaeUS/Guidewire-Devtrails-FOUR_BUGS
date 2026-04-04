import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Users, CreditCard, Banknote, Percent } from 'lucide-react';

interface KPI {
  activePolicies: number;
  totalPremiums: number;
  totalPayouts: number;
  lossRatio: number;
}

export default function KPICards({ refreshKey }: { refreshKey: number }) {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const data = await api.get('/admin/kpis') as any;
        setKpis(data);
      } catch (err) {
        console.error('Failed to fetch KPIs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, [refreshKey]);

  const cards = [
    { label: 'Active Policies', value: kpis?.activePolicies || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Premiums Collected', value: `₹${kpis?.totalPremiums?.toLocaleString() || 0}`, icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Payouts Disbursed', value: `₹${kpis?.totalPayouts?.toLocaleString() || 0}`, icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Loss Ratio', value: `${kpis?.lossRatio || 0}%`, icon: Percent, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl animate-pulse h-32" />
    ))}
  </div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:blur-3xl transition-all`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
                <h3 className="text-2xl font-bold text-white">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
