import React, { useState } from 'react';
import { Search, Plus, Briefcase, Edit2, Trash2, Loader2, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';

interface CareerRoleItem {
  career_role_id: string;
  title: string;
  category: string;
  description: string;
  is_active: boolean;
  role_skills?: { count: number }[];
  created_at?: string;
}

export function AdminCareerRoles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRole, setEditingRole] = useState<CareerRoleItem | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const { data: roles = [], isLoading, isError, refetch } = useQuery<CareerRoleItem[]>({
    queryKey: ['admin-career-roles'],
    queryFn: async () => {
      return await apiClient.get<CareerRoleItem[]>('/admin/career-roles');
    }
  });

  const createMutation = useApiMutation(
    async (payload: { title: string; category: string; description: string }) => {
      return await apiClient.post('/admin/career-roles', payload);
    },
    {
      successMessage: 'Career role created successfully.',
      invalidateQueries: [['admin-career-roles']],
    }
  );

  const updateMutation = useApiMutation(
    async ({ roleId, payload }: { roleId: string; payload: Partial<CareerRoleItem> }) => {
      return await apiClient.patch(`/admin/career-roles/${roleId}`, payload);
    },
    {
      successMessage: 'Career role updated successfully.',
      invalidateQueries: [['admin-career-roles']],
    }
  );

  const deleteMutation = useApiMutation(
    async (roleId: string) => {
      return await apiClient.delete(`/admin/career-roles/${roleId}`);
    },
    {
      successMessage: 'Career role removed.',
      invalidateQueries: [['admin-career-roles']],
    }
  );

  const filteredRoles = roles.filter(r =>
    (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCreate = () => {
    setEditingRole(null);
    setFormTitle('');
    setFormCategory('');
    setFormDescription('');
    setIsAdding(true);
  };

  const handleStartEdit = (role: CareerRoleItem) => {
    setIsAdding(false);
    setEditingRole(role);
    setFormTitle(role.title);
    setFormCategory(role.category);
    setFormDescription(role.description || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCategory.trim()) return;

    if (isAdding) {
      createMutation.mutate(
        {
          title: formTitle.trim(),
          category: formCategory.trim(),
          description: formDescription.trim() || 'Role defining required professional competencies.'
        },
        {
          onSuccess: () => {
            setIsAdding(false);
            setFormTitle('');
            setFormCategory('');
            setFormDescription('');
          }
        }
      );
    } else if (editingRole) {
      updateMutation.mutate(
        {
          roleId: editingRole.career_role_id,
          payload: {
            title: formTitle.trim(),
            category: formCategory.trim(),
            description: formDescription.trim()
          }
        },
        {
          onSuccess: () => {
            setEditingRole(null);
          }
        }
      );
    }
  };

  const handleDelete = (roleId: string) => {
    if (confirm('Are you sure you want to delete or deactivate this career role?')) {
      deleteMutation.mutate(roleId);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> Career Role Taxonomy
          </h1>
          <p className="text-sm text-slate mt-1">Define and manage career roles mapped to the national skills taxonomy.</p>
        </div>
        <button 
          onClick={handleStartCreate}
          className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-ink/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Role
        </button>
      </div>

      {(isAdding || editingRole) && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-ink p-5 rounded-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="font-bold text-ink text-base">
              {isAdding ? 'Create New Career Role' : `Edit Career Role: ${editingRole?.title}`}
            </h3>
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setEditingRole(null); }}
              className="text-slate hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Role Title</label>
              <input 
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Cloud Security Engineer"
                required
                className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Domain / Category</label>
              <input 
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Cloud & DevOps"
                required
                className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">Description</label>
              <textarea 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of responsibilities and skill benchmarks..."
                className="w-full bg-paper border border-hairline p-2 rounded-sm text-sm focus:outline-none focus:border-ink h-20 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button"
              onClick={() => { setIsAdding(false); setEditingRole(null); }}
              className="px-4 py-2 border border-hairline text-slate text-sm font-bold rounded-sm hover:bg-slate/5"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 bg-ink text-white text-sm font-bold rounded-sm hover:bg-ink/90 transition-colors flex items-center gap-1.5"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Career Role
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Defined Roles</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">{roles.length}</div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Active Taxonomy Roles</span>
          <div className="text-2xl font-serif font-bold text-growth-teal mt-1">
            {roles.filter(r => r.is_active !== false).length}
          </div>
        </div>
        <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">Unique Categories</span>
          <div className="text-2xl font-serif font-bold text-ink mt-1">
            {new Set(roles.map(r => r.category)).size}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-hairline rounded-sm shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            type="text"
            placeholder="Search roles by title, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-paper border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-sm shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ink mb-3" />
            <span className="text-sm text-slate">Loading career roles...</span>
          </div>
        ) : isError ? (
          <div className="bg-alert-rust/5 border border-alert-rust/30 p-8 rounded-sm text-center">
            <p className="text-sm font-bold text-alert-rust">Failed to load career roles.</p>
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
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Role Title</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Mapped Skills</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate uppercase tracking-wider w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm">
              {filteredRoles.map((role) => (
                <tr key={role.career_role_id} className="hover:bg-slate/5 transition-colors">
                  <td className="p-4 font-bold text-ink">{role.title}</td>
                  <td className="p-4 text-slate">{role.category}</td>
                  <td className="p-4 text-slate text-xs max-w-xs truncate" title={role.description}>
                    {role.description}
                  </td>
                  <td className="p-4 text-ink font-bold">
                    {role.role_skills?.[0]?.count ?? '—'}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider",
                      role.is_active !== false ? "bg-growth-teal/10 text-growth-teal border border-growth-teal/20" : "bg-alert-rust/10 text-alert-rust border border-alert-rust/20"
                    )}>
                      {role.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleStartEdit(role)}
                        className="p-1.5 text-slate hover:text-ink transition-colors"
                        title="Edit Role"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(role.career_role_id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-slate hover:text-alert-rust transition-colors"
                        title="Delete or Deactivate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
