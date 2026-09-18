import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Calendar, Clock, Plus, Star, CheckCircle2, AlertCircle, Loader2, X, MessageSquare } from 'lucide-react';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface MilestoneTracking {
  tracking_id: string;
  application_id: string;
  milestone: string;
  status: 'not_started' | 'in_progress' | 'completed';
  mentor_rating?: number;
  mentor_feedback?: string;
  created_at?: string;
}

interface InternApplication {
  application_id: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  opportunity_title: string;
  university?: string;
  department?: string;
  match_score?: number;
  submitted_at?: string;
  internship_tracking?: MilestoneTracking[];
}

export function IndustryInterns() {
  const [addMilestoneModal, setAddMilestoneModal] = useState<{ applicationId: string; studentName: string } | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');

  const [evalModal, setEvalModal] = useState<{
    applicationId: string;
    trackingId: string;
    milestoneName: string;
    studentName: string;
  } | null>(null);
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalStatus, setEvalStatus] = useState<'completed' | 'in_progress'>('completed');
  const [evalFeedback, setEvalFeedback] = useState('');

  // 1. Fetch real active interns (selected applications)
  const { data: interns = [], isLoading, error, refetch } = useQuery({
    queryKey: ['industry', 'interns'],
    queryFn: async () => {
      const res = await apiClient.get<InternApplication[]>('/industry/interns');
      return Array.isArray(res) ? res : [];
    }
  });

  // 2. Add milestone mutation
  const addMilestoneMutation = useApiMutation({
    mutationFn: async ({ applicationId, milestone }: { applicationId: string; milestone: string }) => {
      return await apiClient.post(`/industry/interns/${applicationId}/milestones`, { milestone });
    },
    successMessage: 'Milestone created successfully.',
    invalidateQueries: [['industry', 'interns']]
  });

  // 3. Eval / update milestone mutation
  const evalMilestoneMutation = useApiMutation({
    mutationFn: async ({
      applicationId,
      trackingId,
      status,
      mentor_rating,
      mentor_feedback
    }: {
      applicationId: string;
      trackingId: string;
      status: string;
      mentor_rating: number;
      mentor_feedback: string;
    }) => {
      return await apiClient.patch(`/industry/interns/${applicationId}/milestones/${trackingId}`, {
        status,
        mentor_rating,
        mentor_feedback
      });
    },
    successMessage: 'Mentor evaluation and feedback saved.',
    invalidateQueries: [['industry', 'interns']]
  });

  const handleAddMilestone = async () => {
    if (!addMilestoneModal || !milestoneTitle.trim()) return;
    try {
      await addMilestoneMutation.mutateAsync({
        applicationId: addMilestoneModal.applicationId,
        milestone: milestoneTitle.trim()
      });
      setAddMilestoneModal(null);
      setMilestoneTitle('');
      refetch();
    } catch {
      // Error handled by useApiMutation
    }
  };

  const handleSaveEval = async () => {
    if (!evalModal || !evalFeedback.trim()) return;
    try {
      await evalMilestoneMutation.mutateAsync({
        applicationId: evalModal.applicationId,
        trackingId: evalModal.trackingId,
        status: evalStatus,
        mentor_rating: Number(evalRating),
        mentor_feedback: evalFeedback.trim()
      });
      setEvalModal(null);
      setEvalFeedback('');
      refetch();
    } catch {
      // Error handled by useApiMutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Active Interns & Milestones</h1>
          <p className="text-sm text-slate mt-1">Manage current placements, set milestones, and record mentor evaluations.</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-ink/40" />
        </div>
      )}

      {error && (
        <div className="bg-alert-rust/10 border border-alert-rust/20 text-alert-rust p-4 rounded-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">Failed to load interns: {(error as any)?.message || 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && interns.length === 0 && (
        <div className="text-center p-12 bg-white border border-hairline border-dashed rounded-sm">
          <GraduationCap className="h-8 w-8 text-slate/40 mx-auto mb-2" />
          <h3 className="font-bold text-ink text-base">No active interns yet</h3>
          <p className="text-sm text-slate mt-1 max-w-md mx-auto">
            Candidates who are moved to the <strong>Selected</strong> stage in your Pipeline will automatically appear here as active interns.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interns.map(intern => {
          const milestones = intern.internship_tracking || [];
          const score = Math.round(intern.match_score || 85);

          return (
            <div key={intern.application_id} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center font-serif font-bold text-ink text-xl">
                        {intern.student_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-ink">{intern.student_name}</h3>
                        <p className="text-sm text-slate">{intern.opportunity_title}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-growth-teal/10 text-growth-teal">
                      active intern
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate">
                      <GraduationCap className="h-4 w-4" /> {intern.university || 'Affiliated Institution'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate">
                      <Calendar className="h-4 w-4" /> Enrolled: {intern.submitted_at ? new Date(intern.submitted_at).toLocaleDateString() : 'Current Term'}
                    </div>
                  </div>

                  {/* Milestones list */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate uppercase tracking-wider">Milestones & Evaluations</span>
                      <button
                        onClick={() => {
                          setAddMilestoneModal({
                            applicationId: intern.application_id,
                            studentName: intern.student_name
                          });
                          setMilestoneTitle('');
                        }}
                        className="text-xs font-bold text-growth-teal hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Milestone
                      </button>
                    </div>

                    {milestones.length === 0 ? (
                      <div className="text-xs text-slate/70 bg-paper p-3 rounded-sm border border-hairline border-dashed">
                        No milestones added yet. Click "+ Add Milestone" to assign goals.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {milestones.map(m => (
                          <div key={m.tracking_id} className="p-3 bg-paper rounded-sm border border-hairline text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-ink">{m.milestone}</span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase",
                                m.status === 'completed' ? "bg-growth-teal/10 text-growth-teal" :
                                m.status === 'in_progress' ? "bg-amber-100 text-amber-800" :
                                "bg-slate/10 text-slate"
                              )}>
                                {m.status.replace('_', ' ')}
                              </span>
                            </div>

                            {m.mentor_feedback && (
                              <p className="text-slate italic mt-1 bg-white p-2 rounded-sm border border-hairline">
                                "{m.mentor_feedback}"
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline/60">
                              <div className="flex items-center gap-1 text-slate font-medium">
                                {m.mentor_rating ? (
                                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    {m.mentor_rating} / 5
                                  </span>
                                ) : (
                                  <span className="text-slate/60">Awaiting rating</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEvalModal({
                                    applicationId: intern.application_id,
                                    trackingId: m.tracking_id,
                                    milestoneName: m.milestone,
                                    studentName: intern.student_name
                                  });
                                  setEvalRating(m.mentor_rating || 5);
                                  setEvalStatus(m.status === 'completed' ? 'completed' : 'completed');
                                  setEvalFeedback(m.mentor_feedback || '');
                                }}
                                className="bg-white border border-hairline text-ink px-2 py-0.5 rounded-sm text-[11px] font-bold hover:bg-slate/5 transition-colors"
                              >
                                {m.mentor_rating ? 'Update Eval' : 'Complete Eval'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-paper p-4 rounded-sm border border-hairline mt-2">
                  <MatchScoreVisualizer 
                    score={score} 
                    breakdown={{ skill: Math.round(score * 0.4), evidence: Math.round(score * 0.3), projects: Math.round(score * 0.2), eligibility: Math.round(score * 0.1) }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {addMilestoneModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-md rounded-sm shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-white p-4 border-b border-hairline flex justify-between items-center">
              <h3 className="font-bold text-ink text-lg">Add Intern Milestone</h3>
              <button onClick={() => setAddMilestoneModal(null)} className="text-slate hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate">
                Assign a milestone or deliverable for <strong className="text-ink">{addMilestoneModal.studentName}</strong>.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Milestone Description *</label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. Complete Backend API Integration & Dockerization"
                  className="w-full bg-white border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                />
              </div>

              {addMilestoneMutation.isError && (
                <div className="p-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm text-alert-rust text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{(addMilestoneMutation.error as any)?.message || 'Failed to add milestone.'}</span>
                </div>
              )}
            </div>
            <div className="bg-white p-4 border-t border-hairline flex justify-end gap-4">
              <button 
                onClick={() => setAddMilestoneModal(null)}
                disabled={addMilestoneMutation.isPending}
                className="text-sm font-medium text-slate hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={!milestoneTitle.trim() || addMilestoneMutation.isPending}
                className="bg-ink text-paper px-5 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {addMilestoneMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Eval Modal */}
      {evalModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-md rounded-sm shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-white p-4 border-b border-hairline flex justify-between items-center">
              <h3 className="font-bold text-ink text-lg">Mentor Evaluation</h3>
              <button onClick={() => setEvalModal(null)} className="text-slate hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate">
                  Evaluating <strong className="text-ink">{evalModal.studentName}</strong> for milestone:
                </p>
                <p className="text-sm font-bold text-ink mt-1 bg-slate/5 p-2 rounded-sm border border-hairline">
                  {evalModal.milestoneName}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Completion Status</label>
                <select
                  value={evalStatus}
                  onChange={(e: any) => setEvalStatus(e.target.value)}
                  className="w-full bg-white border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Mentor Rating (1 - 5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvalRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6",
                          evalRating >= star ? "fill-amber-500 text-amber-500" : "text-slate/30"
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-ink ml-2">{evalRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Mentor Feedback *</label>
                <textarea
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="Provide structured feedback on code quality, autonomy, communication, and milestone output..."
                  className="w-full bg-white border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-24 resize-none"
                />
              </div>

              {evalMilestoneMutation.isError && (
                <div className="p-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm text-alert-rust text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{(evalMilestoneMutation.error as any)?.message || 'Failed to save evaluation.'}</span>
                </div>
              )}
            </div>
            <div className="bg-white p-4 border-t border-hairline flex justify-end gap-4">
              <button 
                onClick={() => setEvalModal(null)}
                disabled={evalMilestoneMutation.isPending}
                className="text-sm font-medium text-slate hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEval}
                disabled={!evalFeedback.trim() || evalMilestoneMutation.isPending}
                className="bg-ink text-paper px-5 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {evalMilestoneMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
