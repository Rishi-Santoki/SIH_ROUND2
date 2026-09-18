import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { BookOpen, Map, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Sparkles, AlertCircle, FileBadge } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface RoadmapStep {
  step_number: number;
  title: string;
  description: string;
  key_topics: string[];
  matched_learning_program?: { program_id: string; title: string } | null;
  matched_assessment?: { assessment_id: string; title: string } | null;
}

interface RoadmapResponse {
  status: 'generated' | 'already_mastered';
  skill_id: string;
  starting_point: string;
  path: RoadmapStep[];
}

export function StudentRoadmap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSkill = searchParams.get('skill');

  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapResponse | null>(null);
  const isInitializedRef = React.useRef(false);

  // 1. Fetch Student Skills
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

  // Combine student skills with URL target skill if not already present
  const availableSkills = React.useMemo(() => {
    const list = [...skills];
    if (urlSkill) {
      const match = list.find(s => 
        s.skill_id === urlSkill || 
        s.skill_name?.toLowerCase() === urlSkill.toLowerCase()
      );
      if (!match) {
        list.unshift({
          skill_id: urlSkill,
          skill_name: urlSkill,
          verification_status: 'target gap'
        });
      }
    }
    return list;
  }, [skills, urlSkill]);

  // Set selected skill from URL or default to first available only once when skills load
  useEffect(() => {
    if (availableSkills.length > 0 && !isInitializedRef.current) {
      isInitializedRef.current = true;
      if (urlSkill) {
        const matched = availableSkills.find(s => 
          s.skill_id === urlSkill || 
          s.skill_name?.toLowerCase() === urlSkill.toLowerCase()
        );
        setSelectedSkillId(matched ? matched.skill_id : urlSkill);
      } else {
        setSelectedSkillId(availableSkills[0].skill_id);
      }
    }
  }, [availableSkills, urlSkill]);

  const handleSelectSkill = (newId: string) => {
    setSelectedSkillId(newId);
    setCurrentRoadmap(null);
    const item = availableSkills.find(s => s.skill_id === newId);
    if (item) {
      setSearchParams({ skill: item.skill_name });
    }
  };

  // 2. Query cached/existing Roadmap for selected skill
  const { data: cachedRoadmap, isLoading: isFetchingRoadmap } = useQuery<RoadmapResponse | null>({
    queryKey: ['student', 'skills', selectedSkillId, 'roadmap'],
    queryFn: async () => {
      if (!selectedSkillId) return null;
      try {
        return await apiClient.get<RoadmapResponse>(`/student/skills/${encodeURIComponent(selectedSkillId)}/roadmap`);
      } catch {
        return null;
      }
    },
    enabled: Boolean(selectedSkillId)
  });

  useEffect(() => {
    if (cachedRoadmap) {
      setCurrentRoadmap(cachedRoadmap);
      if (cachedRoadmap.path && cachedRoadmap.path.length > 0) {
        setExpandedStep(cachedRoadmap.path[0].step_number);
      }
    }
  }, [cachedRoadmap]);

  // 3. Mutation to Generate Roadmap
  const generateRoadmapMutation = useApiMutation({
    mutationFn: async (skillId: string) => {
      return await apiClient.post<RoadmapResponse>(`/student/skills/${encodeURIComponent(skillId)}/roadmap`);
    },
    invalidateQueries: [['student', 'skills', selectedSkillId, 'roadmap']],
    onSuccess: (data) => {
      setCurrentRoadmap(data);
      if (data.path && data.path.length > 0) {
        setExpandedStep(data.path[0].step_number);
      }
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    generateRoadmapMutation.mutate(selectedSkillId);
  };

  const verifiedSkills = skills.filter((s: any) => s.verification_status === 'verified').map((s: any) => s.skill_name);
  const activeSkillObj = availableSkills.find(s => s.skill_id === selectedSkillId);
  const isGenerating = generateRoadmapMutation.isPending || isFetchingRoadmap;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Personalized Career Roadmap</h1>
          <p className="text-sm text-slate mt-1">
            Dynamic learning sequencing that skips skills you already know.
          </p>
        </div>

        {/* Skill Selector & Trigger */}
        <form onSubmit={handleGenerate} className="flex items-center gap-2 bg-white border border-hairline p-2 rounded-sm shadow-sm">
          <select
            value={selectedSkillId}
            onChange={(e) => handleSelectSkill(e.target.value)}
            className="bg-paper border border-hairline rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-ink cursor-pointer"
          >
            {availableSkills.map((s: any) => (
              <option key={s.skill_id} value={s.skill_id}>
                {s.skill_name} ({s.verification_status})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isGenerating || !selectedSkillId}
            className="bg-ink text-paper px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      {generateRoadmapMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-alert-rust rounded-sm text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {generateRoadmapMutation.error?.message || 'Failed to generate roadmap'}
        </div>
      )}

      {/* Already Mastered Banner */}
      {verifiedSkills.length > 0 && (
        <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">
            Already Mastered (Verified & Skipped from Path)
          </h3>
          <div className="flex flex-wrap gap-3">
            {verifiedSkills.map((skillName: string) => (
              <div key={skillName} className="flex items-center gap-2 bg-paper border border-hairline px-3 py-1.5 rounded-sm">
                <span className="text-sm font-medium text-ink">{skillName}</span>
                <ProofBadge status="verified" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation Status / Results */}
      {generateRoadmapMutation.isPending ? (
        <div className="bg-white border border-hairline rounded-sm p-12 text-center shadow-sm">
          <div className="h-8 w-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-serif font-bold text-ink text-lg">Generating Personalized Curriculum</h3>
          <p className="text-sm text-slate mt-2 max-w-md mx-auto">
            Analyzing your verified skills, prerequisite mastery, and available platform resources...
          </p>
        </div>
      ) : currentRoadmap?.status === 'already_mastered' ? (
        <div className="bg-growth-teal/10 border border-growth-teal/20 rounded-sm p-8 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-growth-teal/20 flex items-center justify-center mx-auto mb-3 text-growth-teal">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-serif font-bold text-ink text-xl">Skill Already Mastered!</h3>
          <p className="text-sm text-slate max-w-md mx-auto mt-2">
            {currentRoadmap.starting_point}
          </p>
          <p className="text-xs text-slate mt-4">
            ProofLedger has verified this competency. No foundational steps are needed.
          </p>
        </div>
      ) : currentRoadmap?.path && currentRoadmap.path.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-paper p-4 border border-hairline rounded-sm flex items-center gap-3">
            <Map className="h-5 w-5 text-growth-teal shrink-0" />
            <span className="text-sm text-ink font-medium">
              {currentRoadmap.starting_point}
            </span>
          </div>

          <h3 className="text-xs font-bold text-slate uppercase tracking-wider">Targeted Learning Path</h3>
          
          <div className="relative border-l-2 border-hairline ml-6 space-y-8">
            {currentRoadmap.path.map((step) => {
              const isExpanded = expandedStep === step.step_number;
              return (
                <div key={step.step_number} className="relative pl-8">
                  {/* Number Badge */}
                  <div className="absolute -left-[17px] top-0 h-8 w-8 bg-ink rounded-full flex items-center justify-center text-paper font-bold text-sm border-4 border-paper shadow-sm">
                    {step.step_number}
                  </div>

                  <div 
                    className={cn(
                      "bg-white border border-hairline rounded-sm transition-all overflow-hidden cursor-pointer shadow-sm",
                      isExpanded ? "ring-1 ring-ink border-ink" : "hover:border-slate/30"
                    )}
                    onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
                  >
                    <div className="p-5 flex items-center justify-between bg-paper">
                      <div>
                        <h4 className="font-bold text-ink text-lg">{step.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {step.key_topics?.map((topic, i) => (
                            <span key={i} className="text-[11px] font-bold text-slate bg-slate/10 px-2 py-0.5 rounded-sm">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button className="text-slate hover:text-ink">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-5 border-t border-hairline space-y-4 animate-in slide-in-from-top-2">
                        <p className="text-sm text-slate leading-relaxed">{step.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          {step.matched_learning_program && (
                            <div className="bg-slate/5 p-4 rounded-sm border border-hairline">
                              <h5 className="text-xs font-bold text-slate uppercase tracking-wider flex items-center gap-2 mb-2">
                                <BookOpen className="h-4 w-4" /> Recommended Resource
                              </h5>
                              <Link 
                                to="/student/learning" 
                                className="text-sm font-bold text-ink underline decoration-hairline hover:decoration-ink flex items-center gap-1"
                              >
                                {step.matched_learning_program.title} <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          )}

                          {step.matched_assessment && (
                            <div className="bg-growth-teal/5 p-4 rounded-sm border border-growth-teal/20">
                              <h5 className="text-xs font-bold text-growth-teal uppercase tracking-wider flex items-center gap-2 mb-2">
                                <FileBadge className="h-4 w-4" /> Verification Milestone
                              </h5>
                              <Link 
                                to={`/student/assessments/${step.matched_assessment.assessment_id}/take`}
                                className="text-sm font-bold text-ink underline decoration-hairline hover:decoration-ink flex items-center gap-1"
                              >
                                {step.matched_assessment.title} <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-hairline rounded-sm p-12 text-center shadow-sm">
          <Map className="h-10 w-10 text-slate mx-auto mb-3" />
          <h3 className="font-serif font-bold text-ink text-lg">Personalized Roadmap Generator</h3>
          <p className="text-sm text-slate max-w-sm mx-auto mt-1 mb-6">
            Select one of your target skills above and click "Generate" to construct your tailored learning trajectory.
          </p>
          {selectedSkillId && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> {isGenerating ? 'Generating...' : `Generate for ${activeSkillObj?.skill_name || 'Selected Skill'}`}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
