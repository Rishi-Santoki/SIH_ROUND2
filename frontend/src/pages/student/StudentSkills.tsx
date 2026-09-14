import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, HelpCircle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { EvidenceChip } from '../../components/ui/EvidenceChip';
import { cn } from '../../lib/utils';

// Mock Data
const MOCK_SKILLS = [
  {
    id: 's1',
    category: 'Programming Languages',
    name: 'Python',
    status: 'verified' as const,
    proficiency: 85,
    evidenceCount: 14,
    subTopics: [
      { name: 'Data Structures', state: 'strong' },
      { name: 'OOP', state: 'strong' },
      { name: 'Async/Await', state: 'weak' },
      { name: 'Metaprogramming', state: 'untested' },
    ],
    evidence: [
      { type: 'assessment', title: 'Advanced Python Assessment', date: '2023-10-15', score: '92%' },
      { type: 'project', title: 'Data Analysis Pipeline', date: '2023-09-01', link: '#' },
      { type: 'certification', title: 'Coursera Python Specialization', date: '2023-08-20' }
    ]
  },
  {
    id: 's2',
    category: 'Programming Languages',
    name: 'JavaScript',
    status: 'pending' as const,
    proficiency: 60,
    evidenceCount: 3,
    subTopics: [],
    evidence: [
      { type: 'project', title: 'React Frontend App', date: '2023-11-01', link: '#' }
    ]
  },
  {
    id: 's3',
    category: 'Data Science',
    name: 'Machine Learning',
    status: 'self-declared' as const,
    proficiency: 40,
    evidenceCount: 0,
    subTopics: [
      { name: 'Supervised Learning', state: 'untested' },
      { name: 'Unsupervised Learning', state: 'untested' },
    ],
    evidence: []
  }
];

export function StudentSkills() {
  const [selectedSkill, setSelectedSkill] = useState<typeof MOCK_SKILLS[0] | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [skills, setSkills] = useState(MOCK_SKILLS);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSkills(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    
    // Simulate POST /student/skills
    const newSkill = {
      id: `s${Date.now()}`,
      category: 'Uncategorized',
      name: newSkillName,
      status: 'self-declared' as const,
      proficiency: 0,
      evidenceCount: 0,
      subTopics: [],
      evidence: []
    };
    
    setSkills([...skills, newSkill]);
    setNewSkillName('');
    setIsAdding(false);
  };

  // Group by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof MOCK_SKILLS>);

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
        <form onSubmit={handleAddSkill} className="bg-white border border-hairline border-dashed rounded-sm p-4 mb-6 flex items-center gap-4">
          <input 
            autoFocus
            type="text" 
            placeholder="E.g., React, SQL, Figma..." 
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="flex-1 border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink"
          />
          <button type="button" onClick={() => setIsAdding(false)} className="text-slate hover:text-ink text-sm font-medium">Cancel</button>
          <button type="submit" className="bg-slate/10 text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate/20">Declare Skill</button>
        </form>
      )}

      {skills.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-hairline border-dashed bg-white rounded-sm">
          <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-slate" />
          </div>
          <h3 className="font-serif font-bold text-ink text-lg">Your ledger is empty</h3>
          <p className="text-sm text-slate max-w-md mt-2 mb-6">Start by declaring the skills you already have, or take an assessment to discover your baseline.</p>
          <button onClick={() => setIsAdding(true)} className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-medium hover:bg-ink/90">
            Add your first skill
          </button>
        </div>
      ) : (
        <div className="space-y-8 flex-1 overflow-y-auto pr-4 pb-12">
          {Object.entries(groupedSkills).map(([category, catSkills]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-bold text-slate uppercase tracking-wider">{category}</h3>
              <div className="bg-white border border-hairline rounded-sm overflow-hidden shadow-sm">
                {catSkills.map((skill, idx) => (
                  <div key={skill.id} className={cn(
                    "flex flex-col border-hairline transition-colors",
                    idx !== catSkills.length - 1 && "border-b",
                    selectedSkill?.id === skill.id ? "bg-slate/5" : "hover:bg-slate/5"
                  )}>
                    {/* Main Row */}
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
                          <div className="w-6" /> // spacer
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
                    <button className="mt-3 text-sm font-medium text-ink underline decoration-hairline hover:decoration-ink underline-offset-4">Add Project or Certificate</button>
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
                        {ev.score && <p className="text-xs text-growth-teal font-bold">Score: {ev.score}</p>}
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
