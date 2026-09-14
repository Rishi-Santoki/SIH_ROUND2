import React from 'react';
import { GraduationCap, MapPin, Calendar, Clock } from 'lucide-react';
import { MatchScoreVisualizer } from '../../components/ui/MatchScoreVisualizer';
import { cn } from '../../lib/utils';

const MOCK_INTERNS = [
  {
    id: 'i1',
    name: 'Sarah Jenkins',
    role: 'Data Science Intern',
    university: 'State University',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    performance: 92,
    breakdown: { skill: 40, evidence: 30, projects: 12, eligibility: 10 }
  },
  {
    id: 'i2',
    name: 'Michael Chang',
    role: 'Frontend Engineering Intern',
    university: 'Tech Institute',
    startDate: '2024-05-15',
    endDate: '2024-08-15',
    status: 'completed',
    performance: 88,
    breakdown: { skill: 35, evidence: 30, projects: 15, eligibility: 8 }
  }
];

export function IndustryInterns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Active Interns</h1>
          <p className="text-sm text-slate mt-1">Manage current placements and report on performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_INTERNS.map(intern => (
          <div key={intern.id} className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center font-serif font-bold text-ink text-xl">
                      {intern.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-ink">{intern.name}</h3>
                      <p className="text-sm text-slate">{intern.role}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                    intern.status === 'active' ? "bg-growth-teal/10 text-growth-teal" : "bg-slate/10 text-slate"
                  )}>
                    {intern.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate">
                    <GraduationCap className="h-4 w-4" /> {intern.university}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate">
                    <Calendar className="h-4 w-4" /> {intern.startDate} to {intern.endDate}
                  </div>
                </div>
              </div>

              <div className="bg-paper p-4 rounded-sm border border-hairline">
                <MatchScoreVisualizer score={intern.performance} breakdown={intern.breakdown} />
                <div className="mt-4 pt-4 border-t border-hairline flex justify-between items-center">
                  <span className="text-xs font-bold text-slate uppercase tracking-wider">Mid-Term Eval Due</span>
                  <button className="bg-white border border-hairline text-ink px-3 py-1 rounded-sm text-xs font-bold hover:bg-slate/5 transition-colors">
                    Complete Eval
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
