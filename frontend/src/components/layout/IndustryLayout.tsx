import React from 'react';
import { LayoutDashboard, Building, Briefcase, Users, GitMerge, GraduationCap, MessageSquare } from 'lucide-react';
import { DashboardShell } from './DashboardShell';

const industryNavItems = [
  { label: 'Dashboard', href: '/industry', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Company Profile', href: '/industry/company', icon: <Building className="h-4 w-4" /> },
  { label: 'Postings', href: '/industry/opportunities', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Candidates', href: '/industry/candidates/search', icon: <Users className="h-4 w-4" /> },
  { label: 'Pipeline', href: '/industry/pipeline', icon: <GitMerge className="h-4 w-4" /> },
  { label: 'Interns', href: '/industry/interns', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Messages', href: '/industry/messages', icon: <MessageSquare className="h-4 w-4" /> },
];

export function IndustryLayout() {
  return (
    <DashboardShell 
      navItems={industryNavItems}
      userName="Rajesh Mehta"
      userRole="Industry Partner"
      verificationStatus="verified"
    />
  );
}
