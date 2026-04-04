import { ShieldCheck, Calendar, ArrowUpRight } from 'lucide-react';

interface PolicyCardProps {
  policy: {
    tier: string;
    weeklyPremium: number;
    maxWeeklyPayout: number;
    coverageStart: string;
    coverageEnd: string;
    status: string;
  };
  remainingPayout: number;
  paidThisWeek: number;
}

export default function PolicyCard({ policy, remainingPayout, paidThisWeek }: PolicyCardProps) {
  const percentageUsed = (paidThisWeek / (paidThisWeek + remainingPayout)) * 100 || 0;

  return (
    <div className="glass-card p-6 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-teal-500/20 transition-all" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-500 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} />
            {policy.tier} SHIELD ACTIVE
          </div>
          <h2 className="text-3xl font-bold">₹{remainingPayout}</h2>
          <p className="text-teal-400/60 text-sm mt-1">Remaining weekly payout limit</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-teal-500/60 uppercase font-medium tracking-widest mb-1">Weekly Premium</p>
          <p className="text-xl font-semibold text-teal-100 italic">₹{policy.weeklyPremium}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative h-2 bg-teal-950/50 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-amber-500 transition-all duration-1000"
            style={{ width: `${Math.min(100, percentageUsed)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs font-medium">
          <span className="text-teal-400/60">₹{paidThisWeek} Claimed</span>
          <span className="text-teal-400/60">Max: ₹{policy.maxWeeklyPayout}</span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-teal-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-800/30 flex items-center justify-center text-teal-400">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[10px] text-teal-500/60 uppercase font-bold tracking-widest">Valid Until</p>
            <p className="text-xs font-medium">{new Date(policy.coverageEnd).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-amber-500 text-sm font-semibold hover:text-amber-400 transition-colors">
          View Details
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}
