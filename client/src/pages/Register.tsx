import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Phone, Lock, Hash, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    city: 'Chennai',
    pincode: '',
    zone: '',
    platform: 'zomato',
    avgDailyHours: '8',
    avgDailyEarnings: '600',
    monthsActive: '12',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const CITIES = ['Chennai', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Pune'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', formData);
      login(res.token, res.worker);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-12 px-6 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      <div className="absolute top-0 left-0 w-full h-[300px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[50%] -right-[10%] w-[80%] h-[100%] rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-teal-800/30 rounded-full mb-3 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
          <ShieldAlert size={32} className="text-amber-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p className="text-teal-200/70 text-sm mt-1">Join GigShield today</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-5 space-y-5 animate-slide-up">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Personal Info - Condensed for demo */}
        <div className="space-y-4 border-b border-teal-800/30 pb-5">
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Personal Info</h2>
          
          <div>
            <label className="block text-xs text-teal-300 mb-1 ml-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute top-3 pl-3 text-teal-600" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Rahul Kumar"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-teal-300 mb-1 ml-1">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute top-3 pl-3 text-teal-600" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="10 digits"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-teal-300 mb-1 ml-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute top-3 pl-3 text-teal-600" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="Min 6 chars"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Location & Work */}
        <div className="space-y-4 pt-1 border-b border-teal-800/30 pb-5">
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Location & Work</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-teal-300 mb-1 ml-1">City</label>
              <select
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none appearance-none"
              >
                {CITIES.map(c => <option key={c} value={c} className="bg-teal-900">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-teal-300 mb-1 ml-1">Zone / Area</label>
              <input
                type="text"
                required
                value={formData.zone}
                onChange={e => setFormData({ ...formData, zone: e.target.value })}
                className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="e.g. Adyar"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-teal-300 mb-1 ml-1">Platform</label>
              <select
                value={formData.platform}
                onChange={e => setFormData({ ...formData, platform: e.target.value })}
                className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none appearance-none"
              >
                <option value="zomato" className="bg-teal-900">Zomato</option>
                <option value="swiggy" className="bg-teal-900">Swiggy</option>
                <option value="both" className="bg-teal-900">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-teal-300 mb-1 ml-1">Pincode</label>
              <div className="relative">
                <Hash size={16} className="absolute top-3 pl-3 text-teal-600" />
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-teal-950/40 border border-teal-800/60 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="6 digits"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] disabled:opacity-70 flex justify-center mt-6"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Continue to Risk Profiling'}
        </button>
        
        <div className="text-center pt-2">
          <p className="text-xs text-teal-400/60">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-amber-500 hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
