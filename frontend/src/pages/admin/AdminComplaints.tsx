import React, { useState } from 'react';
import { Search, MessageSquareWarning, Eye, CheckCircle, Filter, Clock, Loader2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface ComplaintItem {
  complaint_id: string;
  category: string;
  description: string;
  status: string;
  against_entity_type?: string;
  against_entity_id?: string;
  created_at: string;
  raised_by_user?: { full_name: string; email: string };
  resolution_notes?: string;
}

export function AdminComplaints() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: complaints = [], isLoading, isError, refetch } = useQuery<ComplaintItem[]>({
    queryKey: ['admin-complaints'],
    queryFn: async () => {
      return await apiClient.get<ComplaintItem[]>('/admin/complaints');
    }
  });

  const statusMutation = useApiMutation(
    async ({ complaintId, status, resolutionNotes }: { complaintId: string; status: string; resolutionNotes: string }) => {
      return await apiClient.patch(`/admin/complaints/${complaintId}/status`, {
        status,
        resolution_notes: resolutionNotes
      });
    },
    {
      successMessage: 'Complaint status updated successfully.',
      invalidateQueries: [['admin-complaints']],
    }
  );

  const filtered = complaints.filter(c =>
    (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.raised_by_user?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.raised_by_user?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResolve = (complaintId: string) => {
    const notes = prompt('Enter resolution notes for this complaint:', 'Investigated and resolved by platform admin.');
    if (!notes) return;
    statusMutation.mutate({ complaintId, status: 'resolved', resolutionNotes: notes });
  };

  const handleDismiss = (complaintId: string) => {
    const notes = prompt('Enter reason for dismissing this complaint:', 'Reviewed and dismissed after administrative verification.');
    if (!notes) return;
    statusMutation.mutate({ complaintId, status: 'dismissed', resolutionNotes: notes });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <MessageSquareWarning className="h-6 w-6" /> Complaint Management
          </h1>
          <p className="text-sm text-slate mt-1">Review and resolve user-submitted complaints and incident reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Complaints</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{complaints.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Open</span>
          <div className="text-2xl font-serif font-bold text-alert-rust mt-1">
            {complaints.filter(c => c.status === 'open').length}
          </div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Investigating</span>
          <div className="text-2xl font-serif font-bold text-warning-gold mt-1">
            {complaints.filter(c => c.status === 'investigating' || c.status === 'in-progress').length}
          </div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Resolved / Dismissed</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">
            {complaints.filter(c => c.status === 'resolved' || c.status === 'dismissed').length}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search complaints by category, description, or submitter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading complaints...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load complaints.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs font-bold bg-alert-rust text-white px-3 py-1.5 rounded-sm hover:bg-alert-rust/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper border-b border-hairline">
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Category & Description</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Submitted By</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Against Entity</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm">
              {filtered.map((c) => {
                const isPending = statusMutation.isPending && statusMutation.variables?.complaintId === c.complaint_id;

                return (
                  <tr key={c.complaint_id} className="hover:bg-slate/5 transition-colors">
                    <td className="p-4 max-w-sm">
                      <div className="font-bold text-ink">{c.category}</div>
                      <div className="text-xs text-slate mt-0.5 line-clamp-2" title={c.description}>
                        {c.description}
                      </div>
                      {c.resolution_notes && (
                        <div className="text-[11px] text-growth-teal mt-1 font-medium italic">
                          Resolution: {c.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate text-xs">
                      {c.raised_by_user ? (
                        <>
                          <div className="font-bold text-ink">{c.raised_by_user.full_name}</div>
                          <div className="text-slate font-mono">{c.raised_by_user.email}</div>
                        </>
                      ) : (
                        'Direct / Platform User'
                      )}
                    </td>
                    <td className="p-4 text-slate text-xs capitalize">
                      {c.against_entity_type || 'System'}
                      {c.against_entity_id && (
                        <div className="font-mono text-[10px] text-slate/70">
                          {c.against_entity_id.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider uppercase",
                        c.status === 'open' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                        (c.status === 'investigating' || c.status === 'in-progress') ? "bg-warning-gold/10 text-warning-gold border border-warning-gold/20" :
                        "bg-growth-teal/10 text-growth-teal border border-growth-teal/20"
                      )}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-ink inline-block" />
                      ) : (
                        <div className="flex justify-end gap-2">
                          {c.status === 'open' && (
                            <>
                              <button 
                                onClick={() => handleResolve(c.complaint_id)}
                                className="p-1 text-growth-teal hover:bg-growth-teal/10 rounded transition-colors"
                                title="Resolve Complaint"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDismiss(c.complaint_id)}
                                className="p-1 text-slate hover:bg-slate/10 rounded transition-colors"
                                title="Dismiss Complaint"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {c.status !== 'open' && (
                            <span className="text-xs text-slate italic capitalize">{c.status}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
