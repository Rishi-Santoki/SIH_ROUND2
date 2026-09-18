import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Building, GraduationCap, MessageCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface AlumniItem {
  alumni_id: string;
  id?: string;
  full_name?: string;
  name?: string;
  degree?: string;
  department?: string;
  graduation_year?: number | string;
  year?: string;
  current_profession?: string;
  current_designation?: string;
  role?: string;
  current_company?: string;
  company?: string;
  skills?: string[] | { skill_name: string }[];
  is_verified?: boolean;
  match_reasons?: string[];
  reason?: string;
}

export function SharedAlumniNetwork() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAcademician = location.pathname.startsWith('/academician');
  const basePath = isAcademician ? '/academician' : '/student';

  const [activeTab, setActiveTab] = useState<'recommended' | 'browse'>('recommended');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAlumniId, setActiveAlumniId] = useState<string | null>(null);

  const endpoint = isAcademician ? '/academician/alumni' : '/student/alumni';

  const { data: alumniList = [], isLoading, error } = useQuery<AlumniItem[]>({
    queryKey: [isAcademician ? 'academician' : 'student', 'alumni', searchTerm],
    queryFn: () => {
      const url = searchTerm ? `${endpoint}?search=${encodeURIComponent(searchTerm)}` : endpoint;
      return apiClient<AlumniItem[]>(url);
    },
  });

  const conversationMutation = useApiMutation(
    (alumniId: string) =>
      apiClient<{ conversation_id?: string; id?: string }>('/community/conversations', {
        method: 'POST',
        data: { alumni_id: alumniId },
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

  const handleStartConversation = (alumniId: string) => {
    setActiveAlumniId(alumniId);
    conversationMutation.mutate(alumniId);
  };

  const displayedAlumni = alumniList.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (a.full_name || a.name || '').toLowerCase();
    const comp = (a.current_company || a.company || '').toLowerCase();
    const role = (a.current_designation || a.current_profession || a.role || '').toLowerCase();
    return name.includes(term) || comp.includes(term) || role.includes(term);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Alumni Network</h1>
        <p className="text-sm text-slate mt-1">
          {isAcademician 
            ? 'Connect with verified alumni from your institution for research, guest lectures, and mentorship.'
            : 'Connect with graduates who have walked your path.'}
        </p>
      </div>

      <div className="border-b border-hairline flex gap-8">
        <button 
          onClick={() => setActiveTab('recommended')}
          className={cn(
            "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
            activeTab === 'recommended' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Recommended for you
          {activeTab === 'recommended' && <div className="absolute bottom-0 left-0 w-full h-1 bg-ink rounded-t-sm" />}
        </button>
        <button 
          onClick={() => setActiveTab('browse')}
          className={cn(
            "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
            activeTab === 'browse' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Browse All
          {activeTab === 'browse' && <div className="absolute bottom-0 left-0 w-full h-1 bg-ink rounded-t-sm" />}
        </button>
      </div>

      <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-3">
        <Search className="h-5 w-5 text-slate ml-2" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, company, or role..." 
          className="flex-1 bg-transparent text-sm focus:outline-none py-1"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="text-xs text-slate hover:text-ink px-2"
          >
            Clear
          </button>
        )}
      </div>

      {conversationMutation.isError && (
        <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-3 flex items-start gap-2 text-alert-rust">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">
            {conversationMutation.error?.message || 'Failed to start conversation with alumni.'}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load alumni: {(error as any)?.message || 'Network error'}</span>
        </div>
      ) : displayedAlumni.length === 0 ? (
        <div className="bg-white border border-hairline rounded-sm p-12 text-center">
          <GraduationCap className="h-10 w-10 text-slate mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-ink">No Verified Alumni Found</h3>
          <p className="text-sm text-slate mt-1 max-w-md mx-auto">
            {searchTerm 
              ? `No alumni matching "${searchTerm}". Try a different search.` 
              : 'Once alumni from your institution verify their profiles, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedAlumni.map((alumni) => {
            const alumniId = alumni.alumni_id || alumni.id || '';
            const name = alumni.full_name || alumni.name || 'Alumni Member';
            const company = alumni.current_company || alumni.company || 'Industry';
            const role = alumni.current_designation || alumni.current_profession || alumni.role || 'Professional';
            const degree = alumni.degree || alumni.department || 'Graduate';
            const year = alumni.graduation_year || alumni.year || '';
            const reason = alumni.reason || (alumni.match_reasons && alumni.match_reasons[0]);
            const isConnecting = conversationMutation.isPending && activeAlumniId === alumniId;

            return (
              <div key={alumniId} className="bg-white border border-hairline rounded-sm shadow-sm flex flex-col">
                {reason && (
                  <div className="bg-slate/5 px-5 py-2 border-b border-hairline text-xs font-medium text-slate">
                    <span className="font-bold text-ink">Why recommended:</span> {reason}
                  </div>
                )}
                
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center font-serif font-bold text-ink text-xl">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-ink text-lg flex items-center gap-2">
                          {name} <ProofBadge status={alumni.is_verified ? "verified" : "unverified"} />
                        </h3>
                        <p className="text-sm text-slate flex items-center gap-1 mt-1">
                          <GraduationCap className="h-4 w-4" /> {degree}{year ? `, Class of ${year}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-paper border border-hairline p-3 rounded-sm mb-4">
                    <p className="text-sm font-bold text-ink flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate" /> {role} @ {company}
                    </p>
                  </div>

                  {Array.isArray(alumni.skills) && alumni.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {alumni.skills.map((skill: any, idx: number) => {
                        const sName = typeof skill === 'string' ? skill : skill.skill_name;
                        return (
                          <span key={idx} className="bg-white border border-hairline px-2 py-1 rounded-sm text-xs font-bold text-slate uppercase tracking-wider">
                            {sName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-hairline bg-paper flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleStartConversation(alumniId)}
                      disabled={conversationMutation.isPending}
                      className="flex-1 bg-ink text-paper py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4" /> Message
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => navigate(`${basePath}/alumni/${alumniId}`)}
                      className="flex-1 bg-white border border-hairline text-ink py-2 rounded-sm text-sm font-medium hover:bg-slate/5 transition-colors flex items-center justify-center gap-2"
                    >
                      View Profile <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

