import React, { useState } from 'react';
import { Plus, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const MOCK_POSTINGS = [
  { id: 'p1', title: 'Junior Data Analyst', status: 'active', applicants: 12 },
  { id: 'p2', title: 'Frontend Developer', status: 'draft', applicants: 0 },
];

export function IndustryOpportunities() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [skills, setSkills] = useState<{name: string, level: number, importance: number, mandatory: boolean}[]>([]);
  
  // Mock company verification state (unverified for testing the block)
  const isCompanyVerified = false; 
  
  const displayedPostings = MOCK_POSTINGS.filter(p => filter === 'all' || p.status === filter);

  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-ink">Create Posting</h1>
          <button onClick={() => setIsCreating(false)} className="text-sm font-medium text-slate hover:text-ink">Cancel</button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={cn("flex-1 h-2 rounded-full", createStep >= 1 ? "bg-ink" : "bg-slate/10")} />
          <div className={cn("flex-1 h-2 rounded-full", createStep >= 2 ? "bg-ink" : "bg-slate/10")} />
        </div>

        <div className="bg-white border border-hairline rounded-sm shadow-sm p-8">
          {createStep === 1 ? (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-bold text-ink text-lg mb-4">Basic Details</h3>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Job Title</label>
                <input type="text" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" placeholder="e.g. Data Scientist" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Location</label>
                  <input type="text" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" placeholder="e.g. Remote" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Type</label>
                  <select className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink">
                    <option>Full-time</option>
                    <option>Internship</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Description</label>
                <textarea className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-32" />
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setCreateStep(2)}
                  className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors"
                >
                  Next: Required Skills
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-bold text-ink text-lg mb-4">Required Skills Configuration</h3>
              <p className="text-sm text-slate mb-6">Define the exact skills to feed the ProofLedger matching engine.</p>
              
              <div className="space-y-4">
                {skills.map((s, i) => (
                  <div key={i} className="bg-paper border border-hairline p-4 rounded-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-ink">{s.name}</span>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate cursor-pointer">
                        <input type="checkbox" checked={s.mandatory} className="accent-ink" readOnly /> Mandatory
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate uppercase tracking-wider mb-2">
                          <span>Required Level</span>
                          <span>{s.level}%</span>
                        </div>
                        <input type="range" min="0" max="100" defaultValue={s.level} className="w-full accent-ink" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate uppercase tracking-wider mb-2">
                          <span>Importance Weight</span>
                          <span>{s.importance}/10</span>
                        </div>
                        <input type="range" min="1" max="10" defaultValue={s.importance} className="w-full accent-growth-teal" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-dashed border-hairline bg-white p-4 rounded-sm flex items-center gap-4">
                <input type="text" id="newSkillInput" placeholder="Skill name (e.g. Python)" className="flex-1 bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" />
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    const input = document.getElementById('newSkillInput') as HTMLInputElement;
                    if (input.value) {
                      setSkills([...skills, { name: input.value, level: 70, importance: 5, mandatory: true }]);
                      input.value = '';
                    }
                  }}
                  className="bg-slate/10 text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate/20"
                >
                  Add Skill
                </button>
              </div>

              <div className="pt-8 border-t border-hairline flex items-center justify-between">
                <button onClick={() => setCreateStep(1)} className="text-sm font-medium text-slate hover:text-ink">Back</button>
                
                <div className="flex items-center gap-4">
                  {/* Validation feedback block */}
                  {!isCompanyVerified ? (
                     <div className="flex items-center gap-2 text-xs font-medium text-alert-rust">
                       <AlertCircle className="h-4 w-4" /> Company not verified.
                     </div>
                  ) : skills.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-alert-rust">
                       <AlertCircle className="h-4 w-4" /> Add at least 1 skill to publish.
                     </div>
                  ) : null}

                  <button 
                    disabled={!isCompanyVerified || skills.length === 0}
                    className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publish Posting
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Postings</h1>
          <p className="text-sm text-slate mt-1">Manage your active opportunities.</p>
        </div>
        <button 
          onClick={() => {
             setIsCreating(true);
             setCreateStep(1);
             setSkills([]);
          }}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Posting
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-hairline pb-4">
        <SlidersHorizontal className="h-4 w-4 text-slate mr-2" />
        {['all', 'active', 'draft', 'closed'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors",
              filter === f ? "bg-slate/10 text-ink" : "text-slate hover:text-ink"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        {displayedPostings.length === 0 ? (
          <div className="p-8 text-center text-slate text-sm">No postings match this filter.</div>
        ) : (
          <div className="divide-y divide-hairline">
            {displayedPostings.map(post => (
              <div key={post.id} className="p-5 flex items-center justify-between hover:bg-slate/5 transition-colors group">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-ink text-lg group-hover:text-growth-teal transition-colors">
                      <Link to={`/industry/opportunities/${post.id}/candidates`}>{post.title}</Link>
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                      post.status === 'active' ? "bg-growth-teal/10 text-growth-teal" : "bg-slate/10 text-slate"
                    )}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate">{post.applicants} applicants • Remote</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link 
                    to={`/industry/opportunities/${post.id}/candidates`}
                    className="text-sm font-medium text-ink underline decoration-hairline hover:decoration-ink underline-offset-4"
                  >
                    View Candidates
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
