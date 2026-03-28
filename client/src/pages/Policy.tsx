import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, Clock, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function Policy() {
  const [data, setData] = useState<{ policy: any, remainingPayout: number, paidThisWeek: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get('/policies/active');
      setData(res);
    } catch (err) {
      console.error('Failed to load policy', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await api.post('/policies/renew', {});
      await loadData();
    } catch (err) {
      console.error('Renewal failed', err);
    } finally {
      setRenewing(false);
    }
  };

  if (loading) return <div className="p-5 pt-8"><CardSkeleton /></div>;

  const { policy, remainingPayout, paidThisWeek } = data || {};

  if (!policy) {
    return (
      <div className="min-h-screen pt-12 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 flex flex-col items-center justify-center text-center">
        <Shield size={64} className="text-teal-700 mb-4" />
        <h2 className="text-xl font-bold mb-2">No Active Policy</h2>
        <p className="text-teal-400 text-sm mb-6 max-w-[250px]">You don't have active coverage for this week.</p>
        <button 
          onClick={() => window.location.href = '/onboarding'}
          className="bg-amber-500 text-teal-950 font-bold px-6 py-3 rounded-xl shadow-lg"
        >
          Select a Plan
        </button>
      </div>
    );
  }

  const end = new Date(policy.coverageEnd);
  const start = new Date(policy.coverageStart);
  const now = new Date();
  const daysUntilRenewal = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isRenewalDue = daysUntilRenewal <= 1;

  return (
    <div className="min-h-screen pt-8 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Coverage Plan</h1>

      {isRenewalDue && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-pulse">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-amber-500 text-sm">Renewal Due Tommorow</h4>
              <p className="text-xs text-amber-500/80 mt-1 mb-3">Your coverage expires soon. Tap below to renew for the next week.</p>
              <button 
                onClick={handleRenew}
                disabled={renewing}
                className="bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded flex items-center gap-2"
              >
                {renewing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                RENEW NOW
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 p-5 flex justify-between items-center border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold capitalize">{policy.tier} Shield</h2>
              <p className="text-xs text-teal-300">Active until {end.toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white tracking-tight">₹{policy.weeklyPremium}</div>
            <div className="text-[10px] text-teal-400 uppercase tracking-widest">per week</div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-teal-200">Weekly Payout Limit</span>
              <span className="font-bold">₹{policy.maxWeeklyPayout}</span>
            </div>
            <div className="h-2.5 w-full bg-teal-950 rounded-full overflow-hidden border border-teal-800">
              <div 
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(paidThisWeek / policy.maxWeeklyPayout) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className="text-teal-400">Used: ₹{paidThisWeek}</span>
              <span className="text-emerald-400 font-medium tracking-tight">Avail: ₹{remainingPayout}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-teal-800/30">
            <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-800/50 flex flex-col gap-1">
              <Clock size={16} className="text-teal-500" />
              <span className="text-[10px] text-teal-400 uppercase tracking-wider">Start Date</span>
              <span className="text-sm font-semibold">{start.toLocaleDateString()}</span>
            </div>
            <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-800/50 flex flex-col gap-1">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-[10px] text-amber-500/80 uppercase tracking-wider">Expires In</span>
              <span className="text-sm font-semibold">{daysUntilRenewal} Days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-bold mb-4 text-teal-100">Plan Benefits</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-teal-200/90 leading-snug">Instant UPI payouts automatically triggered by severe weather.</p>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-teal-200/90 leading-snug">Protection up to ₹{policy.maxWeeklyPayout} per week total limit.</p>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-teal-200/90 leading-snug">AI-adjusted premium specifically tuned to your delivery zone.</p>
          </li>
        </ul>
      </div>
      
      <div className="mt-8 text-center px-4">
        <p className="text-xs text-teal-500 flex items-center justify-center gap-1">
          <Shield size={12} /> Exclusively for income loss 
        </p>
        <p className="text-[10px] text-teal-600 mt-1">This plan does not cover health, accident, or vehicle repair costs.</p>
      </div>
    </div>
  );
}
