import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function resolveDashboard() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            navigate('/login', { replace: true });
          }
          return;
        }

        const role = (session.user.user_metadata?.role || '').toLowerCase();

        let target = '/student';
        if (role === 'student') target = '/student';
        else if (role === 'industry') target = '/industry';
        else if (role === 'academician') target = '/academician';
        else if (role === 'institution') target = '/institution';
        else if (role === 'alumni') target = '/alumni';
        else if (role === 'admin' || role === 'super_admin') target = '/admin';

        if (isMounted) {
          navigate(target, { replace: true });
        }
      } catch {
        if (isMounted) {
          navigate('/student', { replace: true });
        }
      }
    }

    resolveDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-ink" />
      <p className="text-sm text-slate font-medium">Opening your dashboard...</p>
    </div>
  );
}
