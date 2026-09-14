import React, { useState } from 'react';
import { Search, Building, GraduationCap, MessageCircle, ExternalLink } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { cn } from '../../lib/utils';

const MOCK_ALUMNI = [
  {
    id: 'al1',
    name: 'Sarah Jenkins',
    degree: 'B.Tech Computer Science',
    year: '2021',
    role: 'Data Scientist',
    company: 'TechCorp',
    skills: ['Python', 'SQL', 'Machine Learning'],
    reason: 'Current expertise match (Target Role: Data Scientist)',
    tab: 'recommended'
  },
  {
    id: 'al2',
    name: 'Michael Chang',
    degree: 'M.S. Data Science',
    year: '2019',
    role: 'Senior Analyst',
    company: 'Fintech Solutions',
    skills: ['R', 'Tableau', 'Statistics'],
    reason: 'Opted in as mentor for your institution',
    tab: 'recommended'
  },
  {
    id: 'al3',
    name: 'Priya Sharma',
    degree: 'B.Tech IT',
    year: '2022',
    role: 'Frontend Engineer',
    company: 'Startup Inc',
    skills: ['React', 'TypeScript'],
    tab: 'browse'
  }
];

export function SharedAlumniNetwork() {
  const [activeTab, setActiveTab] = useState<'recommended' | 'browse'>('recommended');
  
  const displayedAlumni = MOCK_ALUMNI.filter(a => activeTab === 'browse' ? true : a.tab === 'recommended');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Alumni Network</h1>
        <p className="text-sm text-slate mt-1">Connect with graduates who have walked your path.</p>
      </div>

      <div className="border-b border-hairline flex gap-8">
        <button 
          onClick={() => setActiveTab('recommended')}
          className={cn(
            "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
            activeTab === 'recommended' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Recommended for you
          {activeTab === 'recommended' && <div className="absolute bottom-0 left-0 w-full h-1 bg-ink rounded-t-sm" />}
        </button>
        <button 
          onClick={() => setActiveTab('browse')}
          className={cn(
            "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
            activeTab === 'browse' ? "text-ink" : "text-slate hover:text-ink"
          )}
        >
          Browse All
          {activeTab === 'browse' && <div className="absolute bottom-0 left-0 w-full h-1 bg-ink rounded-t-sm" />}
        </button>
      </div>

      {activeTab === 'browse' && (
        <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-3">
          <Search className="h-5 w-5 text-slate ml-2" />
          <input 
            type="text" 
            placeholder="Search by company, role, or skill..." 
            className="flex-1 bg-transparent text-sm focus:outline-none py-1"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedAlumni.map(alumni => (
          <div key={alumni.id} className="bg-white border border-hairline rounded-sm shadow-sm flex flex-col">
            {alumni.reason && (
              <div className="bg-slate/5 px-5 py-2 border-b border-hairline text-xs font-medium text-slate">
                <span className="font-bold text-ink">Why recommended:</span> {alumni.reason}
              </div>
            )}
            
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate/10 flex items-center justify-center font-serif font-bold text-ink text-xl">
                    {alumni.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-lg flex items-center gap-2">
                      {alumni.name} <ProofBadge status="verified" />
                    </h3>
                    <p className="text-sm text-slate flex items-center gap-1 mt-1">
                      <GraduationCap className="h-4 w-4" /> {alumni.degree}, {alumni.year}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-paper border border-hairline p-3 rounded-sm mb-4">
                <p className="text-sm font-bold text-ink flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate" /> {alumni.role} @ {alumni.company}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {alumni.skills.map(skill => (
                  <span key={skill} className="bg-white border border-hairline px-2 py-1 rounded-sm text-xs font-bold text-slate uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-hairline bg-paper flex items-center gap-4">
              <button className="flex-1 bg-ink text-paper py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" /> Message
              </button>
              <button className="flex-1 bg-white border border-hairline text-ink py-2 rounded-sm text-sm font-medium hover:bg-slate/5 transition-colors flex items-center justify-center gap-2">
                View Profile <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
