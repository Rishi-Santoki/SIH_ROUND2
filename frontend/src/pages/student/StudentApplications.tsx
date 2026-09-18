import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileSignature, XCircle, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';

const MOCK_APPS = [
  {
    id: 'app1',
    role: 'Frontend Developer',
    company: 'Fintech Solutions',
    status: 'interview',
    appliedDate: 'Oct 10, 2023',
    recruiterNote: 'Strong portfolio. Schedule technical round for next week.'
  },
  {
    id: 'app2',
    role: 'Backend Intern',
    company: 'Startup Inc',
    status: 'rejected',
    appliedDate: 'Sep 25, 2023',
    recruiterNote: 'Looking for more experience in system design.',
    frozenScore: 60,
    weakestLink: 'System Design'
  }
];

const STAGES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];

export function StudentApplications() {
  const { data: apiApps, isLoading } = useQuery<any[]>({
    queryKey: ['student', 'applications'],
    queryFn: () => apiClient<any[]>('/student/applications'),
    retry: 1,
  });

  // Merge real applications with mock fallback if empty
  const displayedApps = (Array.isArray(apiApps) && apiApps.length > 0)
    ? apiApps.map((a: any) => ({
        id: a.application_id || a.id,
        role: a.opportunities?.title || 'Data Analyst',
        company: a.opportunities?.company_name || a.opportunities?.company || 'Industry Partner',
        status: a.status || 'applied',
        appliedDate: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Just now',
        recruiterNote: a.recruiter_notes || 'Application received via ProofLedger.',
        frozenScore: a.match_score,
        weakestLink: a.match_score_breakdown ? Object.keys(a.match_score_breakdown)[0] : undefined
      }))
    : MOCK_APPS;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Applications</h1>
        <p className="text-sm text-slate mt-1">Track your progress and learn from outcomes.</p>
      </div>

      <div className="space-y-4">
        {displayedApps.map((app: any) => {
          const currentIndex = STAGES.indexOf(app.status);
          const isRejected = app.status === 'rejected';

          return (
            <div key={app.id} className="bg-white border border-hairline rounded-sm shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-ink text-lg">{app.role}</h3>
                  <p className="text-sm text-slate">{app.company} • Applied on {app.appliedDate}</p>
                </div>
                {isRejected ? (
                  <div className="bg-alert-rust/10 text-alert-rust px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Rejected
                  </div>
                ) : (
                  <div className="bg-growth-teal/10 text-growth-teal px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-4 w-4" /> In Progress
                  </div>
                )}
              </div>

              {/* Status Tracker */}
              <div className="relative mb-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate/10 -translate-y-1/2 rounded-full" />
                <div 
                  className={cn("absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all", isRejected ? "bg-alert-rust" : "bg-growth-teal")}
                  style={{ width: `${(currentIndex / (STAGES.length - 2)) * 100}%` }}
                />
                
                <div className="relative flex justify-between">
                  {STAGES.slice(0, 4).map((stage, idx) => {
                    const isCompleted = idx <= currentIndex && !isRejected;
                    const isCurrent = idx === currentIndex && !isRejected;
                    const wasReachedBeforeRejection = isRejected && idx <= (currentIndex > 0 ? currentIndex - 1 : 0);

                    let statusColor = "bg-white border-slate/20 text-slate/20"; // pending
                    if (isCompleted || wasReachedBeforeRejection) statusColor = "bg-growth-teal border-growth-teal text-white"; // done
                    if (isCurrent) statusColor = "bg-white border-growth-teal text-growth-teal ring-4 ring-growth-teal/10"; // active

                    // If rejected, the last reached step or a specific rejection node
                    if (isRejected && idx === (currentIndex > 0 ? currentIndex : 0)) {
                       statusColor = "bg-alert-rust border-alert-rust text-white";
                    }

                    return (
                      <div key={stage} className="flex flex-col items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10", statusColor)}>
                          {(isCompleted || wasReachedBeforeRejection) && <CheckCircle2 className="h-3 w-3" />}
                          {isRejected && idx === (currentIndex > 0 ? currentIndex : 0) && <XCircle className="h-3 w-3" />}
                        </div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", (isCompleted || isCurrent || wasReachedBeforeRejection) ? "text-ink" : "text-slate")}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recruiter Note & Feedback Loop */}
              <div className="bg-paper p-4 rounded-sm border border-hairline space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Recruiter Note</h4>
                  <p className="text-sm font-medium text-ink italic">"{app.recruiterNote}"</p>
                </div>

                {isRejected && (
                  <div className="border-t border-hairline pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate">Your frozen match score was <span className="font-bold text-ink">{app.frozenScore}%</span>.</p>
                      <p className="text-sm text-slate">The weakest area was <span className="font-bold text-ink">{app.weakestLink}</span>.</p>
                    </div>
                    <Link 
                      to={`/student/roadmap?skill=${app.weakestLink}`}
                      className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
                    >
                      Close this gap <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
