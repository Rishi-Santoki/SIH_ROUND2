import React, { useState } from 'react';
import { Search, MapPin, Building, GraduationCap, Lock, Unlock } from 'lucide-react';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { cn } from '../../lib/utils';
import { useParams } from 'react-router-dom';

const MOCK_CANDIDATES = [
  {
    id: 'c1',
    name: 'Sarah Jenkins',
    hasApplied: true,
    university: 'State University',
    degree: 'B.Tech Computer Science',
    matchScore: 88,
    breakdown: { skill: 40, evidence: 30, projects: 10, eligibility: 8 },
    matchedSkills: ['Python (Verified)', 'SQL (Verified)'],
    missingSkills: ['Cloud Deployment']
  },
  {
    id: 'c2',
    name: 'Anonymous Candidate',
    hasApplied: false,
    university: 'Hidden until application',
    degree: 'B.Tech IT',
    matchScore: 75,
    breakdown: { skill: 35, evidence: 20, projects: 10, eligibility: 10 },
    matchedSkills: ['Python (Verified)'],
    missingSkills: ['SQL']
  }
];

export function IndustryCandidates() {
  const { id } = useParams(); // if present, we are viewing candidates for a specific posting
  const isSearchMode = !id;
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">
          {isSearchMode ? 'Candidate Search' : 'Applicants: Junior Data Analyst'}
        </h1>
        <p className="text-sm text-slate mt-1">
          {isSearchMode ? 'Discover verified talent across the network.' : 'Review matches for this opportunity.'}
        </p>
      </div>

      {isSearchMode && (
        <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-3 shadow-sm mb-6">
          <Search className="h-5 w-5 text-slate ml-2" />
          <input 
            type="text" 
            placeholder="Search by skill, degree, or keyword..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none py-1"
          />
        </div>
      )}

      <div className="space-y-6">
        {MOCK_CANDIDATES.map(candidate => (
          <div key={candidate.id} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Profile Section */}
            <div className={cn("p-6 flex-1 border-b md:border-b-0 md:border-r border-hairline relative", !candidate.hasApplied && "bg-slate/5")}>
              {!candidate.hasApplied && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-slate uppercase tracking-wider bg-white px-2 py-1 rounded-sm border border-hairline shadow-sm">
                  <Lock className="h-3 w-3" /> Reduced Profile
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center font-serif font-bold text-xl",
                  candidate.hasApplied ? "bg-slate/10 text-ink" : "bg-slate/20 text-slate"
                )}>
                  {candidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className={cn("font-bold text-lg", candidate.hasApplied ? "text-ink" : "text-slate italic")}>
                    {candidate.name}
                  </h3>
                  <div className="text-sm text-slate flex flex-col gap-1 mt-1">
                    <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {candidate.degree}</span>
                    <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {candidate.university}</span>
                  </div>
                </div>
              </div>

              {!candidate.hasApplied ? (
                <p className="text-xs text-slate bg-white p-3 rounded-sm border border-hairline mt-4">
                  This candidate has not applied yet. Identifying details are hidden. Their match score is projected based on public verified ledger data. Full profile unlocks upon application.
                </p>
              ) : (
                <div className="flex gap-2 mt-4">
                   <button className="bg-ink text-paper px-4 py-2 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors">
                     View Full Profile
                   </button>
                   <button className="bg-white border border-hairline text-ink px-4 py-2 rounded-sm text-xs font-bold hover:bg-slate/5 transition-colors">
                     Message
                   </button>
                </div>
              )}
            </div>

            {/* Match Engine Section */}
            <div className="p-6 md:w-96 flex flex-col justify-between bg-paper">
              <MatchScoreVisualizer score={candidate.matchScore} breakdown={candidate.breakdown} showDetails={true} />
              
              <div className="mt-6 space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Matched Requirements</h4>
                  <div className="flex flex-wrap gap-1">
                    {candidate.matchedSkills.map(s => (
                      <span key={s} className="bg-growth-teal/10 text-growth-teal border border-growth-teal/20 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate uppercase tracking-wider mb-2">Missing/Unverified</h4>
                  <div className="flex flex-wrap gap-1">
                    {candidate.missingSkills.map(s => (
                      <span key={s} className="bg-white border border-hairline text-slate px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
