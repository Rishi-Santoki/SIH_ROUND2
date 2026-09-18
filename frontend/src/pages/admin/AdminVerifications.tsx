import React, { useState } from 'react';
import { ShieldCheck, X, Check, Search, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

export function AdminVerifications() {
  const [activeTab, setActiveTab] = useState('company');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading, isError, refetch } = useQuery<any[]>({
    queryKey: ['admin-verifications', activeTab],
    queryFn: async () => {
      return await apiClient.get<any[]>(`/admin/verifications?entity_type=${activeTab}`);
    }
  });

  const approveMutation = useApiMutation(
    async (requestId: string) => {
      return await apiClient.patch(`/admin/verifications/${requestId}/approve`);
    },
    {
      successMessage: 'Entity verification approved and trust flag flipped.',
      invalidateQueries: [['admin-verifications', activeTab]],
    }
  );

  const rejectMutation = useApiMutation(
    async ({ requestId, notes }: { requestId: string; notes: string }) => {
      return await apiClient.patch(`/admin/verifications/${requestId}/reject`, { notes });
    },
    {
      successMessage: 'Verification request rejected.',
      invalidateQueries: [['admin-verifications', activeTab]],
    }
  );

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(
      { requestId: id, notes: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectReason('');
        }
      }
    );
  };

  const getItemName = (item: any) => {
    if (activeTab === 'company') return item.entity_details?.name || 'Company Profile';
    if (activeTab === 'institution') return item.entity_details?.name || 'Academic Institution';
    if (activeTab === 'alumni') return item.alumni_profile?.users?.full_name || 'Alumni Member';
    if (activeTab === 'certification') return item.entity_details?.name || 'Student Certification';
    if (activeTab === 'project') return item.entity_details?.title || 'Student Project';
    return item.entity_id;
  };

  const getItemContext = (item: any) => {
    if (item.notes) return item.notes;
    if (item.entity_details?.cin) return `CIN: ${item.entity_details.cin}`;
    if (item.entity_details?.code) return `Institution Code: ${item.entity_details.code}`;
    if (item.alumni_profile) {
      return `${item.alumni_profile.degree || ''} ${item.alumni_profile.department || ''} (Grad: ${item.alumni_profile.graduation_year || 'N/A'}) - ${item.alumni_profile.current_company || 'Independent'}`;
    }
    return 'Verification documents submitted for admin audit.';
  };

  const getItemDocUrl = (item: any) => {
    return item.signed_url || item.entity_details?.credential_url || item.entity_details?.github_repo_url || null;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Verification Queue</h1>
        <p className="text-sm text-slate mt-1">Review and process Trust Layer entity verifications.</p>
      </div>

      <div className="flex border-b border-hairline mb-6 overflow-x-auto">
        {['company', 'institution', 'alumni', 'certification', 'project'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setRejectingId(null);
              setRejectReason('');
            }}
            className={cn(
              "px-6 py-3 font-bold text-sm transition-colors relative capitalize whitespace-nowrap",
              activeTab === tab ? "text-ink" : "text-slate hover:text-ink"
            )}
          >
            {tab}s
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 border border-hairline rounded-sm text-center shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading pending {activeTab} verifications...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load verification queue.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs font-bold bg-alert-rust text-white px-3 py-1.5 rounded-sm hover:bg-alert-rust/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white p-8 border border-hairline rounded-sm text-center text-slate shadow-sm">
            No pending verifications for {activeTab}s. All current items have been processed.
          </div>
        ) : (
          queue.map((item) => {
            const docUrl = getItemDocUrl(item);
            const isProcessing =
              (approveMutation.isPending && approveMutation.variables === item.request_id) ||
              (rejectMutation.isPending && rejectMutation.variables?.requestId === item.request_id);

            return (
              <div 
                key={item.request_id} 
                className={cn(
                  "bg-white border rounded-sm p-5 shadow-sm transition-all duration-300",
                  isProcessing ? "opacity-60 pointer-events-none" : "opacity-100",
                  item.status === 'approved' ? "border-growth-teal/50 bg-growth-teal/5" : 
                  item.status === 'rejected' ? "border-alert-rust/50 bg-alert-rust/5" : "border-hairline"
                )}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-ink text-lg">{getItemName(item)}</h3>
                      {item.status === 'approved' && (
                        <span className="bg-growth-teal text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="bg-alert-rust text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                          Rejected
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="bg-warning-gold/10 text-warning-gold border border-warning-gold/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                          Pending Audit
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate mb-4">
                      <div>
                        <span className="font-bold">Submitted By:</span>{' '}
                        {item.submitter?.full_name ? `${item.submitter.full_name} (${item.submitter.email})` : item.submitted_by || 'System / Direct'}
                      </div>
                      <div>
                        <span className="font-bold">Date:</span>{' '}
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <span className="font-bold">Context:</span> {getItemContext(item)}
                      </div>
                    </div>
                    
                    {docUrl && (
                      <a 
                        href={docUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-ink flex items-center gap-1 hover:underline inline-flex"
                      >
                        View Attached Documents / Repository <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {item.status === 'pending' && (
                    <div className="shrink-0 w-full md:w-72">
                      {rejectingId === item.request_id ? (
                        <div className="space-y-3 bg-slate/5 p-3 rounded-sm border border-slate/10">
                          <label className="text-xs font-bold text-slate uppercase tracking-wider block">Rejection Reason</label>
                          <textarea 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explain why this verification was rejected..."
                            className="w-full bg-white border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-alert-rust h-20 resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleReject(item.request_id)}
                              disabled={!rejectReason.trim() || rejectMutation.isPending}
                              className="flex-1 bg-alert-rust text-white py-1.5 rounded-sm text-sm font-bold hover:bg-alert-rust/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                            >
                              {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                              Confirm Reject
                            </button>
                            <button 
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              disabled={rejectMutation.isPending}
                              className="bg-white border border-hairline text-slate px-3 rounded-sm hover:bg-slate/5 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleApprove(item.request_id)}
                            disabled={approveMutation.isPending}
                            className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                          >
                            {approveMutation.isPending && approveMutation.variables === item.request_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Approve
                          </button>
                          <button 
                            onClick={() => {
                              setRejectingId(item.request_id);
                              setRejectReason('');
                            }}
                            disabled={approveMutation.isPending}
                            className="w-full bg-white border border-alert-rust/30 text-alert-rust py-2 rounded-sm text-sm font-bold hover:bg-alert-rust/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      )}
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
