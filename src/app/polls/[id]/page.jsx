"use client";

import { useState, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle, Share2, ArrowLeft, ArrowRight, MessageSquareOff, Trash2, Check, Send } from 'lucide-react';
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
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        if (!userEmail) {
          const guestVotesStr = localStorage.getItem('localVoice_guestVotes');
          if (guestVotesStr) {
            const guestVotes = JSON.parse(guestVotesStr);
            if (guestVotes.includes(fetchedPoll.id)) {
              fetchedPoll.hasVoted = true;
            }
          }
        }

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
        fetchPoll();
        const data = await res.json();
        alert(data.error || "Failed to submit vote");
      } else {
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
          userName: currentUser?.name || 'Resident',
          userEmail: currentUser?.email || 'guest@localvoice.app'
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
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-20 px-4">
        <h1 className="text-[17px] font-semibold text-[var(--text)] mb-2">Poll Not Found</h1>
        <p className="text-[13px] text-[var(--text-2)] mb-4">This poll may have been removed or does not exist.</p>
        <button onClick={() => router.push('/feed')} className="text-[13px] font-medium text-[var(--accent)]">
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] transition-colors -ml-1"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>{t('Back', 'திரும்பிச் செல்')}</span>
      </button>

      <div className="bg-[var(--surface-1)] p-5 rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)]">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-[17px] font-semibold text-[var(--text)] leading-snug">
            {poll.question}
          </h1>
          {!poll.isActive && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-3)] whitespace-nowrap ml-2">
              {t('Closed', 'முடிந்தது')}
            </span>
          )}
        </div>

        <div className="space-y-2.5 mb-5">
          {poll.options.map((opt, index) => {
            const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;

            return (
              <div key={opt.id} className="relative">
                <button
                  onClick={() => poll.isActive && !poll.hasVoted && handleVote(opt.id)}
                  disabled={!poll.isActive || poll.hasVoted}
                  className={clsx(
                    "w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-[var(--r-control)] text-[13px] font-medium transition-all relative overflow-hidden text-left",
                    poll.hasVoted || !poll.isActive
                      ? "bg-[var(--surface-2)] text-[var(--text-2)] cursor-default"
                      : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] active:scale-[0.98]"
                  )}
                >
                  {(poll.hasVoted || !poll.isActive) && (
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-[var(--r-control)] bg-[var(--accent-soft)] transition-all duration-700 pointer-events-none"
                      style={{ width: `${percentage}%` }}
                    />
                  )}

                  <span className="relative z-10 flex-1 pr-2 truncate">
                    {opt.text}
                  </span>
                  {(poll.hasVoted || !poll.isActive) && (
                    <span className="relative z-10 text-[12px] font-semibold text-[var(--text)]">
                      {percentage}%
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[var(--hairline)] flex justify-between items-center text-[12px] text-[var(--text-2)]">
          <span>{poll.totalVotes} {t('votes', 'வாக்குகள்')}</span>
          <button
            onClick={handleShare}
            className="flex items-center space-x-1 text-[var(--text-2)] hover:text-[var(--text)] transition-colors p-1"
          >
            {copied ? (
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

        {/* Comments Section */}
        <div className="mt-6 pt-4 border-t border-[var(--hairline)]">
          <h3 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            {t('Comments', 'கருத்துக்கள்')}
          </h3>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              placeholder={t("Share your opinion...", "கருத்தை பகிரவும்...")}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
              className="flex-1 bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-[var(--text-3)]"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={isCommenting || !commentInput.trim()}
              className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--accent-hover)] active:scale-95 transition-all"
            >
              {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2} />}
            </button>
          </div>

          <div className="space-y-2">
            {poll.comments && poll.comments.length > 0 ? (
              poll.comments.map((comment, idx) => (
                <div key={idx} className="bg-[var(--surface-2)] p-3 rounded-[var(--r-control)]">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="font-medium text-[12px] text-[var(--text)]">
                      {comment.authorName || 'Resident'}
                    </span>
                    <span className="text-[10px] text-[var(--text-3)]">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-2)]">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-[var(--text-3)] text-center py-3">
                {t('No comments yet.', 'கருத்துகள் எதுவும் இல்லை.')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
