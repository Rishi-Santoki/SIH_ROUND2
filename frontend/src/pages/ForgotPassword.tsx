import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-hairline rounded-sm shadow-sm p-8 space-y-8">
        
        <div className="flex flex-col items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-ink mb-2">
            <ShieldCheck className="h-7 w-7 text-ink" />
            <span>ProofLedger</span>
          </Link>
          <h1 className="text-xl font-medium text-ink">Reset your password</h1>
        </div>

        {error && (
          <div className="bg-alert-rust/10 border border-alert-rust/20 text-alert-rust p-3 rounded-sm text-sm flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-verified-gold/10 border border-verified-gold/20 text-ink p-4 rounded-sm text-sm flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-verified-gold" />
            <p>If an account exists for {email}, you will receive a password reset link shortly.</p>
            <Link to="/login" className="text-ink font-medium hover:underline mt-2">Return to log in</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-slate text-center pb-2">Enter your email address and we'll send you a link to reset your password.</p>
            
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-ink text-paper py-2 rounded-sm font-medium hover:bg-ink/90 transition-colors shadow-sm disabled:opacity-70"
            >
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>

            <div className="text-center pt-2">
               <Link to="/login" className="text-sm text-slate hover:text-ink font-medium">Back to log in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
