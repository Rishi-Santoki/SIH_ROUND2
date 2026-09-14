import React from 'react';
import { LayoutDashboard, Handshake, Activity, GraduationCap, MessageSquare } from 'lucide-react';
import { DashboardShell } from './DashboardShell';

const academicianNavItems = [
  { label: 'Dashboard', href: '/academician', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Collaborations', href: '/academician/collaborations', icon: <Handshake className="h-4 w-4" /> },
  { label: 'Skill Pulse', href: '/academician/skill-pulse', icon: <Activity className="h-4 w-4" /> },
  { label: 'Alumni Network', href: '/academician/alumni', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Messages', href: '/academician/messages', icon: <MessageSquare className="h-4 w-4" /> },
];

export function AcademicianLayout() {
  return (
    <DashboardShell 
      navItems={academicianNavItems}
      userName="Dr. Anita Desai"
      userRole="Faculty Member"
      verificationStatus="verified"
    />
  );
}
