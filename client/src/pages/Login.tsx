import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Phone, Lock, LogIn, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [phone, setPhone] = useState('9876543210'); // Default to Chennai Ramesh seed
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { phone, password });
      login(res.token, res.worker);
      
      if (res.worker.isAdmin) {
        // Just for demo purposes, pre-fill admin password
        if (phone === '9999999999') {
          localStorage.setItem('adminPassword', 'admin123');
        }
        navigate('/admin');
      } else if (!res.worker.riskTier) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      <div className="mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-4 bg-teal-800/30 rounded-2xl mb-4 border border-teal-700/50 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
          <ShieldAlert size={48} className="text-amber-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Gig<span className="text-gradient">Shield</span>
        </h1>
        <p className="text-teal-200/70 text-sm">Parametric income protection for delivery partners</p>
      </div>

      <form onSubmit={handleLogin} className="glass-card p-6 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-teal-300/80 mb-1.5 ml-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-500/60">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-teal-950/50 border border-teal-800/60 rounded-xl py-3 pl-10 pr-4 text-white placeholder-teal-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                placeholder="10-digit mobile number"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-teal-300/80 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-500/60">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-teal-950/50 border border-teal-800/60 rounded-xl py-3 pl-10 pr-4 text-white placeholder-teal-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                placeholder="Enter password"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-medium py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>Secure Login</span>
                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-teal-400/60">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </form>

      {/* Demo helper */}
      <div className="mt-8 pt-6 border-t border-teal-800/30 text-center animate-slide-up text-xs text-teal-500/50" style={{ animationDelay: '0.2s' }}>
        <p>Demo accounts (pwd: password123):</p>
        <p>Chennai: 9876543210 (High Risk)</p>
        <p>Mumbai: 9876543212 (Med Risk)</p>
        <p>Bengaluru: 9876543213 (Low Risk)</p>
        <p>Admin: 9999999999</p>
      </div>
    </div>
  );
}
