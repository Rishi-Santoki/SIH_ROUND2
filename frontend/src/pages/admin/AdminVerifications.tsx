import React, { useState } from 'react';
import { ShieldCheck, X, Check, Building2, Search, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_QUEUE = [
  { id: 'v1', type: 'company', name: 'TechCorp Solutions', submittedBy: 'admin@techcorp.com', date: '2 hours ago', context: 'CIN: U72900KA2023PTC123456', status: 'pending' },
  { id: 'v2', type: 'company', name: 'DataFlow Dynamics', submittedBy: 'hr@dataflow.com', date: '5 hours ago', context: 'Missing GSTIN proof', status: 'pending' },
  { id: 'v3', type: 'institution', name: 'National Institute of Tech', submittedBy: 'registrar@nit.edu', date: '1 day ago', context: 'UGC ID provided', status: 'pending' },
];

export function AdminVerifications() {
  const [activeTab, setActiveTab] = useState('company');
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // States for visual transition demo
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const filteredQueue = queue.filter(q => q.type === activeTab);

  const handleApprove = (id: string) => {
    setAnimatingId(id);
    setTimeout(() => {
      setQueue(q => q.map(item => item.id === id ? { ...item, status: 'verified' } : item));
      setTimeout(() => setAnimatingId(null), 500);
    }, 600);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    setAnimatingId(id);
    setTimeout(() => {
      setQueue(q => q.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
      setRejectingId(null);
      setRejectReason('');
      setTimeout(() => setAnimatingId(null), 500);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">Verification Queue</h1>
        <p className="text-sm text-slate mt-1">Review and process Trust Layer entity verifications.</p>
      </div>

      <div className="flex border-b border-hairline mb-6 overflow-x-auto">
        {['company', 'institution', 'alumni', 'certification', 'project'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 font-bold text-sm transition-colors relative capitalize whitespace-nowrap",
              activeTab === tab ? "text-ink" : "text-slate hover:text-ink"
            )}
          >
            {tab}s
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ink"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="bg-white p-8 border border-hairline rounded-sm text-center text-slate shadow-sm">
             No pending verifications for this entity type.
          </div>
        ) : (
          filteredQueue.map((item) => (
            <div 
              key={item.id} 
              className={cn(
                "bg-white border rounded-sm p-5 shadow-sm transition-all duration-500",
                animatingId === item.id ? "scale-[0.98] opacity-50" : "scale-100 opacity-100",
                item.status === 'verified' ? "border-growth-teal/50 bg-growth-teal/5" : 
                item.status === 'rejected' ? "border-alert-rust/50 bg-alert-rust/5" : "border-hairline"
              )}
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-ink text-lg">{item.name}</h3>
                    {item.status === 'verified' && (
                      <span className="bg-growth-teal text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="bg-alert-rust text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate mb-4">
                    <div><span className="font-bold">Submitted By:</span> {item.submittedBy}</div>
                    <div><span className="font-bold">Date:</span> {item.date}</div>
                    <div className="col-span-2"><span className="font-bold">Context:</span> {item.context}</div>
                  </div>
                  
                  {item.status === 'pending' && (
                    <button className="text-xs font-bold text-ink flex items-center gap-1 hover:underline">
                      View Attached Documents <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {item.status === 'pending' && (
                  <div className="shrink-0 w-full md:w-72">
                    {rejectingId === item.id ? (
                      <div className="space-y-3 bg-slate/5 p-3 rounded-sm border border-slate/10">
                        <label className="text-xs font-bold text-slate uppercase tracking-wider block">Rejection Reason</label>
                        <textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Explain why this was rejected..."
                          className="w-full bg-white border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-alert-rust h-20 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReject(item.id)}
                            disabled={!rejectReason.trim()}
                            className="flex-1 bg-alert-rust text-white py-1.5 rounded-sm text-sm font-bold hover:bg-alert-rust/90 disabled:opacity-50 transition-colors"
                          >
                            Confirm Reject
                          </button>
                          <button 
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="bg-white border border-hairline text-slate px-3 rounded-sm hover:bg-slate/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleApprove(item.id)}
                          className="w-full bg-ink text-paper py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button 
                          onClick={() => setRejectingId(item.id)}
                          className="w-full bg-white border border-alert-rust/30 text-alert-rust py-2 rounded-sm text-sm font-bold hover:bg-alert-rust/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
