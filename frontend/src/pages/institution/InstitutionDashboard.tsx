import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Users, AlertTriangle, Briefcase, GraduationCap, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const READINESS_DISTRIBUTION = [
  { group: '<40% (At Risk)', count: 450, color: '#f87171' }, // alert-rust (approx)
  { group: '40-70% (Developing)', count: 1200, color: '#facc15' }, // warning-gold
  { group: '>70% (Placement Ready)', count: 850, color: '#10b981' }, // growth-teal
];

export function InstitutionDashboard() {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    // Simulate live data update time
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Institution Overview</h1>
          <p className="text-sm text-slate mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Live Data — Last updated at {lastUpdated}
          </p>
        </div>
      </div>

      {/* Top Actionable Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate('/institution/students?filter=at-risk')}
          className="bg-white p-5 border-2 border-alert-rust rounded-sm shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-alert-rust/10 p-2 rounded-sm text-alert-rust">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-alert-rust opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-bold text-ink mb-1">450</div>
          <div className="text-sm font-bold text-alert-rust flex items-center gap-1">
            At-Risk Students
          </div>
          <div className="text-xs text-slate mt-1">Placement readiness &lt; 40%</div>
        </div>

        <div className="bg-white p-5 border border-hairline rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate/10 p-2 rounded-sm text-slate">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-ink mb-1">2,500</div>
          <div className="text-sm font-bold text-slate">Total Students</div>
          <div className="text-xs text-slate mt-1">Active across 8 departments</div>
        </div>

        <div className="bg-white p-5 border border-hairline rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-growth-teal/10 p-2 rounded-sm text-growth-teal">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-ink mb-1">850</div>
          <div className="text-sm font-bold text-slate">Placement Ready</div>
          <div className="text-xs text-slate mt-1">Readiness &gt; 70%</div>
        </div>

        <div className="bg-white p-5 border border-hairline rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-500/10 p-2 rounded-sm text-indigo-500">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-ink mb-1">124</div>
          <div className="text-sm font-bold text-slate">Active Connections</div>
          <div className="text-xs text-slate mt-1">Industry partners engaged</div>
        </div>
      </div>

      {/* Headline Visual: Placement Readiness Distribution */}
      <div className="bg-white p-6 border border-hairline rounded-sm shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-ink text-lg">Overall Placement Readiness Distribution</h3>
          <span className="bg-growth-teal/10 text-growth-teal px-2 py-1 rounded-sm text-xs font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-growth-teal animate-pulse"></span> Live
          </span>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={READINESS_DISTRIBUTION}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="group" tick={{ fontSize: 12, fill: '#14213D', fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {READINESS_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate mt-4 text-center">
          Distribution of student population by aggregated placement readiness score.
        </p>
      </div>

    </div>
  );
}
