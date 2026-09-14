import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, AlertTriangle, MoreVertical, Ban, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const MOCK_USERS = [
  { id: 'u1', name: 'Dr. Anita Desai', email: 'anita@nit.edu', role: 'Academician', status: 'active', lastLogin: '2 hours ago' },
  { id: 'u2', name: 'Ravi Kumar', email: 'ravi@student.edu', role: 'Student', status: 'suspended', lastLogin: '4 days ago' },
  { id: 'u3', name: 'Sarah Jones', email: 'sarah@techcorp.com', role: 'Industry', status: 'active', lastLogin: '1 hour ago' },
  { id: 'u4', name: 'System Operator', email: 'ops@platform.admin', role: 'Super Admin', status: 'active', lastLogin: 'Just now' },
];

export function AdminUsers() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  
  const [roleEditingId, setRoleEditingId] = useState<string | null>(null);
  const [grantingSuperAdmin, setGrantingSuperAdmin] = useState(false);
  const [superAdminConfirmText, setSuperAdminConfirmText] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspend = (id: string) => {
    if (!suspendReason.trim()) return;
    setUsers(users.map(u => u.id === id ? { ...u, status: 'suspended' } : u));
    setSuspendingId(null);
    setSuspendReason('');
  };

  const handleReactivate = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    setRoleEditingId(null);
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
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
        <button className="bg-white border border-hairline text-slate p-2 rounded-sm hover:bg-slate/5 transition-colors flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper border-b border-hairline">
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">User Details</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Last Login</th>
              <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate/5 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-ink">{user.name}</div>
                  <div className="text-xs text-slate">{user.email}</div>
                </td>
                <td className="p-4">
                  {roleEditingId === user.id ? (
                    <div className="flex items-center gap-2 relative">
                      <select 
                        className="bg-paper border border-hairline rounded-sm text-sm p-1 focus:outline-none focus:border-ink"
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="Student">Student</option>
                        <option value="Academician">Academician</option>
                        <option value="Industry">Industry</option>
                        <option value="Institution Admin">Institution Admin</option>
                        <option value="Alumni">Alumni</option>
                      </select>
                      <button 
                        onClick={() => setGrantingSuperAdmin(true)}
                        className="text-[10px] bg-alert-rust/10 text-alert-rust font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-alert-rust/20 hover:bg-alert-rust hover:text-white transition-colors"
                      >
                        Grant Super Admin
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
                               onClick={() => {
                                 handleRoleChange(user.id, 'Super Admin');
                                 setGrantingSuperAdmin(false);
                                 setSuperAdminConfirmText('');
                               }}
                               disabled={superAdminConfirmText !== user.email}
                               className="flex-1 bg-alert-rust text-white py-1.5 rounded-sm text-xs font-bold disabled:opacity-50"
                             >
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
                        "px-2 py-0.5 rounded-sm text-xs font-bold",
                        user.role === 'Super Admin' ? "bg-alert-rust/10 text-alert-rust border border-alert-rust/20" : "bg-slate/10 text-slate"
                      )}>
                        {user.role}
                      </span>
                      {user.role !== 'Super Admin' && (
                        <button 
                          onClick={() => setRoleEditingId(user.id)}
                          className="text-xs text-ink underline opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {user.status === 'active' ? (
                     <span className="flex items-center gap-1 text-growth-teal text-xs font-bold uppercase tracking-wider">
                       <CheckCircle2 className="h-3 w-3" /> Active
                     </span>
                  ) : (
                     <span className="flex items-center gap-1 text-alert-rust text-xs font-bold uppercase tracking-wider">
                       <Ban className="h-3 w-3" /> Suspended
                     </span>
                  )}
                </td>
                <td className="p-4 text-sm text-slate">{user.lastLogin}</td>
                <td className="p-4 text-right">
                   {user.role !== 'Super Admin' && (
                     <>
                        {user.status === 'active' ? (
                          suspendingId === user.id ? (
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
                                  onClick={() => handleSuspend(user.id)}
                                  disabled={!suspendReason.trim()} 
                                  className="text-xs font-bold bg-alert-rust text-white px-2 py-1 rounded-sm disabled:opacity-50"
                                >
                                  Suspend
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setSuspendingId(user.id)}
                              className="text-alert-rust text-sm font-bold hover:underline"
                            >
                              Suspend
                            </button>
                          )
                        ) : (
                          <button 
                            onClick={() => handleReactivate(user.id)}
                            className="text-growth-teal text-sm font-bold hover:underline"
                          >
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
      </div>
    </div>
  );
}
