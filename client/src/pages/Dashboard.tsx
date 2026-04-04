import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shield, Sparkles } from 'lucide-react';

import PolicyCard from '../components/PolicyCard';
import WeatherPanel from '../components/WeatherPanel';
import ClaimsTimeline from '../components/ClaimsTimeline';
import SimulateDisruption from '../components/SimulateDisruption';

export default function Dashboard() {
  const { worker } = useAuth();
  const [data, setData] = useState<{ policy: any, remainingPayout: number, paidThisWeek: number, lifetimePaid: number } | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [triggerUpdate, setTriggerUpdate] = useState(0);

  const loadData = async () => {
    try {
      const [policyRes, claimsRes] = await Promise.all([
        api.get('/policies/active'),
        api.get('/claims')
      ]);
      setData(policyRes);
      setClaims(claimsRes.claims);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerUpdate]);

  const handleSimulationComplete = () => {
    // Refresh all data
    setTriggerUpdate(prev => prev + 1);
  };

  return (
    <div className="min-h-screen pt-6 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-teal-50">Hello, {worker?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-teal-400 opacity-80 mt-0.5">{worker?.city} • {worker?.zone}</p>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-teal-800/50 flex items-center justify-center border border-teal-700/50">
            <Shield size={20} className="text-amber-500" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-teal-950" />
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <WeatherPanel triggerSimulationUpdate={triggerUpdate} />
        
        {data?.policy && (
          <PolicyCard 
            policy={data.policy} 
            remainingPayout={data.remainingPayout} 
            paidThisWeek={data.paidThisWeek} 
          />
        )}

        <SimulateDisruption onComplete={handleSimulationComplete} />

        {/* Earnings Protected Widget */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-xs text-teal-500/60 uppercase font-bold tracking-widest mb-0.5">Total Earnings Protected</p>
              <h3 className="text-2xl font-bold text-white">₹{data?.lifetimePaid?.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <ClaimsTimeline claims={claims} limit={3} />
        </div>
      </div>
    </div>
  );
}
