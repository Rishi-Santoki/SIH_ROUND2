import React from 'react';
import { User, ShieldCheck, MessageSquare } from 'lucide-react';
import { DashboardShell } from './DashboardShell';

const alumniNavItems = [
  { label: 'My Profile', href: '/alumni', icon: <User className="h-4 w-4" /> },
  { label: 'Verification', href: '/alumni/verification', icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Messages', href: '/alumni/messages', icon: <MessageSquare className="h-4 w-4" /> },
];

export function AlumniLayout() {
  return (
    <DashboardShell 
      navItems={alumniNavItems}
      userName="Alex Mercer"
      userRole="Alumni"
    />
  );
}
