import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building, MapPin, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface OpportunityItem {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  breakdown: {
    skill: number;
    evidence: number;
    projects: number;
    eligibility: number;
  };
  explanation?: {
    skillMatch?: string;
    evidenceWeight?: string;
    projects?: string;
    eligibility?: string;
  };
}

const FALLBACK_OPPS: OpportunityItem[] = [
  {
    id: 'b3119318-a471-4880-a00d-fed40f3d4f79',
    title: 'Machine Learning Engineer Intern',
    company: 'TechNova Solutions',
    location: 'Bangalore, India',
    matchScore: 88,
    breakdown: { skill: 40, evidence: 30, projects: 10, eligibility: 8 },
    explanation: {
      skillMatch: 'Based on 5 overlapping requirements',
      evidenceWeight: 'You have verified proof for 80% of skills',
      projects: '2 projects mapped to role domain',
      eligibility: 'Degree and graduation year align',
    }
  },
  {
    id: 'b3119318-a471-4880-a00d-fed40f3d4f79',
    title: 'Junior Data Analyst',
    company: 'TechCorp',
    location: 'Remote',
    matchScore: 78,
    breakdown: { skill: 35, evidence: 25, projects: 10, eligibility: 8 },
    explanation: {
      skillMatch: 'Based on 4 overlapping requirements',
      evidenceWeight: 'Verified proof for 70% of skills',
      projects: '1 project mapped to data analysis',
      eligibility: 'Meets academic criteria',
    }
  }
];

export function StudentOpportunities() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  // Query recommended opportunities from backend
  const { data: recData } = useQuery({
    queryKey: ['student', 'opportunities', 'recommended'],
    queryFn: () => apiClient<{ weights_version?: number; matches?: any[] }>('/student/opportunities/recommended'),
    retry: 1,
  });

  // Query existing applications to reflect already-applied status
  const { data: existingApps } = useQuery({
    queryKey: ['student', 'applications'],
    queryFn: () => apiClient<any[]>('/student/applications'),
    retry: 1,
  });

  useEffect(() => {
    if (Array.isArray(existingApps)) {
      const ids = new Set<string>();
      existingApps.forEach((app: any) => {
        if (app.opportunity_id) ids.add(app.opportunity_id);
      });
      setAppliedIds(ids);
    }
  }, [existingApps]);

  // Merge recommended matches or fallback
  const opportunities: OpportunityItem[] = useMemo(() => {
    if (recData?.matches && recData.matches.length > 0) {
      return recData.matches.map((m: any, idx: number) => {
        const rawScore = typeof m.match_score === 'number' ? Math.round(m.match_score) : 80;
        const bd = m.breakdown || {};
        return {
          id: m.opportunity_id || `rec-${idx}`,
          title: m.title || 'Software / ML Engineer',
          company: m.company || 'TechCorp',
          location: m.location || 'Remote',
          matchScore: Math.min(100, Math.max(0, rawScore)),
          breakdown: {
            skill: Math.round(bd.skill_compatibility ?? 40),
            evidence: Math.round(bd.assessment_evidence ?? 25),
            projects: Math.round(bd.projects_experience ?? 15),
            eligibility: Math.round(bd.eligibility ?? 10),
          },
          explanation: {
            skillMatch: m.matched?.length ? `Matched skills: ${m.matched.slice(0, 3).join(', ')}` : 'Based on overlapping requirements',
            evidenceWeight: bd.assessment_evidence ? `Assessment score: ${Math.round(bd.assessment_evidence)}%` : 'Verified ledger evidence',
            projects: bd.projects_experience ? `Verified project score: ${Math.round(bd.projects_experience)}%` : 'Mapped project domain',
            eligibility: m.missing?.length ? `Gaps: ${m.missing.slice(0, 2).join(', ')}` : 'Requirements satisfied',
          }
        };
      });
    }
    return FALLBACK_OPPS;
  }, [recData]);

  // Set default expanded card
  useEffect(() => {
    if (!expandedId && opportunities.length > 0) {
      setExpandedId(opportunities[0].id);
    }
  }, [opportunities, expandedId]);

  const applyMutation = useApiMutation(
    (opportunityId: string) =>
      apiClient('/student/applications', {
        method: 'POST',
        data: { opportunity_id: opportunityId },
      }),
    {
      invalidateQueries: [['student', 'applications']],
      onSuccess: (_, oppId) => {
        setAppliedIds(prev => new Set(prev).add(oppId));
        setErrorMap(prev => {
          const next = { ...prev };
          delete next[oppId];
          return next;
        });
      },
      onError: (err, oppId) => {
        setErrorMap(prev => ({
          ...prev,
          [oppId]: err.message || 'Failed to submit application',
        }));
      },
    }
  );

  const handleApply = (oppId: string) => {
    setApplyingId(oppId);
    applyMutation.mutate(oppId, {
      onSettled: () => setApplyingId(null),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Opportunities</h1>
        <p className="text-sm text-slate mt-1">Roles matched specifically to your verified skills and evidence ledger.</p>
      </div>

      <div className="space-y-4">
        {opportunities.map((opp, idx) => {
          const isExpanded = expandedId === opp.id || (expandedId === null && idx === 0);
          const hasApplied = appliedIds.has(opp.id);
          const isCurrentApplying = applyingId === opp.id;

          return (
            <div key={`${opp.id}-${idx}`} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden transition-colors hover:border-slate/30">
              <div 
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : opp.id)}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-ink text-lg">{opp.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate mt-2">
                    <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {opp.company}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {opp.location}</span>
                  </div>
                </div>

                <div className="w-full md:w-64">
                  <MatchScoreVisualizer score={opp.matchScore} breakdown={opp.breakdown} />
                </div>

                <div className="text-slate">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-hairline bg-paper animate-in slide-in-from-top-2">
                  <h4 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Score Breakdown Explainability</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-growth-teal" />
                        <span className="text-xs font-bold text-ink">Skill Match</span>
                      </div>
                      <span className="text-sm text-slate">{opp.explanation?.skillMatch || 'Based on overlapping requirements'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-verified-gold" />
                        <span className="text-xs font-bold text-ink">Evidence Weight</span>
                      </div>
                      <span className="text-sm text-slate">{opp.explanation?.evidenceWeight || 'Verified proof on ledger'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-ink" />
                        <span className="text-xs font-bold text-ink">Projects</span>
                      </div>
                      <span className="text-sm text-slate">{opp.explanation?.projects || 'Domain-mapped projects'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-slate" />
                        <span className="text-xs font-bold text-ink">Eligibility</span>
                      </div>
                      <span className="text-sm text-slate">{opp.explanation?.eligibility || 'Degree & graduation year align'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex flex-col items-end gap-2">
                    {hasApplied ? (
                      <div className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Applied via ProofLedger
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(opp.id);
                        }}
                        disabled={isCurrentApplying}
                        className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isCurrentApplying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Applying...
                          </>
                        ) : (
                          'Apply via ProofLedger'
                        )}
                      </button>
                    )}

                    {errorMap[opp.id] && (
                      <p className="text-xs text-alert-rust flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorMap[opp.id]}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
