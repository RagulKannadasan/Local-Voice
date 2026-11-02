"use client";

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  Search, 
  Filter, 
  UserCheck, 
  Mail, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminUsers() {
  const { language, t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Updating state
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCurrentUser(parsed);
      fetchUsers(parsed.email);
    }
  }, []);

  const fetchUsers = async (email) => {
    try {
      const res = await fetch(`/api/admin/users?requesterEmail=${email}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole, currentPermissions) => {
    setUpdatingId(targetUserId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          targetUserId,
          newRole,
          newPermissions: newRole === 'user' ? [] : currentPermissions
        }),
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === targetUserId ? { 
          ...u, 
          role: newRole, 
          permissions: newRole === 'user' ? [] : currentPermissions 
        } : u));
      }
    } catch (error) {
      console.error("Failed to update role", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const togglePermission = async (targetUserId, permission, currentRole, currentPermissions) => {
    if (currentRole === 'user') return;

    setUpdatingId(targetUserId);
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          targetUserId,
          newRole: currentRole,
          newPermissions
        }),
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === targetUserId ? { ...u, permissions: newPermissions } : u));
      }
    } catch (error) {
      console.error("Failed to update permissions", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (targetUserId) => {
    if (!confirm(t('Are you sure you want to permanently delete this user account?', 'இந்த பயனர் கணக்கை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?'))) return;
    
    setDeletingId(targetUserId);
    try {
      const res = await fetch(`/api/admin/users?id=${targetUserId}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== targetUserId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'SUPER_ADMIN') return u.role === 'super_admin';
    if (roleFilter === 'ADMIN') return u.role === 'admin';
    if (roleFilter === 'USER') return u.role === 'user' || !u.role;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-3)] font-medium">
          {t('Loading user directory...', 'பயனர் விவரங்கள் ஏற்றப்படுகின்றன...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              {t('User & Role Directory', 'பயனர்கள் & அனுமதி மையம்')}
            </h1>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {t(
              'Super Admin control: Assign role delegations and configure restricted admin scopes.',
              'முழு நிர்வாக கட்டுப்பாடு: பொறுப்பாளர்கள் நியமனம் மற்றும் அனுமதிகளை நிர்வகிக்கவும்.'
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)]">
            {users.length} {t('registered members', 'பதிவுசெய்த உறுப்பினர்கள்')}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by name or email address...', 'பெயர் அல்லது மின்னஞ்சல் மூலம் தேடவும்...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--hairline)] text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all shadow-sm"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: t('All', 'அனைத்தும்') },
            { id: 'SUPER_ADMIN', label: 'Super Admin' },
            { id: 'ADMIN', label: t('Restricted Admin', 'பொறுப்பாளர்') },
            { id: 'USER', label: t('Citizens', 'பொதுமக்கள்') }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === f.id
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Responsive Table (Desktop) / Cards (Mobile) */}
      <div 
        tabIndex={0} 
        role="region" 
        aria-label="Community Users Directory"
        className="table-wrapper bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl shadow-soft overflow-hidden"
      >
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--surface-2)]/60 text-[var(--text-3)] text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3.5 px-5">{t('User', 'பயனர்')}</th>
                <th className="py-3.5 px-4">{t('Role', 'பங்கு')}</th>
                <th className="py-3.5 px-4">{t('Delegated Scopes', 'அனுமதிகள்')}</th>
                <th className="py-3.5 px-4 text-right">{t('Action', 'செயல்')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--text-3)]">
                    {t('No users found matching your filters.', 'பயனர்கள் எவரும் காணப்படவில்லை.')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isPrimaryOwner = u.email === 'ragulkannadasan@gmail.com';
                  const isUpdating = updatingId === u._id;
                  const isDeleting = deletingId === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center justify-center font-bold text-xs text-[var(--text-2)] flex-shrink-0">
                            {u.profilePhoto ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.profilePhoto} alt={u.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (u.name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-[var(--text)] truncate">{u.name || 'Member'}</span>
                              {isPrimaryOwner && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Owner
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[var(--text-3)] block truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown / Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {u.role === 'super_admin' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            Super Admin
                          </span>
                        ) : (
                          <div className="inline-flex items-center space-x-2">
                            <select
                              value={u.role || 'user'}
                              disabled={isUpdating}
                              onChange={(e) => handleRoleChange(u._id, e.target.value, u.permissions || [])}
                              className="bg-[var(--surface-2)] text-[var(--text)] text-xs font-medium border border-[var(--hairline)] rounded-lg px-2.5 py-1.5 focus:border-[var(--accent)] outline-none transition-colors cursor-pointer"
                            >
                              <option value="user">{t('Citizen (User)', 'குடிமகன்')}</option>
                              <option value="admin">{t('Restricted Admin', 'நிர்வாகி')}</option>
                            </select>
                            {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />}
                          </div>
                        )}
                      </td>

                      {/* Delegated Permissions */}
                      <td className="py-4 px-4">
                        {u.role === 'admin' ? (
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: 'manage_complaints', label: t('Complaints', 'புகார்கள்') },
                              { id: 'manage_announcements', label: t('Announcements', 'அறிவிப்புகள்') },
                              { id: 'manage_polls', label: t('Polls', 'கருத்துக்கணிப்பு') },
                            ].map(p => {
                              const hasPerm = (u.permissions || []).includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => togglePermission(u._id, p.id, u.role, u.permissions || [])}
                                  disabled={isUpdating}
                                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    hasPerm
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--hairline)] hover:text-[var(--text)]'
                                  }`}
                                >
                                  {hasPerm && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                                  <span>{p.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : u.role === 'super_admin' ? (
                          <span className="text-xs text-[var(--text-3)] italic">
                            {t('All platform capabilities granted', 'முழு நிர்வாக அனுமதி')}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-3)]">
                            {t('No administrative scopes', 'அனுமதிகள் இல்லை')}
                          </span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {!isPrimaryOwner && currentUser?.role === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(u._id)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title={t('Delete User', 'பயனரை நீக்கு')}
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-[var(--hairline)]">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-3)]">
              {t('No users found matching your filters.', 'பயனர்கள் எவரும் காணப்படவில்லை.')}
            </div>
          ) : (
            filteredUsers.map(u => {
              const isPrimaryOwner = u.email === 'ragulkannadasan@gmail.com';
              const isUpdating = updatingId === u._id;
              const isDeleting = deletingId === u._id;

              return (
                <div key={u._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center justify-center font-bold text-xs text-[var(--text-2)] flex-shrink-0">
                        {u.profilePhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.profilePhoto} alt={u.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (u.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-[var(--text)] truncate">{u.name || 'Member'}</h3>
                        <p className="text-xs text-[var(--text-3)] truncate">{u.email}</p>
                      </div>
                    </div>

                    {!isPrimaryOwner && currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDelete(u._id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Role Selector */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)]">
                    <span className="text-xs text-[var(--text-3)] font-semibold uppercase">{t('Role', 'பங்கு')}:</span>
                    {u.role === 'super_admin' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Super Admin
                      </span>
                    ) : (
                      <select
                        value={u.role || 'user'}
                        disabled={isUpdating}
                        onChange={(e) => handleRoleChange(u._id, e.target.value, u.permissions || [])}
                        className="bg-[var(--surface-2)] text-[var(--text)] text-xs font-semibold border border-[var(--hairline)] rounded-lg px-2.5 py-1"
                      >
                        <option value="user">{t('Citizen (User)', 'குடிமகன்')}</option>
                        <option value="admin">{t('Restricted Admin', 'நிர்வாகி')}</option>
                      </select>
                    )}
                  </div>

                  {/* Permissions for Admin */}
                  {u.role === 'admin' && (
                    <div className="pt-2 border-t border-[var(--hairline)] space-y-1.5">
                      <span className="text-[11px] text-[var(--text-3)] font-semibold uppercase">{t('Permissions', 'அனுமதிகள்')}:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'manage_complaints', label: t('Complaints', 'புகார்கள்') },
                          { id: 'manage_announcements', label: t('Announcements', 'அறிவிப்புகள்') },
                          { id: 'manage_polls', label: t('Polls', 'கருத்துக்கணிப்பு') },
                        ].map(p => {
                          const hasPerm = (u.permissions || []).includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => togglePermission(u._id, p.id, u.role, u.permissions || [])}
                              disabled={isUpdating}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                hasPerm
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-[var(--surface-2)] text-[var(--text-3)]'
                              }`}
                            >
                              {p.label} {hasPerm ? '✓' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
