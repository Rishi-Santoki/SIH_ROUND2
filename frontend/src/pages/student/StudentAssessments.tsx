import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileBadge, ArrowRight, PlayCircle, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';

export function StudentAssessments() {
  // 1. Fetch available assessments
  const { data: availableAssessments = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['student', 'assessments', 'available'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/assessments/available');
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch past assessment results
  const { data: pastResults = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['student', 'assessments', 'results'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/assessments/results');
      } catch {
        return [];
      }
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Assessments</h1>
        <p className="text-sm text-slate mt-1">Verify your self-declared skills and close your skill gaps.</p>
      </div>

      {/* Available to Take */}
      <div>
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Available to Take</h3>
        
        {isLoadingAvailable ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline rounded-sm">
            Loading assessments...
          </div>
        ) : availableAssessments.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline border-dashed rounded-sm">
            No active assessments available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableAssessments.map((a: any) => {
              const id = a.assessment_id || a.id;
              return (
                <div key={id} className="bg-white border border-hairline p-5 rounded-sm shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-ink text-lg">{a.title}</h4>
                      <div className="bg-slate/10 px-2 py-1 rounded-sm flex items-center gap-1">
                        <FileBadge className="h-3 w-3 text-slate" />
                      </div>
                    </div>
                    <div className="text-sm text-slate mt-2 flex gap-4">
                      <span>{a.assessment_type || 'Skill Verification'}</span>
                      <span>•</span>
                      <span>{a.duration_minutes || 30} mins</span>
                      <span>•</span>
                      <span>{a.total_marks || 100} Marks</span>
                    </div>
                    {a.description && (
                      <p className="text-xs text-slate mt-2 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <div className="mt-6">
                    <Link 
                      to={`/student/assessments/${id}/take`}
                      className="flex items-center justify-center gap-2 w-full bg-ink text-paper py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
                    >
                      <PlayCircle className="h-4 w-4" /> Start Assessment
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Results */}
      <div>
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4 mt-8">Past Results</h3>
        
        {isLoadingResults ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline rounded-sm">
            Loading past results...
          </div>
        ) : pastResults.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline border-dashed rounded-sm">
            You haven't completed any assessments yet. Take an assessment above to earn verified skill proof!
          </div>
        ) : (
          <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden divide-y divide-hairline">
            {pastResults.map((r: any) => {
              const score = Math.round(r.percentage ?? (r.score ?? 0));
              const title = r.assessments?.title || 'Assessment';
              const dateStr = r.completed_at ? new Date(r.completed_at).toLocaleDateString() : 'Completed';
              return (
                <div key={r.result_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate/5 transition-colors">
                  <div>
                    <h4 className="font-bold text-ink">{title}</h4>
                    <p className="text-sm text-slate mt-1">{dateStr} • Attempt #{r.attempt_number || 1}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 sm:w-1/2 justify-end">
                    <div className="text-right w-24">
                      <p className="text-xs font-bold text-slate uppercase tracking-wider mb-1">Score</p>
                      <span className={cn("text-lg font-bold", score >= 70 ? "text-growth-teal" : "text-alert-rust")}>
                        {score}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
