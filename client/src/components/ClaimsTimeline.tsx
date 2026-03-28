import { formatDistanceToNow, format } from 'date-fns';
import { CloudRain, Sun, Wind, Waves, AlertOctagon, CheckCircle2, Copy, Zap, ArrowRight, FileX2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClaimsTimelineProps {
  claims: any[];
  limit?: number;
  emptyStateMsg?: string;
}

export default function ClaimsTimeline({ claims, limit, emptyStateMsg = "No claims on record yet" }: ClaimsTimelineProps) {
  const navigate = useNavigate();
  const displayClaims = limit ? claims.slice(0, limit) : claims;

  if (!claims || claims.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-teal-900/50 flex items-center justify-center mb-2">
          <FileX2 size={32} className="text-teal-600" />
        </div>
        <h3 className="text-teal-200 font-medium">Clear Record</h3>
        <p className="text-xs text-teal-500/80 max-w-[200px]">{emptyStateMsg}</p>
      </div>
    );
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'heavy_rain': return <CloudRain size={16} className="text-blue-400" />;
      case 'extreme_heat': return <Sun size={16} className="text-orange-400" />;
      case 'aqi': return <Wind size={16} className="text-gray-400" />;
      case 'flood': return <Waves size={16} className="text-cyan-400" />;
      case 'curfew': return <AlertOctagon size={16} className="text-red-400" />;
      default: return <Zap size={16} className="text-amber-500" />;
    }
  };

  const getTriggerName = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-wider font-bold border border-emerald-500/30">Paid</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] uppercase tracking-wider font-bold border border-blue-500/30">Processing</span>;
      case 'flagged':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[9px] uppercase tracking-wider font-bold border border-amber-500/30">Reviewing</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[9px] uppercase tracking-wider font-bold border border-red-500/30">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[9px] uppercase tracking-wider font-bold border border-teal-500/30">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-teal-200">Recent Claims History</h3>
        {limit && claims.length > limit && (
          <button 
            onClick={() => navigate('/claims')}
            className="text-[10px] text-amber-500 uppercase tracking-widest font-bold flex items-center gap-1 hover:text-amber-400 transition-colors"
          >
            View All <ArrowRight size={12} />
          </button>
        )}
      </div>
      
      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[1.15rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-teal-800 before:to-transparent">
        {displayClaims.map((claim, index) => {
          const isLatest = index === 0;
          return (
            <div key={claim.id} className="relative flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${
                isLatest ? 'bg-teal-900 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-teal-950 border-teal-800 text-teal-500'
              }`}>
                {getTriggerIcon(claim.trigger?.triggerType)}
              </div>
              
              <div className="flex-1 glass-card p-4 hover:border-teal-600/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-teal-50">
                      {getTriggerName(claim.trigger?.triggerType)}
                    </span>
                    <span className="text-[10px] text-teal-400/60 font-mono mt-1">
                      {format(new Date(claim.triggeredAt), 'h:mm a · MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-amber-500 tracking-tight">
                      ₹{claim.calculatedPayout}
                    </div>
                    <div className="mt-1 flex justify-end">
                      {getStatusBadge(claim.status)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-teal-800/30 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[9px] text-teal-500 uppercase tracking-wider mb-0.5">Disruption Time</span>
                    <span className="text-xs font-semibold">{claim.hoursCovered} hrs</span>
                  </div>
                  {claim.payout?.upiRef && (
                    <div className="text-right">
                      <span className="block text-[9px] text-teal-500 uppercase tracking-wider mb-0.5">UPI Reference</span>
                      <span className="text-[10px] font-mono font-medium text-emerald-400 flex items-center justify-end gap-1">
                        {claim.payout.upiRef} <Copy size={10} className="opacity-50 group-hover:opacity-100 cursor-pointer" />
                      </span>
                    </div>
                  )}
                  {claim.status === 'flagged' && (
                    <div className="col-span-2 mt-2 p-2 bg-amber-500/10 rounded border border-amber-500/20 flex items-start gap-1.5">
                      <AlertOctagon size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-amber-200/90 leading-tight">
                        Under manual review. Fraud score: {claim.fraudScore}/100.
                      </span>
                    </div>
                  )}
                  {claim.status === 'paid' && (
                    <div className="col-span-2 mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400/80">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>Credited {formatDistanceToNow(new Date(claim.payout?.completedAt || new Date()), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
