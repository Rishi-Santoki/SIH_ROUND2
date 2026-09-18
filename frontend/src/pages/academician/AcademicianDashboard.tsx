import React from 'react';
import { Handshake, Calendar, Activity, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';

export function AcademicianDashboard() {
  const { data: myCollabs = [], isLoading: loadingCollabs } = useQuery<any[]>({
    queryKey: ['academician', 'collaborations', 'mine'],
    queryFn: () => apiClient<any[]>('/academician/collaborations/mine'),
  });

  const { data: skillPulse, isLoading: loadingPulse } = useQuery<any>({
    queryKey: ['academician', 'skill-pulse'],
    queryFn: () => apiClient<any>('/academician/skill-pulse'),
  });

  const activeCount = myCollabs.filter(c => c.status === 'ongoing').length;
  const proposedCount = myCollabs.filter(c => c.status === 'proposed').length;

  const topInsight = skillPulse?.insights?.[0] || {
    skill: 'Cloud Security',
    insight: 'Largest gap between industry demand and student readiness.'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Academician Dashboard</h1>
        <p className="text-sm text-slate mt-1">Manage collaborations and monitor institutional skill health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/academician/collaborations" 
          className="bg-white p-6 rounded-sm border border-hairline shadow-sm hover:border-ink/20 transition-all block group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Active Collaborations</span>
            <Handshake className="h-5 w-5 text-growth-teal" />
          </div>
          <div className="flex items-end gap-2">
            {loadingCollabs ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate" />
            ) : (
              <>
                <span className="text-4xl font-serif font-bold text-ink">{activeCount}</span>
                <span className="text-sm text-slate mb-1">/ {proposedCount} Proposed</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-ink group-hover:text-growth-teal mt-4 uppercase tracking-wider transition-colors">
            View Collaborations <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
        
        <div className="bg-white p-6 rounded-sm border border-hairline shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Upcoming Dates</span>
            <Calendar className="h-5 w-5 text-ink" />
          </div>
          <div className="flex flex-col gap-2">
            {myCollabs.length > 0 ? (
              myCollabs.slice(0, 2).map((c, i) => (
                <div key={i} className="text-sm font-bold text-ink truncate">
                  {c.collaboration_type?.toUpperCase()} - {c.title}
                </div>
              ))
            ) : (
              <>
                <div className="text-sm font-bold text-ink">Oct 15 - TechCorp Guest Lecture</div>
                <div className="text-sm font-bold text-ink">Nov 02 - AWS FDP Workshop</div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-hairline shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate uppercase tracking-wider">Skill Pulse Alert</span>
              <Activity className="h-5 w-5 text-alert-rust" />
            </div>
            {loadingPulse ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate" />
            ) : (
              <>
                <div className="text-lg font-serif font-bold text-alert-rust">{topInsight.skill}</div>
                <p className="text-xs text-slate mt-1 line-clamp-2">{topInsight.insight}</p>
              </>
            )}
          </div>
          <Link to="/academician/skill-pulse" className="flex items-center gap-1 text-xs font-bold text-ink hover:text-growth-teal mt-4 uppercase tracking-wider transition-colors">
            View Analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

