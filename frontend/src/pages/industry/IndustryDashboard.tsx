import React, { useState } from 'react';
import { AlertCircle, Briefcase, Users, FileSignature, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function IndustryDashboard() {
  const [isVerified, setIsVerified] = useState(false); // Simulate unverified company by default for the demo

  return (
    <div className="space-y-6">
      {!isVerified && (
        <div className="w-full bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-alert-rust shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-alert-rust">Company Verification Required</h3>
              <p className="text-sm text-alert-rust mt-1">
                To maintain the integrity of the ProofLedger, you must verify your company identity before posting opportunities or searching candidates.
              </p>
            </div>
          </div>
          <Link 
            to="/industry/company"
            className="bg-alert-rust text-white px-4 py-2 rounded-sm text-sm font-bold whitespace-nowrap hover:bg-alert-rust/90 transition-colors"
          >
            Submit for verification
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Recruiter Dashboard</h1>
        <p className="text-sm text-slate mt-1">Manage your pipeline and verify candidate evidence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-hairline shadow-sm opacity-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Active Postings</span>
            <Briefcase className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">0</span>
        </div>
        
        <div className="bg-white p-5 rounded-sm border border-hairline shadow-sm opacity-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Total Applicants</span>
            <Users className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">0</span>
        </div>

        <div className="bg-white p-5 rounded-sm border border-hairline shadow-sm opacity-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Awaiting Review</span>
            <FileSignature className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">0</span>
        </div>

        <div className="bg-white p-5 rounded-sm border border-hairline shadow-sm opacity-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Upcoming Interviews</span>
            <Clock className="h-4 w-4 text-slate" />
          </div>
          <span className="text-2xl font-serif font-bold text-ink">0</span>
        </div>
      </div>
      
      {!isVerified && (
        <div className="text-center p-12 bg-white border border-hairline border-dashed rounded-sm mt-8">
           <p className="text-sm font-medium text-slate">Dashboard metrics will populate once your company is verified.</p>
        </div>
      )}

    </div>
  );
}
