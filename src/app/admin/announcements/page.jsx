"use client";

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Normal');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setCurrentUser(profile);
      if (profile.role === 'super_admin' || (profile.permissions || []).includes('manage_announcements')) {
        setHasPermission(true);
        fetchAnnouncements();
      } else {
        router.push('/admin');
      }
    }
  }, [router]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          title,
          content,
          priority
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements([data.announcement, ...announcements]);
        setTitle('');
        setContent('');
        setPriority('Normal');
      } else {
        alert(data.error || 'Failed to create announcement');
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement? This cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/announcements?id=${id}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAnnouncements(announcements.filter(a => a._id !== id));
      } else {
        alert("Failed to delete announcement");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!hasPermission) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Megaphone className="w-6 h-6 mr-2 text-blue-500" />
          Manage Announcements
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Broadcast important information to the entire community.</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">New Announcement</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g., Water Supply Interruption"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Content</label>
            <textarea 
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="Provide full details here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority Level</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="priority" 
                  value="Normal" 
                  checked={priority === 'Normal'}
                  onChange={() => setPriority('Normal')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Normal</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="priority" 
                  value="High" 
                  checked={priority === 'High'}
                  onChange={() => setPriority('High')}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">High (Alert)</span>
              </label>
            </div>
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-2" /> Publish Announcement</>}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Broadcast History</h2>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No announcements published yet.</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann._id} className={clsx(
              "p-4 rounded-xl border",
              ann.priority === 'High' ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
            )}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  {ann.priority === 'High' && <AlertTriangle className="inline w-4 h-4 mr-1.5 mb-0.5 text-red-500" />}
                  {ann.title}
                </h3>
                <span className="text-xs text-gray-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ann.content}</p>
              <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                <span>By {ann.author}</span>
                <span className={clsx(
                  "px-2 py-0.5 rounded-md font-medium",
                  ann.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}>{ann.priority}</span>
              </div>
              {currentUser?.role === 'super_admin' && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    onClick={() => handleDelete(ann._id)}
                    disabled={deletingId === ann._id}
                    className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
