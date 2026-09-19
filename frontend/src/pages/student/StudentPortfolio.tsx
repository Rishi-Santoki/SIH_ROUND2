import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Upload, FolderGit2, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { cn } from '../../lib/utils';

export function StudentPortfolio() {
  const [isAdding, setIsAdding] = useState(false);
  const [itemType, setItemType] = useState<'project' | 'certificate' | 'resume'>('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState('Coursera');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Fetch Projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['student', 'portfolio', 'projects'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/portfolio/projects');
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch Certifications
  const { data: certifications = [], isLoading: isLoadingCerts } = useQuery({
    queryKey: ['student', 'portfolio', 'certifications'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/portfolio/certifications');
      } catch {
        return [];
      }
    }
  });

  // 3. Fetch Student Skills for the evidence dropdown
  const { data: skills = [] } = useQuery({
    queryKey: ['student', 'skills'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/skills');
      } catch {
        return [];
      }
    }
  });

  // 4. Fetch Profile to show current resume if available
  const { data: profile } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/student/profile');
      } catch {
        return null;
      }
    }
  });

  // Mutations
  const addProjectMutation = useApiMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/student/portfolio/projects', payload);
    },
    invalidateQueries: [['student', 'portfolio', 'projects'], ['student', 'skills'], ['student', 'readiness']],
    successMessage: 'Project saved to ledger!',
    onSuccess: () => resetForm()
  });

  const addCertMutation = useApiMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/student/portfolio/certifications', payload);
    },
    invalidateQueries: [['student', 'portfolio', 'certifications'], ['student', 'skills'], ['student', 'readiness']],
    successMessage: 'Certification saved to ledger!',
    onSuccess: () => resetForm()
  });

  const updateResumeMutation = useApiMutation({
    mutationFn: async (resumeUrl: string) => {
      return await apiClient.patch('/student/profile', { resume_url: resumeUrl });
    },
    invalidateQueries: [['student', 'profile']],
    successMessage: 'Resume uploaded and attached to profile!',
    onSuccess: () => resetForm()
  });

  const resetForm = () => {
    setIsAdding(false);
    setTitle('');
    setDescription('');
    setUrl('');
    setSelectedSkillId('');
    setUploadedFile(null);
    setUploadError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Map item type to upload context
    let context = 'project_media';
    if (itemType === 'certificate') context = 'certificate';
    if (itemType === 'resume') context = 'resume';

    // PDF validation for resume
    if (itemType === 'resume' && file.type !== 'application/pdf') {
      setUploadError('Resumes must be in PDF format.');
      return;
    }

    const formData = new FormData();
    formData.append('context', context);
    formData.append('file', file);

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await apiClient.post<any>('/files/upload', formData);
      setUploadedFile({
        name: file.name,
        url: res.url || '#'
      });
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (itemType === 'project') {
      addProjectMutation.mutate({
        title,
        description: description || 'Portfolio project submission',
        github_url: url.startsWith('http') ? url : (url ? `https://${url}` : undefined),
        media_url: uploadedFile?.url,
        skill_id: selectedSkillId || undefined
      });
    } else if (itemType === 'certificate') {
      addCertMutation.mutate({
        title,
        provider: provider || 'Certification Body',
        issue_date: new Date().toISOString().split('T')[0],
        credential_id: `cert-${Date.now()}`,
        credential_url: url.startsWith('http') ? url : (url ? `https://${url}` : (uploadedFile?.url || undefined)),
        skill_id: selectedSkillId || undefined
      });
    } else if (itemType === 'resume') {
      if (!uploadedFile?.url) {
        setUploadError('Please upload a resume file first.');
        return;
      }
      updateResumeMutation.mutate(uploadedFile.url);
    }
  };

  const isPending = addProjectMutation.isPending || addCertMutation.isPending || updateResumeMutation.isPending;

  // Combine items for unified ledger view
  const combinedItems = [
    ...projects.map((p: any) => ({
      id: p.project_id,
      type: 'project' as const,
      title: p.title,
      date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active',
      link: p.github_url || p.project_url,
      file: p.media_url,
      status: p.verification_status || 'pending',
      evidenceFor: p.skills?.name ? [p.skills.name] : ['Project Portfolio']
    })),
    ...certifications.map((c: any) => ({
      id: c.certification_id,
      type: 'certificate' as const,
      title: `${c.title} (${c.provider || 'Verified'})`,
      date: c.issue_date || 'Current',
      link: c.credential_url,
      file: null,
      status: c.verification_status || 'pending',
      evidenceFor: c.skills?.name ? [c.skills.name] : ['Industry Credential']
    }))
  ];

  const studentResumeUrl = profile?.student_profiles?.[0]?.resume_url || profile?.student_profiles?.resume_url;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Portfolio Ledger</h1>
          <p className="text-sm text-slate mt-1">Verified projects, credentials, and resume documents that back up your claims.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setUploadError(null); }}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Active Resume / Profile Preview Card if present */}
      {studentResumeUrl && (
        <div className="bg-growth-teal/5 border border-growth-teal/20 rounded-sm p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-growth-teal/10 rounded-sm flex items-center justify-center text-growth-teal">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-ink text-sm">Active Resume on File</h4>
              <p className="text-xs text-slate">Recruiters can download this directly through verified applications.</p>
            </div>
          </div>
          <a
            href={studentResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-growth-teal bg-white border border-growth-teal/30 px-3 py-1.5 rounded-sm hover:bg-growth-teal hover:text-white transition-colors"
          >
            View Document
          </a>
        </div>
      )}

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white border border-hairline border-dashed rounded-sm p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-ink">Add to Portfolio Ledger</h3>
            <button 
              type="button" 
              onClick={resetForm} 
              className="text-slate hover:text-ink text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Item Type</label>
                <select 
                  value={itemType}
                  onChange={(e) => {
                    setItemType(e.target.value as any);
                    setUploadedFile(null);
                    setUploadError(null);
                  }}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                >
                  <option value="project">Project / Repository</option>
                  <option value="certificate">Certificate / Credential</option>
                  <option value="resume">Resume / CV</option>
                </select>
              </div>

              {itemType !== 'resume' && (
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Title</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                    placeholder={itemType === 'project' ? "E.g., Distributed Key-Value Store" : "E.g., AWS Cloud Practitioner"} 
                  />
                </div>
              )}

              {itemType === 'certificate' && (
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Issuing Provider</label>
                  <input 
                    type="text" 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                    placeholder="E.g., Coursera, AWS, Udacity" 
                  />
                </div>
              )}

              {itemType === 'project' && (
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Brief Description</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                    placeholder="Technologies used and problems solved..." 
                  />
                </div>
              )}

              {itemType !== 'resume' && (
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">URL (GitHub / Live Link)</label>
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                    placeholder="https://..." 
                  />
                </div>
              )}

              {itemType !== 'resume' && (
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
                    Attach as Evidence For Skill (Optional)
                  </label>
                  <select
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  >
                    <option value="">-- No specific skill link --</option>
                    {(Array.isArray(skills) ? skills : []).map((s: any) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.skill_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
                File Upload ({itemType === 'resume' ? 'PDF Resume' : 'Certificate PDF / Project Screenshot'})
              </label>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept={itemType === 'resume' ? '.pdf' : '.pdf,.png,.jpg,.jpeg'}
              />

              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed border-hairline bg-paper rounded-sm h-48 flex flex-col items-center justify-center text-slate transition-colors cursor-pointer p-4 text-center",
                  isUploading ? "opacity-60 cursor-wait" : "hover:bg-slate/5"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-8 w-8 mb-2 animate-spin text-ink" />
                    <span className="text-sm font-medium text-ink">Uploading file to storage...</span>
                  </>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-growth-teal" />
                    <span className="text-sm font-bold text-ink truncate max-w-xs">{uploadedFile.name}</span>
                    <span className="text-xs text-growth-teal mt-1">Upload complete ✓</span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="mt-3 text-xs text-slate underline hover:text-ink"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium text-ink">Click or drop file to upload</span>
                    <span className="text-xs text-slate mt-1">
                      {itemType === 'resume' ? 'PDF only (Max 10MB)' : 'PDF, JPG, PNG (Max 10MB)'}
                    </span>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-alert-rust mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {uploadError}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-hairline">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-4 py-2 text-sm text-slate hover:text-ink"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPending || (itemType !== 'resume' && !title.trim())}
              className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? 'Saving...' : 'Save to Ledger'}
            </button>
          </div>
        </form>
      )}

      {/* Ledger Table */}
      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-hairline bg-paper text-xs font-bold text-slate uppercase tracking-wider">
          <div className="col-span-6">Item</div>
          <div className="col-span-3">Evidence For</div>
          <div className="col-span-3 text-right">Status</div>
        </div>
        
        {isLoadingProjects || isLoadingCerts ? (
          <div className="p-8 text-center text-sm text-slate">Loading portfolio ledger...</div>
        ) : combinedItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate">
            No projects or certifications recorded yet. Click "Add Item" to attach proof!
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {combinedItems.map((item: any) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate/5 transition-colors">
                <div className="col-span-6 flex items-start gap-3">
                  <div className="h-10 w-10 bg-slate/5 rounded-sm flex items-center justify-center text-slate shrink-0">
                    {item.type === 'project' ? <FolderGit2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">{item.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate mt-1">
                      <span>{item.date}</span>
                      {item.link && (
                        <a 
                          href={item.link.startsWith('http') ? item.link : `https://${item.link}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 hover:text-ink underline decoration-hairline hover:decoration-ink"
                        >
                          <LinkIcon className="h-3 w-3" /> View Source
                        </a>
                      )}
                      {item.file && (
                        <a 
                          href={item.file} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 text-growth-teal underline"
                        >
                          <FileText className="h-3 w-3" /> Attached File
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3 flex flex-wrap gap-1">
                  {item.evidenceFor.map((skill: string) => (
                    <span key={skill} className="bg-white border border-hairline text-[10px] font-bold text-slate uppercase tracking-wider px-2 py-0.5 rounded-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="col-span-3 flex justify-end">
                  <ProofBadge status={item.status === 'verified' ? 'verified' : 'pending'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
