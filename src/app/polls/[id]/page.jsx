"use client";

import { useState, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle, Share2, ArrowLeft, ArrowRight, MessageSquareOff } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function PollPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [mounted, setMounted] = useState(false);
  const [poll, setPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Guest Voting State
  const [guestModal, setGuestModal] = useState({ isOpen: false, optionId: null });
  const [guestForm, setGuestForm] = useState({ name: '', phone: '' });

  // Comment State
  const [commentInput, setCommentInput] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const { t, setLanguage } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchPoll();
    
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, [id]);

  const fetchPoll = async () => {
    try {
      let userEmail = '';
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        const profile = JSON.parse(saved);
        userEmail = profile.email;
      }
      
      const res = await fetch(`/api/polls?id=${id}&requesterEmail=${userEmail}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.polls && data.polls.length > 0) {
        let fetchedPoll = data.polls[0];
        
        // If not logged in, check local storage for guest votes
        if (!userEmail) {
          const guestVotesStr = localStorage.getItem('localVoice_guestVotes');
          if (guestVotesStr) {
            const guestVotes = JSON.parse(guestVotesStr);
            if (guestVotes.includes(fetchedPoll.id)) {
              fetchedPoll.hasVoted = true;
            }
          }
        }
        
        // Auto-set the language context to the poll's default language
        if (fetchedPoll.defaultLanguage) {
          setLanguage(fetchedPoll.defaultLanguage);
        }
        
        setPoll(fetchedPoll);
      } else {
        setPoll(null);
      }
    } catch (error) {
      console.error("Failed to fetch poll:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (optionId) => {
    if (!currentUser) {
      setGuestModal({ isOpen: true, optionId });
      return;
    }
    await submitVote(optionId, currentUser.email);
  };

  const submitVote = async (optionId, userEmailToSubmit) => {
    if (!poll || poll.hasVoted) return;

    // Optimistic update
    const newOptions = poll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    setPoll({ 
      ...poll, 
      options: newOptions, 
      totalVotes: poll.totalVotes + 1,
      hasVoted: true
    });

    try {
      const res = await fetch('/api/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: id,
          optionId,
          userEmail: userEmailToSubmit
        })
      });
      if (!res.ok) {
        fetchPoll(); // Revert
        const data = await res.json();
        alert(data.error || "Failed to submit vote");
      } else {
        // Guest local storage
        if (userEmailToSubmit.startsWith('GUEST::')) {
          const savedStr = localStorage.getItem('localVoice_guestVotes');
          const guestVotes = savedStr ? JSON.parse(savedStr) : [];
          if (!guestVotes.includes(id)) {
            guestVotes.push(id);
            localStorage.setItem('localVoice_guestVotes', JSON.stringify(guestVotes));
          }
        }
      }
    } catch (error) {
      console.error("Voting error:", error);
      fetchPoll();
      alert("Network error. Please try again.");
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestForm.name.trim()) return;

    const uniqueId = Math.random().toString(36).substr(2, 9);
    const guestEmail = `GUEST::${guestForm.name.trim()}::${guestForm.phone.trim() || 'N/A'}::${uniqueId}`;
    
    await submitVote(guestModal.optionId, guestEmail);
    setGuestModal({ isOpen: false, optionId: null });
    setGuestForm({ name: '', phone: '' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || isCommenting) return;
    
    setIsCommenting(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: id,
          action: 'comment',
          content: commentInput.trim(),
          userName: currentUser ? currentUser.name : undefined,
          userEmail: currentUser ? currentUser.email : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPoll({
          ...poll,
          comments: [...(poll.comments || []), data.comment]
        });
        setCommentInput('');
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsCommenting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-sky-500" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-20 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Poll Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">This poll may have been deleted or doesn&apos;t exist.</p>
        <button onClick={() => router.push('/')} className="text-blue-600 font-medium">Return Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-6 px-4 pb-20 space-y-6">
      <button 
        onClick={() => router.back()} 
        className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('Back', 'திரும்பிச் செல்')}</span>
      </button>

      <div className="bg-white dark:bg-[#0a0a0a] p-5 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
            {poll.question}
          </h1>
          {!poll.isActive && (
            <span className="ml-3 text-[10px] font-bold px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full whitespace-nowrap">
              {t('Closed', 'முடிந்தது')}
            </span>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {poll.options.map((opt, index) => {
            const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            
            return (
              <div key={opt.id} className="relative">
                <button
                  onClick={() => poll.isActive && !poll.hasVoted && handleVote(opt.id)}
                  disabled={!poll.isActive || poll.hasVoted}
                  className={clsx(
                    "w-full flex items-center justify-between p-4 rounded-xl border text-base font-medium transition-all relative z-10 overflow-hidden",
                    poll.hasVoted || !poll.isActive
                      ? "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400"
                      : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-900/50 hover:bg-blue-50 dark:hover:bg-sky-900/10 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {(poll.hasVoted || !poll.isActive) && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 z-[-1] rounded-xl transition-all duration-1000 bg-gray-100 dark:bg-gray-800/50"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  <div className="flex items-center">
                    <span className="font-bold">{index + 1}. {opt.text}</span>
                  </div>
                  {(poll.hasVoted || !poll.isActive) && (
                    <span className="font-bold">{percentage}%</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-5 border-t border-gray-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{poll.totalVotes} {t('votes', 'வாக்குகள்')}</span>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? t('Copied', 'நகலெடுக்கப்பட்டது') : t('Share', 'பகிரவும்')}</span>
            </button>
          </div>
          {poll.hasVoted && <span className="text-sm text-blue-800 dark:text-sky-500 font-medium">{t('Vote recorded', 'உங்கள் வாக்கு பதிவானது')}</span>}
        </div>

        {/* Comments Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('Comments', 'கருத்துக்கள்')}</h3>
          
          <div className="flex items-center space-x-2 mb-6">
            <input
              type="text"
              placeholder={t("Share your opinion...", "கருத்தை பகிரவும்...")}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={isCommenting || !commentInput.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3">
            {poll.comments && poll.comments.length > 0 ? (
              poll.comments.map((comment, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <MessageSquareOff className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {comment.authorName ? comment.authorName : t('Anonymous', 'ரகசியவாதி')}
                      {comment.authorName && currentUser?.role === 'super_admin' && ' (Admin View)'}
                    </span>
                    <span className="text-[10px] text-gray-500">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-7">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">{t('No comments yet. Be the first to share your opinion anonymously!', 'இன்னும் கருத்துக்கள் இல்லை. உங்கள் கருத்தை முதலில் பகிரவும்!')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guest Modal */}
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
                  onClick={() => setGuestModal({ isOpen: false, optionId: null })}
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
