import { useState, useEffect } from 'react';
import { ShieldAlert, IndianRupee, PieChart, Activity } from 'lucide-react';
import { api } from '../../api/client';

export default function KPICards({ refreshKey = 0 }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadKPIs() {
      try {
        const res = await api.get('/admin/kpis');
        setData(res);
      } catch (err) {
        console.error('Failed to load KPIs', err);
      }
    }
    loadKPIs();
  }, [refreshKey]);

  if (!data) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />)}
    </div>
  );

  const kpis = [
    {
      title: 'Active Policies',
      value: data.activePolicies,
      subtext: 'This week',
      icon: ShieldAlert,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Premiums Collected',
      value: `₹${data.totalPremiums}`,
      subtext: 'This week',
      icon: IndianRupee,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Payouts Disbursed',
      value: `₹${data.totalPayouts}`,
      subtext: 'This week',
      icon: Activity,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Loss Ratio',
      value: `${data.lossRatio}%`,
      subtext: 'Healthy < 65%',
      icon: PieChart,
      color: data.lossRatio > 65 ? 'text-rose-500' : 'text-blue-500',
      bg: data.lossRatio > 65 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-blue-500/10 border-blue-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-lg border ${kpi.bg}`}>
                <Icon size={20} className={kpi.color} />
              </div>
              <span className="text-xs text-slate-500 font-medium">{kpi.subtext}</span>
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-1">{kpi.title}</h3>
              <div className="text-2xl font-bold tracking-tight text-white font-mono">{kpi.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
