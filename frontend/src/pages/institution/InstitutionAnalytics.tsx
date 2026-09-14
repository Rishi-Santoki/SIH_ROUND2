import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { ShieldCheck, TrendingUp, BookOpen, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

const PROGRESSION_DATA = [
  { month: 'Jan', readiness: 45, assessments: 120 },
  { month: 'Feb', readiness: 48, assessments: 150 },
  { month: 'Mar', readiness: 52, assessments: 210 },
  { month: 'Apr', readiness: 58, assessments: 280 },
  { month: 'May', readiness: 65, assessments: 340 },
  { month: 'Jun', readiness: 72, assessments: 410 },
];

const SKILL_GAPS_DATA = [
  { skill: 'Cloud Security', gap: 65 },
  { skill: 'System Design', gap: 45 },
  { skill: 'Data Engineering', gap: 35 },
  { skill: 'DevOps (CI/CD)', gap: 30 },
  { skill: 'React / Next.js', gap: 15 },
];

export function InstitutionAnalytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Institutional Analytics</h1>
        <p className="text-sm text-slate mt-1">Aggregate data across the student body for placement readiness and skill gaps.</p>
      </div>

      {/* Verified Evidence Rate Visual - The Core Proof Concept */}
      <div className="bg-white p-6 border-2 border-warning-gold/30 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning-gold/5 rounded-bl-full -z-10"></div>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-warning-gold" />
          <h3 className="font-bold text-ink text-lg">Verified Evidence Rate</h3>
        </div>
        
        <p className="text-sm text-slate max-w-2xl mb-8">
          This metric represents the core of the Trust Layer. It shows the proportion of student skills backed by cryptographically verified evidence (GitHub, certifications) versus self-declared claims.
        </p>

        <div className="space-y-4">
          <div className="flex justify-between text-sm font-bold text-ink mb-1">
            <span>Overall Evidence Profile</span>
            <span>25,482 Total Claims</span>
          </div>
          
          <div className="h-10 w-full flex rounded-sm overflow-hidden bg-paper border border-hairline">
            {/* Verified Segment - Solid Gold */}
            <div 
              className="h-full bg-warning-gold relative flex items-center px-4"
              style={{ width: '68%' }}
            >
              <span className="text-white text-xs font-bold whitespace-nowrap hidden md:inline">
                68% Verified
              </span>
            </div>
            {/* Self-Declared Segment - Dashed Muted */}
            <div 
              className="h-full bg-white relative flex items-center justify-end px-4 flex-1 border-l-2 border-dashed border-slate/30"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)' }}
            >
              <span className="text-slate text-xs font-bold whitespace-nowrap hidden md:inline">
                32% Self-Declared
              </span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate md:hidden">
            <span className="text-warning-gold font-bold">68% Verified</span>
            <span>32% Self-Declared</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Progression over time */}
        <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm">
          <h3 className="font-bold text-ink mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-growth-teal" /> 
            Placement Readiness Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PROGRESSION_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                <Line type="monotone" dataKey="readiness" name="Avg Readiness %" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Institutional Skill Gaps */}
        <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm">
          <h3 className="font-bold text-ink mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-alert-rust" /> 
            Top Institutional Skill Gaps
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SKILL_GAPS_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="skill" type="category" width={110} tick={{ fontSize: 12, fill: '#14213D', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="gap" name="Gap Severity (%)" fill="#f87171" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
