import React, { useState, useEffect } from 'react';
import { Camera, Save, Plus, X, Briefcase, GraduationCap, Link as LinkIcon, HandHeart, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { cn } from '../../lib/utils';

interface AlumniSkillItem {
  alumni_skill_id: string;
  skill_id: string;
  proficiency_level: number;
  willing_to_mentor: boolean;
  found_challenging: boolean;
  skills?: {
    skill_id: string;
    name: string;
    category: string;
  };
}

export function AlumniProfile() {
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['alumni-profile'],
    queryFn: () => apiClient.get<any>('/alumni/profile')
  });

  const { data: skillsData = [], isLoading: isSkillsLoading } = useQuery<AlumniSkillItem[]>({
    queryKey: ['alumni-skills'],
    queryFn: () => apiClient.get<AlumniSkillItem[]>('/alumni/skills')
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    currentRole: '',
    company: '',
    degree: '',
    department: '',
    graduationYear: '',
    bio: '',
    linkedin: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.full_name || '',
        currentRole: profile.current_designation || profile.current_profession || '',
        company: profile.current_company || '',
        degree: profile.degree || '',
        department: profile.department || '',
        graduationYear: profile.graduation_year ? String(profile.graduation_year) : '',
        bio: profile.bio || '',
        linkedin: profile.linkedin_url || ''
      });
    }
  }, [profile]);

  const updateProfileMutation = useApiMutation({
    mutationFn: (payload: any) => apiClient.patch('/alumni/profile', payload),
    invalidateQueries: [['alumni-profile']],
    onSuccess: () => {
      setIsEditing(false);
    }
  });

  const toggleMentorshipMutation = useApiMutation({
    mutationFn: ({ skillId, willing_to_mentor, found_challenging }: { skillId: string; willing_to_mentor?: boolean; found_challenging?: boolean }) =>
      apiClient.patch(`/alumni/skills/${skillId}/mentorship`, { willing_to_mentor, found_challenging }),
    invalidateQueries: [['alumni-skills']]
  });

  const addSkillMutation = useApiMutation({
    mutationFn: (skillName: string) =>
      apiClient.post('/alumni/skills', { skill_name: skillName, willing_to_mentor: false, found_challenging: false }),
    invalidateQueries: [['alumni-skills']],
    onSuccess: () => setNewSkill('')
  });

  const removeSkillMutation = useApiMutation({
    mutationFn: (skillId: string) => apiClient.delete(`/alumni/skills/${skillId}`),
    invalidateQueries: [['alumni-skills']]
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateProfileMutation.mutate({
      full_name: formData.name.trim() || undefined,
      current_designation: formData.currentRole.trim() || undefined,
      current_profession: formData.currentRole.trim() || undefined,
      current_company: formData.company.trim() || undefined,
      degree: formData.degree.trim() || undefined,
      department: formData.department.trim() || undefined,
      graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
      bio: formData.bio.trim() || undefined,
      linkedin_url: formData.linkedin.trim() || undefined
    });
  };

  const handleToggleMentorship = (skill: AlumniSkillItem, field: 'mentor' | 'challenging') => {
    const isMentor = field === 'mentor' ? !skill.willing_to_mentor : false;
    const isChallenging = field === 'challenging' ? !skill.found_challenging : false;
    
    toggleMentorshipMutation.mutate({
      skillId: skill.skill_id,
      willing_to_mentor: isMentor,
      found_challenging: isChallenging
    });
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (!newSkill.trim() || addSkillMutation.isPending) return;
      addSkillMutation.mutate(newSkill.trim());
    }
  };

  if (isProfileLoading) {
    return (
      <div className="p-12 text-center text-slate text-sm font-medium flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-ink" /> Loading alumni profile...
      </div>
    );
  }

  const displayName = formData.name || profile?.full_name || 'Alumni Member';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">My Profile</h1>
          <p className="text-sm text-slate mt-1">Manage your public alumni profile and mentorship settings.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-white border border-hairline text-ink px-4 py-2 rounded-sm text-sm font-bold hover:bg-slate/5 transition-colors shadow-sm"
          >
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => handleSave()}
            disabled={updateProfileMutation.isPending}
            className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        )}
      </div>

      {updateProfileMutation.isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-growth-teal" /> Profile updated successfully.
        </div>
      )}

      {updateProfileMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {updateProfileMutation.error?.message || 'Failed to update profile'}
        </div>
      )}

      {toggleMentorshipMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {toggleMentorshipMutation.error?.message || 'Failed to update mentorship preferences'}
        </div>
      )}

      {addSkillMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {addSkillMutation.error?.message || 'Failed to add skill'}
        </div>
      )}

      {removeSkillMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {removeSkillMutation.error?.message || 'Failed to remove skill'}
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <div className="h-32 bg-slate/10 relative"></div>
        <div className="px-8 pb-8 relative">
          {/* Avatar */}
          <div className="absolute -top-12 left-8">
            <div className="w-24 h-24 rounded-sm bg-white border-4 border-white shadow-sm overflow-hidden relative group">
              <div className="w-full h-full bg-slate/20 flex items-center justify-center text-3xl font-serif font-bold text-slate">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-ink/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Full Name</label>
                 {isEditing ? (
                   <input 
                     type="text" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})} 
                     className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                   />
                 ) : (
                   <div className="text-lg font-bold text-ink">{displayName}</div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 flex items-center gap-1"><Briefcase className="h-3 w-3"/> Current Role</label>
                   {isEditing ? (
                     <input 
                       type="text" 
                       value={formData.currentRole} 
                       onChange={e => setFormData({...formData, currentRole: e.target.value})} 
                       placeholder="e.g. Senior Cloud Architect"
                       className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                     />
                   ) : (
                     <div className="text-sm text-ink">{formData.currentRole || 'Not specified'}</div>
                   )}
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Company</label>
                   {isEditing ? (
                     <input 
                       type="text" 
                       value={formData.company} 
                       onChange={e => setFormData({...formData, company: e.target.value})} 
                       placeholder="e.g. TechCorp Global"
                       className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                     />
                   ) : (
                     <div className="text-sm font-bold text-ink">{formData.company || 'Not specified'}</div>
                   )}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 flex items-center gap-1"><GraduationCap className="h-3 w-3"/> Degree & Dept</label>
                   {isEditing ? (
                     <div className="space-y-1">
                       <input 
                         type="text" 
                         value={formData.degree} 
                         onChange={e => setFormData({...formData, degree: e.target.value})} 
                         placeholder="Degree (e.g. B.Tech)"
                         className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                       />
                       <input 
                         type="text" 
                         value={formData.department} 
                         onChange={e => setFormData({...formData, department: e.target.value})} 
                         placeholder="Dept (e.g. CSE)"
                         className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                       />
                     </div>
                   ) : (
                     <div className="text-sm text-ink">
                       {formData.degree ? `${formData.degree}${formData.department ? ` in ${formData.department}` : ''}` : 'Not specified'}
                     </div>
                   )}
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Class of</label>
                   {isEditing ? (
                     <input 
                       type="number" 
                       value={formData.graduationYear} 
                       onChange={e => setFormData({...formData, graduationYear: e.target.value})} 
                       placeholder="e.g. 2024"
                       className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                     />
                   ) : (
                     <div className="text-sm text-ink">{formData.graduationYear || 'Not specified'}</div>
                   )}
                 </div>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Professional Bio</label>
                 {isEditing ? (
                   <textarea 
                     rows={4} 
                     value={formData.bio} 
                     onChange={e => setFormData({...formData, bio: e.target.value})} 
                     placeholder="Specializing in distributed systems and cloud infrastructure..."
                     className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink resize-none" 
                   />
                 ) : (
                   <div className="text-sm text-ink leading-relaxed">{formData.bio || 'No bio provided yet.'}</div>
                 )}
               </div>

               <div>
                 <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> LinkedIn</label>
                 {isEditing ? (
                   <input 
                     type="text" 
                     value={formData.linkedin} 
                     onChange={e => setFormData({...formData, linkedin: e.target.value})} 
                     placeholder="linkedin.com/in/username"
                     className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" 
                   />
                 ) : (
                   formData.linkedin ? (
                     <a 
                       href={formData.linkedin.startsWith('http') ? formData.linkedin : `https://${formData.linkedin}`} 
                       target="_blank" 
                       rel="noreferrer" 
                       className="text-sm text-growth-teal hover:underline"
                     >
                       {formData.linkedin}
                     </a>
                   ) : (
                     <span className="text-sm text-slate">Not linked</span>
                   )
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expertise & Mentorship Section */}
      <div className="bg-white border border-hairline rounded-sm shadow-sm p-8">
         <div className="flex items-start justify-between mb-6">
           <div>
             <h2 className="text-lg font-serif font-bold text-ink">Expertise & Mentorship</h2>
             <p className="text-sm text-slate mt-1 max-w-2xl">
               List your skills. If you are open to mentoring students on a topic, toggle <span className="font-bold text-ink">Mentor</span>. If it's an area you found challenging when starting out, toggle <span className="font-bold text-ink">Challenging</span> to help normalize the learning curve.
             </p>
           </div>
           <div className="hidden md:flex bg-slate/5 border border-slate/10 px-3 py-2 rounded-sm items-center gap-2 text-xs text-slate">
             <Info className="h-4 w-4 text-ink" />
             These are self-reported and distinct from platform verifications.
           </div>
         </div>

         {isSkillsLoading ? (
           <div className="py-6 text-center text-slate text-sm flex items-center justify-center gap-2">
             <Loader2 className="h-4 w-4 animate-spin text-ink" /> Loading skills...
           </div>
         ) : skillsData.length === 0 ? (
           <div className="p-6 bg-paper border border-hairline rounded-sm text-center">
             <p className="text-sm text-slate mb-3">No skills added to your profile yet.</p>
             <p className="text-xs text-slate">Add skills below to indicate your mentorship areas to students.</p>
           </div>
         ) : (
           <div className="space-y-3 max-w-3xl">
             {skillsData.map(skill => {
               const skillName = skill.skills?.name || 'Skill';
               const isMentor = Boolean(skill.willing_to_mentor);
               const isChallenging = Boolean(skill.found_challenging);

               return (
                 <div key={skill.alumni_skill_id || skill.skill_id} className="flex items-center gap-4 bg-paper p-3 border border-hairline rounded-sm hover:border-slate/30 transition-colors">
                   <div className="flex-1 font-bold text-sm text-ink">{skillName}</div>
                   
                   <div className="flex items-center gap-2">
                     <button 
                       type="button"
                       disabled={toggleMentorshipMutation.isPending}
                       onClick={() => handleToggleMentorship(skill, 'mentor')}
                       className={cn(
                         "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-colors border cursor-pointer",
                         isMentor 
                           ? "bg-ink text-paper border-ink" 
                           : "bg-white text-slate border-hairline hover:bg-slate/5"
                       )}
                     >
                       <HandHeart className="h-3.5 w-3.5" /> 
                       Willing to Mentor
                     </button>
                     
                     <button 
                       type="button"
                       disabled={toggleMentorshipMutation.isPending}
                       onClick={() => handleToggleMentorship(skill, 'challenging')}
                       className={cn(
                         "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-colors border cursor-pointer",
                         isChallenging 
                           ? "bg-slate/20 text-ink border-slate/30" 
                           : "bg-white text-slate border-hairline hover:bg-slate/5"
                       )}
                     >
                       Found Challenging
                     </button>

                     <button 
                       type="button"
                       disabled={removeSkillMutation.isPending}
                       onClick={() => removeSkillMutation.mutate(skill.skill_id)} 
                       className="p-1.5 text-slate hover:text-alert-rust transition-colors ml-2 cursor-pointer"
                       title="Remove skill"
                     >
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                 </div>
               );
             })}
           </div>
         )}

         {/* Add Skill Form */}
         <div className="flex items-center gap-3 mt-6 max-w-3xl">
           <Plus className="h-4 w-4 text-slate flex-shrink-0" />
           <input 
             type="text" 
             placeholder="Type a skill and press Enter (or click Add)..."
             value={newSkill}
             onChange={e => setNewSkill(e.target.value)}
             onKeyDown={handleAddSkill}
             disabled={addSkillMutation.isPending}
             className="flex-1 bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
           />
           <button
             type="button"
             onClick={handleAddSkill}
             disabled={!newSkill.trim() || addSkillMutation.isPending}
             className="bg-ink text-paper px-4 py-2 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 cursor-pointer"
           >
             {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
           </button>
         </div>
      </div>
    </div>
  );
}
