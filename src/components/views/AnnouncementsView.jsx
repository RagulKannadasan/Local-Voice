"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Megaphone, AlertCircle, Clock, Loader2, BarChart2, CheckCircle2, Share2, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import clsx from 'clsx';
import EmptyState from '@/components/EmptyState';
import { ListCardSkeleton } from '@/components/Skeleton';

export default function AnnouncementsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' or 'polls'
  
  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Polls State
  const [polls, setPolls] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Guest Voting State
  const [guestModal, setGuestModal] = useState({ isOpen: false, pollId: null, optionId: null });
  const [guestForm, setGuestForm] = useState({ name: '', phone: '' });
  const [copiedId, setCopiedId] = useState(null);

  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAnnouncements();
    fetchPolls();
    
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
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

  const fetchPolls = async () => {
    try {
      let userEmail = '';
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        const profile = JSON.parse(saved);
        userEmail = profile.email;
      }
      
      const res = await fetch(`/api/polls?requesterEmail=${userEmail}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        let fetchedPolls = data.polls || [];
        
        // If not logged in, check local storage for guest votes
        if (!userEmail) {
          const guestVotesStr = localStorage.getItem('localVoice_guestVotes');
          if (guestVotesStr) {
            const guestVotes = JSON.parse(guestVotesStr);
            fetchedPolls = fetchedPolls.map(p => {
              if (guestVotes.includes(p.id)) {
                return { ...p, hasVoted: true };
              }
              return p;
            });
          }
        }
        
        setPolls(fetchedPolls);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    }
  };

  const handleVote = async (pollId, optionId) => {
    if (!currentUser) {
      setGuestModal({ isOpen: true, pollId, optionId });
      return;
    }
    await submitVote(pollId, optionId, currentUser.email);
  };

  const submitVote = async (pollId, optionId, userEmailToSubmit) => {
    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll || targetPoll.hasVoted) return;

    // Optimistic update
    const updated = polls.map(poll => {
      if (poll.id === pollId) {
        const newOptions = poll.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return { 
          ...poll, 
          options: newOptions, 
          totalVotes: poll.totalVotes + 1,
          hasVoted: true
        };
      }
      return poll;
    });
    setPolls(updated);

    try {
      const res = await fetch('/api/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId, userEmail: userEmailToSubmit })
      });
      if (!res.ok) {
        fetchPolls();
        const data = await res.json();
        alert(data.error || "Failed to submit vote");
      } else {
        if (userEmailToSubmit.startsWith('GUEST::')) {
          const savedStr = localStorage.getItem('localVoice_guestVotes');
          const guestVotes = savedStr ? JSON.parse(savedStr) : [];
          if (!guestVotes.includes(pollId)) {
            guestVotes.push(pollId);
            localStorage.setItem('localVoice_guestVotes', JSON.stringify(guestVotes));
          }
        }
      }
    } catch (error) {
      console.error("Voting error:", error);
      fetchPolls();
      alert("Network error. Please try again.");
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestForm.name.trim()) return;

    const uniqueId = Math.random().toString(36).substr(2, 9);
    const guestEmail = `GUEST::${guestForm.name.trim()}::${guestForm.phone.trim() || 'N/A'}::${uniqueId}`;
    
    await submitVote(guestModal.pollId, guestModal.optionId, guestEmail);
    setGuestModal({ isOpen: false, pollId: null, optionId: null });
    setGuestForm({ name: '', phone: '' });
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/polls/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Segmented Control Header: calm surface-2 pill */}
      <div className="bg-[var(--surface-2)] p-1 rounded-[var(--r-control)] flex items-center">
        <button
          onClick={() => setActiveTab('announcements')}
          className={clsx(
            "flex-1 flex justify-center items-center space-x-2 py-2 rounded-[10px] text-[13px] font-medium transition-all",
            activeTab === 'announcements' 
              ? "bg-[var(--surface-1)] text-[var(--text)] shadow-[var(--shadow-soft)]" 
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          <Megaphone className="w-4 h-4" strokeWidth={1.5} />
          <span>{t('Announcements', 'அறிவிப்புகள்')}</span>
        </button>
        <button
          onClick={() => setActiveTab('polls')}
          className={clsx(
            "flex-1 flex justify-center items-center space-x-2 py-2 rounded-[10px] text-[13px] font-medium transition-all",
            activeTab === 'polls' 
              ? "bg-[var(--surface-1)] text-[var(--text)] shadow-[var(--shadow-soft)]" 
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          <BarChart2 className="w-4 h-4" strokeWidth={1.5} />
          <span>{t('Polls', 'கருத்துக்கணிப்பு')}</span>
        </button>
      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="px-1">
            <h1 className="text-[17px] font-semibold text-[var(--text)] tracking-tight">
              {t('Official Board', 'அதிகாரபூர்வ அறிவிப்புகள்')}
            </h1>
            <p className="text-[13px] text-[var(--text-2)] mt-0.5">
              {t('Notices from Kavarappattu Panchayat.', 'ஊராட்சியின் நேரடி அறிவிப்புகள்.')}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <ListCardSkeleton />
              <ListCardSkeleton />
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title={t('No announcements at this time', 'தற்போது எந்த அறிவிப்புகளும் இல்லை')}
              description={t('Panchayat notices and official village updates will appear here.', 'புதிய அறிவிப்புகள் வெளியாகும் போது இங்கு தோன்றும்.')}
            />
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <article 
                  key={ann._id} 
                  className={clsx(
                    "p-4 rounded-[var(--r-card)] bg-[var(--surface-1)] border transition-all duration-200",
                    ann.priority === 'High' 
                      ? "border-l-4 border-l-red-500 border-t-[var(--hairline)] border-r-[var(--hairline)] border-b-[var(--hairline)]" 
                      : "border-l-4 border-l-[var(--accent)] border-t-[var(--hairline)] border-r-[var(--hairline)] border-b-[var(--hairline)]"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                        ann.priority === 'High'
                          ? "bg-red-500/10 text-red-500"
                          : "bg-[var(--accent-soft)] text-[var(--accent)]"
                      )}>
                        {ann.priority === 'High' ? t('Urgent', 'அவசரம்') : t('Official', 'அதிகாரபூர்வம்')}
                      </span>
                      <h2 className="text-[15px] font-semibold text-[var(--text)] leading-snug">
                        {ann.title}
                      </h2>
                    </div>
                    <time className="text-[11px] text-[var(--text-3)] whitespace-nowrap ml-2">
                      {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </time>
                  </div>

                  <p className="text-[14px] text-[var(--text-2)] whitespace-pre-wrap leading-relaxed mb-3">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-3)] pt-2 border-t border-[var(--hairline)]">
                    <span>{t('By:', 'வழங்கியவர்:')} {ann.author}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Polls Tab */}
      {activeTab === 'polls' && (
        <div className="space-y-4">
          <div className="px-1">
            <h1 className="text-[17px] font-semibold text-[var(--text)] tracking-tight">
              {t('Opinion Polls', 'கருத்துக்கணிப்பு')}
            </h1>
            <p className="text-[13px] text-[var(--text-2)] mt-0.5">
              {t('Have your say in village decisions.', 'ஊர் முடிவுகளில் உங்கள் கருத்தை பதிவு செய்யுங்கள்.')}
            </p>
          </div>

          {polls.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title={t('No active polls', 'தற்போது கருத்துக்கணிப்புகள் இல்லை')}
              description={t('New community voting topics will be published here.', 'புதிய வாக்கெடுப்புகள் தொடங்கப்படும் போது இங்கு பார்க்கலாம்.')}
            />
          ) : (
            <div className="space-y-3.5">
              {polls.map((poll) => {
                const hasVoted = poll.hasVoted;
                
                return (
                  <div key={poll.id} className="bg-[var(--surface-1)] p-4 rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)]">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-[15px] font-semibold text-[var(--text)] leading-snug">
                        {poll.question}
                      </h2>
                      {!poll.isActive && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-3)] whitespace-nowrap ml-2">
                          {t('Closed', 'முடிந்தது')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {poll.options.map((opt, index) => {
                        const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        
                        return (
                          <div key={opt.id} className="relative">
                            <button
                              onClick={() => poll.isActive && !hasVoted && handleVote(poll.id, opt.id)}
                              disabled={!poll.isActive || hasVoted}
                              className={clsx(
                                "w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-[var(--r-control)] text-[13px] font-medium transition-all relative overflow-hidden text-left",
                                hasVoted || !poll.isActive
                                  ? "bg-[var(--surface-2)] text-[var(--text-2)] cursor-default"
                                  : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] active:scale-[0.98]"
                              )}
                            >
                              {(hasVoted || !poll.isActive) && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 rounded-[var(--r-control)] bg-[var(--accent-soft)] transition-all duration-700 pointer-events-none"
                                  style={{ width: `${percentage}%` }}
                                />
                              )}

                              <span className="relative z-10 flex-1 pr-2 truncate">
                                {opt.text}
                              </span>
                              {(hasVoted || !poll.isActive) && (
                                <span className="relative z-10 text-[12px] font-semibold text-[var(--text)]">
                                  {percentage}%
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 mt-3 border-t border-[var(--hairline)] flex justify-between items-center text-[12px] text-[var(--text-2)]">
                      <span>{poll.totalVotes} {t('votes', 'வாக்குகள்')}</span>
                      <button
                        onClick={() => handleShare(poll.id)}
                        className="flex items-center space-x-1 text-[var(--text-2)] hover:text-[var(--text)] transition-colors p-1"
                      >
                        {copiedId === poll.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="text-[var(--accent)]">{t('Copied', 'நகலானது')}</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>{t('Share', 'பகிர்')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Guest Modal */}
      {mounted && guestModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface-1)] rounded-[var(--r-card)] border border-[var(--hairline)] w-full max-w-sm p-5 shadow-[var(--shadow-lift)]">
            <h3 className="text-[17px] font-semibold text-[var(--text)] mb-1">
              {t('Vote on this Poll', 'வாக்களிக்கவும்')}
            </h3>
            <p className="text-[13px] text-[var(--text-2)] mb-4 leading-relaxed">
              {t('Enter your name to cast your vote as a resident.', 'வாக்களிக்க உங்கள் பெயரை உள்ளிடவும்.')}
            </p>

            <form onSubmit={handleGuestSubmit} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-2)] mb-1">
                  {t('Name', 'பெயர்')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full bg-[var(--surface-2)] rounded-[var(--r-control)] p-3 text-[14px] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder={t('Enter your name', 'உங்கள் பெயர்')}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--text-2)] mb-1">
                  {t('Phone (Optional)', 'தொலைபேசி (விருப்பத்தேர்வு)')}
                </label>
                <input
                  type="tel"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="w-full bg-[var(--surface-2)] rounded-[var(--r-control)] p-3 text-[14px] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder={t('Mobile number', 'கைபேசி எண்')}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGuestModal({ isOpen: false, pollId: null, optionId: null })}
                  className="flex-1 py-2.5 rounded-[var(--r-control)] font-medium text-[13px] text-[var(--text-2)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  {t('Cancel', 'ரத்து')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-[var(--r-control)] font-semibold text-[13px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all"
                >
                  {t('Submit Vote', 'வாக்களி')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
