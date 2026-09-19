import { Link } from 'react-router-dom';
import { Target, ArrowRight, AlertTriangle } from 'lucide-react';

const MOCK_GAPS = [
  {
    id: 'g1',
    skillName: 'Advanced SQL',
    targetRole: 'Junior Data Scientist',
    importance: 'mandatory',
    currentProficiency: 40,
    requiredProficiency: 80,
    gapSize: 40,
  },
  {
    id: 'g2',
    skillName: 'Cloud Deployment (AWS)',
    targetRole: 'Junior Data Scientist',
    importance: 'optional',
    currentProficiency: 0,
    requiredProficiency: 50,
    gapSize: 50,
  },
  {
    id: 'g3',
    skillName: 'Statistical Modeling',
    targetRole: 'Junior Data Scientist',
    importance: 'mandatory',
    currentProficiency: 65,
    requiredProficiency: 85,
    gapSize: 20,
  }
];

export function StudentSkillGap() {
  const sortedGaps = [...MOCK_GAPS].sort((a, b) => {
    if (a.importance === 'mandatory' && b.importance === 'optional') return -1;
    if (a.importance === 'optional' && b.importance === 'mandatory') return 1;
    return b.gapSize - a.gapSize;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Skill Gap Analysis</h1>
        <p className="text-sm text-slate mt-1">Ranked gaps between your verified profile and your target role.</p>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden flex-1">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-hairline bg-paper text-xs font-bold text-slate uppercase tracking-wider">
          <div className="col-span-5">Skill Gap</div>
          <div className="col-span-4 hidden sm:block">Proficiency Delta</div>
          <div className="col-span-3 text-right">Action</div>
        </div>
        
        {sortedGaps.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Target className="h-12 w-12 text-slate/20 mb-4" />
            <h3 className="text-lg font-serif font-bold text-ink">No gaps found!</h3>
            <p className="text-sm text-slate mt-1">You meet all requirements for your target role.</p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {sortedGaps.map(gap => (
              <div key={gap.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate/5 transition-colors">
                <div className="col-span-9 sm:col-span-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-ink">{gap.skillName}</span>
                    {gap.importance === 'mandatory' && (
                      <span className="flex items-center gap-1 bg-alert-rust/10 text-alert-rust px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle className="h-3 w-3" /> Required
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate">Target: {gap.targetRole}</div>
                </div>

                <div className="col-span-4 hidden sm:flex items-center gap-3">
                  <span className="text-xs font-bold text-slate w-6 text-right">{gap.currentProficiency}%</span>
                  <div className="flex-1 h-2 bg-slate/10 rounded-full overflow-hidden flex">
                    <div className="h-full bg-growth-teal opacity-50" style={{ width: `${gap.currentProficiency}%` }} />
                    <div className="h-full bg-alert-rust/20 border-l border-white/20" style={{ width: `${gap.gapSize}%` }} />
                  </div>
                  <span className="text-xs font-bold text-ink w-6">{gap.requiredProficiency}%</span>
                </div>

                <div className="col-span-3 text-right">
                  <Link 
                    to={`/student/roadmap?skill=${gap.skillName}`}
                    className="inline-flex items-center gap-2 bg-ink text-paper px-3 py-1.5 rounded-sm text-xs font-bold hover:bg-ink/90 transition-colors"
                  >
                    Generate Roadmap <ArrowRight className="h-3 w-3 hidden sm:block" />
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
