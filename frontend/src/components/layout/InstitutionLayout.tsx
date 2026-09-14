import React from 'react';
import { LayoutDashboard, Users, BarChart3, Building2, AlertTriangle, Briefcase, FileText } from 'lucide-react';
import { DashboardShell } from './DashboardShell';

const institutionNavItems = [
  { label: 'Dashboard', href: '/institution', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Students', href: '/institution/students', icon: <Users className="h-4 w-4" /> },
  { label: 'Analytics', href: '/institution/analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Departments', href: '/institution/departments', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Interventions', href: '/institution/interventions', icon: <AlertTriangle className="h-4 w-4" /> },
  { label: 'Industry Connections', href: '/institution/industry-connections', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Reports', href: '/institution/reports', icon: <FileText className="h-4 w-4" /> },
];

export function InstitutionLayout() {
  return (
    <DashboardShell 
      navItems={institutionNavItems}
      userName="Prof. Suresh Kumar"
      userRole="Institution Admin"
      verificationStatus="verified"
    />
  );
}
