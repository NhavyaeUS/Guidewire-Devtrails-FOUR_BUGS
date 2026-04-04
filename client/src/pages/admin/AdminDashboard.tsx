import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, TrendingUp, AlertTriangle, FileText, Activity } from 'lucide-react';
import KPICards from '../../components/admin/KPICards';
import PredictivePanel from '../../components/admin/PredictivePanel';
import ClaimsTable from '../../components/admin/ClaimsTable';
import FraudQueue from '../../components/admin/FraudQueue';
import ActiveTriggersMap from '../../components/admin/ActiveTriggersMap';
import AnalyticsModule from '../../components/admin/AnalyticsModule';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-amber-500/30 pb-20">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white">GigShield <span className="text-amber-500">HQ</span></h1>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] flex items-center gap-1.5 leading-none mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" /> Command Center
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <nav className="hidden lg:flex items-center bg-slate-950/50 p-1.5 rounded-xl border border-white/5">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'claims', label: 'Claims', icon: FileText },
                { id: 'fraud', label: 'Fraud Queue', icon: AlertTriangle },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-950/20' 
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            
            <button 
              onClick={logout}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 border border-white/10 hover:border-rose-500/30 rounded-xl transition-all duration-300 group"
              title="Logout"
            >
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-slide-up">
            <KPICards refreshKey={refreshKey} />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <ActiveTriggersMap refreshKey={refreshKey} />
                <ClaimsTable limit={5} refreshKey={refreshKey} onAction={triggerRefresh} />
              </div>
              <div className="lg:col-span-4 h-full">
                <PredictivePanel refreshKey={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="animate-slide-up">
            <ClaimsTable refreshKey={refreshKey} onAction={triggerRefresh} />
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="animate-slide-up">
            <FraudQueue refreshKey={refreshKey} onAction={triggerRefresh} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-slide-up">
            <AnalyticsModule refreshKey={refreshKey} />
          </div>
        )}
      </main>
    </div>
  );
}
