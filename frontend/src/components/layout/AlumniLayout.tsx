import React from 'react';
import { User, ShieldCheck, MessageSquare } from 'lucide-react';
import { DashboardShell } from './DashboardShell';

import { supabase } from '../../lib/supabase';

const alumniNavItems = [
  { label: 'My Profile', href: '/alumni', icon: <User className="h-4 w-4" /> },
  { label: 'Verification', href: '/alumni/verification', icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Messages', href: '/alumni/messages', icon: <MessageSquare className="h-4 w-4" /> },
];

export function AlumniLayout() {
  const [userName, setUserName] = React.useState('Alumni');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.full_name) {
        setUserName(data.user.user_metadata.full_name);
      }
    });
  }, []);

  return (
    <DashboardShell 
      navItems={alumniNavItems}
      userName={userName}
      userRole="Alumni"
    />
  );
}
