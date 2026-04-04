import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface Claim {
  id: string;
  triggeredAt: string;
  calculatedPayout: number;
  status: string;
}

export default function ClaimsTimeline({ claims, limit = 5 }: { claims: Claim[], limit?: number }) {
  const displayedClaims = claims.slice(0, limit);

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp size={20} className="text-teal-400" />
          Recent Claims
        </h3>
        <span className="text-xs font-bold text-teal-500/60 uppercase tracking-widest">{claims.length} Total</span>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-10">
          <Clock size={48} className="mx-auto text-teal-800/40 mb-3" strokeWidth={1} />
          <p className="text-teal-400/60 text-sm">No claims yet. Your income is safe!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedClaims.map((claim, idx) => (
            <div key={claim.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              {/* Timeline line */}
              {idx !== displayedClaims.length - 1 && (
                <div className="absolute top-10 left-[18px] bottom-[-24px] w-[2px] bg-teal-800/20" />
              )}
              
              <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-2 ${
                claim.status === 'paid' ? 'bg-teal-500/10 border-teal-500 text-teal-500' : 
                claim.status === 'auto-triggered' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 
                'bg-red-500/10 border-red-500 text-red-500'
              }`}>
                {claim.status === 'paid' ? <CheckCircle2 size={18} /> : 
                 claim.status === 'auto-triggered' ? <Clock size={18} /> : 
                 <AlertCircle size={18} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-teal-50 text-base truncate">Income Protection Triggered</h4>
                    <p className="text-xs text-teal-400 opacity-60 mt-0.5">{new Date(claim.triggeredAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-500 tracking-tight">₹{claim.calculatedPayout}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                      claim.status === 'paid' ? 'text-teal-400' : 'text-amber-500'
                    }`}>
                      {claim.status === 'paid' ? 'Completed' : 'Processing'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {claims.length > limit && (
        <button className="w-full mt-8 py-3 bg-teal-800/20 border border-teal-700/30 rounded-xl text-teal-400 text-sm font-semibold hover:bg-teal-800/30 hover:text-teal-200 transition-all active:scale-[0.98]">
          View Full History
        </button>
      )}
    </div>
  );
}
