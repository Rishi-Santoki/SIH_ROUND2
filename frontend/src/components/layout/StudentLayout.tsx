import React from 'react';
import { LayoutDashboard, Award, Target, Map, FileBadge, BookOpen, Briefcase, FileSignature, FolderGit2, Users, MessageSquare } from 'lucide-react';
import { DashboardShell } from './DashboardShell';

const studentNavItems = [
  { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Skill Profile', href: '/student/skills', icon: <Award className="h-4 w-4" /> },
  { label: 'Skill Gap', href: '/student/skill-gap', icon: <Target className="h-4 w-4" /> },
  { label: 'Career Roadmap', href: '/student/roadmap', icon: <Map className="h-4 w-4" /> },
  { label: 'Assessments', href: '/student/assessments', icon: <FileBadge className="h-4 w-4" /> },
  { label: 'Learning', href: '/student/learning', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Opportunities', href: '/student/opportunities', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Applications', href: '/student/applications', icon: <FileSignature className="h-4 w-4" /> },
  { label: 'Portfolio', href: '/student/portfolio', icon: <FolderGit2 className="h-4 w-4" /> },
  { label: 'Alumni Network', href: '/student/alumni', icon: <Users className="h-4 w-4" /> },
  { label: 'Messages', href: '/student/messages', icon: <MessageSquare className="h-4 w-4" /> },
];

export function StudentLayout() {
  return (
    <DashboardShell 
      navItems={studentNavItems}
      userName="Priya Sharma"
      userRole="Student"
      verificationStatus="verified"
    />
  );
}
