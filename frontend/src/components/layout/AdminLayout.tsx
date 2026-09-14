import React from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  Network, 
  Briefcase, 
  FileCheck, 
  Layers, 
  AlertOctagon, 
  Scale, 
  BookOpen, 
  Settings, 
  Activity 
} from 'lucide-react';
import { DashboardShell } from './DashboardShell';

const adminNavItems = [
  { label: 'Overview', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Verification Queue', href: '/admin/verifications', icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Taxonomy', href: '/admin/skills', icon: <Network className="h-4 w-4" /> },
  { label: 'Career Roles', href: '/admin/career-roles', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Assessments', href: '/admin/assessments', icon: <FileCheck className="h-4 w-4" /> },
  { label: 'Postings', href: '/admin/opportunities', icon: <Layers className="h-4 w-4" /> },
  { label: 'Complaints', href: '/admin/complaints', icon: <AlertOctagon className="h-4 w-4" /> },
  { label: 'Matching', href: '/admin/matching', icon: <Scale className="h-4 w-4" /> },
  { label: 'Knowledge Base', href: '/admin/knowledge-base', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
  { label: 'Audit Log', href: '/admin/audit-logs', icon: <Activity className="h-4 w-4" /> },
];

export function AdminLayout() {
  return (
    <DashboardShell 
      navItems={adminNavItems}
      userName="Super Admin"
      userRole="Super Admin"
      verificationStatus="verified"
      hideCopilot={true}
    />
  );
}
