import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, AlertTriangle, Ban, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface AdminUserItem {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  
  const [roleEditingId, setRoleEditingId] = useState<string | null>(null);
  const [grantingSuperAdmin, setGrantingSuperAdmin] = useState(false);
  const [superAdminConfirmText, setSuperAdminConfirmText] = useState('');

  const { data: users = [], isLoading, isError, refetch } = useQuery<AdminUserItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      return await apiClient.get<AdminUserItem[]>('/admin/users');
    }
  });

  const suspendMutation = useApiMutation(
    async ({ userId, reason }: { userId: string; reason: string }) => {
      return await apiClient.patch(`/admin/users/${userId}/suspend`, { reason });
    },
    {
      successMessage: 'User suspended. Access revoked.',
      invalidateQueries: [['admin-users']],
    }
  );

  const reactivateMutation = useApiMutation(
    async (userId: string) => {
      return await apiClient.patch(`/admin/users/${userId}/reactivate`);
    },
    {
      successMessage: 'User reactivated. Access restored.',
      invalidateQueries: [['admin-users']],
    }
  );

  const roleMutation = useApiMutation(
    async ({ userId, newRole }: { userId: string; newRole: string }) => {
      return await apiClient.patch(`/admin/users/${userId}/role`, { new_role: newRole });
    },
    {
      successMessage: 'User role updated.',
      invalidateQueries: [['admin-users']],
    }
  );

  const grantSuperAdminMutation = useApiMutation(
    async (userId: string) => {
      return await apiClient.post(`/admin/users/${userId}/grant-super-admin`);
    },
    {
      successMessage: 'Super Admin privileges granted successfully.',
      invalidateQueries: [['admin-users']],
    }
  );

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspend = (id: string) => {
    if (!suspendReason.trim()) return;
    suspendMutation.mutate(
      { userId: id, reason: suspendReason.trim() },
      {
        onSuccess: () => {
          setSuspendingId(null);
          setSuspendReason('');
        }
      }
    );
  };

  const handleReactivate = (id: string) => {
    reactivateMutation.mutate(id);
  };

  const handleRoleChange = (id: string, newRole: string) => {
    roleMutation.mutate(
      { userId: id, newRole: newRole.toLowerCase() },
      {
        onSuccess: () => {
          setRoleEditingId(null);
        }
      }
    );
  };

  const handleGrantSuperAdmin = (userId: string) => {
    grantSuperAdminMutation.mutate(userId, {
      onSuccess: () => {
        setGrantingSuperAdmin(false);
        setSuperAdminConfirmText('');
        setRoleEditingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink">User Management</h1>
        <p className="text-sm text-slate mt-1">Manage platform access, roles, and account statuses.</p>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-visible">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading platform users...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load users.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs font-bold bg-alert-rust text-white px-3 py-1.5 rounded-sm hover:bg-alert-rust/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper border-b border-hairline">
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">User Details</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Created</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate/5 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-ink">{user.full_name || 'Unnamed User'}</div>
                    <div className="text-xs text-slate">{user.email}</div>
                  </td>
                  <td className="p-4">
                    {roleEditingId === user.user_id ? (
                      <div className="flex items-center gap-2 relative">
                        <select 
                          className="bg-paper border border-hairline rounded-sm text-sm p-1 focus:outline-none focus:border-ink capitalize"
                          defaultValue={user.role}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="academician">Academician</option>
                          <option value="industry">Industry</option>
                          <option value="institution">Institution Admin</option>
                          <option value="alumni">Alumni</option>
                        </select>
                        <button 
                          onClick={() => setGrantingSuperAdmin(true)}
                          className="text-[10px] bg-alert-rust/10 text-alert-rust font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-alert-rust/20 hover:bg-alert-rust hover:text-white transition-colors"
                        >
                          Grant Super Admin
                        </button>
                        <button 
                          onClick={() => setRoleEditingId(null)}
                          className="text-xs text-slate hover:text-ink px-1"
                        >
                          Cancel
                        </button>
                        
                        {/* Super Admin Deliberate Confirmation Flow */}
                        {grantingSuperAdmin && (
                          <div className="absolute top-10 left-0 w-80 bg-white border-2 border-alert-rust p-4 rounded-sm shadow-xl z-50">
                            <div className="flex items-start gap-2 mb-3">
                               <ShieldAlert className="h-5 w-5 text-alert-rust shrink-0" />
                               <div>
                                 <h4 className="font-bold text-alert-rust text-sm">Destructive Action Warning</h4>
                                 <p className="text-xs text-slate mt-1">Granting Super Admin gives this user unrestricted access to all platform data and settings. Type the user's exact email to confirm.</p>
                               </div>
                            </div>
                            <input 
                              type="text" 
                              placeholder={user.email}
                              value={superAdminConfirmText}
                              onChange={(e) => setSuperAdminConfirmText(e.target.value)}
                              className="w-full bg-paper border border-alert-rust/30 p-2 rounded-sm text-sm mb-3 focus:outline-none focus:border-alert-rust"
                            />
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => handleGrantSuperAdmin(user.user_id)}
                                 disabled={superAdminConfirmText !== user.email || grantSuperAdminMutation.isPending}
                                 className="flex-1 bg-alert-rust text-white py-1.5 rounded-sm text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                               >
                                 {grantSuperAdminMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                 Confirm Grant
                               </button>
                               <button 
                                 onClick={() => { setGrantingSuperAdmin(false); setSuperAdminConfirmText(''); }}
                                 className="px-3 bg-paper border border-hairline text-slate rounded-sm text-xs font-bold"
                               >
                                 Cancel
                               </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-xs font-bold capitalize",
                          user.role === 'super_admin' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" : "bg-slate/10 text-slate"
                        )}>
                          {user.role}
                        </span>
                        {user.role !== 'super_admin' && (
                          <button 
                            onClick={() => setRoleEditingId(user.user_id)}
                            className="text-xs text-ink underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {user.is_active ? (
                       <span className="flex items-center gap-1 text-growth-teal text-xs font-bold uppercase tracking-wider">
                         <CheckCircle2 className="h-3 w-3" /> Active
                       </span>
                    ) : (
                       <span className="flex items-center gap-1 text-alert-rust text-xs font-bold uppercase tracking-wider">
                         <Ban className="h-3 w-3" /> Suspended
                       </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                     {user.role !== 'super_admin' && (
                       <>
                          {user.is_active ? (
                            suspendingId === user.user_id ? (
                              <div className="flex flex-col items-end gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Reason for suspension..." 
                                  value={suspendReason}
                                  onChange={(e) => setSuspendReason(e.target.value)}
                                  className="w-64 bg-paper border border-alert-rust/30 p-1.5 rounded-sm text-xs focus:outline-none focus:border-alert-rust"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => setSuspendingId(null)} className="text-xs text-slate hover:text-ink">Cancel</button>
                                  <button 
                                    onClick={() => handleSuspend(user.user_id)}
                                    disabled={!suspendReason.trim() || suspendMutation.isPending} 
                                    className="text-xs font-bold bg-alert-rust text-white px-2 py-1 rounded-sm disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {suspendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Suspend
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setSuspendingId(user.user_id)}
                                className="text-alert-rust text-sm font-bold hover:underline"
                              >
                                Suspend
                              </button>
                            )
                          ) : (
                            <button 
                              onClick={() => handleReactivate(user.user_id)}
                              disabled={reactivateMutation.isPending}
                              className="text-growth-teal text-sm font-bold hover:underline inline-flex items-center gap-1"
                            >
                              {reactivateMutation.isPending && reactivateMutation.variables === user.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              Reactivate
                            </button>
                          )}
                       </>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
