import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BarChart3, LineChart, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  registrationsByWeek: { week: string; users: number }[];
  claimsVsPremiums: { week: string; premiums: number; claims: number }[];
}

export default function AnalyticsModule({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics') as any;
        setData(res);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [refreshKey]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-96 animate-pulse" />;

  const maxUsers = Math.max(...(data?.registrationsByWeek.map(w => w.users) || [100]));
  const maxFinance = Math.max(...(data?.claimsVsPremiums.flatMap(w => [w.premiums, w.claims]) || [100000]));

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Registrations Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-blue-500" size={20} /> New Registrations
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Last 8 Weeks Trend</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-500/20">
              +12.4% vs Previous
            </div>
          </div>

          <div className="flex items-end justify-between h-48 gap-3">
            {data?.registrationsByWeek.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                <div className="w-full relative group">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-700 group-hover:from-blue-500 group-hover:to-blue-300 relative group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    style={{ height: `${(w.users / maxUsers) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap border border-slate-800">
                      {w.users} Users
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-600 font-bold tracking-tighter w-full text-center group-hover/bar:text-slate-400 transition-colors uppercase whitespace-nowrap overflow-hidden">
                  {w.week.split(' ')[0]} {w.week.split(' ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Claims vs Premiums Line Chart (Represented as dual bars for clarity in simple CSS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={20} /> Profitability Index
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Premiums vs Payouts</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Premium
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase">
                <div className="w-2 h-2 rounded-full bg-rose-500" /> Claims
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 gap-5 px-2">
            {data?.claimsVsPremiums.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group/finance">
                <div className="flex items-end gap-1 w-full h-full">
                  <div 
                    className="flex-1 bg-emerald-500/80 rounded-t-sm transition-all duration-700 hover:bg-emerald-400"
                    style={{ height: `${(w.premiums / maxFinance) * 100}%` }}
                  />
                  <div 
                    className="flex-1 bg-rose-500/80 rounded-t-sm transition-all duration-700 hover:bg-rose-400"
                    style={{ height: `${(w.claims / maxFinance) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-600 font-bold tracking-tighter uppercase group-hover/finance:text-slate-400 transition-colors">
                  {w.week.split(' ')[0]} {w.week.split(' ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <LineChart size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-200">Export Analytics Data</h4>
            <p className="text-xs text-slate-500 font-medium">Download full dataset for the past quarter in CSV/JSON format.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700">
          Prepare Export
        </button>
      </div>
    </div>
  );
}
