"use client";

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Mail, 
  Image as ImageIcon, 
  Loader2, 
  Trash2, 
  Search, 
  Filter, 
  AlertCircle,
  ExternalLink,
  X,
  User,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminComplaints() {
  const { language, t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

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
        setComplaints(data.complaints || []);
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
        
        // Trigger background email alert
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
        }).catch(err => console.warn("Email alert deferred:", err));
      } else {
        alert(t("Failed to update status", "நிலையை புதுப்பிக்க முடியவில்லை"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('Are you sure you want to completely delete this complaint? This cannot be undone.', 'இந்த புகாரை நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இதை மீட்டெடுக்க முடியாது.'))) return;
    
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/complaints?id=${id}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComplaints(complaints.filter(c => c._id !== id));
      } else {
        alert(t("Failed to delete complaint", "புகாரை நீக்க முடியவில்லை"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddTimeline = async (id) => {
    const updateText = timelineInputs[id];
    if (!updateText || !updateText.trim()) return;

    setUpdatingId(id);
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: id,
          timelineUpdate: updateText.trim(),
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

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.userName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-3)] font-medium">
          {t('Loading complaints directory...', 'புகார்கள் பட்டியல் ஏற்றப்படுகிறது...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lightbox Modal for Attachment */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden bg-[var(--surface-1)] border border-[var(--hairline)]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Complaint preview" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              {t('Complaints Oversight', 'புகார் மேலாண்மை மையம்')}
            </h1>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {t(
              'Track civic issue lifecycles, update official action logs, and dispatch resolution statuses.',
              'குடிமக்களின் புகார்களை கண்காணித்து, நடவடிக்கை பதிவேடு மற்றும் தீர்வுகளை வழங்கவும்.'
            )}
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)] self-start sm:self-auto">
          {complaints.length} {t('total submissions', 'மொத்த புகார்கள்')}
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: t('All', 'அனைத்தும்'), count: complaints.length },
            { id: 'Pending', label: t('Pending', 'நிலுவை'), count: pendingCount, color: 'text-[var(--accent)]' },
            { id: 'In Progress', label: t('In Progress', 'நடவடிக்கையில்'), count: inProgressCount, color: 'text-sky-500' },
            { id: 'Resolved', label: t('Resolved', 'தீர்க்கப்பட்டவை'), count: resolvedCount, color: 'text-emerald-500' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === tab.id ? 'bg-black/20 text-inherit' : 'bg-[var(--surface-2)] text-[var(--text-3)]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by title, location, category, or reporter...', 'தலைப்பு, இடம், வகை அல்லது பயனர் மூலம் தேடவும்...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--hairline)] text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-12 text-center shadow-soft">
          <CheckCircle2 className="w-12 h-12 mx-auto text-[var(--accent)]/40 mb-3" />
          <h3 className="text-base font-bold text-[var(--text)]">
            {t('No complaints found', 'புகார்கள் எதுவும் காணப்படவில்லை')}
          </h3>
          <p className="text-xs text-[var(--text-3)] mt-1">
            {t('Try adjusting your search criteria or filter tabs.', 'தேடல் சொல் அல்லது வடிகட்டிகளை மாற்றி முயற்சிக்கவும்.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map(c => {
            const isUpdating = updatingId === c._id;
            const isPending = c.status === 'Pending';
            const isInProgress = c.status === 'In Progress';
            const isResolved = c.status === 'Resolved';

            // Check if overdue (>3 days)
            const isOverdue = isPending && (new Date() - new Date(c.createdAt) > 3 * 24 * 60 * 60 * 1000);

            return (
              <div 
                key={c._id}
                className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft hover:border-[var(--accent)]/30 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                        {c.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isResolved
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : isInProgress
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {c.status}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t('Overdue (72h+)', 'காலாவதி (72+ மணி)')}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">
                      {c.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-3)] font-medium">
                      <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-[var(--accent)]" /> {c.location}</span>
                      <span>•</span>
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {new Date(c.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> {c.userName || 'Anonymous'} ({c.userEmail})</span>
                    </div>
                  </div>

                  {/* Quick Action Button Group */}
                  <div className="flex items-center space-x-1.5 self-start sm:self-auto flex-shrink-0">
                    {!isPending && (
                      <button
                        onClick={() => handleStatusChange(c._id, 'Pending', c)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                      >
                        {t('Pending', 'நிலுவை')}
                      </button>
                    )}
                    {!isInProgress && (
                      <button
                        onClick={() => handleStatusChange(c._id, 'In Progress', c)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
                      >
                        {t('In Progress', 'செயலில்')}
                      </button>
                    )}
                    {!isResolved && (
                      <button
                        onClick={() => handleStatusChange(c._id, 'Resolved', c)}
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50 flex items-center space-x-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('Resolve', 'தீர்க்கப்பட்டது')}</span>
                      </button>
                    )}
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDelete(c._id)}
                        disabled={isUpdating}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title={t('Delete Complaint', 'புகாரை நீக்கு')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description Body & Attachment */}
                <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--hairline)] space-y-3">
                  <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
                    {c.description}
                  </p>

                  {c.imageUrl && (
                    <div 
                      onClick={() => setSelectedImage(c.imageUrl)}
                      className="cursor-pointer group relative inline-block max-w-xs rounded-xl overflow-hidden border border-[var(--hairline)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt="Complaint Attachment" className="max-h-40 w-auto object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold space-x-1">
                        <ImageIcon className="w-4 h-4" />
                        <span>{t('View Image', 'படத்தைப் பார்')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Timeline */}
                <div className="pt-2 border-t border-[var(--hairline)] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] block">
                    {t('Action & Progression Timeline', 'நடவடிக்கை பதிவேடு')}
                  </span>

                  {c.timeline && c.timeline.length > 0 && (
                    <div className="pl-2 border-l-2 border-[var(--hairline)] space-y-2.5 my-2">
                      {c.timeline.map((event, idx) => (
                        <div key={idx} className="relative pl-3">
                          <span className="absolute -left-[11px] top-1.5 w-2 h-2 rounded-full bg-[var(--accent)] ring-4 ring-[var(--surface-1)]" />
                          <p className="text-xs font-semibold text-[var(--text)]">{event.action}</p>
                          <p className="text-[10px] text-[var(--text-3)] mt-0.5">
                            {event.author} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Timeline Entry Form */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={timelineInputs[c._id] || ''}
                      onChange={(e) => setTimelineInputs({ ...timelineInputs, [c._id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTimeline(c._id);
                        }
                      }}
                      placeholder={t('Log an action (e.g. Field team dispatched, valve repaired)...', 'நடவடிக்கையை பதிவு செய்யவும் (எ.கா: களப்பணியாளர் அனுப்பப்பட்டார்)...')}
                      className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] outline-none transition-colors"
                    />
                    <button
                      onClick={() => handleAddTimeline(c._id)}
                      disabled={isUpdating || !timelineInputs[c._id]?.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center space-x-1"
                    >
                      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{t('Log', 'பதிவிடு')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
