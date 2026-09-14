import React, { useState } from 'react';
import { Search, Send, MoreVertical, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isDeleted?: boolean;
}

// Set this to false to test the empty state
const HAS_MESSAGES = true;

const MOCK_MESSAGES: Message[] = HAS_MESSAGES ? [
  { id: 'm1', senderId: 'al1', text: 'Hi Alex! I am a final year CS student at NIT. I saw you were open to mentoring on AWS Architecture. Do you have 15 mins to review my project design?', timestamp: '10:30 AM' },
  { id: 'm2', senderId: 'me', text: 'Hi! Sure, I would be happy to take a look. Send over the diagram.', timestamp: '10:45 AM' },
] : [];

export function AlumniMessages() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const handleDelete = (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, isDeleted: true } : m));
  };

  if (!HAS_MESSAGES) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white border border-hairline rounded-sm shadow-sm p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-16 h-16 bg-slate/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <MessageSquare className="h-8 w-8 text-slate" />
          </div>
          <h2 className="text-lg font-bold text-ink">No Messages Yet</h2>
          <p className="text-sm text-slate leading-relaxed">
            When a student or faculty member at your institution reaches out, their message will appear here.
          </p>
          <p className="text-xs font-bold text-slate uppercase tracking-wider pt-4">
             Note: Alumni can only reply to incoming conversations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
      
      {/* Threads List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-hairline flex flex-col bg-paper">
        <div className="p-4 border-b border-hairline">
          <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-slate" />
            <input type="text" placeholder="Search conversations..." className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Active thread */}
          <div className="p-4 border-b border-hairline bg-white cursor-pointer border-l-4 border-l-ink">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-ink text-sm">Rahul Sharma</h4>
              <span className="text-[10px] text-slate font-medium">10:45 AM</span>
            </div>
            <p className="text-sm text-slate truncate">Hi! Sure, I would be happy to...</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="h-16 border-b border-hairline px-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-ink">Rahul Sharma</h3>
            <p className="text-xs text-slate">Student • 4th Year CS</p>
          </div>
          <button className="text-slate hover:text-ink"><MoreVertical className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate/5">
          {messages.map(msg => {
            const isMe = msg.senderId === 'me';
            
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[70%] group", isMe ? "items-end" : "items-start")}>
                  {msg.isDeleted ? (
                    <div className="bg-paper border border-hairline text-slate italic px-4 py-2 rounded-sm text-sm">
                      [Message deleted]
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isMe && (
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-2">
                            <button onClick={() => handleDelete(msg.id)} className="p-1 text-slate hover:text-alert-rust rounded-sm"><Trash2 className="h-3 w-3" /></button>
                         </div>
                      )}
                      <div className={cn(
                        "px-4 py-2 rounded-sm text-sm",
                        isMe ? "bg-ink text-paper" : "bg-white border border-hairline text-ink"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                  <div className={cn("text-[10px] text-slate mt-1 font-medium", isMe && "text-right")}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-white border-t border-hairline">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Reply to this conversation..." 
              className="flex-1 bg-paper border border-hairline rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-ink"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-ink text-paper p-2.5 rounded-sm hover:bg-ink/90 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
