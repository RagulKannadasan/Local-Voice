"use client";

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, User, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Update state
  const [updatingId, setUpdatingId] = useState(null);

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
        setUsers(data.users);
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
          newPermissions: newRole === 'user' ? [] : currentPermissions // Clear perms if downgraded to user
        }),
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === targetUserId ? { ...u, role: newRole, permissions: newRole === 'user' ? [] : currentPermissions } : u));
      }
    } catch (error) {
      console.error("Failed to update role", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const togglePermission = async (targetUserId, permission, currentRole, currentPermissions) => {
    if (currentRole === 'user') return; // Users don't get permissions

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <ShieldAlert className="w-6 h-6 mr-2 text-red-500" />
          User Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Super Admin Access Only. Assign roles and restricted permissions to community members.</p>
      </div>

      <div className="space-y-4">
        {users.map(u => (
          <div key={u._id} className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{u.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {u.role === 'super_admin' && (
                  <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-bold flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Super Admin
                  </span>
                )}
                {updatingId === u._id && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                
                {u.role !== 'super_admin' && (
                  <select 
                    value={u.role || 'user'}
                    disabled={updatingId === u._id}
                    onChange={(e) => handleRoleChange(u._id, e.target.value, u.permissions || [])}
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Restricted Admin</option>
                  </select>
                )}
              </div>
            </div>

            {u.role === 'admin' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Restricted Permissions</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => togglePermission(u._id, 'manage_complaints', u.role, u.permissions || [])}
                    disabled={updatingId === u._id}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(u.permissions || []).includes('manage_complaints') ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700'}`}
                  >
                    {(u.permissions || []).includes('manage_complaints') && <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Manage Complaints</span>
                  </button>
                  <button 
                    onClick={() => togglePermission(u._id, 'manage_polls', u.role, u.permissions || [])}
                    disabled={updatingId === u._id}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(u.permissions || []).includes('manage_polls') ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700'}`}
                  >
                    {(u.permissions || []).includes('manage_polls') && <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Manage Polls</span>
                  </button>
                  <button 
                    onClick={() => togglePermission(u._id, 'manage_announcements', u.role, u.permissions || [])}
                    disabled={updatingId === u._id}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${(u.permissions || []).includes('manage_announcements') ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700'}`}
                  >
                    {(u.permissions || []).includes('manage_announcements') && <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Manage Announcements</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
