import { useAuth } from '../context/AuthContext';
import { User, LogOut, Phone, MapPin, Hash, Shield, Info, Activity } from 'lucide-react';

export default function Profile() {
  const { worker, logout } = useAuth();

  if (!worker) return null;

  return (
    <div className="min-h-screen pt-8 pb-20 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <button 
          onClick={logout}
          className="p-2 bg-teal-900/50 rounded-full text-teal-400 hover:text-amber-500 hover:bg-teal-800 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="glass-card p-6 mb-6 flex items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -z-10" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center border-2 border-teal-600/50 shadow-inner">
          <User size={32} className="text-teal-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-teal-50 tracking-tight">{worker.name}</h2>
          <div className="flex items-center gap-1.5 text-sm text-teal-400/80 mt-1">
            <Phone size={14} />
            <span>+91 {worker.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4">Location Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-900/50 rounded-lg text-teal-400 shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <span className="block text-[10px] text-teal-500 uppercase tracking-widest mb-0.5">City & Zone</span>
                <span className="text-sm font-semibold">{worker.city} • <span className="text-teal-300">{worker.zone}</span></span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-900/50 rounded-lg text-teal-400 shrink-0">
                <Hash size={16} />
              </div>
              <div>
                <span className="block text-[10px] text-teal-500 uppercase tracking-widest mb-0.5">Pincode</span>
                <span className="text-sm font-semibold">{worker.pincode}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4">Work & Risk Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-800/40">
                <span className="block text-[10px] text-teal-500 uppercase tracking-widest mb-1">Platform</span>
                <span className="text-sm font-semibold capitalize">{worker.platform}</span>
              </div>
              <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-800/40">
                <span className="block text-[10px] text-red-400 uppercase tracking-widest mb-1">Risk Tier</span>
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Activity size={12} className="text-red-500" />
                  {worker.riskTier || 'Pending'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-800/40">
                <span className="block text-[10px] text-teal-500 uppercase tracking-widest mb-1">Avg Earnings</span>
                <span className="text-sm font-semibold">₹{worker.avgDailyEarnings}/day</span>
              </div>
              <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-800/40">
                <span className="block text-[10px] text-teal-500 uppercase tracking-widest mb-1">Avg Hours</span>
                <span className="text-sm font-semibold">{worker.avgDailyHours} hrs/day</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-start gap-3 border-teal-800/20 bg-teal-900/20">
          <Info size={16} className="text-teal-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-teal-400/80 leading-relaxed">
            Your risk tier and premium are calculated using an AI model that analyzes 
            historical weather patterns, flood zones, and civic disruption frequency for your specific operating area.
          </p>
        </div>
      </div>
    </div>
  );
}
