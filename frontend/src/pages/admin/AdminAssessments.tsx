import React, { useState } from 'react';
import { Search, FileCheck, Eye, Trash2, Filter, AlertTriangle, Loader2, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface AssessmentItem {
  assessment_id: string;
  title: string;
  category?: string;
  skill_id?: string;
  passing_score?: number;
  duration_minutes?: number;
  is_active: boolean;
  created_at?: string;
  question_count?: number;
}

export function AdminAssessments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  const { data: assessments = [], isLoading, isError, refetch } = useQuery<AssessmentItem[]>({
    queryKey: ['admin-assessments'],
    queryFn: async () => {
      return await apiClient.get<AssessmentItem[]>('/admin/assessments');
    }
  });

  const forceDeactivateMutation = useApiMutation(
    async ({ assessmentId, reason }: { assessmentId: string; reason: string }) => {
      return await apiClient.patch(`/admin/assessments/${assessmentId}/force-deactivate`, { reason });
    },
    {
      successMessage: 'Assessment force-deactivated successfully.',
      invalidateQueries: [['admin-assessments']],
    }
  );

  const filtered = assessments.filter(a =>
    (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeactivate = (id: string) => {
    if (!deactivateReason.trim()) return;
    forceDeactivateMutation.mutate(
      { assessmentId: id, reason: deactivateReason.trim() },
      {
        onSuccess: () => {
          setDeactivatingId(null);
          setDeactivateReason('');
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <FileCheck className="h-6 w-6" /> Assessment Management
          </h1>
          <p className="text-sm text-slate mt-1">Create, review, and monitor platform-wide skill assessments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Assessments</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{assessments.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Active</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">
            {assessments.filter(a => a.is_active).length}
          </div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Deactivated / Inactive</span>
          <div className="text-2xl font-serif font-bold text-alert-rust mt-1">
            {assessments.filter(a => !a.is_active).length}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search assessments by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      {deactivatingId && (
        <div className="bg-alert-rust/5 border-2 border-alert-rust/30 p-4 rounded-sm shadow-sm space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-alert-rust shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-alert-rust text-sm">Force-Deactivate Assessment</h4>
              <p className="text-xs text-slate mt-0.5">
                Provide a reason for administrative intervention. This assessment will be immediately disabled for all candidates.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="e.g. Quality audit failure, compromised answer key..."
              className="flex-1 bg-white border border-alert-rust/30 p-2 rounded-sm text-sm focus:outline-none focus:border-alert-rust"
              autoFocus
            />
            <button
              onClick={() => handleDeactivate(deactivatingId)}
              disabled={!deactivateReason.trim() || forceDeactivateMutation.isPending}
              className="bg-alert-rust text-white px-4 py-2 rounded-sm text-sm font-bold disabled:opacity-50 hover:bg-alert-rust/90 flex items-center gap-1.5"
            >
              {forceDeactivateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Force-Deactivate
            </button>
            <button
              onClick={() => { setDeactivatingId(null); setDeactivateReason(''); }}
              className="bg-white border border-hairline text-slate px-3 py-2 rounded-sm text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading assessments...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load assessments.</p>
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
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Assessment Title</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Passing Score</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Duration</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm">
              {filtered.map((a) => (
                <tr key={a.assessment_id} className="hover:bg-slate/5 transition-colors">
                  <td className="p-4 font-bold text-ink">
                    {a.title}
                    <div className="text-xs text-slate font-mono mt-0.5">{a.assessment_id.slice(0, 10)}...</div>
                  </td>
                  <td className="p-4 text-ink font-bold">{a.passing_score ?? 70}%</td>
                  <td className="p-4 text-slate">{a.duration_minutes ?? 60} mins</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                      a.is_active ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" : "bg-alert-rust/10 text-alert-rust border border-alert-rust/20"
                    )}>
                      {a.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {a.is_active ? (
                      <button 
                        onClick={() => {
                          setDeactivatingId(a.assessment_id);
                          setDeactivateReason('');
                        }}
                        className="text-xs font-bold text-alert-rust hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Force Deactivate
                      </button>
                    ) : (
                      <span className="text-xs text-slate italic">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
