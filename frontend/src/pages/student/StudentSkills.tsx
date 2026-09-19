import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronRight, HelpCircle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { EvidenceChip } from '../../components/ui/EvidenceChip';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface SkillItem {
  id: string;
  skill_id: string;
  category: string;
  name: string;
  status: 'verified' | 'pending' | 'self-declared';
  proficiency: number;
  evidenceCount: number;
  subTopics: { name: string; state: 'strong' | 'weak' | 'untested' }[];
  evidence: { type: string; title: string; date?: string; score?: string; link?: string }[];
}

export function StudentSkills() {
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState(1);

  // 1. Fetch Student Skills from Backend
  const { data: rawSkills = [], isLoading } = useQuery({
    queryKey: ['student', 'skills'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/skills');
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch Available Taxonomy Skills for autocomplete suggestions
  const { data: taxonomySkills = [] } = useQuery({
    queryKey: ['student', 'skills', 'available'],
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/student/skills/available');
      } catch {
        return [];
      }
    }
  });

  // 3. Mutation to Declare Skill
  const addSkillMutation = useApiMutation({
    mutationFn: async (payload: { skill_name: string; proficiency_level: number }) => {
      return await apiClient.post('/student/skills', payload);
    },
    invalidateQueries: [['student', 'skills'], ['student', 'readiness']],
    successMessage: 'Skill added to your profile!',
    onSuccess: () => {
      setNewSkillName('');
      setIsAdding(false);
    }
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSkills(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    addSkillMutation.mutate({
      skill_name: newSkillName.trim(),
      proficiency_level: selectedProficiency
    });
  };

  // Map backend skills to display shape
  const skills: SkillItem[] = rawSkills.map((s, idx) => {
    const isVerified = s.verification_status === 'verified';
    const isPending = s.verification_status === 'pending';
    const status: 'verified' | 'pending' | 'self-declared' = isVerified ? 'verified' : (isPending ? 'pending' : 'self-declared');
    
    const evidenceList = (s.evidence || []).map((ev: any) => ({
      type: ev.evidence_type || 'assessment',
      title: `${ev.evidence_type === 'project' ? 'Project' : (ev.evidence_type === 'certification' ? 'Certification' : 'Assessment')} Evidence`,
      date: ev.created_at ? new Date(ev.created_at).toLocaleDateString() : 'Verified',
      score: ev.weight ? `Weight: ${ev.weight}` : undefined
    }));

    const rawConf = typeof s.confidence_score === 'number' ? s.confidence_score : null;
    let computedProficiency = 20;
    if (rawConf !== null) {
      computedProficiency = rawConf <= 1.0 ? Math.round(rawConf * 100) : Math.round(rawConf);
    } else if (s.proficiency_level) {
      computedProficiency = s.proficiency_level <= 5 ? s.proficiency_level * 20 : s.proficiency_level;
    }
    computedProficiency = Math.max(0, Math.min(100, computedProficiency));

    return {
      id: s.skill_id || `skill-${idx}`,
      skill_id: s.skill_id,
      category: s.category || 'General Skills',
      name: s.skill_name || 'Skill',
      status,
      proficiency: computedProficiency,
      evidenceCount: s.evidence?.length || 0,
      subTopics: [],
      evidence: evidenceList
    };
  });

  // Group by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || 'General Skills';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, SkillItem[]>);

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Skill Profile & DNA</h1>
          <p className="text-sm text-slate mt-1">Your comprehensive, evidence-backed skill ledger.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSkill} className="bg-white border border-hairline border-dashed rounded-sm p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-serif font-bold text-sm text-ink">Declare a Skill</h4>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="text-slate hover:text-ink text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                Skill Name
              </label>
              <input 
                autoFocus
                type="text" 
                list="platform-skills-list"
                placeholder="E.g., Python, SQL, Machine Learning, React..." 
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="w-full border border-hairline rounded-sm px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
                required
              />
              <datalist id="platform-skills-list">
                {taxonomySkills.map((ts: any) => (
                  <option key={ts.skill_id} value={ts.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1">
                Proficiency Level
              </label>
              <select
                value={selectedProficiency}
                onChange={(e) => setSelectedProficiency(parseInt(e.target.value) || 1)}
                className="w-full border border-hairline rounded-sm px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Elementary</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Advanced</option>
                <option value={5}>5 - Expert</option>
              </select>
            </div>
          </div>

          {addSkillMutation.isError && (
            <div className="p-3 mb-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm text-xs text-alert-rust flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{addSkillMutation.error?.message || 'Failed to add skill'}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="text-slate hover:text-ink text-sm font-medium px-3 py-1.5"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={addSkillMutation.isPending || !newSkillName.trim()}
              className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addSkillMutation.isPending ? 'Declaring...' : 'Declare Skill'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate text-sm">Loading skills ledger...</div>
      ) : skills.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-hairline border-dashed bg-white rounded-sm">
          <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-slate" />
          </div>
          <h3 className="font-serif font-bold text-ink text-lg">No Skills Declared Yet</h3>
          <p className="text-slate text-sm max-w-sm mt-1 mb-4">
            Add skills to your profile to kick off your skill DNA and unlock opportunity matching.
          </p>
          <button 
            onClick={() => setIsAdding(true)} 
            className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Add Your First Skill
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, catSkills]) => (
            <div key={category} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-hairline bg-paper flex justify-between items-center">
                <span className="text-xs font-bold text-slate uppercase tracking-wider">{category}</span>
                <span className="text-xs text-slate font-medium">{catSkills.length} skills</span>
              </div>
              
              <div className="divide-y divide-hairline">
                {catSkills.map(skill => (
                  <div key={skill.id} className="hover:bg-slate/5 transition-colors">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => setSelectedSkill(skill)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {skill.subTopics.length > 0 ? (
                          <button onClick={(e) => toggleExpand(skill.id, e)} className="text-slate hover:text-ink p-1">
                            {expandedSkills[skill.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        ) : (
                          <div className="w-6" />
                        )}
                        <span className="font-medium text-ink w-48">{skill.name}</span>
                        <ProofBadge status={skill.status} />
                      </div>
                      
                      <div className="flex items-center gap-6 flex-1 justify-end">
                        <div className="text-xs text-slate font-medium text-right min-w-[120px]">
                          {skill.evidenceCount} pieces of evidence
                        </div>
                        <div className="w-32 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate/10 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all duration-500", skill.proficiency > 0 ? "bg-growth-teal" : "bg-transparent")} 
                              style={{ width: `${skill.proficiency}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate w-8">{skill.proficiency}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-topics Rollup */}
                    {expandedSkills[skill.id] && skill.subTopics.length > 0 && (
                      <div className="bg-paper border-t border-hairline p-4 pl-14 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {skill.subTopics.map((topic, tIdx) => (
                          <div key={tIdx} className="flex items-center justify-between text-sm">
                            <span className="text-slate">{topic.name}</span>
                            {topic.state === 'strong' && <span className="flex items-center gap-1 text-growth-teal text-xs font-bold"><CheckCircle2 className="h-4 w-4"/> Strong</span>}
                            {topic.state === 'weak' && <span className="flex items-center gap-1 text-alert-rust text-xs font-bold"><AlertCircle className="h-4 w-4"/> Needs Review</span>}
                            {topic.state === 'untested' && <span className="flex items-center gap-1 text-slate text-xs font-bold"><HelpCircle className="h-4 w-4"/> Untested</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {selectedSkill && (
        <>
          <div className="fixed inset-0 bg-ink/20 z-40 backdrop-blur-sm" onClick={() => setSelectedSkill(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-hairline flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-hairline bg-paper">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-serif font-bold text-ink">{selectedSkill.name}</h2>
                  <ProofBadge status={selectedSkill.status} />
                </div>
                <p className="text-sm text-slate">{selectedSkill.category}</p>
              </div>
              <button onClick={() => setSelectedSkill(null)} className="text-slate hover:text-ink bg-white p-2 border border-hairline rounded-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 border-b border-hairline">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate uppercase tracking-wider">Proficiency</span>
                <span className="text-sm font-bold text-ink">{selectedSkill.proficiency}%</span>
              </div>
              <div className="w-full h-3 bg-slate/10 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", selectedSkill.proficiency > 0 ? "bg-growth-teal" : "bg-transparent")} 
                  style={{ width: `${selectedSkill.proficiency}%` }} 
                />
              </div>
              {selectedSkill.status === 'self-declared' && (
                <p className="text-xs text-slate mt-3 italic">This proficiency is self-declared. Take an assessment to verify.</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Evidence Ledger</h3>
                
                {selectedSkill.evidence.length === 0 ? (
                  <div className="text-center p-8 bg-paper border border-hairline border-dashed rounded-sm">
                    <p className="text-sm text-slate">No evidence attached yet.</p>
                    <p className="text-xs text-slate mt-1">Take an assessment or attach a portfolio project to verify this skill.</p>
                  </div>
                ) : (
                  <div className="space-y-0 border border-hairline rounded-sm bg-white">
                    {selectedSkill.evidence.map((ev, i) => (
                      <div key={i} className={cn("p-4 flex flex-col gap-2", i !== selectedSkill.evidence.length - 1 && "border-b border-hairline")}>
                        <div className="flex items-center justify-between">
                          <EvidenceChip type={ev.type as any} />
                          <span className="text-xs text-slate font-medium">{ev.date}</span>
                        </div>
                        <p className="font-medium text-ink text-sm">{ev.title}</p>
                        {ev.score && <p className="text-xs text-growth-teal font-bold">{ev.score}</p>}
                        {ev.link && <a href={ev.link} className="text-xs text-slate underline hover:text-ink">View source &rarr;</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
