import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Bell, LogOut, Menu, X, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProofBadge } from '../ui/ProofBadge';

// Mock fetching notifications
const mockGetNotifications = async () => 3;

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

export function DashboardShell({ 
  navItems = [], 
  userName = 'User', 
  userRole,
  verificationStatus,
  hideCopilot = false
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/login');
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
            const isActive = location.pathname.startsWith(item.href);
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
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-hairline bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="hidden md:block text-sm font-medium text-slate">
            {navItems.find(n => location.pathname.startsWith(n.href))?.label || 'Dashboard'}
          </div>
          <div className="flex-1 md:hidden" /> {/* Spacer for mobile */}
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate hover:text-ink transition-colors">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-alert-rust rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-4 border-l border-hairline pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-ink">{userName}</span>
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
        <main className="flex-1 overflow-y-auto bg-paper p-6">
           <div className="max-w-7xl mx-auto h-full">
              <Outlet />
           </div>
        </main>
      </div>

    </div>
  );
}
