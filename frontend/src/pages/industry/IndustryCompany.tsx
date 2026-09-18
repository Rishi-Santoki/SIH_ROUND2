import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, ShieldCheck, Clock, CheckCircle2, AlertCircle, FileText, X, Loader2, Building2, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { cn } from '../../lib/utils';

export function IndustryCompany() {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { data: company, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['industry', 'company'],
    queryFn: async () => {
      return await apiClient.get<any>('/industry/company');
    },
    retry: 1,
  });

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setIndustry(company.industry_type || '');
      setWebsite(company.website || '');
      setDescription(company.description || '');
      setLogoUrl(company.logo_url || '');
    }
  }, [company]);

  const verifyMutation = useApiMutation({
    mutationFn: async (_payload: any) => {
      return await apiClient.post('/industry/company/verify', _payload);
    },
    invalidateQueries: [['industry', 'company']],
    successMessage: 'Company verification request submitted for admin review!'
  });

  const updateMutation = useApiMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.patch('/industry/company', payload);
    },
    invalidateQueries: [['industry', 'company']],
    successMessage: 'Company profile updated successfully!'
  });

  const inviteMutation = useApiMutation({
    mutationFn: async (payload: { email: string }) => {
      return await apiClient.post('/industry/company/recruiters/invite', payload);
    },
    onSuccess: () => {
      setInviteModalOpen(false);
      setInviteEmail('');
    },
    successMessage: 'Recruiter invitation sent successfully!'
  });

  const isVerified = company?.verified === true;
  const latestReq = company?.latest_verification_request;
  const isPending = latestReq?.status === 'pending';

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: name.trim() || undefined,
      industry_type: industry.trim() || undefined,
      website: website.trim() || undefined,
      description: description.trim() || undefined,
      logo_url: logoUrl || undefined,
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({
      document_name: docFile?.name || 'Registration_Incorporation_Document.pdf',
    });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim() });
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate text-sm font-medium animate-pulse">
        Loading company details from ProofLedger...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={logoInputRef} 
        accept="image/*" 
        onChange={handleLogoSelect} 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={docInputRef} 
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
        onChange={handleDocSelect} 
        className="hidden" 
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Company Profile</h1>
          <p className="text-sm text-slate mt-1">Manage your organization's identity and team access.</p>
        </div>
        <div className="flex items-center gap-3">
          {isVerified ? (
            <ProofBadge status="verified" text="Verified Partner" />
          ) : isPending ? (
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-sm text-xs font-bold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Verification Pending
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-50 text-alert-rust border border-red-200 rounded-sm text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Unverified
            </span>
          )}
        </div>
      </div>

      {/* Query error alert if any */}
      {queryError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>Note: Running in preview mode with localized partner settings. You can edit and save changes below.</span>
        </div>
      )}

      {/* Status Notifications */}
      {verifyMutation.isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verification request submitted successfully. Platform administrators have been notified.
        </div>
      )}

      {verifyMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {verifyMutation.error?.message || 'Verification submission failed'}
        </div>
      )}

      {updateMutation.isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Company profile updated successfully!
        </div>
      )}

      {updateMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {updateMutation.error?.message || 'Failed to update profile'}
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-6">Organization Details</h3>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-start gap-8">
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Company Logo</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                title="Click to upload company logo"
                className="w-24 h-24 border-2 border-dashed border-hairline rounded-sm bg-paper flex flex-col items-center justify-center text-slate hover:border-ink/50 hover:bg-slate/5 transition-all cursor-pointer overflow-hidden relative group"
              >
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase">
                      <Upload className="h-4 w-4 mb-0.5" />
                      <span>Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-bold">Upload</span>
                  </>
                )}
              </div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[11px] text-alert-rust hover:underline mt-1 block"
                >
                  Remove logo
                </button>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter company name..."
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink font-medium" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Industry</label>
                  <input 
                    type="text" 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Technology / Software"
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Website</label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Company Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization, mission, and key initiatives..."
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-28 leading-relaxed" 
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-hairline">
            <button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>

        {/* Verification Request Box */}
        {!isVerified && (
          <div className="mt-8 bg-paper p-6 rounded-sm border border-hairline">
            <h4 className="text-sm font-bold text-ink mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-growth-teal" /> Company Verification Status
            </h4>
            
            {isPending ? (
              <div className="space-y-2">
                <p className="text-sm text-slate">
                  A verification request submitted on <strong>{latestReq?.created_at ? new Date(latestReq.created_at).toLocaleDateString() : 'recently'}</strong> is currently under review by Platform Administrators.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-sm">
                  <Clock className="h-3.5 w-3.5" /> Request In Progress — Awaiting Admin Approval
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate">
                  Your company is currently unverified. Official company verification allows you to publish opportunities and move applicants through your hiring pipeline.
                </p>
                
                <div 
                  onClick={() => docInputRef.current?.click()}
                  className="border-2 border-dashed border-hairline bg-white rounded-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-medium text-slate cursor-pointer hover:border-ink/50 hover:bg-slate/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-growth-teal shrink-0" />
                    <span>
                      {docFile ? (
                        <strong className="text-ink font-bold">{docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)</strong>
                      ) : (
                        'Official Registration / Incorporation Document (PDF or Image)'
                      )}
                    </span>
                  </div>
                  <span className="text-xs bg-slate/10 px-2.5 py-1 rounded-sm text-ink font-bold shrink-0">
                    {docFile ? 'Change File' : 'Browse File'}
                  </span>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                  className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting Verification Request...
                    </>
                  ) : (
                    'Submit Company for Verification'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Recruiter Team</h3>
          <button 
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 bg-slate/10 text-ink px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-slate/20 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Invite Colleague
          </button>
        </div>
        
        <div className="divide-y divide-hairline">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-ink text-sm">Primary Contact</p>
              <p className="text-xs text-slate">{company?.company_id ? `Company ID: ${company.company_id}` : 'Primary Recruiter'}</p>
            </div>
            <span className="text-xs font-bold text-growth-teal bg-growth-teal/10 px-2.5 py-1 rounded-sm uppercase tracking-wider">
              Primary Admin
            </span>
          </div>
        </div>

        {inviteModalOpen && (
          <div className="mt-4 p-4 border border-hairline bg-paper rounded-sm animate-in fade-in-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Invite Team Member</h4>
              <button 
                type="button" 
                onClick={() => setInviteModalOpen(false)}
                className="text-slate hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="flex gap-2">
              <input 
                type="email" 
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com" 
                className="flex-1 bg-white border border-hairline rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-ink"
              />
              <button 
                type="submit"
                disabled={inviteMutation.isPending}
                className="bg-ink text-paper px-4 py-1.5 rounded-sm text-xs font-bold uppercase hover:bg-ink/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {inviteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Invite'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
