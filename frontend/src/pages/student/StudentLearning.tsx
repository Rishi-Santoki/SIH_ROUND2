import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, ShieldAlert, Check, Plus, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

export function StudentLearning() {
  const [showInterstitial, setShowInterstitial] = useState<string | null>(null);

  // 1. Fetch Enrolled Learning Progress
  const { data: enrolledList = [], isLoading: isLoadingEnrolled } = useQuery({
    queryKey: ['student', 'learning-progress'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/learning-progress');
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch Available Learning Programs
  const { data: availablePrograms = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['student', 'learning-progress', 'available'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/learning-progress/available');
      } catch {
        return [];
      }
    }
  });

  // 3. Mutation to Enroll in a program
  const enrollMutation = useApiMutation({
    mutationFn: async (programId: string) => {
      return await apiClient.post(`/student/learning-progress?program_id=${programId}`);
    },
    invalidateQueries: [['student', 'learning-progress']],
    successMessage: 'Enrolled in learning program!'
  });

  // 4. Mutation to Update Progress
  const updateProgressMutation = useApiMutation({
    mutationFn: async ({ progressId, progress, status }: { progressId: string; progress: number; status: string }) => {
      return await apiClient.patch(`/student/learning-progress/${progressId}`, {
        progress_percentage: progress,
        status
      });
    },
    invalidateQueries: [['student', 'learning-progress']],
    onSuccess: (data, vars) => {
      if (vars.status === 'completed' || vars.progress >= 100) {
        setShowInterstitial('Course Competencies');
      }
    }
  });

  const enrolledProgramIds = new Set(enrolledList.map(e => e.program_id));

  const handleAdvanceProgress = (progressId: string, currentPct: number) => {
    const nextPct = Math.min(100, currentPct + 25);
    const nextStatus = nextPct >= 100 ? 'completed' : 'in_progress';
    updateProgressMutation.mutate({
      progressId,
      progress: nextPct,
      status: nextStatus
    });
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Learning Resources</h1>
        <p className="text-sm text-slate mt-1">Targeted programs to close your specific skill gaps and prepare for verified assessments.</p>
      </div>

      {/* Enrolled Courses Section */}
      <div>
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">My Active Learning</h3>
        
        {isLoadingEnrolled ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline rounded-sm">
            Loading enrolled courses...
          </div>
        ) : enrolledList.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline border-dashed rounded-sm">
            You are not currently enrolled in any learning programs. Browse available courses below to enroll!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledList.map((item: any) => {
              const prog = item.learning_programs || {};
              const progress = item.progress_percentage ?? 0;
              const isCompleted = item.status === 'completed' || progress >= 100;
              const title = prog.title || 'Personalized Study Module';

              return (
                <div key={item.progress_id} className="bg-white border border-hairline rounded-sm p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-ink text-lg">{title}</h3>
                        <p className="text-sm text-slate">{prog.duration || 'Self-paced'}</p>
                      </div>
                      <div className="bg-slate/5 p-2 rounded-sm border border-hairline flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Status</span>
                        <span className={cn("text-xs font-medium capitalize", isCompleted ? "text-growth-teal" : "text-ink")}>
                          {item.status?.replace('_', ' ') || 'In Progress'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate">Progress</span>
                        <span className={isCompleted ? "text-growth-teal" : "text-ink"}>{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate/10 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", isCompleted ? "bg-growth-teal" : "bg-ink")}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-hairline">
                    {!isCompleted ? (
                      <button
                        type="button"
                        disabled={updateProgressMutation.isPending}
                        onClick={() => handleAdvanceProgress(item.progress_id, progress)}
                        className="text-xs text-ink font-medium hover:underline flex items-center gap-1"
                      >
                        +25% Progress
                      </button>
                    ) : (
                      <span className="text-xs text-growth-teal font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Ready for Re-assessment
                      </span>
                    )}

                    <div>
                      {isCompleted ? (
                        <button 
                          onClick={() => setShowInterstitial(title)}
                          className="bg-paper border border-hairline text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate/5 transition-colors"
                        >
                          View Next Steps
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAdvanceProgress(item.progress_id, progress)}
                          disabled={updateProgressMutation.isPending}
                          className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {updateProgressMutation.isPending ? 'Updating...' : 'Continue Learning'}
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Programs Section */}
      <div>
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4 mt-8">Explore Learning Programs</h3>
        
        {isLoadingAvailable ? (
          <div className="p-8 text-center text-sm text-slate bg-white border border-hairline rounded-sm">
            Loading catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availablePrograms.map((prog: any) => {
              const isEnrolled = enrolledProgramIds.has(prog.program_id);
              return (
                <div key={prog.program_id} className="bg-white border border-hairline rounded-sm p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-ink text-lg">{prog.title}</h4>
                      <span className="text-xs font-bold bg-slate/10 px-2 py-0.5 rounded-sm text-slate">
                        {prog.duration || '4 weeks'}
                      </span>
                    </div>
                    {prog.description && (
                      <p className="text-sm text-slate mt-2 line-clamp-2">{prog.description}</p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    {isEnrolled ? (
                      <span className="text-xs text-growth-teal font-bold bg-growth-teal/10 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" /> Enrolled
                      </span>
                    ) : (
                      <button
                        onClick={() => enrollMutation.mutate(prog.program_id)}
                        disabled={enrollMutation.isPending}
                        className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Course'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closed-loop Interstitial */}
      {showInterstitial && (
        <>
          <div className="fixed inset-0 bg-ink/20 z-40 backdrop-blur-sm" onClick={() => setShowInterstitial(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-hairline rounded-sm shadow-xl z-50 p-6 animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-growth-teal/10 flex items-center justify-center mb-4 text-growth-teal">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-ink mb-2">Nice work completing the course.</h3>
            <p className="text-sm text-slate mb-6 leading-relaxed">
              To officially count this toward your <span className="font-bold text-ink">{showInterstitial}</span> skill profile and close the gap, you need to pass a quick re-assessment. We verify knowledge, not just participation.
            </p>
            <div className="flex flex-col gap-3">
              <Link 
                to="/student/assessments" 
                className="bg-ink text-paper text-center px-4 py-2.5 rounded-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Take Re-assessment Now
              </Link>
              <button 
                onClick={() => setShowInterstitial(null)}
                className="text-slate text-sm font-medium hover:text-ink transition-colors py-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
