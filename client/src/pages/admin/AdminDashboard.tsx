import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, TrendingUp, AlertTriangle, FileText, Activity } from 'lucide-react';
import KPICards from '../../components/admin/KPICards';
import PredictivePanel from '../../components/admin/PredictivePanel';
import ClaimsTable from '../../components/admin/ClaimsTable';
import FraudQueue from '../../components/admin/FraudQueue';

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
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-amber-500/30 pb-10">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <Shield size={20} className="text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">GigShield Command Center</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex space-x-1">
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
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'bg-slate-800 text-amber-500' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            
            <div className="w-px h-6 bg-slate-800" />
            
            <button 
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <KPICards refreshKey={refreshKey} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ClaimsTable limit={5} refreshKey={refreshKey} onAction={triggerRefresh} />
              </div>
              <div>
                <PredictivePanel refreshKey={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="animate-fade-in">
            <ClaimsTable refreshKey={refreshKey} onAction={triggerRefresh} />
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="animate-fade-in">
            <FraudQueue refreshKey={refreshKey} onAction={triggerRefresh} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
              <TrendingUp size={48} className="text-slate-700 mb-4" />
              <h2 className="text-xl font-bold text-slate-300">Detailed Analytics</h2>
              <p className="text-slate-500 mt-2">Charts and graphs visualization module.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
