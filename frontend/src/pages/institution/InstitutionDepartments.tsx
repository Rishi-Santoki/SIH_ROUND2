import React from 'react';
import { Building2, TrendingUp, Target, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

const DEPARTMENT_DATA = [
  {
    name: 'Computer Science',
    avgReadiness: 72,
    topGap: 'Cloud Security',
    placementRate: 85,
    verifiedEvidence: 78,
  },
  {
    name: 'Information Technology',
    avgReadiness: 68,
    topGap: 'System Design',
    placementRate: 75,
    verifiedEvidence: 65,
  },
  {
    name: 'Electronics & Comm.',
    avgReadiness: 55,
    topGap: 'Embedded C++',
    placementRate: 60,
    verifiedEvidence: 42,
    attentionNeeded: true,
  },
  {
    name: 'Mechanical Engineering',
    avgReadiness: 45,
    topGap: 'AutoCAD Advanced',
    placementRate: 50,
    verifiedEvidence: 30,
    attentionNeeded: true,
  },
];

export function InstitutionDepartments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Department Comparison</h1>
        <p className="text-sm text-slate mt-1">Cross-departmental analysis of placement readiness and skill metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {DEPARTMENT_DATA.map((dept, index) => (
          <div 
            key={index} 
            className={cn(
              "bg-white rounded-sm border shadow-sm p-6 relative overflow-hidden",
              dept.attentionNeeded ? "border-alert-rust/50" : "border-hairline"
            )}
          >
            {dept.attentionNeeded && (
              <div className="absolute top-0 right-0 bg-alert-rust text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-sm z-10">
                Action Required
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate/10 p-2 rounded-sm text-slate">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink text-lg leading-tight">{dept.name}</h3>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Avg Readiness</span>
                  <span className={cn("font-bold", dept.avgReadiness > 60 ? "text-growth-teal" : "text-alert-rust")}>
                    {dept.avgReadiness}%
                  </span>
                </div>
                <div className="w-full bg-paper rounded-full h-1.5">
                  <div 
                    className={cn("h-1.5 rounded-full", dept.avgReadiness > 60 ? "bg-growth-teal" : "bg-alert-rust")}
                    style={{ width: `${dept.avgReadiness}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-warning-gold" /> Verified Evidence</span>
                  <span className="font-bold text-ink">{dept.verifiedEvidence}%</span>
                </div>
                <div className="w-full flex rounded-full overflow-hidden h-1.5 bg-paper">
                  <div className="bg-warning-gold h-full" style={{ width: `${dept.verifiedEvidence}%` }}></div>
                </div>
              </div>

              <div className="bg-slate/5 p-3 rounded-sm border border-slate/10">
                <span className="text-xs text-slate uppercase tracking-wider font-bold block mb-1 flex items-center gap-1">
                  <Target className="h-3 w-3" /> Top Skill Gap
                </span>
                <span className="text-sm font-bold text-ink">{dept.topGap}</span>
              </div>
              
              <div className="flex justify-between items-end border-t border-hairline pt-4 mt-2">
                <span className="text-xs text-slate uppercase tracking-wider font-bold">Placement Rate</span>
                <span className="text-2xl font-serif font-bold text-ink">{dept.placementRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
