"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Megaphone, AlertTriangle, Clock, Loader2, BarChart2, CheckCircle, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import clsx from 'clsx';

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
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
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
        let fetchedPolls = data.polls;
        
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
    if (!targetPoll || targetPoll.hasVoted) {
      return; // Already voted or invalid poll
    }

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
        body: JSON.stringify({
          pollId,
          optionId,
          userEmail: userEmailToSubmit
        })
      });
      if (!res.ok) {
        // Revert on failure
        fetchPolls();
        const data = await res.json();
        alert(data.error || "Failed to submit vote");
      } else {
        // If guest, save to local storage
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
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800 p-2 flex overflow-hidden">
        <button
          onClick={() => setActiveTab('announcements')}
          className={clsx(
            "flex-1 flex justify-center items-center space-x-2 py-3 px-4 rounded-xl font-medium transition-colors text-sm",
            activeTab === 'announcements' 
              ? "bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50" 
              : "text-gray-600 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent"
          )}
        >
          <Megaphone className="w-4 h-4" />
          <span>{t('Announcements', 'அறிவிப்புகள்')}</span>
        </button>
        <button
          onClick={() => setActiveTab('polls')}
          className={clsx(
            "flex-1 flex justify-center items-center space-x-2 py-3 px-4 rounded-xl font-medium transition-colors text-sm",
            activeTab === 'polls' 
              ? "bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50" 
              : "text-gray-600 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent"
          )}
        >
          <BarChart2 className="w-4 h-4" />
          <span>{t('Polls', 'கருத்துக்கணிப்பு')}</span>
        </button>
      </div>

      {activeTab === 'announcements' && (
        <>
          <div className="px-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('Official Board', 'அதிகாரபூர்வ அறிவிப்புகள்')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Updates from Kavarappattu Panchayat.', 'ஊராட்சியின் அறிவிப்புகள்.')}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-800 dark:text-sky-500" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-gray-500">{t('No announcements at this time.', 'தற்போது எந்த அறிவிப்புகளும் இல்லை.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div 
                  key={ann._id} 
                  className={clsx(
                    "p-5 rounded-2xl border transition-colors",
                    ann.priority === 'High' 
                      ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" 
                      : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h2 className={clsx(
                      "text-lg font-bold leading-tight",
                      ann.priority === 'High' ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                    )}>
                      {ann.priority === 'High' && <AlertTriangle className="inline w-5 h-5 mr-2 mb-1" />}
                      {ann.title}
                    </h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center whitespace-nowrap ml-3">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">
                    {ann.content}
                  </p>
                  <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-800/50">
                    <span>{t('Posted by:', 'பதிவிட்டவர்:')} {ann.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'polls' && (
        <>
          <div className="px-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('Opinion Polls', 'கருத்துக்கணிப்பு')}</h1>
            <p className="text-xs text-gray-500 mt-1">{t('Your voice matters in community decisions.', 'சமூக முடிவுகளில் உங்கள் குரல் முக்கியமானது.')}</p>
          </div>

          <div className="space-y-4 pb-20">
            {polls.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800">
                <p className="text-gray-500">{t('No active polls at this time.', 'தற்போது எந்த கருத்துக்கணிப்பும் இல்லை.')}</p>
              </div>
            ) : polls.map((poll) => {
              const hasVoted = poll.hasVoted;
              
              return (
                <div key={poll.id} className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                      {poll.question}
                    </h2>
                    <div className="flex flex-col items-end">
                      {!poll.isActive && (
                        <span className="ml-3 text-[10px] font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full whitespace-nowrap">
                          {t('Closed', 'முடிந்தது')}
                        </span>
                      )}
                    </div>
                  </div>
  
                  <div className="space-y-3">
                    {poll.options.map((opt, index) => {
                      const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                      
                      return (
                        <div key={opt.id} className="relative">
                          <button
                            onClick={() => poll.isActive && !hasVoted && handleVote(poll.id, opt.id)}
                            disabled={!poll.isActive || hasVoted}
                            className={clsx(
                              "w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all relative z-10 overflow-hidden",
                              hasVoted || !poll.isActive
                                ? "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400"
                                : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-900/50 hover:bg-blue-50 dark:hover:bg-sky-900/10 text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {/* Progress Bar Background */}
                            {(hasVoted || !poll.isActive) && (
                              <div 
                                className="absolute left-0 top-0 bottom-0 z-[-1] rounded-xl transition-all duration-1000 bg-gray-100 dark:bg-gray-800/50"
                                style={{ width: `${percentage}%` }}
                              />
                            )}
                            
                            <div className="flex items-center">
                              <span className="font-bold">{index + 1}. {opt.text}</span>
                            </div>
                            {(hasVoted || !poll.isActive) && (
                              <span className="font-bold">{percentage}%</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
  

                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>{poll.totalVotes} {t('votes', 'வாக்குகள்')}</span>
                      <button
                        onClick={() => handleShare(poll.id)}
                        className="flex items-center space-x-1 text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 font-medium transition-colors"
                      >
                        {copiedId === poll.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedId === poll.id ? t('Copied', 'நகலெடுக்கப்பட்டது') : t('Share', 'பகிரவும்')}</span>
                      </button>
                      <Link
                        href={`/polls/${poll.id}`}
                        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors ml-2"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{poll.comments ? poll.comments.length : 0} {t('Comments', 'கருத்துக்கள்')}</span>
                      </Link>
                    </div>
                    {hasVoted && <span className="text-blue-800 dark:text-sky-500 font-medium">{t('Vote recorded', 'உங்கள் வாக்கு பதிவானது')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Guest Voting Modal */}
      {mounted && guestModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('Vote as Guest', 'விருந்தினராக வாக்களிக்கவும்')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t('Please provide your name to record your vote.', 'உங்கள் வாக்கை பதிவு செய்ய உங்கள் பெயரை வழங்கவும்.')}
            </p>
            
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Name', 'பெயர்')} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder={t('Enter your name', 'உங்கள் பெயரை உள்ளிடவும்')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Mobile Number', 'மொபைல் எண்')} <span className="text-gray-400 font-normal">({t('Optional', 'விருப்பத் தேர்வு')})</span>
                </label>
                <input 
                  type="tel" 
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder={t('Enter mobile number', 'மொபைல் எண்ணை உள்ளிடவும்')}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setGuestModal({ isOpen: false, pollId: null, optionId: null })}
                  className="flex-1 py-2.5 rounded-xl font-medium border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-sm"
                >
                  {t('Cancel', 'ரத்து செய்')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl font-medium bg-blue-600 dark:bg-sky-500 text-white hover:bg-blue-700 dark:hover:bg-sky-600 transition-colors text-sm"
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
