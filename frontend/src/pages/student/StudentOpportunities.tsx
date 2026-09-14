import React, { useState } from 'react';
import { Briefcase, Building, MapPin, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { EvidenceChip } from '../../components/ui/EvidenceChip';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';

const MOCK_OPPS = [
  {
    id: 'o1',
    title: 'Junior Data Analyst',
    company: 'TechCorp',
    location: 'Remote',
    matchScore: 88,
    breakdown: { skill: 40, evidence: 30, projects: 10, eligibility: 8 } // out of 100 total
  },
  {
    id: 'o2',
    title: 'Data Science Intern',
    company: 'Innovate AI',
    location: 'Bangalore, India',
    matchScore: 65,
    breakdown: { skill: 30, evidence: 15, projects: 15, eligibility: 5 }
  }
];

export function StudentOpportunities() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Opportunities</h1>
        <p className="text-sm text-slate mt-1">Roles matched specifically to your verified skills and evidence ledger.</p>
      </div>

      <div className="space-y-4">
        {MOCK_OPPS.map(opp => {
          const isExpanded = expandedId === opp.id;
          return (
            <div key={opp.id} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden transition-colors hover:border-slate/30">
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
                      <span className="text-sm text-slate">Based on 5 overlapping requirements</span>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-verified-gold" />
                        <span className="text-xs font-bold text-ink">Evidence Weight</span>
                      </div>
                      <span className="text-sm text-slate">You have verified proof for 80% of skills</span>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-ink" />
                        <span className="text-xs font-bold text-ink">Projects</span>
                      </div>
                      <span className="text-sm text-slate">2 projects mapped to role domain</span>
                    </div>
                    <div className="bg-white p-3 rounded-sm border border-hairline">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-slate" />
                        <span className="text-xs font-bold text-ink">Eligibility</span>
                      </div>
                      <span className="text-sm text-slate">Degree and graduation year align</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors">
                      Apply via ProofLedger
                    </button>
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
