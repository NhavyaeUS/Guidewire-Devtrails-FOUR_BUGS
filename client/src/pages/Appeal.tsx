import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Appeal() {
  const { worker } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState('');
  const [reason, setReason] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchClaims() {
      try {
        const res = await api.get('/claims');
        const flagged = (res as any).claims?.filter((c: any) => 
          c.status === 'flagged' || c.status === 'rejected'
        ) || [];
        setClaims(flagged);
        if (flagged.length > 0) setSelectedClaim(flagged[0].id);
      } catch (err) {
        console.error('Failed to fetch claims', err);
      }
    }
    fetchClaims();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !reason) {
      setError('Please select a claim and provide a reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/appeals', {
        claimId: selectedClaim,
        reason,
        proofUrl: proofUrl || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit appeal');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-16 px-6 bg-gradient-to-br from-teal-950 to-teal-900 flex flex-col items-center justify-center">
        <div className="glass-card p-8 text-center max-w-sm">
          <ShieldAlert size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Appeal Submitted!</h2>
          <p className="text-teal-400 text-sm mb-6">
            Your appeal has been submitted for review. An admin will review your case shortly.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-bold transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-8 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-teal-400 hover:text-teal-300 text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Appeal a Flagged Claim</h1>
      <p className="text-teal-400/80 text-sm mb-6">
        If you believe a claim was incorrectly flagged or rejected, submit an appeal with supporting evidence.
      </p>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card p-5">
          <label className="block text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">
            Select Claim
          </label>
          {claims.length === 0 ? (
            <p className="text-teal-400/60 text-sm">No flagged or rejected claims found.</p>
          ) : (
            <select
              value={selectedClaim}
              onChange={(e) => setSelectedClaim(e.target.value)}
              className="w-full bg-teal-950/60 border border-teal-800/50 rounded-xl px-4 py-3 text-teal-100 text-sm focus:outline-none focus:border-amber-500/50"
            >
              {claims.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.trigger?.triggerType || 'Claim'} — ₹{c.calculatedPayout} — {c.status}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="glass-card p-5">
          <label className="block text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">
            Reason for Appeal
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you believe this claim should be reviewed..."
            rows={4}
            className="w-full bg-teal-950/60 border border-teal-800/50 rounded-xl px-4 py-3 text-teal-100 text-sm placeholder-teal-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        <div className="glass-card p-5">
          <label className="block text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">
            Photo Evidence URL (optional)
          </label>
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://example.com/photo-evidence.jpg"
            className="w-full bg-teal-950/60 border border-teal-800/50 rounded-xl px-4 py-3 text-teal-100 text-sm placeholder-teal-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || claims.length === 0}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Send size={18} />
              Submit Appeal
            </>
          )}
        </button>
      </form>
    </div>
  );
}
