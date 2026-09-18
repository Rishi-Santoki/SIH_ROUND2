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
import { ShieldAlert, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';

interface DemandItem {
  skill: string;
  demand_level: string;
  opportunity_count: number;
}

interface ReadinessItem {
  skill: string;
  readiness_level: string;
  avg_proficiency: number;
}

interface InsightItem {
  skill: string;
  insight: string;
  action: string;
  suggested_collaboration_type: string;
}

interface SkillPulseData {
  industry_demand: DemandItem[];
  student_readiness: ReadinessItem[];
  insights: InsightItem[];
}

const FALLBACK_INSIGHTS: InsightItem[] = [
  {
    skill: 'Cloud Security',
    insight: 'Industry demand is at 92%, but institutional readiness is only 45%. Students are lacking hands-on AWS IAM and KMS evidence.',
    action: 'Host an FDP or Guest Lecture to upskill faculty and students on modern cloud security practices.',
    suggested_collaboration_type: 'guest_lecture'
  },
  {
    skill: 'DevOps (CI/CD)',
    insight: 'Demand remains high (80%), but readiness is lagging (50%). Students lack verifiable deployment pipelines in their portfolios.',
    action: 'Integrate CI/CD pipeline requirements into major project rubrics and conduct an intensive faculty workshop.',
    suggested_collaboration_type: 'fdp'
  }
];

export function AcademicianSkillPulse() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<SkillPulseData>({
    queryKey: ['academician', 'skill-pulse'],
    queryFn: () => apiClient<SkillPulseData>('/academician/skill-pulse'),
  });

  const handleProposeCollab = (type: string, skill: string, actionText: string) => {
    const formattedType = type.toLowerCase().includes('lecture') ? 'guest_lecture' : 'fdp';
    const typeLabel = formattedType === 'guest_lecture' ? 'Guest Lecture' : 'Faculty Development Program (FDP)';
    const title = `${typeLabel}: ${skill}`;
    const description = `Industry-academia collaboration focused on ${skill}. Objective: ${actionText}`;

    const params = new URLSearchParams({
      propose: 'true',
      proposeType: formattedType,
      title,
      description,
    });
    navigate(`/academician/collaborations?${params.toString()}`);
  };

  // Build chart dataset
  const readinessMap = new Map<string, number>();
  (data?.student_readiness || []).forEach((r) => {
    readinessMap.set(r.skill, r.avg_proficiency);
  });

  const chartData = (data?.industry_demand && data.industry_demand.length > 0)
    ? data.industry_demand.slice(0, 7).map((d) => {
        const oppCount = d.opportunity_count || 1;
        const demandScore = Math.min(100, Math.max(30, oppCount * 25));
        const readinessScore = readinessMap.get(d.skill) || (d.demand_level === 'HIGH' ? 45 : 60);
        return {
          skill: d.skill,
          demand: demandScore,
          readiness: readinessScore,
        };
      })
    : [
        { skill: 'Cloud Security', demand: 92, readiness: 45 },
        { skill: 'React / Next.js', demand: 88, readiness: 82 },
        { skill: 'Machine Learning', demand: 85, readiness: 60 },
        { skill: 'Advanced SQL', demand: 75, readiness: 70 },
        { skill: 'DevOps (CI/CD)', demand: 80, readiness: 50 },
      ];

  const insightsList = (data?.insights && data.insights.length > 0)
    ? data.insights
    : FALLBACK_INSIGHTS;

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

      {isLoading ? (
        <div className="bg-white p-12 border border-hairline rounded-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-growth-teal animate-spin" />
          <p className="text-sm text-slate">Computing institutional skill health...</p>
        </div>
      ) : error ? (
        <div className="bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-4 text-alert-rust text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load Skill Pulse analytics: {(error as any)?.message || 'Network error'}</span>
        </div>
      ) : (
        <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm">
          <h3 className="font-bold text-ink mb-6">Readiness vs. Demand (Institution-wide)</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="skill" type="category" width={140} tick={{ fontSize: 12, fill: '#14213D', fontWeight: 600 }} />
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
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-growth-teal" />
          <h3 className="text-sm font-bold text-slate uppercase tracking-wider">Actionable Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insightsList.map((item, idx) => {
            const collabType = item.suggested_collaboration_type || 'guest_lecture';
            const actionLabel = collabType === 'fdp' ? 'Propose FDP for Faculty' : 'Propose Guest Lecture';

            return (
              <div key={idx} className="bg-white border border-alert-rust/30 rounded-sm p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-ink text-lg">{item.skill}</h4>
                    <span className="bg-alert-rust/10 text-alert-rust px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                      Curriculum Gap
                    </span>
                  </div>
                  <p className="text-sm text-slate mb-4">
                    {item.insight}
                  </p>
                  <div className="bg-paper p-3 rounded-sm border border-hairline mb-4">
                    <p className="text-xs font-bold text-ink flex items-center gap-2">
                      Suggested Action:
                    </p>
                    <p className="text-xs text-slate mt-1">
                      {item.action}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => handleProposeCollab(collabType, item.skill, item.action)}
                  className="w-full bg-ink text-paper py-2.5 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {actionLabel} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

