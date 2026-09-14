import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

// Demo credentials that work for all dashboards
const DEMO_EMAIL = 'demo@proofledger.in';
const DEMO_PASSWORD = 'demo1234';

const DEMO_ROLES = [
  { label: 'Student', route: '/student', color: 'bg-growth-teal' },
  { label: 'Industry', route: '/industry', color: 'bg-ink' },
  { label: 'Academician', route: '/academician', color: 'bg-verified-gold' },
  { label: 'Institution', route: '/institution', color: 'bg-slate' },
  { label: 'Admin', route: '/admin', color: 'bg-alert-rust' },
  { label: 'Alumni', route: '/alumni', color: 'bg-growth-teal' },
];

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate a small delay
    await new Promise(r => setTimeout(r, 400));

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setShowRolePicker(true);
      setLoading(false);
    } else {
      setError('Incorrect email or password. Use the demo credentials shown below.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (route: string) => {
    navigate(route);
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  if (showRolePicker) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-hairline rounded-sm shadow-sm p-8 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-ink" />
            <h1 className="text-xl font-serif font-bold text-ink">Select Dashboard</h1>
            <p className="text-sm text-slate text-center">Choose which role you want to explore.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DEMO_ROLES.map((role) => (
              <button
                key={role.label}
                onClick={() => handleQuickLogin(role.route)}
                className={`${role.color} text-white p-4 rounded-sm text-sm font-bold hover:opacity-90 transition-all flex items-center justify-between shadow-sm`}
              >
                {role.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>

          <button
            onClick={() => { setShowRolePicker(false); setEmail(''); setPassword(''); }}
            className="w-full text-center text-sm text-slate hover:text-ink transition-colors"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-hairline rounded-sm shadow-sm p-8 space-y-8">
        
        <div className="flex flex-col items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-ink mb-2">
            <ShieldCheck className="h-7 w-7 text-ink" />
            <span>ProofLedger</span>
          </Link>
          <h1 className="text-xl font-medium text-ink">Log in to your account</h1>
        </div>

        {error && (
          <div className="bg-alert-rust/10 border border-alert-rust/20 text-alert-rust p-3 rounded-sm text-sm flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo credentials hint */}
        <div className="bg-growth-teal/5 border border-growth-teal/20 p-4 rounded-sm space-y-2">
          <p className="text-xs font-bold text-growth-teal uppercase tracking-wider">Demo Credentials</p>
          <div className="text-sm text-ink space-y-1 font-mono">
            <p>Email: <span className="font-bold">{DEMO_EMAIL}</span></p>
            <p>Password: <span className="font-bold">{DEMO_PASSWORD}</span></p>
          </div>
          <button 
            onClick={fillDemo}
            className="text-xs font-bold text-growth-teal hover:text-growth-teal/80 transition-colors underline underline-offset-2"
          >
            Auto-fill credentials →
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-ink" htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-ink" htmlFor="password">Password</label>
              <Link to="/forgot-password" className="text-xs text-slate hover:text-ink transition-colors">Forgot password?</Link>
            </div>
            <input 
              id="password"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-ink text-paper py-2 rounded-sm font-medium hover:bg-ink/90 transition-colors shadow-sm disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Quick access */}
        <div className="border-t border-hairline pt-6 space-y-3">
          <p className="text-xs font-bold text-slate uppercase tracking-wider text-center">Quick Access — Skip Login</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ROLES.map((role) => (
              <button
                key={role.label}
                onClick={() => handleQuickLogin(role.route)}
                className="border border-hairline text-ink px-3 py-2 rounded-sm text-xs font-bold hover:bg-slate/5 transition-colors"
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate">
          Don't have an account? <Link to="/signup" className="text-ink font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
