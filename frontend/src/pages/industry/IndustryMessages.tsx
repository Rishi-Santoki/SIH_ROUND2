import React from 'react';
import { Search } from 'lucide-react';

export function IndustryMessages() {
  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white border border-hairline rounded-sm overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-hairline flex flex-col bg-paper">
        <div className="p-4 border-b border-hairline bg-white">
          <h2 className="font-bold text-ink mb-4">Messages</h2>
          <div className="bg-paper border border-hairline p-2 rounded-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-slate" />
            <input type="text" placeholder="Search conversations..." className="bg-transparent text-sm focus:outline-none w-full" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-hairline bg-white cursor-pointer border-l-2 border-l-growth-teal">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-ink text-sm">Sarah Jenkins</span>
              <span className="text-xs text-slate">10:42 AM</span>
            </div>
            <p className="text-xs text-slate truncate">Thank you for the interview opportunity...</p>
          </div>
          <div className="p-4 border-b border-hairline hover:bg-white cursor-pointer transition-colors">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-ink text-sm">TechCorp System</span>
              <span className="text-xs text-slate">Yesterday</span>
            </div>
            <p className="text-xs text-slate truncate">Your company verification has been pending...</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-hairline flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-ink">Sarah Jenkins</h3>
            <p className="text-xs text-slate">Candidate: Junior Data Analyst</p>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-paper/50">
          <div className="flex flex-col gap-1 items-start">
            <div className="bg-white border border-hairline p-3 rounded-sm rounded-tl-none max-w-md shadow-sm text-sm text-ink">
              Hello, I noticed your posting for the Junior Data Analyst role. I have completed the required Python assessment and my ProofLedger is updated.
            </div>
            <span className="text-[10px] text-slate font-medium ml-1">Yesterday, 2:30 PM</span>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <div className="bg-ink text-white p-3 rounded-sm rounded-tr-none max-w-md shadow-sm text-sm">
              Hi Sarah, thanks for reaching out. Your Python score looks great. Are you available for a brief technical screen this Thursday?
            </div>
            <span className="text-[10px] text-slate font-medium mr-1">Yesterday, 4:15 PM</span>
          </div>
          
          <div className="flex flex-col gap-1 items-start">
            <div className="bg-white border border-hairline p-3 rounded-sm rounded-tl-none max-w-md shadow-sm text-sm text-ink">
              Thank you for the interview opportunity. Yes, Thursday works perfectly. Anytime after 1 PM EST.
            </div>
            <span className="text-[10px] text-slate font-medium ml-1">Today, 10:42 AM</span>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-hairline">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-paper border border-hairline rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-ink" 
            />
            <button className="bg-ink text-paper px-6 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
