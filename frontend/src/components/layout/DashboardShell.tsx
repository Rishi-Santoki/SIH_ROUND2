import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { ShieldCheck, Bell, LogOut, Menu, X, User, Sparkles, Send, Check, CheckCircle2, MessageSquare, ExternalLink, AlertCircle, Trash2, RotateCcw, Compass, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProofBadge } from '../ui/ProofBadge';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { supabase } from '../../lib/supabase';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface DashboardShellProps {
  navItems?: NavItem[];
  userName?: string;
  userRole?: string;
  verificationStatus?: 'verified' | 'pending' | 'self-declared';
  hideCopilot?: boolean;
}

interface NotificationItem {
  notification_id: string;
  title: string;
  message: string;
  read_status?: boolean;
  is_read?: boolean;
  type?: string;
  reference_id?: string;
  created_at: string;
}

interface CopilotMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: string[];
  nextAction?: string;
}

export function DashboardShell({ 
  navItems = [], 
  userName: defaultUserName = 'User', 
  userRole,
  verificationStatus,
  hideCopilot = false
}: DashboardShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isIndustryRole = location.pathname.startsWith('/industry') || userRole?.toLowerCase() === 'recruiter' || userRole?.toLowerCase() === 'industry';
  const isStudentRole = !isIndustryRole && (userRole?.toLowerCase() === 'student' || !userRole);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');

  const defaultWelcomeText = isIndustryRole
    ? 'Hello! I am your ProofLedger Recruiter Copilot. Ask me about finding candidates with verified skills, talent pool analytics, or role match requirements.'
    : 'Hello! I am your ProofLedger AI Career Copilot. Ask me for a step-by-step roadmap for any skill, official NPTEL courses, or your current skill gaps.';

  const defaultWelcomeMsg: CopilotMessage = {
    id: 'welcome',
    sender: 'bot',
    text: defaultWelcomeText
  };

  const storageKey = `proofledger_copilot_${isIndustryRole ? 'industry' : 'student'}`;

  // Initialize from localStorage for instant display
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [defaultWelcomeMsg];
  });

  const [realUserName, setRealUserName] = useState<string>(defaultUserName);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch logged in user name
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.full_name) {
        setRealUserName(data.user.user_metadata.full_name);
      }
    });
  }, []);

  // 1. Fetch Chat History from Server
  const { data: serverHistory = [], refetch: refetchChatHistory } = useQuery({
    queryKey: ['copilot', 'history', isIndustryRole ? 'industry' : 'student'],
    queryFn: async () => {
      try {
        const endpoint = isIndustryRole ? '/industry/copilot/history' : '/student/copilot/history';
        const res = await apiClient.get<any[]>(endpoint);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // Sync server history when fetched
  useEffect(() => {
    if (serverHistory && serverHistory.length > 0) {
      const formatted: CopilotMessage[] = serverHistory.map((item: any, idx: number) => ({
        id: item.message_id || `hist-${idx}-${item.created_at}`,
        sender: (item.role === 'user' || item.is_bot === false) ? 'user' : 'bot',
        text: item.message || ''
      }));
      setCopilotMessages(formatted);
      try {
        localStorage.setItem(storageKey, JSON.stringify(formatted));
      } catch {
        // ignore
      }
    }
  }, [serverHistory, storageKey]);

  // Persist local copilotMessages to localStorage
  useEffect(() => {
    if (copilotMessages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(copilotMessages));
      } catch {
        // ignore
      }
    }
  }, [copilotMessages, storageKey]);

  // Scroll copilot to bottom
  useEffect(() => {
    if (copilotOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, copilotOpen]);

  // 2. Fetch Notifications (Student or Industry role endpoint)
  const { data: notifications = [] } = useQuery({
    queryKey: [isIndustryRole ? 'industry' : 'student', 'notifications'],
    queryFn: async () => {
      try {
        if (isIndustryRole) {
          const res = await apiClient.get<NotificationItem[]>('/industry/notifications');
          return Array.isArray(res) ? res : [];
        }
        if (isStudentRole) {
          const res = await apiClient.get<NotificationItem[]>('/student/notifications');
          return Array.isArray(res) ? res : [];
        }
        return [];
      } catch {
        return [];
      }
    },
    refetchInterval: 15000 // Refresh notifications periodically
  });

  // 3. Mark Notification Read Mutation
  const markReadMutation = useApiMutation({
    mutationFn: async (notificationId: string) => {
      if (isIndustryRole) {
        return await apiClient.patch(`/industry/notifications/${notificationId}/read`);
      }
      return await apiClient.patch(`/student/notifications/${notificationId}/read`);
    },
    invalidateQueries: [[isIndustryRole ? 'industry' : 'student', 'notifications']]
  });

  // 4. Ask Copilot Mutation
  const askCopilotMutation = useApiMutation({
    mutationFn: async (queryText: string) => {
      if (isIndustryRole) {
        return await apiClient.post<any>('/industry/copilot/ask', { query: queryText });
      }
      return await apiClient.post<any>('/student/copilot', { query: queryText });
    },
    onSuccess: (data, queryText) => {
      const botResponse: CopilotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.answer || 'I have analyzed your request.',
        sources: data.sources || [],
        nextAction: data.next_action
      };
      setCopilotMessages(prev => [...prev, botResponse]);
      refetchChatHistory();
    },
    onError: (err) => {
      setCopilotMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `Error connecting to Copilot: ${err.message}`
        }
      ]);
    }
  });

  // 5. Clear Copilot History Mutation
  const clearHistoryMutation = useApiMutation({
    mutationFn: async () => {
      localStorage.removeItem(storageKey);
      if (!isIndustryRole) {
        return await apiClient.delete('/student/copilot/history');
      }
    },
    onSuccess: () => {
      setCopilotMessages([defaultWelcomeMsg]);
      refetchChatHistory();
    }
  });

  const isNotificationUnread = (n: NotificationItem) => !(n.is_read || n.read_status);
  const unreadCount = notifications.filter(isNotificationUnread).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSendCopilot = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (typeof customQuery === 'string' ? customQuery : copilotQuery).trim();
    if (!q || askCopilotMutation.isPending) return;

    setCopilotQuery('');
    setCopilotMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: q }
    ]);
    askCopilotMutation.mutate(q);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      
      {/* Mobile Sidebar Toggle & Header */}
      <div className="md:hidden flex items-center justify-between border-b border-hairline bg-white p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2 font-serif font-bold text-ink">
           <ShieldCheck className="h-6 w-6" />
           <span>ProofLedger</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="text-ink">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-ink/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 h-screen w-64 bg-ink flex-shrink-0 flex flex-col z-50 transition-transform duration-300 ease-in-out border-r border-hairline",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate/20">
          <Link to="/" className="flex items-center gap-2 font-serif font-bold text-paper">
            <ShieldCheck className="h-6 w-6" />
            <span>ProofLedger</span>
          </Link>
          <button className="md:hidden text-paper" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          <div className="px-6 pb-2 text-xs font-medium text-slate uppercase tracking-wider">
             {userRole ? `${userRole} Dashboard` : 'Dashboard'}
          </div>
          {navItems.length > 0 ? navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/student' && location.pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href}
                to={item.href}
                className={cn(
                  "px-6 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors relative",
                  isActive ? "text-paper" : "text-slate hover:text-paper"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-verified-gold rounded-r-sm" />
                )}
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          }) : (
             <div className="px-6 text-sm text-slate">Navigation pending...</div>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-hairline bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="hidden md:block text-sm font-medium text-slate">
            {navItems.find(n => n.href !== '/student' && location.pathname.startsWith(n.href))?.label || 'Dashboard'}
          </div>
          <div className="flex-1 md:hidden" />
          
          <div className="flex items-center gap-6">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative text-slate hover:text-ink transition-colors p-1"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 bg-alert-rust rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-hairline rounded-sm shadow-xl z-50 overflow-hidden animate-in zoom-in-95">
                    <div className="p-3 border-b border-hairline bg-paper flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-ink">Notifications</h4>
                      <span className="text-xs text-slate">{unreadCount} unread</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-hairline">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate">
                          No notifications to display.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.notification_id}
                            className={cn(
                              "p-3 text-left transition-colors flex items-start justify-between gap-3",
                              isNotificationUnread(n) ? "bg-growth-teal/5" : "hover:bg-slate/5"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-ink">{n.title}</h5>
                              <p className="text-xs text-slate mt-0.5 break-words">{n.message}</p>
                              <span className="text-[10px] text-slate mt-1 block">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {isNotificationUnread(n) && (
                              <button
                                onClick={() => markReadMutation.mutate(n.notification_id)}
                                disabled={markReadMutation.isPending}
                                className="text-slate hover:text-ink p-1 shrink-0"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5 text-growth-teal" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* User Profile Info */}
            <div className="flex items-center gap-4 border-l border-hairline pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-ink">{realUserName}</span>
                {verificationStatus && <ProofBadge status={verificationStatus} />}
              </div>
              <div className="h-8 w-8 rounded-full bg-slate/10 border border-hairline flex items-center justify-center text-ink shrink-0">
                 <User className="h-4 w-4" />
              </div>
              <button onClick={handleLogout} className="text-slate hover:text-alert-rust transition-colors ml-2" title="Log out">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-paper p-6 pb-20">
           <div className="max-w-7xl mx-auto h-full">
              <Outlet />
           </div>
        </main>

        {/* Floating Copilot Button */}
        {!hideCopilot && (
          <button
            onClick={() => setCopilotOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-ink text-paper px-4 py-3 rounded-full shadow-lg hover:bg-ink/90 transition-all flex items-center gap-2 border border-slate/20 hover:scale-105 active:scale-95"
            title="Ask ProofLedger AI Copilot"
          >
            <Sparkles className="h-4 w-4 text-verified-gold animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase">ProofLedger Copilot</span>
          </button>
        )}

        {/* AI Copilot Drawer */}
        {copilotOpen && (
          <>
            <div 
              className="fixed inset-0 bg-ink/20 z-50 backdrop-blur-sm transition-opacity"
              onClick={() => setCopilotOpen(false)} 
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-md sm:max-w-lg bg-white shadow-2xl z-50 border-l border-hairline flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-hairline bg-paper flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-xs">
                    <div className="h-full w-full bg-white rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif font-bold text-ink text-base">ProofLedger AI Copilot</h3>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                    </div>
                    <p className="text-[10px] text-slate font-medium">NPTEL Govt. Courses & Skill Roadmap Mentor</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm("Clear all copilot conversation history?")) {
                        clearHistoryMutation.mutate();
                      }
                    }}
                    disabled={clearHistoryMutation.isPending || copilotMessages.length <= 1}
                    className="p-1.5 text-slate hover:text-alert-rust rounded-sm transition-colors disabled:opacity-30"
                    title="Clear chat history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setCopilotOpen(false)}
                    className="p-1.5 text-slate hover:text-ink rounded-sm transition-colors ml-1"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Chat Conversation Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {copilotMessages.map((msg) => (
                  <div key={msg.id} className="w-full">
                    {msg.sender === 'user' ? (
                      <div className="flex items-start justify-end gap-2 max-w-[88%] ml-auto">
                        <div className="bg-ink text-paper rounded-2xl rounded-tr-none px-4 py-2.5 text-sm leading-relaxed shadow-xs">
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                          {realUserName ? realUserName[0].toUpperCase() : 'U'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 max-w-[95%]">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-4 shadow-xs text-ink flex-1 overflow-hidden">
                          <div className="text-xs sm:text-sm text-ink leading-relaxed">
                            <ReactMarkdown
                              components={{
                                h1: ({ node, ...props }) => <h1 className="text-base font-bold font-serif text-ink mt-3 mb-1.5 border-b border-hairline pb-1" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-sm font-bold font-serif text-ink mt-3 mb-1.5 text-blue-900" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-ink mt-2.5 mb-1 text-slate-900" {...props} />,
                                h4: ({ node, ...props }) => <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-2 mb-1" {...props} />,
                                p: ({ node, ...props }) => <p className="text-xs sm:text-sm leading-relaxed mb-2 text-ink/90" {...props} />,
                                ul: ({ node, ...props }) => <ul className="space-y-1 mb-2.5 pl-4 list-disc marker:text-growth-teal text-xs sm:text-sm" {...props} />,
                                ol: ({ node, ...props }) => <ol className="space-y-1 mb-2.5 pl-4 list-decimal marker:text-ink font-medium text-xs sm:text-sm" {...props} />,
                                li: ({ node, ...props }) => <li className="leading-relaxed text-ink/90" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-ink" {...props} />,
                                hr: ({ node, ...props }) => <hr className="my-3 border-hairline" {...props} />,
                                a: ({ node, href, children, ...props }) => (
                                  <a 
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded-sm transition-colors my-0.5 underline underline-offset-2 break-all"
                                    {...props}
                                  >
                                    <span>{children}</span>
                                    <ExternalLink className="h-3 w-3 inline shrink-0" />
                                  </a>
                                ),
                                blockquote: ({ node, ...props }) => (
                                  <blockquote className="border-l-2 border-orange-500 bg-orange-50/60 pl-3 py-1.5 text-xs text-orange-900 rounded-r-sm my-2 font-medium" {...props} />
                                ),
                                code: ({ node, inline, ...props }: any) => inline 
                                  ? <code className="bg-slate-100 text-ink px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200" {...props} />
                                  : <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-sm overflow-x-auto text-[11px] font-mono my-2"><code {...props} /></pre>
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-hairline flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate shrink-0">Sources:</span>
                              {msg.sources.map((s, idx) => (
                                <span key={idx} className="inline-flex items-center text-[10px] bg-slate/10 text-slate px-2 py-0.5 rounded-sm font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.nextAction && (
                            <div className="mt-2.5 pt-2 border-t border-hairline/60 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[11px] font-semibold text-growth-teal flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                Next: {msg.nextAction}
                              </span>
                              {isStudentRole && (
                                <Link
                                  to="/student/learning"
                                  onClick={() => setCopilotOpen(false)}
                                  className="text-[10px] font-bold text-ink underline hover:text-growth-teal shrink-0 flex items-center gap-0.5"
                                >
                                  <span>View Courses</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {askCopilotMutation.isPending && (
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div className="bg-white border border-hairline rounded-2xl rounded-tl-none p-3.5 text-xs text-slate shadow-xs flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      <span>Generating step-by-step roadmap & finding NPTEL courses...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div className="px-4 py-2 border-t border-hairline bg-paper/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { label: "🗺️ Python Roadmap", q: "Give me a complete roadmap for Python" },
                  { label: "🧠 Deep Learning Path", q: "Give me a step by step roadmap for Deep Learning" },
                  { label: "☁️ Cloud Computing", q: "Give me a roadmap for Cloud Computing" },
                  { label: "📊 Missing Skill Gaps", q: "What are my missing skill gaps?" }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendCopilot(undefined, chip.q)}
                    disabled={askCopilotMutation.isPending}
                    className="shrink-0 text-[11px] font-medium bg-white hover:bg-slate-50 border border-hairline hover:border-ink/40 text-ink px-2.5 py-1 rounded-full shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <div className="p-3.5 border-t border-hairline bg-white">
                <form onSubmit={(e) => handleSendCopilot(e)} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    placeholder="Ask for a roadmap (e.g. 'Roadmap for Python')..."
                    disabled={askCopilotMutation.isPending}
                    className="flex-1 bg-paper border border-hairline rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-ink disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!copilotQuery.trim() || askCopilotMutation.isPending}
                    className="bg-ink text-paper h-9 w-9 rounded-full hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 shadow-xs"
                    title="Send"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
