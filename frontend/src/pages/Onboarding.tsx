import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Mock API calls for institutions/companies
const mockGetInstitutions = async () => [
  { id: 1, name: 'National Institute of Technology' },
  { id: 2, name: 'Indian Institute of Technology' }
];

const mockGetCompanies = async () => [
  { id: 1, name: 'TechCorp Solutions' },
  { id: 2, name: 'Innovate AI' }
];

// Mock API for onboarding status check
const mockCheckOnboardingStatus = async (userRole?: string) => {
  const r = (userRole || '').toLowerCase();
  const route = r === 'industry' ? '/industry' : r === 'academician' ? '/academician' : r === 'institution' ? '/institution' : r === 'alumni' ? '/alumni' : (r === 'admin' || r === 'super_admin') ? '/admin' : '/student';
  return { complete: true, dashboard_route: route };
};

export function Onboarding() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [institution, setInstitution] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [company, setCompany] = useState('');
  const [recruiterTitle, setRecruiterTitle] = useState('');
  
  // Data options
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        const userRole = (user.user_metadata?.role || '').toLowerCase();
        setRole(userRole);

        if (userRole === 'student' || userRole === 'academician' || userRole === 'alumni') {
          const insts = await mockGetInstitutions();
          setInstitutions(insts);
        }
        
        if (userRole === 'industry') {
          const comps = await mockGetCompanies();
          setCompanies(comps);
        }

      } catch (err: any) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Here we would call the specific backend onboarding endpoint
      // e.g., POST /auth/onboarding/student
      
      // After submission, check status
      const status = await mockCheckOnboardingStatus(role || undefined);
      if (status.complete) {
        navigate(status.dashboard_route);
      } else {
        throw new Error('Onboarding incomplete');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-hairline rounded-sm shadow-sm p-8 space-y-8">
        
        <div className="flex flex-col items-center gap-2">
           <ShieldCheck className="h-7 w-7 text-ink mb-2" />
          <h1 className="text-xl font-medium text-ink">Complete your profile</h1>
          <p className="text-sm text-slate">You're registering as an {role}</p>
        </div>

        {error && (
          <div className="bg-alert-rust/10 border border-alert-rust/20 text-alert-rust p-3 rounded-sm text-sm flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dynamic fields based on role */}
          {role === 'student' && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink">Institution</label>
                <select 
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                >
                  <option value="">Select your institution...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink">Target Career Role</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Frontend Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>
            </>
          )}

          {role === 'industry' && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink">Company</label>
                <select 
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                >
                  <option value="">Select or create company...</option>
                  {companies.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink">Job Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Technical Recruiter"
                  value={recruiterTitle}
                  onChange={(e) => setRecruiterTitle(e.target.value)}
                  className="w-full border border-hairline rounded-sm px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>
            </>
          )}

          {/* Fallback for roles that are not fully detailed here */}
          {(role !== 'student' && role !== 'industry') && (
            <div className="bg-slate/5 p-4 border border-hairline rounded-sm text-sm text-slate">
              Please provide the required details for the {role} onboarding flow.
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-ink text-paper py-2 rounded-sm font-medium hover:bg-ink/90 transition-colors shadow-sm disabled:opacity-70"
          >
            {submitting ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
}
