import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Building, ArrowLeft, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { ProofBadge } from '../../components/ui/ProofBadge';

interface AlumniDetail {
  alumni_id?: string;
  id?: string;
  full_name?: string;
  name?: string;
  graduation_year?: number | string;
  year?: string;
  degree?: string;
  department?: string;
  current_role?: string;
  role?: string;
  current_company?: string;
  company?: string;
  bio?: string;
  skills?: string[] | { skill_name: string; skill_id?: string }[];
  is_verified?: boolean;
}

export function StudentAlumniDetail() {
  const { alumniId } = useParams<{ alumniId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAcademician = location.pathname.startsWith('/academician');
  const basePath = isAcademician ? '/academician' : '/student';

  const { data: alumni, isLoading, error } = useQuery<AlumniDetail>({
    queryKey: [isAcademician ? 'academician' : 'student', 'alumni', alumniId],
    queryFn: () => apiClient<AlumniDetail>(`/${isAcademician ? 'academician' : 'student'}/alumni/${alumniId}`),
    retry: 1,
  });

  const messageMutation = useApiMutation(
    (targetAlumniId: string) =>
      apiClient<{ conversation_id?: string; id?: string }>('/community/conversations', {
        method: 'POST',
        data: { alumni_id: targetAlumniId },
      }),
    {
      onSuccess: (data) => {
        const convoId = data?.conversation_id || data?.id;
        if (convoId) {
          navigate(`${basePath}/messages/${convoId}`);
        } else {
          navigate(`${basePath}/messages`);
        }
      },
    }
  );

  const handleMessage = () => {
    if (alumniId) {
      messageMutation.mutate(alumniId);
    }
  };

  const name = alumni?.full_name || alumni?.name || 'Alumni Profile';
  const role = alumni?.current_role || alumni?.role || 'Professional';
  const company = alumni?.current_company || alumni?.company || 'Company';
  const degree = alumni?.degree || alumni?.department || 'Graduate';
  const year = alumni?.graduation_year || alumni?.year || '';

  return (
    <div className="space-y-6 max-w-4xl">
      <Link 
        to={`${basePath}/alumni`} 
        className="inline-flex items-center gap-2 text-sm font-medium text-slate hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Alumni Network
      </Link>

      {isLoading ? (
        <div className="bg-white border border-hairline rounded-sm p-12 text-center text-slate">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-ink" />
          Loading alumni profile...
        </div>
      ) : error ? (
        <div className="bg-white border border-hairline rounded-sm p-8 text-center space-y-4">
          <div className="bg-alert-rust/10 border border-alert-rust/20 text-alert-rust p-4 rounded-sm text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error instanceof Error ? error.message : 'Could not fetch alumni details'}</span>
          </div>
          <p className="text-xs text-slate">You may only view profiles of alumni within your institution.</p>
        </div>
      ) : (
        <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-hairline">
            <div className="flex items-start gap-5">
              <div className="h-16 w-16 rounded-full bg-slate/10 flex items-center justify-center font-serif font-bold text-ink text-2xl shrink-0">
                {name.charAt(0)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-serif font-bold text-ink">{name}</h1>
                  <ProofBadge status={alumni?.is_verified !== false ? 'verified' : 'pending'} />
                </div>
                <p className="text-base font-bold text-ink flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate" /> {role} @ {company}
                </p>
                <p className="text-sm text-slate flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-slate" /> {degree} {year ? `• Class of ${year}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={handleMessage}
                disabled={messageMutation.isPending}
                className="bg-ink text-paper px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {messageMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </>
                )}
              </button>
              {messageMutation.isError && (
                <p className="text-xs text-alert-rust max-w-xs text-right">
                  {messageMutation.error?.message || 'Failed to start conversation'}
                </p>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {alumni?.bio && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate uppercase tracking-wider">About</h3>
                <p className="text-sm text-slate leading-relaxed">{alumni.bio}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate uppercase tracking-wider">Verified Expertise & Skills</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(alumni?.skills) && alumni.skills.length > 0 ? (
                  alumni.skills.map((skill: any, idx: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.skill_name || 'Skill';
                    return (
                      <span 
                        key={idx} 
                        className="bg-paper border border-hairline px-3 py-1.5 rounded-sm text-xs font-bold text-ink"
                      >
                        {skillName}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate italic">No skills listed yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
