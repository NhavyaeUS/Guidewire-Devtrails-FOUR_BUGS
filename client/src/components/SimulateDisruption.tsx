import { useState } from 'react';
import { CloudRain, Sun, Wind, Waves, AlertOctagon, CheckCircle2, ShieldAlert, Cpu, Search, IndianRupee, MapPin } from 'lucide-react';
import { api } from '../api/client';

export default function SimulateDisruption({ onComplete }: { onComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); // 0: select, 1: trigger, 2: fraud, 3: payout
  const [selectedTrigger, setSelectedTrigger] = useState('heavy_rain');
  const [forceFraud, setForceFraud] = useState(false);
  const [result, setResult] = useState<any>(null);

  const triggers = [
    { id: 'heavy_rain', name: 'Heavy Rain', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'extreme_heat', name: 'Extreme Heat', icon: Sun, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { id: 'aqi', name: 'Severe AQI', icon: Wind, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    { id: 'flood', name: 'Zone Flood', icon: Waves, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { id: 'curfew', name: 'Civic Curfew', icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/20' },
  ];

  const handleSimulate = async () => {
    setStep(1); // Firing trigger
    
    try {
      // Small artificial delay for visual effect
      await new Promise(r => setTimeout(r, 1500));
      setStep(2); // Fraud check
      
      const res = await api.post('/claims/simulate', { 
        triggerType: selectedTrigger,
        forceGpsMismatch: forceFraud
      });
      
      setResult(res);
      
      await new Promise(r => setTimeout(r, 2000));
      
      if (res.claim?.status === 'approved') {
        setStep(3); // Queuing payout
        await new Promise(r => setTimeout(r, 2000));
        setStep(4); // Done
      } else {
        setStep(4); // Done (rejected or flagged)
      }
      
      setTimeout(() => {
        setIsOpen(false);
        setStep(0);
        setResult(null);
        onComplete();
      }, 3000);
      
    } catch (error) {
      console.error(error);
      setIsOpen(false);
      setStep(0);
    }
  };

  return (
    <div className="mt-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <ShieldAlert size={20} className="animate-pulse" />
          <span>Simulate Disruption (Demo)</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
      ) : (
        <div className="glass-card p-5 border-amber-500/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-900/50">
            <div 
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {step === 0 && (
            <div className="animate-fade-in pt-2">
              <h3 className="font-bold text-lg mb-1 flex items-center justify-between">
                <span>Select Trigger Event</span>
                <button onClick={() => setIsOpen(false)} className="text-teal-500 text-sm font-normal">Cancel</button>
              </h3>
              <p className="text-xs text-teal-300 mb-4">This will force an API event for your active zone.</p>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {triggers.map(t => {
                  const Icon = t.icon;
                  const isSelected = selectedTrigger === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrigger(t.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? `bg-teal-800/60 border-amber-500 ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]` 
                          : 'bg-teal-950/50 border-teal-800/50 hover:bg-teal-900/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full mb-2 ${t.bg}`}>
                        <Icon size={20} className={t.color} />
                      </div>
                      <span className="text-xs font-semibold">{t.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-teal-800/30 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-teal-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={forceFraud}
                    onChange={(e) => setForceFraud(e.target.checked)}
                    className="rounded bg-teal-900 border-teal-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-teal-950 accent-amber-500"
                  />
                  <span>Force GPS mismatch (Test Fraud Check)</span>
                </label>
              </div>

              <button
                onClick={handleSimulate}
                className="w-full mt-5 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
              >
                FIRE TRIGGER EVENT
              </button>
            </div>
          )}

          {step > 0 && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${step >= 1 ? 'bg-amber-500 text-white' : 'bg-teal-900 border border-teal-700 text-teal-600'}`}>
                  {step > 1 ? <CheckCircle2 size={16} /> : <CloudRain size={16} className="animate-bounce" />}
                </div>
                <div className={`flex-1 transition-opacity ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                  <h4 className="text-sm font-bold">1. Trigger Fired</h4>
                  <p className="text-[10px] text-teal-300/80">Parametric event registered in your zone</p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative before:absolute before:-top-4 before:left-4 before:w-0.5 before:h-4 before:bg-teal-800">
                <div className={`p-2 rounded-full relative z-10 ${
                  step === 2 ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 
                  step > 2 ? 'bg-emerald-500 text-white' : 'bg-teal-900 border border-teal-700 text-teal-600'
                }`}>
                  {step > 2 ? <CheckCircle2 size={16} /> : <Search size={16} className={step === 2 ? 'animate-pulse' : ''} />}
                </div>
                <div className={`flex-1 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                  <h4 className="text-sm font-bold flex items-center gap-1">
                    2. AI Validation <Cpu size={12} className="text-amber-500" />
                  </h4>
                  {step === 2 && (
                    <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5 animate-pulse">
                      <MapPin size={10} /> Validating GPS & platform activity...
                    </div>
                  )}
                  {step > 2 && result?.claim && (
                    <p className={`text-[10px] mt-0.5 ${result.claim.status === 'flagged' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {result.claim.status === 'flagged' ? 'Anomaly detected - routed to review' : 'No fraud detected - claim approved'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 relative before:absolute before:-top-4 before:left-4 before:w-0.5 before:h-4 before:bg-teal-800">
                <div className={`p-2 rounded-full relative z-10 ${
                  step === 3 && result?.claim?.status === 'approved' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 
                  step > 3 && result?.claim?.status === 'approved' ? 'bg-emerald-500 text-white' : 
                  step >= 3 && result?.claim?.status !== 'approved' ? 'bg-red-500 text-white' : 'bg-teal-900 border border-teal-700 text-teal-600'
                }`}>
                  {step > 3 && result?.claim?.status === 'approved' ? <CheckCircle2 size={16} /> : 
                   step >= 3 && result?.claim?.status !== 'approved' ? <AlertOctagon size={16} /> :
                   <IndianRupee size={16} className={step === 3 ? 'animate-pulse' : ''} />}
                </div>
                <div className={`flex-1 transition-opacity ${step >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                  <h4 className="text-sm font-bold">
                    3. {result?.claim?.status === 'flagged' ? 'Manual Review' : 'Payout Processing'}
                  </h4>
                  {step === 3 && result?.claim?.status === 'approved' && (
                    <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5 animate-pulse">
                      Queuing UPI transfer of ₹{result.claim.calculatedPayout}...
                    </div>
                  )}
                  {step >= 3 && result?.claim?.status === 'flagged' && (
                    <p className="text-[10px] text-red-400 leading-tight mt-0.5">
                      {result.fraudResult?.explanation}
                    </p>
                  )}
                  {step > 3 && result?.claim?.status === 'approved' && (
                    <p className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                      Sent to UPI: {result.payout?.upiRef || 'UPI2026MOCK99X'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
