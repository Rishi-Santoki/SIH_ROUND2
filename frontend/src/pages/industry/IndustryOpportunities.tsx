import React, { useState } from 'react';
import { Plus, SlidersHorizontal, AlertCircle, CheckCircle2, Lock, X, Briefcase, Eye, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

export function IndustryOpportunities() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [createdOppId, setCreatedOppId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('Remote');
  const [oppType, setOppType] = useState('internship');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<{ name: string; level: number; importance: number; mandatory: boolean }[]>([
    { name: 'Python', level: 70, importance: 0.5, mandatory: true }
  ]);
  const [newSkillName, setNewSkillName] = useState('');

  // 1. Fetch Company Status
  const { data: company } = useQuery({
    queryKey: ['industry', 'company'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/industry/company');
      } catch {
        return null;
      }
    }
  });

  const isCompanyVerified = company?.verified === true;

  // 2. Fetch Postings
  const { data: postings = [], isLoading, refetch } = useQuery({
    queryKey: ['industry', 'opportunities'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/industry/opportunities');
      } catch {
        return [];
      }
    }
  });

  // 3. Mutations
  const createMutation = useApiMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post<any>('/industry/opportunities', payload);
    },
    invalidateQueries: [['industry', 'opportunities']],
    successMessage: 'Posting draft created! Now configure required skills.'
  });

  const addSkillsMutation = useApiMutation({
    mutationFn: async ({ oppId, skillsList }: { oppId: string; skillsList: any[] }) => {
      return await apiClient.post(`/industry/opportunities/${oppId}/skills`, skillsList);
    },
    invalidateQueries: [['industry', 'opportunities']],
    successMessage: 'Required skills saved to opportunity!'
  });

  const publishMutation = useApiMutation({
    mutationFn: async (oppId: string) => {
      return await apiClient.patch(`/industry/opportunities/${oppId}/publish`);
    },
    invalidateQueries: [['industry', 'opportunities']],
    successMessage: 'Opportunity published successfully to student talent pool!'
  });

  const closeMutation = useApiMutation({
    mutationFn: async (oppId: string) => {
      return await apiClient.patch(`/industry/opportunities/${oppId}/close`);
    },
    invalidateQueries: [['industry', 'opportunities']],
    successMessage: 'Opportunity closed.'
  });

  const handleCreateStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMutation.mutate({
      title,
      description: description || `Join our team as a ${title}.`,
      opportunity_type: oppType,
      location: location || 'Remote',
      work_mode: workMode.toLowerCase(),
      application_deadline: new Date(deadline).toISOString()
    }, {
      onSuccess: (res: any) => {
        setCreatedOppId(res.opportunity_id);
        setCreateStep(2);
      }
    });
  };

  const handleSaveSkillsAndPublish = async (andPublish: boolean) => {
    if (!createdOppId) return;

    addSkillsMutation.mutate({
      oppId: createdOppId,
      skillsList: skills
    }, {
      onSuccess: () => {
        if (andPublish) {
          publishMutation.mutate(createdOppId, {
            onSuccess: () => {
              setIsCreating(false);
              resetForm();
            }
          });
        } else {
          setIsCreating(false);
          resetForm();
        }
      }
    });
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setCreatedOppId(null);
    setCreateStep(1);
    setSkills([{ name: 'Python', level: 70, importance: 0.5, mandatory: true }]);
  };

  const displayedPostings = postings.filter(p => filter === 'all' || p.status === filter);

  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-ink">Create Opportunity Posting</h1>
            <p className="text-sm text-slate mt-1">Step {createStep} of 2: {createStep === 1 ? 'Job Details' : 'Skill Proof Configuration'}</p>
          </div>
          <button 
            onClick={() => { setIsCreating(false); resetForm(); }}
            className="text-sm font-medium text-slate hover:text-ink"
          >
            Cancel
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={cn("flex-1 h-2 rounded-full", createStep >= 1 ? "bg-ink" : "bg-slate/10")} />
          <div className={cn("flex-1 h-2 rounded-full", createStep >= 2 ? "bg-ink" : "bg-slate/10")} />
        </div>

        {createMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {createMutation.error?.message}
          </div>
        )}

        {publishMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {publishMutation.error?.message}
          </div>
        )}

        <div className="bg-white border border-hairline rounded-sm shadow-sm p-8">
          {createStep === 1 ? (
            <form onSubmit={handleCreateStep1} className="space-y-6 animate-in fade-in">
              <h3 className="font-bold text-ink text-lg mb-4">Basic Information</h3>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Job Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                  placeholder="e.g. Machine Learning Engineer Intern" 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Location</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                    placeholder="e.g. Bangalore or Remote" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={oppType}
                    onChange={(e) => setOppType(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  >
                    <option value="internship">Internship</option>
                    <option value="job">Full-time Job</option>
                    <option value="apprenticeship">Apprenticeship</option>
                    <option value="project">Industry Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Application Deadline</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the opportunity, team, and day-to-day impact..."
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-32" 
                />
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={createMutation.isPending || !title.trim()}
                  className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving Draft...' : 'Next: Configure Required Skills'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <h3 className="font-bold text-ink text-lg">ProofLedger Skill Requirements</h3>
                <p className="text-sm text-slate mt-1">Specify required skills to enable deterministic matching against verified student proofs.</p>
              </div>
              
              <div className="space-y-4">
                {skills.map((s, i) => (
                  <div key={i} className="bg-paper border border-hairline p-4 rounded-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-ink text-sm">{s.name}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={s.mandatory} 
                            onChange={(e) => {
                              const updated = [...skills];
                              updated[i].mandatory = e.target.checked;
                              setSkills(updated);
                            }}
                            className="accent-ink" 
                          /> Mandatory
                        </label>
                        <button 
                          onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                          className="text-slate hover:text-alert-rust text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate uppercase tracking-wider mb-2">
                          <span>Required Level</span>
                          <span>{s.level}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          step="5"
                          value={s.level} 
                          onChange={(e) => {
                            const updated = [...skills];
                            updated[i].level = Number(e.target.value);
                            setSkills(updated);
                          }}
                          className="w-full accent-ink" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate uppercase tracking-wider mb-2">
                          <span>Importance Weight</span>
                          <span>{(s.importance * 10).toFixed(0)}/10</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1.0" 
                          step="0.1"
                          value={s.importance} 
                          onChange={(e) => {
                            const updated = [...skills];
                            updated[i].importance = Number(e.target.value);
                            setSkills(updated);
                          }}
                          className="w-full accent-growth-teal" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-dashed border-hairline bg-white p-4 rounded-sm flex items-center gap-4">
                <input 
                  type="text" 
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Skill name (e.g. Python, SQL, Docker, Machine Learning)" 
                  className="flex-1 bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSkillName.trim()) {
                        setSkills([...skills, { name: newSkillName.trim(), level: 70, importance: 0.5, mandatory: true }]);
                        setNewSkillName('');
                      }
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (newSkillName.trim()) {
                      setSkills([...skills, { name: newSkillName.trim(), level: 70, importance: 0.5, mandatory: true }]);
                      setNewSkillName('');
                    }
                  }}
                  className="bg-slate/10 text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate/20"
                >
                  Add Skill
                </button>
              </div>

              {/* Verification & Skill Validation Banner */}
              {!isCompanyVerified && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm text-xs font-medium text-amber-900 flex items-start gap-2">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <strong>Publishing Blocked:</strong> Company verification is required before opportunities can be published to the public portal. You may still save this posting as a draft.
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-hairline flex items-center justify-between">
                <button 
                  onClick={() => setCreateStep(1)} 
                  className="text-sm font-medium text-slate hover:text-ink"
                >
                  Back
                </button>
                
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => handleSaveSkillsAndPublish(false)}
                    disabled={addSkillsMutation.isPending || skills.length === 0}
                    className="bg-slate/10 text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate/20 disabled:opacity-50"
                  >
                    Save as Draft
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSaveSkillsAndPublish(true)}
                    disabled={addSkillsMutation.isPending || publishMutation.isPending || skills.length === 0 || !isCompanyVerified}
                    className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!isCompanyVerified ? 'Company must be verified to publish' : undefined}
                  >
                    {publishMutation.isPending ? 'Publishing...' : 'Save & Publish'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Opportunities & Postings</h1>
          <p className="text-sm text-slate mt-1">Manage positions and matched candidate pipelines.</p>
        </div>
        <button 
          onClick={() => {
            setIsCreating(true);
            setCreateStep(1);
          }}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Posting
        </button>
      </div>

      {publishMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {publishMutation.error?.message}
        </div>
      )}

      {publishMutation.isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Opportunity published! Candidates can now apply via ProofLedger.
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-hairline pb-4">
        <SlidersHorizontal className="h-4 w-4 text-slate mr-2" />
        {(['all', 'active', 'draft', 'closed'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors",
              filter === f ? "bg-slate/10 text-ink" : "text-slate hover:text-ink"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate text-sm font-medium animate-pulse">
            Loading opportunities...
          </div>
        ) : displayedPostings.length === 0 ? (
          <div className="p-12 text-center text-slate text-sm">
            No {filter !== 'all' ? filter : ''} postings found. Click "Create Posting" above to begin.
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {displayedPostings.map((post: any) => {
              const applicantsCount = post.total_applicants || (post.applicant_counts ? Object.values(post.applicant_counts).reduce((a: any, b: any) => a + b, 0) : 0);
              return (
                <div key={post.opportunity_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate/5 transition-colors group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-ink text-lg group-hover:text-growth-teal transition-colors">
                        <Link to={`/industry/pipeline`}>{post.title}</Link>
                      </h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                        post.status === 'active' && "bg-emerald-50 text-emerald-800 border border-emerald-200",
                        post.status === 'draft' && "bg-slate/10 text-slate",
                        post.status === 'closed' && "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate">
                      {applicantsCount} candidate{applicantsCount === 1 ? '' : 's'} • {post.location || 'Remote'} • {post.opportunity_type || 'internship'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {post.status === 'draft' && (
                      <button 
                        onClick={() => publishMutation.mutate(post.opportunity_id)}
                        disabled={publishMutation.isPending}
                        className={cn(
                          "px-3 py-1.5 rounded-sm text-xs font-bold border transition-colors",
                          isCompanyVerified 
                            ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50" 
                            : "border-slate/20 text-slate/50 cursor-not-allowed"
                        )}
                        title={!isCompanyVerified ? 'Publishing blocked: Company must be verified' : 'Publish to live portal'}
                      >
                        {isCompanyVerified ? 'Publish Now' : 'Publish Blocked'}
                      </button>
                    )}

                    {post.status === 'active' && (
                      <button 
                        onClick={() => closeMutation.mutate(post.opportunity_id)}
                        disabled={closeMutation.isPending}
                        className="px-3 py-1.5 rounded-sm text-xs font-bold border border-slate/30 text-slate hover:text-alert-rust hover:border-alert-rust transition-colors"
                      >
                        Close Posting
                      </button>
                    )}

                    <Link 
                      to="/industry/pipeline"
                      className="inline-flex items-center gap-1 text-sm font-medium text-ink underline decoration-hairline hover:decoration-ink underline-offset-4"
                    >
                      <span>Pipeline</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
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
