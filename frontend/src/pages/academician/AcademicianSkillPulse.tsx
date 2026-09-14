import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_DATA = [
  { skill: 'Cloud Security', demand: 92, readiness: 45 },
  { skill: 'React / Next.js', demand: 88, readiness: 82 },
  { skill: 'Machine Learning', demand: 85, readiness: 60 },
  { skill: 'Advanced SQL', demand: 75, readiness: 70 },
  { skill: 'DevOps (CI/CD)', demand: 80, readiness: 50 },
];

export function AcademicianSkillPulse() {
  const navigate = useNavigate();

  const handleProposeCollab = (type: string) => {
    navigate(`/academician/collaborations?propose=true&proposeType=${type}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Skill Pulse</h1>
        <p className="text-sm text-slate mt-1">Real-time analysis of institutional readiness vs. industry demand.</p>
      </div>

      {/* Privacy Note */}
      <div className="bg-slate/5 border border-hairline rounded-sm p-3 flex items-center justify-center gap-2">
        <ShieldAlert className="h-4 w-4 text-slate" />
        <span className="text-xs font-medium text-slate uppercase tracking-wider">
          Aggregate data only. No individual student identifiers or performance metrics are exposed here.
        </span>
      </div>

      <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm">
        <h3 className="font-bold text-ink mb-6">Readiness vs. Demand (Institution-wide)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MOCK_DATA}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis dataKey="skill" type="category" width={120} tick={{ fontSize: 12, fill: '#14213D', fontWeight: 600 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
              <Bar dataKey="demand" name="Industry Demand" fill="#a8a29e" radius={[0, 4, 4, 0]} />
              <Bar dataKey="readiness" name="Student Readiness" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate uppercase tracking-wider mb-4">Actionable Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-alert-rust/30 rounded-sm p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-ink text-lg">Cloud Security</h4>
              <span className="bg-alert-rust/10 text-alert-rust px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                Critical Gap
              </span>
            </div>
            <p className="text-sm text-slate mb-4">
              Industry demand is at 92%, but institutional readiness is only 45%. Students are lacking hands-on AWS IAM and KMS evidence.
            </p>
            <div className="bg-paper p-3 rounded-sm border border-hairline mb-4">
              <p className="text-xs font-bold text-ink flex items-center gap-2">
                Suggested Action:
              </p>
              <p className="text-xs text-slate mt-1">
                Host an FDP or Guest Lecture to upskill faculty and students on modern cloud security practices.
              </p>
            </div>
            <button 
              onClick={() => handleProposeCollab('Guest Lecture')}
              className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
            >
              Propose Guest Lecture <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-white border border-alert-rust/30 rounded-sm p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-ink text-lg">DevOps (CI/CD)</h4>
              <span className="bg-alert-rust/10 text-alert-rust px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                High Gap
              </span>
            </div>
            <p className="text-sm text-slate mb-4">
              Demand remains high (80%), but readiness is lagging (50%). Students lack verifiable deployment pipelines in their portfolios.
            </p>
            <div className="bg-paper p-3 rounded-sm border border-hairline mb-4">
              <p className="text-xs font-bold text-ink flex items-center gap-2">
                Suggested Action:
              </p>
              <p className="text-xs text-slate mt-1">
                Integrate CI/CD pipeline requirements into major project rubrics.
              </p>
            </div>
            <button 
              onClick={() => handleProposeCollab('FDP')}
              className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
            >
              Propose FDP for Faculty <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
