import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, Cpu, CheckCircle2, ChevronRight, Activity, Zap } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TextSkeleton } from '../components/SkeletonLoader';

interface Tier {
  id: string;
  name: string;
  basePremium: number;
  maxWeeklyPayout: number;
  coverageHoursPerDay: number;
  description: string;
}

interface Previews {
  [key: string]: {
    adjustedPremium: number;
    reason: string;
  };
}

export default function Onboarding() {
  const { worker, updateWorker } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Risk Profile Data
  const [riskData, setRiskData] = useState<any>(null);
  
  // Tiers & Selection
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [previews, setPreviews] = useState<Previews>({});
  const [selectedTier, setSelectedTier] = useState<string>('standard');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function initOnboarding() {
      try {
        // Step 1: Run AI Risk Profiling
        const riskRes = await api.post('/workers/onboard', {});
        setRiskData(riskRes.riskProfile);
        updateWorker(riskRes.worker);
        
        // Step 2: Fetch tiers
        const tiersRes = await api.get('/policies/tiers');
        setTiers(tiersRes.tiers);
        
        // Step 3: Get dynamic pricing for all tiers
        const pricingPromises = tiersRes.tiers.map(async (t: Tier) => {
          const res = await api.post('/policies/preview-premium', { tier: t.id });
          return { id: t.id, adjustedPremium: res.adjusted_premium, reason: res.adjustment_reason };
        });
        
        const pricingResults = await Promise.all(pricingPromises);
        const newPreviews: Previews = {};
        pricingResults.forEach(p => { newPreviews[p.id] = p; });
        setPreviews(newPreviews);
        
        setLoading(false);
      } catch (err: any) {
        setError('Failed to initialize onboarding data');
        setLoading(false);
      }
    }
    
    // Only run if worker needs onboarding
    if (worker && !worker.riskTier) {
      initOnboarding();
    } else {
      // If already has risk profile, skip to step 2 (policy selection)
      // For demo, we just fetch tiers and prices
      setRiskData({
        risk_score: worker?.riskScore,
        risk_tier: worker?.riskTier,
        explanation: 'Using existing risk profile',
        key_risk_factors: ['Current profile data']
      });
      setStep(2);
      initOnboarding(); // In a real app we'd split the logic, but this gets the tiers and pricing
    }
  }, []);

  const handleCreatePolicy = async () => {
    setProcessing(true);
    setError('');
    try {
      await api.post('/policies', { tier: selectedTier });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create policy');
      setProcessing(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="min-h-screen pt-16 px-6 bg-gradient-to-br from-teal-950 to-teal-900 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
          <Cpu className="absolute inset-0 m-auto text-amber-500" size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-center text-teal-50">Claude AI is profiling your risk...</h2>
        <p className="text-teal-400/80 text-sm text-center mb-8 max-w-[250px]">
          Analyzing historical weather, flood data, and civic disruptions for {worker?.city}.
        </p>
        <div className="w-full max-w-sm glass-card p-5 space-y-4">
          <TextSkeleton lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 pt-8 px-5 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <div className="fixed top-0 left-0 w-full h-1 bg-teal-900/50">
        <div 
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">
            {step === 1 ? 'Your Risk Profile' : 'Select Coverage'}
          </h1>
          <p className="text-sm text-teal-400 opacity-80 mt-1">
            {step === 1 ? 'Powered by Anthropic Claude 3.5' : 'Dynamic weekly premiums'}
          </p>
        </div>
        <div className="text-xs font-bold bg-teal-800/50 text-amber-500 px-3 py-1.5 rounded-full border border-teal-700/50">
          STEP {step}/2
        </div>
      </div>

      {error && (
        <div className="p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {step === 1 && riskData && (
        <div className="space-y-5 animate-jade-up">
          <div className="glass-card p-6 border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-800/40 rounded-xl">
                  <Activity className="text-amber-500" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Risk Score</h3>
                  <span className={`text-sm font-bold ${
                    riskData.risk_tier === 'High' ? 'text-red-400' : 
                    riskData.risk_tier === 'Medium' ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {riskData.risk_tier} Risk
                  </span>
                </div>
              </div>
              <div className="text-4xl font-bold font-mono tracking-tighter">
                {riskData.risk_score}<span className="text-lg text-teal-500/50">/100</span>
              </div>
            </div>
            
            <div className="p-4 bg-teal-950/60 rounded-xl border border-teal-800/40 mb-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Cpu size={64} />
              </div>
              <p className="text-sm leading-relaxed text-teal-50/90 relative z-10">
                "{riskData.explanation}"
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-teal-500 uppercase tracking-wider mb-3">Key Risk Factors</h4>
              <ul className="space-y-2">
                {riskData.key_risk_factors?.map((factor: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-teal-200/80">
                    <Zap size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-medium py-3.5 flex items-center justify-center gap-2 rounded-xl shadow-[0_4px_15px_rgba(20,184,166,0.3)]"
          >
            <span>View Coverage Plans</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          {tiers.map(t => {
            const preview = previews[t.id];
            const isSelected = selectedTier === t.id;
            
            return (
              <div 
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`glass-card p-5 transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'border-amber-500/50 ring-1 ring-amber-500/50 bg-teal-800/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                    : 'border-teal-800/40 hover:border-teal-600/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckCircle2 size={20} className="text-amber-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-teal-700/50" />
                    )}
                    <h3 className="font-bold text-lg">{t.name}</h3>
                  </div>
                  <div className="text-right">
                    {preview ? (
                      <>
                        <div className="font-bold text-xl text-amber-500">₹{preview.adjustedPremium}<span className="text-xs text-teal-500 font-normal">/wk</span></div>
                        {preview.adjustedPremium !== t.basePremium && (
                          <div className="text-[10px] text-teal-400/60 line-through">Base: ₹{t.basePremium}</div>
                        )}
                      </>
                    ) : (
                      <div className="h-6 w-16 skeleton rounded" />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-teal-300 mb-4 ml-7">{t.description}</p>
                
                <div className="grid grid-cols-2 gap-2 ml-7">
                  <div className="bg-teal-950/50 rounded p-2 border border-teal-900/50">
                    <div className="text-[10px] text-teal-500 uppercase">Max Payout</div>
                    <div className="text-sm font-semibold">₹{t.maxWeeklyPayout}/wk</div>
                  </div>
                  <div className="bg-teal-950/50 rounded p-2 border border-teal-900/50">
                    <div className="text-[10px] text-teal-500 uppercase">Coverage</div>
                    <div className="text-sm font-semibold">Up to {t.coverageHoursPerDay} hrs/day</div>
                  </div>
                </div>

                {isSelected && preview?.reason && (
                  <div className="mt-4 ml-7 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-teal-100 flex items-start gap-1.5">
                    <Cpu size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>{preview.reason}</span>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={handleCreatePolicy}
            disabled={processing || !previews[selectedTier]}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-70 disabled:shadow-none transition-all"
          >
            {processing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <ShieldAlert size={18} />
                <span>Activate Protection</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
