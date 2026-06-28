"use client";

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { MapPin, CheckCircle, Clock, Send, Mail, Image as ImageIcon, Loader2, Trash } from 'lucide-react';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [timelineInputs, setTimelineInputs] = useState({});

  useEffect(() => {
    const profileSaved = localStorage.getItem('localVoice_profile');
    if (profileSaved) {
      const profile = JSON.parse(profileSaved);
      setCurrentUser(profile);
      if (profile.role === 'super_admin' || (profile.permissions && profile.permissions.includes('manage_complaints'))) {
        setHasPermission(true);
        fetchComplaints(profile.email);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchComplaints = async (email) => {
    try {
      const res = await fetch(`/api/complaints?all=true&userEmail=${email}`);
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error("Failed to fetch complaints", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, complaint) => {
    setUpdatingId(id);
    
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: id,
          status: newStatus,
          timelineUpdate: `Status changed to ${newStatus}`,
          requesterEmail: currentUser.email,
          requesterName: currentUser.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints(complaints.map(c => c._id === id ? data.complaint : c));
        
        // Trigger NodeMailer API for Status Update in background
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'STATUS_UPDATE',
            category: complaint.category,
            area: complaint.location,
            description: complaint.description,
            userEmail: complaint.userEmail,
            newStatus: newStatus
          })
        });
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to completely delete this complaint? This cannot be undone.')) return;
    
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/complaints?id=${id}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComplaints(complaints.filter(c => c._id !== id));
      } else {
        alert("Failed to delete complaint");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddTimeline = async (id) => {
    const updateText = timelineInputs[id];
    if (!updateText) return;

    setUpdatingId(id);
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: id,
          timelineUpdate: updateText,
          requesterEmail: currentUser.email,
          requesterName: currentUser.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints(complaints.map(c => c._id === id ? data.complaint : c));
        setTimelineInputs({ ...timelineInputs, [id]: '' });
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center">
          <Send className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Permission Denied</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">You do not have the required &quot;manage_complaints&quot; permission to view or edit complaints.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Complaints</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and update community issues.</p>
      </div>

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No complaints found in the system.</p>
        ) : complaints.map((c) => (
          <div key={c._id} className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 text-xs px-2.5 py-1 rounded-md font-semibold border border-blue-200 dark:border-sky-900/30">
                    {c.category}
                  </span>
                  <span className={clsx(
                    "text-xs px-2.5 py-1 rounded-full font-bold",
                    c.status === 'Pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    c.status === 'In Progress' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    c.status === 'Resolved' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  )}>
                    {c.status}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{c.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {c.location}</span>
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 w-full md:w-auto">
                {c.status !== 'Pending' && (
                  <button 
                    onClick={() => handleStatusChange(c._id, 'Pending', c)}
                    disabled={updatingId === c._id}
                    className="w-full md:w-32 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
                  >
                    Set Pending
                  </button>
                )}
                {c.status !== 'In Progress' && (
                  <button 
                    onClick={() => handleStatusChange(c._id, 'In Progress', c)}
                    disabled={updatingId === c._id}
                    className="w-full md:w-32 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    Set In Progress
                  </button>
                )}
                {c.status !== 'Resolved' && (
                  <button 
                    onClick={() => handleStatusChange(c._id, 'Resolved', c)}
                    disabled={updatingId === c._id}
                    className="w-full md:w-32 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                )}
                {currentUser?.role === 'super_admin' && (
                  <button 
                    onClick={() => handleDelete(c._id)}
                    disabled={updatingId === c._id}
                    className="w-full md:w-32 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{c.description}</p>
              
              {c.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt="Complaint Attachment" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex items-center text-xs text-gray-500 font-medium">
                <Mail className="w-3.5 h-3.5 mr-1" />
                Reported by {c.userName} ({c.userEmail})
              </div>
            </div>

            {/* Timeline & Actions */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Action Timeline</h4>
              
              <div className="space-y-3 mb-4">
                {c.timeline && c.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{event.action}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">By {event.author} on {new Date(event.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={timelineInputs[c._id] || ''}
                  onChange={(e) => setTimelineInputs({ ...timelineInputs, [c._id]: e.target.value })}
                  placeholder="Add a timeline update (e.g., Plumber dispatched)"
                  className="flex-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
                <button 
                  onClick={() => handleAddTimeline(c._id)}
                  disabled={updatingId === c._id || !timelineInputs[c._id]}
                  className="bg-blue-600 dark:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {updatingId === c._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log'}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
