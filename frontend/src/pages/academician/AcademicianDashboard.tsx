import React from 'react';
import { Handshake, Calendar, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AcademicianDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Academician Dashboard</h1>
        <p className="text-sm text-slate mt-1">Manage collaborations and monitor institutional skill health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-sm border border-hairline shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Active Collaborations</span>
            <Handshake className="h-5 w-5 text-growth-teal" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-bold text-ink">2</span>
            <span className="text-sm text-slate mb-1">/ 1 Proposed</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm border border-hairline shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate uppercase tracking-wider">Upcoming Dates</span>
            <Calendar className="h-5 w-5 text-ink" />
          </div>
          <div className="flex flex-col gap-1">
             <div className="text-sm font-bold text-ink">Oct 15 - TechCorp Guest Lecture</div>
             <div className="text-sm font-bold text-ink">Nov 02 - AWS FDP Workshop</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-hairline shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate uppercase tracking-wider">Skill Pulse Alert</span>
              <Activity className="h-5 w-5 text-alert-rust" />
            </div>
            <div className="text-lg font-serif font-bold text-alert-rust">Cloud Security</div>
            <p className="text-xs text-slate mt-1">Largest gap between industry demand and student readiness.</p>
          </div>
          <Link to="/academician/skill-pulse" className="flex items-center gap-1 text-xs font-bold text-ink hover:text-growth-teal mt-4 uppercase tracking-wider transition-colors">
            View Analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
