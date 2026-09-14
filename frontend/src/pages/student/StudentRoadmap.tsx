import React, { useState } from 'react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { BookOpen, Map, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

// Mock Data
const ALREADY_HAVE = ['Python Basics', 'Git Version Control', 'Basic Statistics'];
const ROADMAP_STEPS = [
  {
    id: 'r1',
    title: 'Advanced SQL Queries',
    skill: 'Advanced SQL',
    description: 'Master window functions, CTEs, and query optimization.',
    duration: '2 weeks',
    resource: { title: 'PostgreSQL Advanced Course', url: '#' },
    milestone: 'Complete 3 complex query challenges'
  },
  {
    id: 'r2',
    title: 'Statistical Modeling (Regression)',
    skill: 'Statistical Modeling',
    description: 'Understand linear and logistic regression in depth.',
    duration: '3 weeks',
    resource: { title: 'Stats for Data Science', url: '#' },
    milestone: 'Build a predictive model using Scikit-Learn'
  }
];

export function StudentRoadmap() {
  const [expandedStep, setExpandedStep] = useState<string | null>(ROADMAP_STEPS[0].id);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Career Roadmap</h1>
        <p className="text-sm text-slate mt-1">Your personalized path to Junior Data Scientist, skipping what you already know.</p>
      </div>

      {/* Already Have */}
      <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider mb-4">Already Mastered (Skipped)</h3>
        <div className="flex flex-wrap gap-3">
          {ALREADY_HAVE.map((skill) => (
            <div key={skill} className="flex items-center gap-2 bg-paper border border-hairline px-3 py-1.5 rounded-sm">
              <span className="text-sm font-medium text-ink">{skill}</span>
              <ProofBadge status="verified" />
            </div>
          ))}
        </div>
      </div>

      {/* The Path */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate uppercase tracking-wider">Your Sequence</h3>
        
        <div className="relative border-l-2 border-hairline ml-6 space-y-8">
          {ROADMAP_STEPS.map((step, idx) => {
            const isExpanded = expandedStep === step.id;
            return (
              <div key={step.id} className="relative pl-8">
                {/* Number Badge */}
                <div className="absolute -left-[17px] top-0 h-8 w-8 bg-ink rounded-full flex items-center justify-center text-paper font-bold text-sm border-4 border-paper shadow-sm">
                  {idx + 1}
                </div>

                <div 
                  className={cn(
                    "bg-white border border-hairline rounded-sm transition-all overflow-hidden cursor-pointer shadow-sm",
                    isExpanded ? "ring-1 ring-ink border-ink" : "hover:border-slate/30"
                  )}
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                >
                  <div className="p-5 flex items-center justify-between bg-paper">
                    <div>
                      <h4 className="font-bold text-ink text-lg">{step.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-growth-teal bg-growth-teal/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                          Target: {step.skill}
                        </span>
                        <span className="text-xs text-slate font-medium">{step.duration}</span>
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
                        <div className="bg-slate/5 p-4 rounded-sm border border-hairline">
                          <h5 className="text-xs font-bold text-slate uppercase tracking-wider flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4" /> Recommended Resource
                          </h5>
                          <a href={step.resource.url} className="text-sm font-bold text-ink underline decoration-hairline hover:decoration-ink flex items-center gap-1">
                            {step.resource.title} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="bg-growth-teal/5 p-4 rounded-sm border border-growth-teal/20">
                          <h5 className="text-xs font-bold text-growth-teal uppercase tracking-wider flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4" /> Milestone to Progress
                          </h5>
                          <p className="text-sm font-medium text-ink">{step.milestone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
