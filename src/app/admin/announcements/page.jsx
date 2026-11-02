"use client";

import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  Send, 
  Calendar, 
  User, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminAnnouncements() {
  const { language, t } = useLanguage();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  
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
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          title: title.trim(),
          content: content.trim(),
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
        alert(data.error || t('Failed to create announcement', 'அறிவிப்பை உருவாக்க முடியவில்லை'));
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('Are you sure you want to delete this announcement? This cannot be undone.', 'இந்த அறிவிப்பை நீக்க விரும்புகிறீர்களா? இதை மீட்டெடுக்க முடியாது.'))) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/announcements?id=${id}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAnnouncements(announcements.filter(a => a._id !== id));
      } else {
        alert(t("Failed to delete announcement", "அறிவிப்பை நீக்க முடியவில்லை"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!hasPermission) return null;

  const filteredList = announcements.filter(a => {
    if (filter === 'ALL') return true;
    return a.priority === filter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              {t('Official Announcements', 'அரசு அறிவிப்புகள் மையம்')}
            </h1>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {t(
              'Publish high-priority alerts, civic bulletins, and village circulars directly to all citizens.',
              'முக்கிய அறிவிப்புகள், அவசர எச்சரிக்கைகள் மற்றும் சுற்றறிக்கைகளை மக்களுக்கு வெளியிடவும்.'
            )}
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)] self-start sm:self-auto">
          {announcements.length} {t('broadcasts', 'அறிவிப்புகள்')}
        </span>
      </div>

      {/* New Announcement Form Card */}
      <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 sm:p-6 shadow-soft space-y-5">
        <div className="flex items-center space-x-2 border-b border-[var(--hairline)] pb-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-[var(--text)]">
            {t('Compose New Announcement', 'புதிய அறிவிப்பை வெளியிடு')}
          </h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
              {t('Announcement Headline', 'தலைப்பு')}
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('e.g., Scheduled Power Maintenance / VAO Camp', 'எ.கா: மின்சார பராமரிப்பு பணி / VAO முகாம்')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
              {t('Notice Details', 'முழு விவரம்')}
            </label>
            <textarea 
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('Specify locations, dates, affected areas, and official department guidance...', 'தேதிகள், இடங்கள், துறை வழிகாட்டுதல் மற்றும் முழு விவரங்களை உள்ளிடவும்...')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Priority Level Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
              {t('Urgency Level', 'முக்கியத்துவ நிலை')}
            </label>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <button
                type="button"
                onClick={() => setPriority('Normal')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  priority === 'Normal'
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text)] font-semibold shadow-sm'
                    : 'bg-[var(--surface-2)] border-[var(--hairline)] text-[var(--text-2)] hover:border-[var(--accent)]/30'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{t('Normal Bulletin', 'வழக்கமான அறிவிப்பு')}</span>
                  <span className="text-[11px] text-[var(--text-3)] block mt-0.5">{t('General updates & circulars', 'பொது தகவல்கள்')}</span>
                </div>
                {priority === 'Normal' && <CheckCircle2 className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setPriority('High')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  priority === 'High'
                    ? 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 font-semibold shadow-sm'
                    : 'bg-[var(--surface-2)] border-[var(--hairline)] text-[var(--text-2)] hover:border-red-500/30'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-500" />
                    {t('High Alert', 'அவசர எச்சரிக்கை')}
                  </span>
                  <span className="text-[11px] text-[var(--text-3)] block mt-0.5">{t('Emergencies & warnings', 'முக்கிய எச்சரிக்கை')}</span>
                </div>
                {priority === 'High' && <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all shadow-md shadow-amber-500/10 flex items-center space-x-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('Broadcasting...', 'வெளியிடப்படுகிறது...')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('Publish Broadcast', 'அறிவிப்பை வெளியிடு')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
            {t('Broadcast History', 'வெளியிடப்பட்ட அறிவிப்புகள்')}
          </h2>

          <div className="flex items-center space-x-1.5">
            {[
              { id: 'ALL', label: t('All', 'அனைத்தும்') },
              { id: 'High', label: t('High Alert', 'அவசரம்') },
              { id: 'Normal', label: t('Normal', 'வழக்கமானவை') },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.id
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-8 text-center text-xs text-[var(--text-3)] shadow-soft">
            {t('No announcements found.', 'அறிவிப்புகள் எதுவும் இல்லை.')}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map(ann => {
              const isHigh = ann.priority === 'High';
              const isDeleting = deletingId === ann._id;

              return (
                <div 
                  key={ann._id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 shadow-soft ${
                    isHigh 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-[var(--surface-1)] border-[var(--hairline)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isHigh
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                      }`}>
                        {isHigh ? t('High Alert', 'அவசர எச்சரிக்கை') : t('Normal Notice', 'வழக்கமான அறிவிப்பு')}
                      </span>
                      <h3 className="font-bold text-base text-[var(--text)]">
                        {ann.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-[var(--text-3)]">
                      <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(ann.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> {ann.author}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>

                  {currentUser?.role === 'super_admin' && (
                    <div className="pt-2 border-t border-[var(--hairline)] flex justify-end">
                      <button
                        onClick={() => handleDelete(ann._id)}
                        disabled={isDeleting}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>{t('Delete Broadcast', 'நீக்கு')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
