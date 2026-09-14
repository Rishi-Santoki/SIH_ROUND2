import React, { useState } from 'react';
import { Plus, Upload, FolderGit2, ShieldCheck, Link as LinkIcon, FileText } from 'lucide-react';
import { ProofBadge } from '../../components/ui/ProofBadge';

const MOCK_PORTFOLIO = [
  { id: 'p1', type: 'project', title: 'E-commerce React Dashboard', date: 'Oct 2023', evidenceFor: ['React', 'TypeScript'], status: 'verified', link: 'github.com/user/dash' },
  { id: 'p2', type: 'certificate', title: 'AWS Solutions Architect Associate', date: 'Sep 2023', evidenceFor: ['Cloud Deployment'], status: 'verified', file: 'aws_cert.pdf' },
];

export function StudentPortfolio() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Portfolio Ledger</h1>
          <p className="text-sm text-slate mt-1">Projects and certificates that back up your claims.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border border-hairline border-dashed rounded-sm p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink">Add to Portfolio</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate hover:text-ink text-sm font-medium">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Item Type</label>
                <select className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink">
                  <option>Project / Repository</option>
                  <option>Certificate / Credential</option>
                  <option>Resume / CV</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">Title</label>
                <input type="text" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" placeholder="E.g., Personal Website" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">URL (Optional)</label>
                <input type="url" className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink" placeholder="https://..." />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">File Upload (File Storage Module)</label>
              <div className="border-2 border-dashed border-hairline bg-paper rounded-sm h-32 flex flex-col items-center justify-center text-slate hover:bg-slate/5 transition-colors cursor-pointer">
                <Upload className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Drop file here or click to upload</span>
                <span className="text-xs mt-1">PDF, JPG, PNG (Max 5MB)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
             <button className="bg-slate/10 text-ink px-6 py-2 rounded-sm text-sm font-medium hover:bg-slate/20 transition-colors">
                Save to Ledger
             </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-hairline bg-paper text-xs font-bold text-slate uppercase tracking-wider">
          <div className="col-span-6">Item</div>
          <div className="col-span-3">Evidence For</div>
          <div className="col-span-3 text-right">Status</div>
        </div>
        
        <div className="divide-y divide-hairline">
          {MOCK_PORTFOLIO.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate/5 transition-colors">
              <div className="col-span-6 flex items-start gap-3">
                <div className="h-10 w-10 bg-slate/5 rounded-sm flex items-center justify-center text-slate shrink-0">
                  {item.type === 'project' ? <FolderGit2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-ink">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate mt-1">
                    <span>{item.date}</span>
                    {item.link && (
                      <a href={`https://${item.link}`} className="flex items-center gap-1 hover:text-ink underline decoration-hairline hover:decoration-ink">
                        <LinkIcon className="h-3 w-3" /> {item.link}
                      </a>
                    )}
                    {item.file && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {item.file}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-span-3 flex flex-wrap gap-1">
                {item.evidenceFor.map(skill => (
                  <span key={skill} className="bg-white border border-hairline text-[10px] font-bold text-slate uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="col-span-3 flex justify-end">
                <ProofBadge status={item.status as any} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
