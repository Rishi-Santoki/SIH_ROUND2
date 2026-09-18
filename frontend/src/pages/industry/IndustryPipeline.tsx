import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, MoreVertical, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

type PipelineStatus = 'applied' | 'shortlisted' | 'interview' | 'selected' | 'rejected';

interface Candidate {
  id: string;
  name: string;
  role: string;
  status: PipelineStatus;
  score: number;
  email?: string;
}

const COLUMNS: { id: PipelineStatus; title: string }[] = [
  { id: 'applied', title: 'Applied' },
  { id: 'shortlisted', title: 'Shortlisted' },
  { id: 'interview', title: 'Interview' },
  { id: 'selected', title: 'Selected' },
  { id: 'rejected', title: 'Rejected' },
];

export function IndustryPipeline() {
  const [transitionModal, setTransitionModal] = useState<{ candidate: Candidate; newStatus: PipelineStatus } | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenuCandidateId, setSelectedMenuCandidateId] = useState<string | null>(null);

  // 1. Fetch real applications
  const { data: applications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['industry', 'applications'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/industry/applications');
      return Array.isArray(res) ? res : [];
    }
  });

  // Map API applications to Candidate model
  const candidates: Candidate[] = applications.map(app => ({
    id: app.application_id,
    name: app.student_name || 'Candidate',
    role: app.opportunity_title || 'Posting',
    status: (app.status as PipelineStatus) || 'applied',
    score: Math.round(app.match_score || 0),
    email: app.student_email
  }));

  // 2. Mutation for status update
  const statusMutation = useApiMutation({
    mutationFn: async ({ applicationId, status, note }: { applicationId: string; status: PipelineStatus; note: string }) => {
      const payload: Record<string, any> = { status };
      if (status === 'rejected') {
        payload.rejection_reason = note;
      } else {
        payload.recruiter_notes = note;
      }
      return await apiClient.patch(`/industry/applications/${applicationId}/status`, payload);
    },
    successMessage: 'Candidate pipeline status updated successfully.',
    invalidateQueries: [['industry', 'applications'], ['industry', 'interns']]
  });

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData('candidateId', candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: PipelineStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate && candidate.status !== newStatus) {
      setTransitionModal({ candidate, newStatus });
      setTransitionNote('');
    }
  };

  const openMoveModal = (candidate: Candidate, newStatus: PipelineStatus) => {
    setSelectedMenuCandidateId(null);
    if (candidate.status !== newStatus) {
      setTransitionModal({ candidate, newStatus });
      setTransitionNote('');
    }
  };

  const isNoteRequired = transitionModal?.newStatus === 'shortlisted' || 
                         transitionModal?.newStatus === 'interview' || 
                         transitionModal?.newStatus === 'rejected';

  const confirmTransition = async () => {
    if (!transitionModal) return;
    if (isNoteRequired && !transitionNote.trim()) return;

    try {
      await statusMutation.mutateAsync({
        applicationId: transitionModal.candidate.id,
        status: transitionModal.newStatus,
        note: transitionNote.trim()
      });
      setTransitionModal(null);
      setTransitionNote('');
      refetch();
    } catch {
      // Error handled by useApiMutation toast and displayed in modal
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Pipeline</h1>
          <p className="text-sm text-slate mt-1">Drag and drop candidates or use the action menu to manage stage progression.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-2 shadow-sm">
             <Search className="h-4 w-4 text-slate" />
             <input 
               type="text" 
               placeholder="Search..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-transparent text-sm focus:outline-none w-36" 
             />
           </div>
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
          <p className="text-sm">Failed to load candidate pipeline: {(error as any)?.message || 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colCandidates = filteredCandidates.filter(c => c.status === col.id);
            return (
              <div 
                key={col.id} 
                className="bg-slate/5 border border-hairline rounded-sm flex-1 min-w-[280px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="p-3 border-b border-hairline bg-white flex justify-between items-center rounded-t-sm shrink-0">
                  <h3 className="font-bold text-ink text-sm">{col.title}</h3>
                  <span className="bg-slate/10 text-slate px-2 py-0.5 rounded-sm text-xs font-bold">{colCandidates.length}</span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {colCandidates.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate/60 border border-dashed border-hairline rounded-sm">
                      No candidates in {col.title}
                    </div>
                  ) : (
                    colCandidates.map(c => (
                      <div 
                        key={c.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, c.id)}
                        className="bg-white border border-hairline p-4 rounded-sm shadow-sm cursor-grab active:cursor-grabbing hover:border-slate/30 transition-colors relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-ink text-sm">{c.name}</h4>
                            {c.email && <p className="text-[11px] text-slate/70">{c.email}</p>}
                          </div>
                          <div className="relative">
                            <button 
                              onClick={() => setSelectedMenuCandidateId(selectedMenuCandidateId === c.id ? null : c.id)}
                              className="text-slate hover:text-ink p-1 rounded-sm hover:bg-slate/10"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {selectedMenuCandidateId === c.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-hairline rounded-sm shadow-lg z-20 py-1 text-xs">
                                <div className="px-3 py-1 font-bold text-slate uppercase text-[10px] border-b border-hairline">
                                  Move candidate to:
                                </div>
                                {COLUMNS.filter(targetCol => targetCol.id !== c.status).map(targetCol => (
                                  <button
                                    key={targetCol.id}
                                    onClick={() => openMoveModal(c, targetCol.id)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate/10 text-ink font-medium"
                                  >
                                    {targetCol.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate mb-3 font-medium">{c.role}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-hairline">
                           <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Match Score</span>
                           <span className={cn(
                             "text-sm font-bold",
                             c.score >= 80 ? "text-growth-teal" : c.score >= 60 ? "text-amber-600" : "text-slate"
                           )}>
                             {c.score}%
                           </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transition Modal */}
      {transitionModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-md rounded-sm shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-white p-4 border-b border-hairline flex justify-between items-center">
              <h3 className="font-bold text-ink text-lg">Move Candidate</h3>
              <button onClick={() => setTransitionModal(null)} className="text-slate hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate mb-2">
                  Moving <strong className="text-ink">{transitionModal.candidate.name}</strong> to{' '}
                  <strong className="text-ink uppercase tracking-wider text-xs bg-slate/10 px-2 py-0.5 rounded-sm ml-1">
                    {transitionModal.newStatus}
                  </strong>
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
                  {transitionModal.newStatus === 'rejected' ? 'Required: Rejection Reason *' :
                   transitionModal.newStatus === 'shortlisted' || transitionModal.newStatus === 'interview' ? 'Required: Recruiter Notes *' :
                   'Recruiter Notes (Optional)'}
                </label>
                <textarea 
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder={
                    transitionModal.newStatus === 'rejected'
                      ? "Explain the rejection reason (required by compliance)..."
                      : "Explain why this candidate is being moved to this stage..."
                  }
                  className="w-full bg-white border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-24 resize-none"
                />
                {isNoteRequired && !transitionNote.trim() && (
                  <p className="text-xs text-alert-rust mt-1 font-medium">
                    {transitionModal.newStatus === 'rejected' ? 'Rejection reason cannot be empty.' : 'Recruiter notes cannot be empty for this stage.'}
                  </p>
                )}
              </div>

              {statusMutation.isError && (
                <div className="p-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm text-alert-rust text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{(statusMutation.error as any)?.message || 'Failed to update candidate status.'}</span>
                </div>
              )}
            </div>
            <div className="bg-white p-4 border-t border-hairline flex justify-end gap-4">
              <button 
                onClick={() => setTransitionModal(null)} 
                disabled={statusMutation.isPending}
                className="text-sm font-medium text-slate hover:text-ink"
              >
                Cancel
              </button>
              <button 
                onClick={confirmTransition}
                disabled={(isNoteRequired && !transitionNote.trim()) || statusMutation.isPending}
                className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
