import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api';
import { cn } from '../lib/utils';
import { ProofBadge } from '../components/ui/ProofBadge';

type Role = 'Student' | 'Industry' | 'Academician' | 'Institution' | 'Alumni';

export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || null;

  const [step, setStep] = useState<1 | 2>(initialRole ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
      setStep(2);
    }
  }, [initialRole]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setError(null);
    setLoading(true);

    try {
      const userRole = selectedRole.toLowerCase();
      
      // 1. Register through backend to avoid Supabase email confirmation rate limits
      await apiClient.post('/auth/register', {
        email: email.trim(),
        password,
        full_name: name.trim(),
        role: userRole
      });

      // 2. Sign in immediately to establish active session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        throw signInError;
      }
      
      // 3. Navigate directly to role-specific dashboard
      navigate(`/${userRole}`);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-hairline rounded-sm shadow-sm p-8 space-y-8">
        
        <div className="flex flex-col items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-ink mb-2">
            <ShieldCheck className="h-7 w-7 text-ink" />
            <span>ProofLedger</span>
          </Link>
          <h1 className="text-xl font-medium text-ink">
            {step === 1 ? 'Join the network' : `Sign up as ${selectedRole}`}
          </h1>
        </div>

        {error && (
          <div className="bg-alert-rust/10 border border-alert-rust/20 text-alert-rust p-3 rounded-sm text-sm flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate text-center pb-2">Select your role in the ecosystem to continue.</p>
            
            {(['Student', 'Industry', 'Academician', 'Institution', 'Alumni'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setStep(2);
                  setError(null);
                }}
                className={cn(
                  "w-full text-left px-4 py-4 border rounded-sm flex items-center justify-between transition-colors group",
                  selectedRole === role ? "border-ink bg-slate/5" : "border-hairline hover:border-slate/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink">{role}</span>
                  {['Student', 'Industry'].includes(role) && <ProofBadge status="verified" />}
                </div>
                <ArrowRight className="h-4 w-4 text-slate opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink" htmlFor="name">Full Name</label>
              <input 
                id="name"
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
            
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
              <label className="text-sm font-medium text-ink" htmlFor="password">Password</label>
              <input 
                id="password"
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div className="pt-2 flex gap-3">
              {!initialRole && (
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-hairline text-ink rounded-sm font-medium hover:bg-slate/5 transition-colors"
                >
                  Back
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-ink text-paper py-2 rounded-sm font-medium hover:bg-ink/90 transition-colors shadow-sm disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-slate">
          Already have an account? <Link to="/login" className="text-ink font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
