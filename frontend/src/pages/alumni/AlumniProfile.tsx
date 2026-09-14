import React, { useState } from 'react';
import { Camera, Save, Plus, X, Briefcase, GraduationCap, Link as LinkIcon, HandHeart, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_PROFILE = {
  name: 'Alex Mercer',
  degree: 'B.Tech',
  department: 'Computer Science',
  graduationYear: '2020',
  currentRole: 'Senior Cloud Architect',
  company: 'TechCorp Global',
  bio: 'Specializing in distributed systems and cloud infrastructure. Passionate about helping the next generation of engineers navigate their early careers.',
  linkedin: 'linkedin.com/in/alexmercer',
  skills: [
    { id: 's1', name: 'AWS Architecture', mentor: true, challenging: false },
    { id: 's2', name: 'System Design', mentor: true, challenging: false },
    { id: 's3', name: 'Go (Golang)', mentor: false, challenging: true },
    { id: 's4', name: 'Kubernetes', mentor: false, challenging: false },
  ]
};

export function AlumniProfile() {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const handleSave = () => {
    setIsEditing(false);
  };

  const toggleSkillState = (id: string, field: 'mentor' | 'challenging') => {
    if (!isEditing) return;
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map(s => {
        if (s.id === id) {
          // They are mutually exclusive toggles for UI clarity, though not strictly required to be
          return { ...s, [field]: !s[field], [field === 'mentor' ? 'challenging' : 'mentor']: false };
        }
        return s;
      })
    }));
  };

  const removeSkill = (id: string) => {
    if (!isEditing) return;
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim() && isEditing) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, { id: `new-${Date.now()}`, name: newSkill.trim(), mentor: false, challenging: false }]
      }));
      setNewSkill('');
    }
  };

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
            onClick={handleSave}
            className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> Save Changes
          </button>
        )}
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <div className="h-32 bg-slate/10 relative"></div>
        <div className="px-8 pb-8 relative">
          {/* Avatar */}
          <div className="absolute -top-12 left-8">
            <div className="w-24 h-24 rounded-sm bg-white border-4 border-white shadow-sm overflow-hidden relative group">
              <div className="w-full h-full bg-slate/20 flex items-center justify-center text-3xl font-serif font-bold text-slate">
                {profile.name.charAt(0)}
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
                   <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                 ) : (
                   <div className="text-lg font-bold text-ink">{profile.name}</div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 flex items-center gap-1"><Briefcase className="h-3 w-3"/> Current Role</label>
                   {isEditing ? (
                     <input type="text" value={profile.currentRole} onChange={e => setProfile({...profile, currentRole: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                   ) : (
                     <div className="text-sm text-ink">{profile.currentRole}</div>
                   )}
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Company</label>
                   {isEditing ? (
                     <input type="text" value={profile.company} onChange={e => setProfile({...profile, company: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                   ) : (
                     <div className="text-sm font-bold text-ink">{profile.company}</div>
                   )}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 flex items-center gap-1"><GraduationCap className="h-3 w-3"/> Degree</label>
                   {isEditing ? (
                     <input type="text" value={profile.degree} onChange={e => setProfile({...profile, degree: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                   ) : (
                     <div className="text-sm text-ink">{profile.degree} in {profile.department}</div>
                   )}
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Class of</label>
                   {isEditing ? (
                     <input type="text" value={profile.graduationYear} onChange={e => setProfile({...profile, graduationYear: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                   ) : (
                     <div className="text-sm text-ink">{profile.graduationYear}</div>
                   )}
                 </div>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Professional Bio</label>
                 {isEditing ? (
                   <textarea rows={4} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink resize-none" />
                 ) : (
                   <div className="text-sm text-ink leading-relaxed">{profile.bio}</div>
                 )}
               </div>

               <div>
                 <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> LinkedIn</label>
                 {isEditing ? (
                   <input type="text" value={profile.linkedin} onChange={e => setProfile({...profile, linkedin: e.target.value})} className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink" />
                 ) : (
                   <a href={`https://${profile.linkedin}`} target="_blank" rel="noreferrer" className="text-sm text-growth-teal hover:underline">{profile.linkedin}</a>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

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

         <div className="space-y-3 max-w-3xl">
           {profile.skills.map(skill => (
             <div key={skill.id} className="flex items-center gap-4 bg-paper p-3 border border-hairline rounded-sm hover:border-slate/30 transition-colors">
               <div className="flex-1 font-bold text-sm text-ink">{skill.name}</div>
               
               <div className="flex items-center gap-2">
                 <button 
                   disabled={!isEditing}
                   onClick={() => toggleSkillState(skill.id, 'mentor')}
                   className={cn(
                     "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-colors border",
                     skill.mentor 
                       ? "bg-ink text-paper border-ink" 
                       : "bg-white text-slate border-hairline hover:bg-slate/5 disabled:hover:bg-white"
                   )}
                 >
                   <HandHeart className="h-3.5 w-3.5" /> 
                   Willing to Mentor
                 </button>
                 
                 <button 
                   disabled={!isEditing}
                   onClick={() => toggleSkillState(skill.id, 'challenging')}
                   className={cn(
                     "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-colors border",
                     skill.challenging 
                       ? "bg-slate/20 text-ink border-slate/30" 
                       : "bg-white text-slate border-hairline hover:bg-slate/5 disabled:hover:bg-white"
                   )}
                 >
                   Found Challenging
                 </button>

                 {isEditing && (
                   <button onClick={() => removeSkill(skill.id)} className="p-1.5 text-slate hover:text-alert-rust transition-colors ml-2">
                     <X className="h-4 w-4" />
                   </button>
                 )}
               </div>
             </div>
           ))}

           {isEditing && (
             <div className="flex items-center gap-2 mt-4">
               <Plus className="h-4 w-4 text-slate" />
               <input 
                 type="text" 
                 placeholder="Type a skill and press Enter to add..."
                 value={newSkill}
                 onChange={e => setNewSkill(e.target.value)}
                 onKeyDown={addSkill}
                 className="flex-1 bg-transparent border-b border-hairline py-2 text-sm focus:outline-none focus:border-ink transition-colors"
               />
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
