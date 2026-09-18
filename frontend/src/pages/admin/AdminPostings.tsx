import React, { useState } from 'react';
import { Search, Layers, Eye, Trash2, Filter, CheckCircle, XCircle, Flag, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface OpportunityPosting {
  opportunity_id: string;
  title: string;
  opportunity_type?: string;
  type?: string;
  location?: string;
  status: string;
  created_at: string;
  companies?: { name: string };
  company?: string;
  applicants_count?: number;
}

export function AdminPostings() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: postings = [], isLoading, isError, refetch } = useQuery<OpportunityPosting[]>({
    queryKey: ['admin-opportunities'],
    queryFn: async () => {
      return await apiClient.get<OpportunityPosting[]>('/admin/opportunities');
    }
  });

  const moderateMutation = useApiMutation(
    async ({ oppId, action, reason }: { oppId: string; action: string; reason: string }) => {
      return await apiClient.patch(`/admin/opportunities/${oppId}/moderate`, { action, reason });
    },
    {
      successMessage: 'Opportunity moderation action applied successfully.',
      invalidateQueries: [['admin-opportunities']],
    }
  );

  const filtered = postings.filter(p =>
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.companies?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModerate = (oppId: string, action: string, promptText: string) => {
    const reason = prompt(promptText, 'Administrative content moderation');
    if (!reason) return;
    moderateMutation.mutate({ oppId, action, reason });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <Layers className="h-6 w-6" /> Opportunity Postings
          </h1>
          <p className="text-sm text-slate mt-1">Review and moderate all job, internship, and research postings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Postings</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{postings.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Published / Active</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">
            {postings.filter(p => p.status === 'published' || p.status === 'active').length}
          </div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Flagged</span>
          <div className="text-2xl font-serif font-bold text-alert-rust mt-1">
            {postings.filter(p => p.status === 'flagged').length}
          </div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Closed</span>
          <div className="text-2xl font-serif font-bold text-slate mt-1">
            {postings.filter(p => p.status === 'closed').length}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search postings by title or company..."
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
            <span className="text-sm text-slate">Loading opportunity postings...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load postings.</p>
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
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Title</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Company</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Applicants</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Posted Date</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-36 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm">
              {filtered.map((p) => {
                const isItemPending = moderateMutation.isPending && moderateMutation.variables?.oppId === p.opportunity_id;

                return (
                  <tr key={p.opportunity_id} className="hover:bg-slate/5 transition-colors">
                    <td className="p-4 font-bold text-ink">{p.title}</td>
                    <td className="p-4 text-slate">{p.companies?.name || 'Partner Company'}</td>
                    <td className="p-4 text-slate capitalize">{p.opportunity_type || p.type || 'Internship'}</td>
                    <td className="p-4 text-ink font-bold">{p.applicants_count ?? 0}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider capitalize",
                        (p.status === 'published' || p.status === 'active') ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" :
                        p.status === 'flagged' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" :
                        "bg-slate/10 text-slate border border-slate/20"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      {isItemPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-ink inline-block" />
                      ) : (
                        <div className="flex justify-end gap-2">
                          {p.status !== 'published' && p.status !== 'active' && (
                            <button 
                              onClick={() => handleModerate(p.opportunity_id, 'reinstate', 'Reason for approving / reinstating posting:')}
                              className="p-1 text-growth-teal hover:bg-growth-teal/10 rounded transition-colors"
                              title="Reinstate / Publish"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {p.status !== 'flagged' && (
                            <button 
                              onClick={() => handleModerate(p.opportunity_id, 'flag', 'Reason for flagging posting:')}
                              className="p-1 text-warning-gold hover:bg-warning-gold/10 rounded transition-colors"
                              title="Flag Posting"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          )}
                          {p.status !== 'closed' && (
                            <button 
                              onClick={() => handleModerate(p.opportunity_id, 'remove', 'Reason for closing / taking down posting:')}
                              className="p-1 text-alert-rust hover:bg-alert-rust/10 rounded transition-colors"
                              title="Take Down (Close)"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
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
