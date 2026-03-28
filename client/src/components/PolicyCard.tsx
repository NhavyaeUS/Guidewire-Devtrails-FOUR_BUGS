import { Shield, Target, Clock } from 'lucide-react';

interface PolicyProps {
  policy: any;
  remainingPayout: number;
  paidThisWeek: number;
}

export default function PolicyCard({ policy, remainingPayout, paidThisWeek }: PolicyProps) {
  if (!policy) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'standard': return 'text-teal-400 bg-teal-400/10 border-teal-400/30';
      default: return 'text-teal-200 bg-teal-200/10 border-teal-200/30';
    }
  };

  const daysUntilRenewal = () => {
    const end = new Date(policy.coverageEnd).getTime();
    const now = new Date().getTime();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const percentUsed = (paidThisWeek / policy.maxWeeklyPayout) * 100;

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${getTierColor(policy.tier)}`}>
            <Shield size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-lg capitalize tracking-tight">{policy.tier} Shield</h3>
            <p className="text-xs text-teal-400/80 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Coverage
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono tracking-tighter">
            ₹{policy.weeklyPremium}<span className="text-xs font-sans text-teal-500/50">/wk</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10 mt-6">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-teal-300">Weekly Limit</span>
            <span className="font-medium text-amber-500">₹{remainingPayout} remaining</span>
          </div>
          <div className="h-2 w-full bg-teal-950/80 rounded-full overflow-hidden border border-teal-800/50">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                percentUsed > 80 ? 'bg-red-500' : percentUsed > 50 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-teal-500/70 mt-1 uppercase tracking-wider">
            <span>₹{paidThisWeek} paid</span>
            <span>Max ₹{policy.maxWeeklyPayout}</span>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-teal-800/30">
          <div className="flex items-center gap-1.5 text-xs text-teal-200">
            <Target size={14} className="text-teal-500" />
            <span>Auto-renew: {' '}
              <span className="font-medium">
                {new Date(policy.coverageEnd).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-teal-200">
            <Clock size={14} className="text-amber-500" />
            <span>{daysUntilRenewal()} days left</span>
          </div>
        </div>
      </div>
    </div>
  );
}
