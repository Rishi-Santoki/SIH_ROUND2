import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, ArrowRight, BookOpen, CheckCircle, Clock, Edit2, X, AlertCircle } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { Link } from 'react-router-dom';

interface CareerRole {
  career_role_id: string;
  title: string;
  category?: string;
  description?: string;
}

export function StudentDashboard() {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    department: '',
    current_year: 3,
    cgpa: 8.5,
    graduation_year: 2027
  });

  // 1. Fetch Profile
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/student/profile');
      } catch {
        return null;
      }
    }
  });

  // 2. Fetch Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['student', 'readiness'],
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/student/readiness');
      } catch {
        return null;
      }
    }
  });

  // 3. Fetch Skills
  const { data: skillsData } = useQuery({
    queryKey: ['student', 'skills'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/skills');
      } catch {
        return [];
      }
    }
  });

  // 4. Fetch Applications
  const { data: applicationsData } = useQuery({
    queryKey: ['student', 'applications'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/applications');
      } catch {
        return [];
      }
    }
  });

  // 5. Fetch Learning Progress
  const { data: learningData } = useQuery({
    queryKey: ['student', 'learning-progress'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/learning-progress');
      } catch {
        return [];
      }
    }
  });

  // 6. Fetch Career Roles for dropdown
  const { data: careerRoles } = useQuery({
    queryKey: ['career-roles'],
    queryFn: async () => {
      try {
        return await apiClient.get<CareerRole[]>('/auth/career-roles');
      } catch {
        return [];
      }
    }
  });

  // Mutation to update target role
  const updateRoleMutation = useApiMutation({
    mutationFn: async (roleId: string) => {
      return await apiClient.put('/student/profile/target-role', { target_career_id: roleId });
    },
    invalidateQueries: [['student', 'profile'], ['student', 'readiness'], ['student', 'skills']],
    successMessage: 'Target role updated successfully!',
    onSuccess: () => {
      setIsEditingRole(false);
    }
  });

  // Mutation to update general profile fields
  const updateProfileMutation = useApiMutation({
    mutationFn: async (data: any) => {
      return await apiClient.patch('/student/profile', data);
    },
    invalidateQueries: [['student', 'profile']],
    successMessage: 'Profile details saved!',
    onSuccess: () => {
      setIsEditingProfile(false);
    }
  });

  const studentProfile = profileData?.student_profiles?.[0] || profileData?.student_profiles || {};
  const currentRole = careerRoles?.find(r => r.career_role_id === studentProfile.target_career_id);
  const targetRoleTitle = currentRole?.title || readinessData?.target_role_title || 'Junior Data Scientist';

  const readinessScore = readinessData?.readiness_score 
    ? Math.round(readinessData.readiness_score) 
    : (studentProfile.readiness_score || 65);

  const verifiedCount = skillsData?.filter(s => s.verification_status === 'verified').length ?? 12;
  const selfDeclaredCount = skillsData?.filter(s => s.verification_status === 'unverified' || s.source === 'self_declared').length ?? 8;
  const activeAppsCount = applicationsData?.filter(a => a.status !== 'rejected').length ?? 3;

  const currentCourse = learningData?.[0] || null;

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) return;
    updateRoleMutation.mutate(selectedRoleId);
  };

  const handleOpenEditProfile = () => {
    setProfileForm({
      bio: studentProfile.bio || '',
      department: studentProfile.department || 'CSE',
      current_year: studentProfile.current_year || 3,
      cgpa: studentProfile.cgpa || 8.5,
      graduation_year: studentProfile.graduation_year || 2027
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  return (
    <div className="space-y-6">
      
      {/* Readiness Hero Card */}
      <div className="bg-white rounded-sm border border-hairline p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm relative">
        {/* Radial Progress */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate/10"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-growth-teal transition-all duration-1000"
              strokeWidth="3"
              strokeDasharray={`${readinessScore}, 100`}
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-serif font-bold text-ink">{readinessScore}%</span>
            <span className="text-[10px] uppercase tracking-wider text-slate font-medium">Readiness</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate uppercase tracking-wider">Target Role</h2>
              <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-3">
                {targetRoleTitle}
                <button
                  onClick={() => {
                    setSelectedRoleId(studentProfile.target_career_id || '');
                    setIsEditingRole(true);
                  }}
                  className="text-xs font-sans font-medium text-slate hover:text-ink flex items-center gap-1 bg-paper border border-hairline px-2 py-1 rounded-sm"
                  title="Change Target Role"
                >
                  <Edit2 className="h-3 w-3" /> Change
                </button>
              </h1>
              <p className="text-sm text-slate mt-1">
                Based on {verifiedCount} verified skills and platform assessments.
              </p>
            </div>

            <button
              onClick={handleOpenEditProfile}
              className="self-start sm:self-center text-xs font-medium text-slate hover:text-ink bg-paper border border-hairline px-3 py-1.5 rounded-sm flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
          
          <div className="bg-paper p-4 rounded-sm border border-hairline flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate uppercase tracking-wider mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" /> Next Best Action
              </div>
              <div className="font-medium text-ink text-sm">
                Pass available Assessments to close your highest-ranked gap and increase matching score.
              </div>
            </div>
            <Link 
              to="/student/assessments" 
              className="flex items-center justify-center h-8 w-8 bg-ink text-paper rounded-full hover:bg-ink/90 transition-colors shrink-0 ml-4"
              title="Go to Assessments"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Target Role Edit Modal */}
      {isEditingRole && (
        <div className="fixed inset-0 bg-ink/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-hairline rounded-sm max-w-md w-full p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-hairline pb-3">
              <h3 className="font-serif font-bold text-lg text-ink">Change Target Role</h3>
              <button onClick={() => setIsEditingRole(false)} className="text-slate hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
                  Select Target Career Role
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  required
                >
                  <option value="">-- Choose a career role --</option>
                  {careerRoles?.map((r) => (
                    <option key={r.career_role_id} value={r.career_role_id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate mt-1.5">
                  Updating your target role recalibrates skill gap analysis, roadmaps, and opportunity matching.
                </p>
              </div>

              {updateRoleMutation.isError && (
                <div className="p-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm text-xs text-alert-rust flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{updateRoleMutation.error?.message || 'Failed to update target role'}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingRole(false)}
                  className="px-4 py-2 text-sm text-slate hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRoleMutation.isPending || !selectedRoleId}
                  className="bg-ink text-paper px-5 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateRoleMutation.isPending ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-ink/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-hairline rounded-sm max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-hairline pb-3">
              <h3 className="font-serif font-bold text-lg text-ink">Edit Academic Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                    Current Year
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={profileForm.current_year}
                    onChange={(e) => setProfileForm({ ...profileForm, current_year: parseInt(e.target.value) || 1 })}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={profileForm.cgpa}
                    onChange={(e) => setProfileForm({ ...profileForm, cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2032"
                    value={profileForm.graduation_year}
                    onChange={(e) => setProfileForm({ ...profileForm, graduation_year: parseInt(e.target.value) || 2027 })}
                    className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                  Bio / Objective
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell recruiters about your passions and career focus..."
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
                />
              </div>

              {updateProfileMutation.isError && (
                <div className="p-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm text-xs text-alert-rust flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{updateProfileMutation.error?.message || 'Failed to update profile'}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-sm text-slate hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-ink text-paper px-5 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/student/applications" className="bg-white p-5 rounded-sm border border-hairline flex items-center justify-between shadow-sm hover:border-ink transition-colors">
          <div>
            <p className="text-sm text-slate font-medium">Active Applications</p>
            <p className="text-2xl font-serif font-bold text-ink mt-1">{activeAppsCount}</p>
          </div>
          <div className="h-10 w-10 bg-slate/5 rounded-full flex items-center justify-center text-slate">
            <Clock className="h-5 w-5" />
          </div>
        </Link>
        
        <Link to="/student/skills" className="bg-white p-5 rounded-sm border border-hairline flex items-center justify-between shadow-sm hover:border-ink transition-colors">
          <div>
            <p className="text-sm text-slate font-medium mb-2">Skill Verification</p>
            <div className="flex items-center gap-2">
              <ProofBadge status="verified" label={String(verifiedCount)} />
              <ProofBadge status="self-declared" label={String(selfDeclaredCount)} />
            </div>
          </div>
          <div className="h-10 w-10 bg-verified-gold/10 rounded-full flex items-center justify-center text-verified-gold">
            <CheckCircle className="h-5 w-5" />
          </div>
        </Link>

        <Link to="/student/opportunities" className="bg-white p-5 rounded-sm border border-hairline flex items-center justify-between shadow-sm hover:border-ink transition-colors">
          <div>
            <p className="text-sm text-slate font-medium">Matching Opportunities</p>
            <p className="text-sm font-serif font-bold text-ink mt-1">Explore Open Roles</p>
            <p className="text-xs text-growth-teal mt-1 font-medium">Based on current DNA</p>
          </div>
          <div className="h-10 w-10 bg-growth-teal/10 rounded-full flex items-center justify-center text-growth-teal">
            <Target className="h-5 w-5" />
          </div>
        </Link>
      </div>

      {/* Continue Where You Left Off */}
      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline bg-paper">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Continue Where You Left Off</h3>
        </div>
        <Link 
          to="/student/learning"
          className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between hover:bg-slate/5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-growth-teal/10 rounded-sm flex items-center justify-center text-growth-teal">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-ink group-hover:text-growth-teal transition-colors">
                {currentCourse?.learning_programs?.title || 'Python Data Structures'}
              </h4>
              <p className="text-sm text-slate mt-1">
                {currentCourse ? `Status: ${currentCourse.status}` : 'Step 3 of 5 in your Data Scientist Roadmap'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="flex-1 sm:w-32 bg-slate/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-growth-teal h-full transition-all" 
                  style={{ width: `${currentCourse?.progress_percentage ?? 60}%` }} 
                />
             </div>
             <span className="text-xs font-bold text-slate">{currentCourse?.progress_percentage ?? 60}%</span>
             <ArrowRight className="h-4 w-4 text-slate opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </div>

    </div>
  );
}
