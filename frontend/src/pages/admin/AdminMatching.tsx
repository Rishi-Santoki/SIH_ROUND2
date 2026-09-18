import React from 'react';
import { Scale, ArrowRight, Check, X, FileText, Database, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface WeightProposal {
  proposal_id: string;
  proposed_weights: Record<string, number>;
  based_on_sample_size?: number;
  rationale?: string;
  status: string;
  notes?: string;
  created_at?: string;
}

export function AdminMatching() {
  const { data: proposals = [], isLoading, isError, refetch } = useQuery<WeightProposal[]>({
    queryKey: ['admin-weight-proposals'],
    queryFn: async () => {
      return await apiClient.get<WeightProposal[]>('/admin/matching/weight-proposals');
    }
  });

  const approveMutation = useApiMutation(
    async (proposalId: string) => {
      return await apiClient.patch(`/admin/matching/weight-proposals/${proposalId}/approve`);
    },
    {
      successMessage: 'Weight proposal approved and applied to platform match engine!',
      invalidateQueries: [['admin-weight-proposals'], ['admin-settings']],
    }
  );

  const rejectMutation = useApiMutation(
    async ({ proposalId, notes }: { proposalId: string; notes: string }) => {
      return await apiClient.patch(`/admin/matching/weight-proposals/${proposalId}/reject`, { notes });
    },
    {
      successMessage: 'Weight proposal rejected.',
      invalidateQueries: [['admin-weight-proposals']],
    }
  );

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    const notes = prompt('Enter rejection rationale for this weight adjustment:', 'Empirical sample size insufficient or inconsistent with policy.');
    if (!notes) return;
    rejectMutation.mutate({ proposalId: id, notes });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Matching Engine Configurations</h1>
        <p className="text-sm text-slate mt-1">Review and approve global match score weight adjustments.</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-white border border-hairline rounded-sm p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading matching weight proposals...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load weight proposals.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs font-bold bg-alert-rust text-white px-3 py-1.5 rounded-sm hover:bg-alert-rust/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white border border-hairline rounded-sm p-8 text-center text-slate shadow-sm">
            No weight adjustment proposals currently pending review.
          </div>
        ) : (
          proposals.map(proposal => {
            const isProcessing =
              (approveMutation.isPending && approveMutation.variables === proposal.proposal_id) ||
              (rejectMutation.isPending && rejectMutation.variables?.proposalId === proposal.proposal_id);

            const proposedWeights = proposal.proposed_weights || {};

            return (
              <div 
                key={proposal.proposal_id} 
                className={cn(
                  "bg-white border-2 rounded-sm shadow-sm overflow-hidden transition-all duration-300",
                  isProcessing ? "opacity-60 pointer-events-none" : "opacity-100",
                  proposal.status === 'approved' ? "border-growth-teal/40" :
                  proposal.status === 'rejected' ? "border-alert-rust/40" : "border-slate/10"
                )}
              >
                <div className="bg-slate/5 p-4 border-b border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-ink" />
                    <div>
                      <h3 className="font-bold text-ink">Weight Adjustment Proposal</h3>
                      <p className="text-xs text-slate">
                        ID: {proposal.proposal_id.slice(0, 8)} •{' '}
                        {proposal.created_at ? new Date(proposal.created_at).toLocaleString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                  {proposal.status === 'pending' ? (
                    <span className="bg-warning-gold/10 text-warning-gold px-3 py-1 rounded-sm text-xs font-bold border border-warning-gold/20">
                      Review Required
                    </span>
                  ) : (
                    <span className={cn(
                      "px-3 py-1 rounded-sm text-xs font-bold border uppercase",
                      proposal.status === 'approved' ? "bg-growth-teal/10 text-growth-teal border-growth-teal/20" : "bg-alert-rust/10 text-alert-rust border-alert-rust/20"
                    )}>
                      {proposal.status === 'approved' ? 'Approved & Applied' : 'Rejected'}
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-paper p-4 border border-hairline rounded-sm">
                    <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Rationale for Change
                    </h4>
                    <p className="text-sm text-ink mb-3">
                      {proposal.rationale || 'Optimization proposal generated from recent placement correlation signals.'}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-slate/10 px-3 py-1.5 rounded-sm text-xs font-bold text-slate">
                      <Database className="h-3 w-3" /> Sample Size: {(proposal.based_on_sample_size || 150).toLocaleString()} placements
                    </div>
                    {proposal.notes && (
                      <div className="mt-3 text-xs text-alert-rust font-medium italic">
                        Rejection notes: {proposal.notes}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Proposed Weights Distribution</h4>
                    <div className="bg-white border-2 border-warning-gold/30 rounded-sm p-4 space-y-3 shadow-sm">
                      {Object.entries(proposedWeights).map(([key, rawVal]) => {
                        const valPercent = typeof rawVal === 'number' && rawVal <= 1 ? Math.round(rawVal * 100) : Math.round(Number(rawVal) || 0);
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate font-bold uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                              <span className="font-bold text-ink">{valPercent}%</span>
                            </div>
                            <div className="w-full bg-slate/10 rounded-full h-2 overflow-hidden">
                              <div className="h-2 rounded-full bg-growth-teal" style={{ width: `${valPercent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {proposal.status === 'pending' && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                      <button 
                        onClick={() => handleReject(proposal.proposal_id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        className="bg-white border border-alert-rust/30 text-alert-rust px-6 py-2 rounded-sm text-sm font-bold hover:bg-alert-rust/10 transition-colors flex items-center gap-2"
                      >
                        <X className="h-4 w-4" /> Reject Proposal
                      </button>
                      <button 
                        onClick={() => handleApprove(proposal.proposal_id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2"
                      >
                        {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Approve & Apply Global Update
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
