import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Bell, LogOut, Menu, X, User, Sparkles, Send, Check, CheckCircle2, MessageSquare, ExternalLink, AlertCircle } from 'lucide-react';
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
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: isIndustryRole
        ? 'Hello! I am your ProofLedger Recruiter Copilot. Ask me about finding candidates with verified skills, talent pool analytics, or role match requirements.'
        : 'Hello! I am your ProofLedger Career Copilot. Ask me about your skill gaps, target career paths, assessments, or application match scores.'
    }
  ]);

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

  // Scroll copilot to bottom
  useEffect(() => {
    if (copilotOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, copilotOpen]);

  // 1. Fetch Notifications (Student or Industry role endpoint)
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

  // 2. Mark Notification Read Mutation
  const markReadMutation = useApiMutation({
    mutationFn: async (notificationId: string) => {
      if (isIndustryRole) {
        return await apiClient.patch(`/industry/notifications/${notificationId}/read`);
      }
      return await apiClient.patch(`/student/notifications/${notificationId}/read`);
    },
    invalidateQueries: [[isIndustryRole ? 'industry' : 'student', 'notifications']]
  });

  // 3. Ask Copilot Mutation
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

  const isNotificationUnread = (n: NotificationItem) => !(n.is_read || n.read_status);
  const unreadCount = notifications.filter(isNotificationUnread).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSendCopilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim() || askCopilotMutation.isPending) return;

    const q = copilotQuery.trim();
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
              className="fixed inset-0 bg-ink/20 z-50 backdrop-blur-sm"
              onClick={() => setCopilotOpen(false)} 
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-hairline flex flex-col animate-in slide-in-from-right">
              {/* Drawer Header */}
              <div className="p-4 border-b border-hairline bg-paper flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-verified-gold/20 flex items-center justify-center text-ink">
                    <Sparkles className="h-4 w-4 text-ink" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-ink text-base">ProofLedger AI Copilot</h3>
                    <p className="text-[10px] text-slate uppercase tracking-wider font-bold">Evidence-Grounded Assistant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCopilotOpen(false)}
                  className="p-1 text-slate hover:text-ink rounded-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Conversation Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate/5">
                {copilotMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      msg.sender === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "max-w-[85%] rounded-sm p-3 text-sm leading-relaxed",
                        msg.sender === 'user' 
                          ? "bg-ink text-paper" 
                          : "bg-white border border-hairline text-ink shadow-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-hairline text-[10px] text-slate">
                          <span className="font-bold uppercase tracking-wider block mb-1">Sources & Grounding:</span>
                          <ul className="list-disc list-inside space-y-0.5">
                            {msg.sources.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.nextAction && (
                        <div className="mt-2 text-[11px] font-bold text-growth-teal">
                          Next action: {msg.nextAction}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {askCopilotMutation.isPending && (
                  <div className="flex items-start">
                    <div className="bg-white border border-hairline rounded-sm p-3 text-xs text-slate shadow-sm flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full border border-ink border-t-transparent animate-spin" />
                      Analyzing your evidence ledger & generating answer...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Footer */}
              <div className="p-4 border-t border-hairline bg-white">
                <form onSubmit={handleSendCopilot} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    placeholder="Ask about missing skills, roadmaps..."
                    disabled={askCopilotMutation.isPending}
                    className="flex-1 bg-paper border border-hairline rounded-sm px-3.5 py-2.5 text-sm focus:outline-none focus:border-ink disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!copilotQuery.trim() || askCopilotMutation.isPending}
                    className="bg-ink text-paper p-2.5 rounded-sm hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
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
