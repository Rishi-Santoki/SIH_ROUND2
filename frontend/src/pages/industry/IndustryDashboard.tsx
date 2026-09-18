import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Briefcase, Users, FileSignature, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { cn } from '../../lib/utils';

export function IndustryDashboard() {
  // 1. Fetch company profile
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['industry', 'company'],
    queryFn: async () => {
      return await apiClient.get<any>('/industry/company');
    }
  });

  // 2. Fetch opportunities
  const { data: opportunities = [] } = useQuery({
    queryKey: ['industry', 'opportunities'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/industry/opportunities');
      return Array.isArray(res) ? res : [];
    }
  });

  // 3. Fetch applications
  const { data: applications = [] } = useQuery({
    queryKey: ['industry', 'applications'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/industry/applications');
      return Array.isArray(res) ? res : [];
    }
  });

  const isVerified = Boolean(company?.verified);

  const activePostingsCount = opportunities.filter(o => o.status === 'published').length;
  const totalApplicantsCount = applications.length;
  const awaitingReviewCount = applications.filter(a => a.status === 'applied').length;
  const upcomingInterviewsCount = applications.filter(a => a.status === 'interview').length;

  return (
    <div className="space-y-6">
      {!isVerified && !companyLoading && (
        <div className="w-full bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-alert-rust shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-alert-rust">Company Verification Required</h3>
              <p className="text-sm text-alert-rust mt-1">
                To maintain the integrity of the ProofLedger, your company identity must be verified before publishing postings or transitioning candidates.
              </p>
            </div>
          </div>
          <Link 
            to="/industry/company"
            className="bg-alert-rust text-white px-4 py-2 rounded-sm text-sm font-bold whitespace-nowrap hover:bg-alert-rust/90 transition-colors shrink-0"
          >
            Submit for verification
          </Link>
        </div>
      )}

      {isVerified && (
        <div className="w-full bg-growth-teal/10 border border-growth-teal/20 rounded-sm p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-growth-teal text-sm font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Verified Employer Account — Full Posting & Pipeline Privileges Active</span>
          </div>
          <Link to="/industry/opportunities" className="text-xs font-bold text-growth-teal hover:underline flex items-center gap-1">
            Manage Postings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Recruiter Dashboard</h1>
        <p className="text-sm text-slate mt-1">
          {company?.name ? `${company.name} — ` : ''}Manage your talent pipeline and verify candidate skills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn(
          "bg-white p-5 rounded-sm border border-hairline shadow-sm transition-opacity",
          !isVerified && "opacity-60"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Active Postings</span>
            <Briefcase className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">
            {isVerified ? activePostingsCount : 0}
          </span>
          <p className="text-[11px] text-slate/70 mt-1">{opportunities.length} total postings created</p>
        </div>
        
        <div className={cn(
          "bg-white p-5 rounded-sm border border-hairline shadow-sm transition-opacity",
          !isVerified && "opacity-60"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Total Applicants</span>
            <Users className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">
            {isVerified ? totalApplicantsCount : 0}
          </span>
          <p className="text-[11px] text-slate/70 mt-1">Across all openings</p>
        </div>

        <div className={cn(
          "bg-white p-5 rounded-sm border border-hairline shadow-sm transition-opacity",
          !isVerified && "opacity-60"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Awaiting Review</span>
            <FileSignature className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">
            {isVerified ? awaitingReviewCount : 0}
          </span>
          <p className="text-[11px] text-slate/70 mt-1">New applications in Applied stage</p>
        </div>

        <div className={cn(
          "bg-white p-5 rounded-sm border border-hairline shadow-sm transition-opacity",
          !isVerified && "opacity-60"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Upcoming Interviews</span>
            <Clock className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">
            {isVerified ? upcomingInterviewsCount : 0}
          </span>
          <p className="text-[11px] text-slate/70 mt-1">Candidates in Interview stage</p>
        </div>
      </div>
      
      {!isVerified && (
        <div className="text-center p-12 bg-white border border-hairline border-dashed rounded-sm mt-8">
           <AlertCircle className="h-8 w-8 text-alert-rust/60 mx-auto mb-2" />
           <h3 className="font-bold text-ink text-base">Account Verification Pending</h3>
           <p className="text-sm font-medium text-slate mt-1 max-w-md mx-auto">
             Full candidate pipelines and live metrics will activate once your company verification is submitted and approved.
           </p>
           <Link 
             to="/industry/company" 
             className="inline-block mt-4 text-xs font-bold text-alert-rust border border-alert-rust/30 px-4 py-2 rounded-sm hover:bg-alert-rust/10 transition-colors"
           >
             Go to Company Verification
           </Link>
        </div>
      )}

      {isVerified && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm">
            <h3 className="font-bold text-ink text-base mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                to="/industry/opportunities" 
                className="flex items-center justify-between p-3 rounded-sm border border-hairline hover:bg-slate/5 transition-colors text-sm font-medium text-ink"
              >
                <span>Create or Publish Opportunity</span>
                <ArrowRight className="h-4 w-4 text-slate" />
              </Link>
              <Link 
                to="/industry/pipeline" 
                className="flex items-center justify-between p-3 rounded-sm border border-hairline hover:bg-slate/5 transition-colors text-sm font-medium text-ink"
              >
                <span>Review Candidate Pipeline</span>
                <ArrowRight className="h-4 w-4 text-slate" />
              </Link>
              <Link 
                to="/industry/interns" 
                className="flex items-center justify-between p-3 rounded-sm border border-hairline hover:bg-slate/5 transition-colors text-sm font-medium text-ink"
              >
                <span>Manage Interns & Milestones</span>
                <ArrowRight className="h-4 w-4 text-slate" />
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-ink text-base mb-2">AI Recruiter Copilot</h3>
              <p className="text-sm text-slate mb-4">
                Use the Copilot in the navigation bar to find candidates with verified evidence, analyze skill gaps, and match requirements across the university talent pool.
              </p>
            </div>
            <div className="p-3 bg-paper rounded-sm border border-hairline text-xs text-slate">
              💡 Tip: Click the Copilot button in the top bar and ask: <em>"Find me candidates with verified Python and Machine Learning skills"</em>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
