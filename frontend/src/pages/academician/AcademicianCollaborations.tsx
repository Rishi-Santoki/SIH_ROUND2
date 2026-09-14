import React, { useState } from 'react';
import { Plus, Search, Building, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSearchParams } from 'react-router-dom';

const MOCK_COLLAB = [
  { id: 'c1', type: 'Guest Lecture', title: 'Modern Data Architectures', company: 'DataBricks', status: 'Available', tab: 'available' },
  { id: 'c2', type: 'Research', title: 'NLP for Local Languages', company: 'AI Labs', status: 'Recommended', tab: 'recommended', reason: 'Matches your Deep Learning expertise' },
  { id: 'c3', type: 'FDP', title: 'Cloud Infrastructure Training', company: 'AWS', status: 'Active', tab: 'mine' }
];

export function AcademicianCollaborations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFormType = searchParams.get('proposeType') || 'Guest Lecture';
  
  const [activeTab, setActiveTab] = useState<'recommended' | 'available' | 'mine'>('recommended');
  const [isCreating, setIsCreating] = useState(searchParams.get('propose') === 'true');
  
  const [companyLink, setCompanyLink] = useState('');
  const [companyStatus, setCompanyStatus] = useState<'verified' | 'unverified' | null>(null);

  const displayedCollabs = MOCK_COLLAB.filter(c => c.tab === activeTab);

  // Mocking company lookup
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyLink(val);
    if (val.toLowerCase().includes('unverified')) {
      setCompanyStatus('unverified');
    } else if (val.length > 3) {
      setCompanyStatus('verified');
    } else {
      setCompanyStatus(null);
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-ink">Propose Collaboration</h1>
          <button 
            onClick={() => {
              setIsCreating(false);
              setSearchParams({});
            }} 
            className="text-sm font-medium text-slate hover:text-ink"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Collaboration Type</label>
            <select className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" defaultValue={initialFormType}>
              <option>FDP</option>
              <option>Research</option>
              <option>Consultancy</option>
              <option>Guest Lecture</option>
              <option>Mentorship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Title / Subject</label>
            <input type="text" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" placeholder="e.g. Advanced Cloud Security FDP" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Description & Outcomes</label>
            <textarea className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-24" />
          </div>

          <div className="pt-4 border-t border-hairline">
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Target Industry Partner (Optional)</label>
            <p className="text-xs text-slate mb-3">Link a specific company profile if you have one in mind.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={companyLink}
                onChange={handleCompanyChange}
                className="flex-1 bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" 
                placeholder="Enter company name or ID (type 'unverified' to test gate)" 
              />
            </div>
            
            {companyStatus === 'unverified' && (
              <div className="mt-3 bg-alert-rust/10 border border-alert-rust/20 rounded-sm p-3 flex items-start gap-2 text-alert-rust">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="text-sm font-medium">
                  This company is not verified on the ProofLedger. You cannot propose a direct collaboration until their identity is verified.
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              disabled={companyStatus === 'unverified'}
              className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Proposal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Collaborations</h1>
          <p className="text-sm text-slate mt-1">Connect with industry for research, FDPs, and guest lectures.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Propose
        </button>
      </div>

      <div className="border-b border-hairline flex gap-8">
        {(['recommended', 'available', 'mine'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative",
              activeTab === tab ? "text-ink" : "text-slate hover:text-ink"
            )}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-ink rounded-t-sm" />}
          </button>
        ))}
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        {displayedCollabs.length === 0 ? (
          <div className="p-8 text-center text-slate text-sm">No collaborations in this category.</div>
        ) : (
          <div className="divide-y divide-hairline">
            {displayedCollabs.map(collab => (
              <div key={collab.id} className="flex flex-col">
                {collab.reason && (
                  <div className="bg-growth-teal/5 px-5 py-2 text-xs font-medium text-growth-teal border-b border-hairline flex items-center gap-2">
                    <span className="font-bold">Why recommended:</span> {collab.reason}
                  </div>
                )}
                <div className="p-5 flex items-center justify-between hover:bg-slate/5 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-ink text-lg">{collab.title}</h3>
                      <span className="px-2 py-0.5 rounded-sm bg-slate/10 text-slate text-[10px] font-bold uppercase tracking-wider">
                        {collab.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate flex items-center gap-1">
                      <Building className="h-4 w-4" /> {collab.company}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {collab.tab === 'mine' && (
                      <select className="bg-paper border border-hairline rounded-sm px-2 py-1 text-xs font-bold focus:outline-none">
                        <option>Active</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    )}
                    <button className="text-sm font-medium text-ink underline decoration-hairline hover:decoration-ink underline-offset-4 flex items-center gap-1">
                      View Details <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
