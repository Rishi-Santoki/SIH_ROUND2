import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { ProofBadge } from '../../components/ui/ProofBadge';

interface Collaboration {
  collaboration_id: string;
  id?: string;
  title: string;
  description?: string;
  collaboration_type: string;
  status: 'proposed' | 'ongoing' | 'completed' | string;
  academician_id?: string;
  company_id?: string;
  start_date?: string;
  end_date?: string;
  companies?: {
    name?: string;
    verified?: boolean;
  };
  reason?: string;
}

interface Company {
  company_id: string;
  name: string;
  industry_type?: string;
  location?: string;
}

export function AcademicianCollaborations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const proposeParam = searchParams.get('propose') === 'true';
  const paramType = searchParams.get('proposeType') || '';
  const paramTitle = searchParams.get('title') || '';
  const paramDesc = searchParams.get('description') || '';

  const [activeTab, setActiveTab] = useState<'recommended' | 'available' | 'mine'>('recommended');
  const [isCreating, setIsCreating] = useState(proposeParam);

  // Form states
  const [collabType, setCollabType] = useState('fdp');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Status update state
  const [updatingCollabId, setUpdatingCollabId] = useState<string | null>(null);
  const [applyingCollabId, setApplyingCollabId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Normalize incoming param type
  useEffect(() => {
    if (proposeParam) {
      setIsCreating(true);
    }
    if (paramType) {
      const lower = paramType.toLowerCase().replace(/[\s-]+/g, '_');
      const valid = ['fdp', 'research', 'consultancy', 'guest_lecture', 'mentorship'];
      if (valid.includes(lower)) {
        setCollabType(lower);
      } else if (lower.includes('lecture')) {
        setCollabType('guest_lecture');
      } else if (lower.includes('research')) {
        setCollabType('research');
      } else {
        setCollabType('fdp');
      }
    }
    if (paramTitle) {
      setTitle(paramTitle);
    }
    if (paramDesc) {
      setDescription(paramDesc);
    }
  }, [proposeParam, paramType, paramTitle, paramDesc]);

  // Queries
  const { data: recommendedCollabs = [], isLoading: loadingRec, error: recError } = useQuery<Collaboration[]>({
    queryKey: ['academician', 'collaborations', 'recommended'],
    queryFn: () => apiClient<Collaboration[]>('/academician/collaborations/recommended'),
  });

  const { data: availableCollabs = [], isLoading: loadingAvail, error: availError } = useQuery<Collaboration[]>({
    queryKey: ['academician', 'collaborations', 'available'],
    queryFn: () => apiClient<Collaboration[]>('/academician/collaborations/available'),
  });

  const { data: myCollabs = [], isLoading: loadingMine, error: mineError } = useQuery<Collaboration[]>({
    queryKey: ['academician', 'collaborations', 'mine'],
    queryFn: () => apiClient<Collaboration[]>('/academician/collaborations/mine'),
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies', 'lookup'],
    queryFn: () => apiClient<Company[]>('/auth/companies'),
  });

  // Propose Mutation
  const proposeMutation = useApiMutation(
    (payload: {
      title: string;
      description: string;
      collaboration_type: string;
      company_id?: string;
      start_date?: string;
      end_date?: string;
    }) =>
      apiClient<Collaboration>('/academician/collaborations', {
        method: 'POST',
        data: payload,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['academician', 'collaborations'] });
        setIsCreating(false);
        setSearchParams({});
        setActiveTab('mine');
        setTitle('');
        setDescription('');
        setSelectedCompanyId('');
        setStartDate('');
        setEndDate('');
        setFeedbackMessage({ type: 'success', message: 'Collaboration proposed successfully!' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      },
    }
  );

  // Status Change Mutation
  const statusMutation = useApiMutation(
    ({ collabId, status }: { collabId: string; status: string }) =>
      apiClient<Collaboration>(`/academician/collaborations/${collabId}/status`, {
        method: 'PATCH',
        data: { status },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['academician', 'collaborations'] });
        setUpdatingCollabId(null);
        setFeedbackMessage({ type: 'success', message: 'Status updated successfully!' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      },
      onError: (err: any) => {
        setUpdatingCollabId(null);
        setFeedbackMessage({ type: 'error', message: err?.message || 'Failed to update status' });
      },
    }
  );

  // Apply Mutation
  const applyMutation = useApiMutation(
    (collabId: string) =>
      apiClient<{ application_id: string }>(`/academician/collaborations/${collabId}/apply`, {
        method: 'POST',
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['academician', 'collaborations'] });
        setApplyingCollabId(null);
        setFeedbackMessage({ type: 'success', message: 'Applied to collaboration successfully!' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      },
      onError: (err: any) => {
        setApplyingCollabId(null);
        setFeedbackMessage({ type: 'error', message: err?.message || 'Failed to apply' });
      },
    }
  );

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFeedbackMessage({ type: 'error', message: 'Title and description are required.' });
      return;
    }

    proposeMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      collaboration_type: collabType,
      company_id: selectedCompanyId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  const handleStatusChange = (collabId: string, newStatus: string) => {
    setUpdatingCollabId(collabId);
    statusMutation.mutate({ collabId, status: newStatus });
  };

  const handleApply = (collabId: string) => {
    setApplyingCollabId(collabId);
    applyMutation.mutate(collabId);
  };

  const currentCollabs = 
    activeTab === 'recommended' 
      ? recommendedCollabs 
      : activeTab === 'available' 
      ? availableCollabs 
      : myCollabs;

  const currentLoading = 
    activeTab === 'recommended' 
      ? loadingRec 
      : activeTab === 'available' 
      ? loadingAvail 
      : loadingMine;

  const currentError = 
    activeTab === 'recommended' 
      ? recError 
      : activeTab === 'available' 
      ? availError 
      : mineError;

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-ink">Propose Collaboration</h1>
          <button 
            onClick={() => {
              setIsCreating(false);
              setSearchParams({});
            }} 
            className="text-sm font-medium text-slate hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>

        {proposeMutation.isError && (
          <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{proposeMutation.error?.message || 'Failed to submit proposal. Please verify the company details.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmitProposal} className="bg-white border border-hairline rounded-sm p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
              Collaboration Type *
            </label>
            <select 
              value={collabType}
              onChange={(e) => setCollabType(e.target.value)}
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink font-medium"
            >
              <option value="fdp">FDP (Faculty Development Program)</option>
              <option value="research">Research Collaboration</option>
              <option value="consultancy">Industry Consultancy</option>
              <option value="guest_lecture">Guest Lecture / Workshop</option>
              <option value="mentorship">Mentorship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
              Title / Subject *
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
              placeholder="e.g. Advanced Cloud Security FDP" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
              Description & Outcomes *
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-24" 
              placeholder="Outline the syllabus, target participants, and intended learning outcomes..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
                Start Date (Optional)
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
                End Date (Optional)
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-hairline">
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
              Target Industry Partner (Optional)
            </label>
            <p className="text-xs text-slate mb-3">Link a verified company profile if you have one in mind.</p>
            <select 
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
            >
              <option value="">None (Independent / Open Proposal)</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.name} {c.industry_type ? `(${c.industry_type})` : ''} - Verified
                </option>
              ))}
            </select>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit"
              disabled={proposeMutation.isPending || !title.trim() || !description.trim()}
              className="bg-ink text-paper px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {proposeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Proposal'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Collaborations</h1>
          <p className="text-sm text-slate mt-1">Connect with industry for research, FDPs, and guest lectures.</p>
        </div>
        <button 
          onClick={() => {
            setIsCreating(true);
            setSearchParams({ propose: 'true' });
          }}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Propose
        </button>
      </div>

      {feedbackMessage && (
        <div className={cn(
          "p-4 rounded-sm border text-sm flex items-center justify-between",
          feedbackMessage.type === 'success' 
            ? "bg-growth-teal/10 border-growth-teal/30 text-growth-teal" 
            : "bg-alert-rust/10 border-alert-rust/30 text-alert-rust"
        )}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedbackMessage.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold uppercase tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="border-b border-hairline flex gap-8">
        {(['recommended', 'available', 'mine'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
              activeTab === tab ? "text-ink" : "text-slate hover:text-ink"
            )}
          >
            {tab === 'mine' ? 'My Collaborations' : tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-ink rounded-t-sm" />}
          </button>
        ))}
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        {currentLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
            <p className="text-sm text-slate">Loading collaborations...</p>
          </div>
        ) : currentError ? (
          <div className="p-8 text-center text-alert-rust text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load collaborations: {(currentError as any)?.message || 'Network error'}</span>
          </div>
        ) : currentCollabs.length === 0 ? (
          <div className="p-12 text-center text-slate text-sm">
            {activeTab === 'mine'
              ? 'You have not proposed or joined any collaborations yet. Click "+ Propose" to start one.'
              : 'No collaborations available in this category.'}
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {currentCollabs.map((collab) => {
              const collabId = collab.collaboration_id || collab.id || '';
              const companyName = collab.companies?.name || 'Independent / Institution-wide';
              const isUpdatingStatus = statusMutation.isPending && updatingCollabId === collabId;
              const isApplying = applyMutation.isPending && applyingCollabId === collabId;

              return (
                <div key={collabId} className="flex flex-col">
                  {collab.reason && (
                    <div className="bg-growth-teal/5 px-5 py-2 text-xs font-medium text-growth-teal border-b border-hairline flex items-center gap-2">
                      <span className="font-bold">Why recommended:</span> {collab.reason}
                    </div>
                  )}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate/5 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-ink text-lg">{collab.title}</h3>
                        <span className="px-2 py-0.5 rounded-sm bg-slate/10 text-slate text-[10px] font-bold uppercase tracking-wider">
                          {collab.collaboration_type?.replace(/_/g, ' ')}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                          collab.status === 'completed'
                            ? "bg-growth-teal/10 text-growth-teal"
                            : collab.status === 'ongoing'
                            ? "bg-verified-gold/15 text-ink"
                            : "bg-slate/10 text-slate"
                        )}>
                          {collab.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-slate" /> {companyName}
                      </p>
                      {collab.description && (
                        <p className="text-xs text-slate line-clamp-2 max-w-2xl mt-1">
                          {collab.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {activeTab === 'mine' ? (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate font-medium">Status:</label>
                          <select 
                            value={collab.status}
                            disabled={isUpdatingStatus}
                            onChange={(e) => handleStatusChange(collabId, e.target.value)}
                            className="bg-paper border border-hairline rounded-sm px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-ink cursor-pointer disabled:opacity-50"
                          >
                            <option value="proposed">Proposed</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                          </select>
                          {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin text-growth-teal" />}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApply(collabId)}
                          disabled={isApplying || collab.status !== 'proposed'}
                          className="bg-ink text-paper px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying...
                            </>
                          ) : (
                            'Apply'
                          )}
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
    </div>
  );
}

