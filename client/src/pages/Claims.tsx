import { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';
import { api } from '../api/client';
import ClaimsTimeline from '../components/ClaimsTimeline';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function Claims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [claimsRes, payoutsRes] = await Promise.all([
          api.get('/claims'),
          api.get('/payouts')
        ]);
        setClaims(claimsRes.claims);
        setPayouts(payoutsRes.payouts);
      } catch (err) {
        console.error('Failed to load claims', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-5 pt-8 space-y-4"><CardSkeleton /><CardSkeleton /></div>;

  const pendingAmount = claims
    .filter(c => c.status === 'approved' || c.status === 'flagged')
    .reduce((sum, c) => sum + c.calculatedPayout, 0);

  const completedAmount = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen pt-8 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Claims & Payouts</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <IndianRupee size={16} />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Total Paid</h3>
          </div>
          <div className="text-2xl font-bold tracking-tighter">₹{completedAmount}</div>
        </div>
        
        <div className="glass-card p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2 mb-2 text-amber-500">
            <IndianRupee size={16} />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Pending</h3>
          </div>
          <div className="text-2xl font-bold tracking-tighter">₹{pendingAmount}</div>
        </div>
      </div>

      <div className="pb-8">
        <ClaimsTimeline 
          claims={claims} 
          emptyStateMsg="You haven't filed any claims yet. When extreme weather hits your zone, claims are filed automatically."
        />
      </div>
    </div>
  );
}
