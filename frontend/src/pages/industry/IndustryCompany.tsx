import React, { useState } from 'react';
import { Upload, Plus, ShieldCheck } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';
import { cn } from '../../lib/utils';

export function IndustryCompany() {
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsVerified(true);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Company Profile</h1>
          <p className="text-sm text-slate mt-1">Manage your organization's identity and team access.</p>
        </div>
        <ProofBadge status={isVerified ? 'verified' : 'pending'} />
      </div>

      <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-6">Organization Details</h3>
        
        <form onSubmit={handleSubmitVerification} className="space-y-6">
          <div className="flex items-start gap-8">
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Company Logo</label>
              <div className="w-24 h-24 border-2 border-dashed border-hairline rounded-sm bg-paper flex flex-col items-center justify-center text-slate hover:bg-slate/5 transition-colors cursor-pointer">
                <Upload className="h-5 w-5 mb-1" />
                <span className="text-[10px] uppercase font-bold">Upload</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Company Name</label>
                <input type="text" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" defaultValue="TechCorp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Industry</label>
                  <input type="text" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" defaultValue="Software" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Website</label>
                  <input type="url" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" defaultValue="https://techcorp.example.com" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Company Description</label>
            <textarea className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink h-24" defaultValue="Leading provider of fintech solutions..." />
          </div>

          {!isVerified && (
            <div className="bg-paper p-4 rounded-sm border border-hairline">
              <h4 className="text-sm font-bold text-ink mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verification Request</h4>
              <p className="text-sm text-slate mb-4">Please provide an official company registration document or domain proof to verify your identity.</p>
              
              <div className="border border-dashed border-hairline bg-white rounded-sm h-16 flex items-center justify-center text-sm font-medium text-slate mb-4 cursor-pointer hover:bg-slate/5">
                 Attach Registration PDF
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          )}
          
          {isVerified && (
             <div className="flex justify-end pt-4 border-t border-hairline">
                <button type="button" className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors">
                  Save Changes
                </button>
             </div>
          )}
        </form>
      </div>

      <div className="bg-white border border-hairline rounded-sm p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Recruiter Team</h3>
          <button className="flex items-center gap-2 bg-slate/10 text-ink px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-slate/20 transition-colors">
            <Plus className="h-3 w-3" /> Invite
          </button>
        </div>
        
        <div className="divide-y divide-hairline">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-ink text-sm">Jane Doe (You)</p>
              <p className="text-xs text-slate">jane@techcorp.example.com</p>
            </div>
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
