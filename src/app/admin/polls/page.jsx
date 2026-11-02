"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Plus, 
  Trash2, 
  Loader2, 
  PlayCircle, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Mail, 
  Users, 
  Check, 
  Calendar,
  Vote,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminPolls() {
  const { language, t } = useLanguage();
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [sendEmail, setSendEmail] = useState(false);
  
  const [question, setQuestion] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [options, setOptions] = useState([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setCurrentUser(profile);
      if (profile.role === 'super_admin' || (profile.permissions || []).includes('manage_announcements')) {
        setHasPermission(true);
        fetchPolls();
      } else {
        router.push('/admin');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchPolls = async () => {
    try {
      let userEmail = '';
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        const profile = JSON.parse(saved);
        userEmail = profile.email;
      }
      const res = await fetch(`/api/polls?requesterEmail=${userEmail}`);
      const data = await res.json();
      if (res.ok) {
        setPolls(data.polls || []);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveOption = (id) => {
    if (options.length <= 2) return;
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleOptionChange = (id, text) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      alert(t("Please enter a question and at least 2 options.", "கேள்வி மற்றும் குறைந்தது 2 விருப்பங்களை உள்ளிடவும்."));
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          question: question.trim(),
          defaultLanguage,
          sendEmail,
          options: validOptions
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPolls([data.poll, ...polls]);
        setQuestion('');
        setOptions([
          { id: '1', text: '' },
          { id: '2', text: '' }
        ]);
        setSendEmail(false);
      } else {
        alert(data.error || t('Failed to create poll', 'கருத்துக்கணிப்பை உருவாக்க முடியவில்லை'));
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('Are you sure you want to delete this poll? This will permanently delete all votes.', 'இந்த கருத்துக்கணிப்பை நீக்க விரும்புகிறீர்களா? அனைத்து வாக்குகளும் நீக்கப்படும்.'))) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/polls?id=${id}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPolls(polls.filter(p => (p.id || p._id) !== id));
      } else {
        alert(t("Failed to delete poll", "கருத்துக்கணிப்பை நீக்க முடியவில்லை"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: id,
          action: 'toggle_status',
          requesterEmail: currentUser.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPolls(polls.map(p => (p.id || p._id) === id ? { ...p, isActive: data.isActive } : p));
      } else {
        alert(t("Failed to update poll status", "நிலையை மாற்ற முடியவில்லை"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/polls/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendEmailNotification = async (id) => {
    if (!confirm(t('Are you sure you want to broadcast an email notification for this poll to all users?', 'அனைத்து பயனர்களுக்கும் இந்த கருத்துக்கணிப்பு குறித்த மின்னஞ்சல் அனுப்ப விரும்புகிறீர்களா?'))) return;
    
    setSendingEmailId(id);
    try {
      const res = await fetch(`/api/polls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: id,
          action: 'send_email',
          requesterEmail: currentUser.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(t("Emails are being sent in the background!", "மின்னஞ்சல்கள் பின்னணியில் அனுப்பப்படுகின்றன!"));
      } else {
        alert(data.error || t("Failed to send email", "மின்னஞ்சல் அனுப்புவதில் தோல்வி"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleExportExcel = (poll) => {
    let csvContent = `Poll Question:,"${poll.question.replace(/"/g, '""')}"\n\n`;
    csvContent += "Option,Voter Name,Contact Info,Voter Type\n";

    poll.options.forEach(opt => {
      const optionText = `"${opt.text.replace(/"/g, '""')}"`;
      if (opt.voters && opt.voters.length > 0) {
        opt.voters.forEach(voter => {
          let voterType = 'User';
          let displayVoter = voter;
          let contactInfo = '';
          
          if (voter.startsWith('GUEST::')) {
            const parts = voter.split('::');
            voterType = 'Guest';
            displayVoter = parts[1] || 'Unknown Guest';
            contactInfo = parts[2] && parts[2] !== 'N/A' ? parts[2] : '';
          } else if (voter.startsWith('USER::')) {
            const parts = voter.split('::');
            displayVoter = parts[1] || 'User';
            contactInfo = parts[2] || '';
          } else {
            displayVoter = voter;
            contactInfo = voter;
          }
          
          const vName = `"${displayVoter.replace(/"/g, '""')}"`;
          const vContact = `"${contactInfo.replace(/"/g, '""')}"`;
          
          csvContent += `${optionText},${vName},${vContact},${voterType}\n`;
        });
      } else {
        csvContent += `${optionText},No voters,, \n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Poll_Results_${poll.id || poll._id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTestEmail = async () => {
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST_EMAIL',
          userEmail: currentUser.email
        })
      });
      if (res.ok) {
        alert(t(`Test email sent to ${currentUser.email}!`, `${currentUser.email} முகவரிக்கு சோதனை மின்னஞ்சல் அனுப்பப்பட்டது!`));
      } else {
        alert(t("Failed to send test email", "சோதனை மின்னஞ்சல் அனுப்ப முடியவில்லை"));
      }
    } catch (error) {
      alert("Network error while sending test email.");
    }
  };

  if (!hasPermission) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              {t('Civic Polls & Consensus', 'கருத்துக் கணிப்பு மையம்')}
            </h1>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {t(
              'Conduct community surveys, inspect voter transparency, and export CSV audit sheets.',
              'கிராம கருத்துக்கணிப்புகளை உருவாக்கி, வாக்குகளின் வெளிப்படைத்தன்மையை கண்காணிக்கவும்.'
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestEmail}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{t('Test Email SMTP', 'மின்னஞ்சல் சோதனை')}</span>
          </button>
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text-2)]">
            {polls.length} {t('polls', 'கணிப்புகள்')}
          </span>
        </div>
      </div>

      {/* New Poll Card */}
      <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 sm:p-6 shadow-soft space-y-5">
        <div className="flex items-center space-x-2 border-b border-[var(--hairline)] pb-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-[var(--text)]">
            {t('Launch New Civic Poll', 'புதிய கருத்துக் கணிப்பை உருவாக்கு')}
          </h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Question */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
              {t('Poll Question / Proposal', 'கருத்துக்கணிப்பு கேள்வி')}
            </label>
            <input 
              type="text" 
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('e.g., Should we install solar street lights along North Street?', 'எ.கா: வடக்குத் தெருவில் சோலார் மின்விளக்குகள் பொருத்தலாமா?')}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>

          {/* Display Language */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
              {t('Primary Language', 'முதன்மை மொழி')}
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full sm:max-w-xs px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs font-semibold text-[var(--text)] focus:border-[var(--accent)] outline-none transition-colors"
            >
              <option value="en">English</option>
              <option value="ta">Tamil (தமிழ்)</option>
            </select>
          </div>

          {/* Dynamic Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">
              {t('Voting Options (2 to 6)', 'வாக்கு விருப்பங்கள் (2 முதல் 6)')}
            </label>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <span className="w-6 text-center text-xs font-bold text-[var(--text-3)]">
                    {index + 1}.
                  </span>
                  <input 
                    type="text" 
                    required={index < 2}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    placeholder={`${t('Option', 'விருப்பம்')} ${index + 1}`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] outline-none transition-colors"
                  />
                  {options.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button 
                type="button" 
                onClick={handleAddOption}
                className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Another Option', 'கூடுதல் விருப்பம் சேர்க்க')}</span>
              </button>
            )}
          </div>

          {/* Email Broadcast Switch */}
          <div className="pt-2 flex items-center space-x-2.5">
            <input 
              type="checkbox" 
              id="sendEmail" 
              checked={sendEmail} 
              onChange={(e) => setSendEmail(e.target.checked)} 
              className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
            />
            <label htmlFor="sendEmail" className="text-xs font-medium text-[var(--text-2)] cursor-pointer">
              {t('Broadcast email alert to all registered village members upon publish', 'அனைத்து பயனர்களுக்கும் உடனடி மின்னஞ்சல் அறிவிப்பை அனுப்பவும்')}
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all shadow-md shadow-amber-500/10 flex items-center space-x-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('Publishing Poll...', 'வெளியிடப்படுகிறது...')}</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>{t('Launch Poll', 'கருத்துக்கணிப்பைத் தொடங்கு')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Polls List */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
          {t('Community Polls Ledger', 'கருத்துக் கணிப்புகள் பட்டியல்')}
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-8 text-center text-xs text-[var(--text-3)] shadow-soft">
            {t('No community polls found.', 'கருத்துக்கணிப்புகள் எதுவும் இல்லை.')}
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const pollId = poll.id || poll._id;
              const isDeleting = deletingId === pollId;
              const isToggling = togglingId === pollId;
              const isSending = sendingEmailId === pollId;
              const isCopied = copiedId === pollId;

              return (
                <div 
                  key={pollId}
                  className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 sm:p-6 shadow-soft space-y-4 hover:border-[var(--accent)]/30 transition-all"
                >
                  {/* Poll Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          poll.isActive 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}>
                          {poll.isActive ? t('Active', 'செயலில்') : t('Closed', 'முடிந்தது')}
                        </span>
                        <span className="text-xs text-[var(--text-3)] font-medium">
                          {poll.defaultLanguage === 'ta' ? 'தமிழ்' : 'English'}
                        </span>
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-[var(--text)] tracking-tight">
                        {poll.question}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--hairline)]">
                        {poll.totalVotes || 0} {t('Votes', 'வாக்குகள்')}
                      </span>
                    </div>
                  </div>

                  {/* Options Progress Bars & Voter Transparency */}
                  <div className="space-y-3 pt-1">
                    {poll.options.map(opt => {
                      const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                      return (
                        <div key={opt.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-[var(--text)]">{opt.text}</span>
                            <span className="font-bold text-[var(--accent)]">{percentage}% ({opt.votes || 0})</span>
                          </div>
                          
                          <div className="w-full bg-[var(--surface-2)] rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-[var(--accent)] h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {/* Voter Transparency Log (Admin only) */}
                          {opt.voters && opt.voters.length > 0 && (
                            <details className="text-[11px] text-[var(--text-3)] bg-[var(--surface-2)]/60 rounded-xl p-2.5 border border-[var(--hairline)]">
                              <summary className="font-semibold cursor-pointer text-[var(--text-2)] hover:text-[var(--text)]">
                                {t('View Verified Voters', 'வாக்களித்தவர்கள் விவரம்')} ({opt.voters.length})
                              </summary>
                              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pl-2">
                                {opt.voters.map((voter, idx) => {
                                  let isGuest = false;
                                  let displayVoter = voter;
                                  let guestPhone = '';
                                  
                                  if (voter.startsWith('GUEST::')) {
                                    const parts = voter.split('::');
                                    isGuest = true;
                                    displayVoter = parts[1] || 'Guest';
                                    guestPhone = parts[2] && parts[2] !== 'N/A' ? parts[2] : '';
                                  } else if (voter.startsWith('USER::')) {
                                    const parts = voter.split('::');
                                    displayVoter = parts[1] || 'User';
                                    guestPhone = parts[2] || '';
                                  }

                                  return (
                                    <li key={idx} className="flex items-center text-xs text-[var(--text-2)] truncate">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mr-2 flex-shrink-0" />
                                      <span className="font-medium truncate">{displayVoter}</span>
                                      {guestPhone && <span className="ml-1 text-[10px] text-[var(--text-3)]">({guestPhone})</span>}
                                      {isGuest && (
                                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                          Guest
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Poll Action Bar */}
                  <div className="pt-3 border-t border-[var(--hairline)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[var(--text-3)]">
                    <div>
                      <span>{t('By', 'பதிவு:')} {poll.author}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Export CSV */}
                      <button
                        onClick={() => handleExportExcel(poll)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('Export CSV', 'CSV தரவிறக்கம்')}</span>
                      </button>

                      {/* Share Link */}
                      <button
                        onClick={() => handleShare(pollId)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--accent)]/10 font-medium transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{isCopied ? t('Copied!', 'நகலெடுக்கப்பட்டது!') : t('Share', 'பகிர்')}</span>
                      </button>

                      {/* Send Email Broadcast */}
                      <button
                        onClick={() => handleSendEmailNotification(pollId)}
                        disabled={isSending}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium transition-colors disabled:opacity-50"
                      >
                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        <span>{isSending ? t('Sending...', 'அனுப்பப்படுகிறது...') : t('Email Alert', 'மின்னஞ்சல்')}</span>
                      </button>

                      {/* Toggle Active/Closed */}
                      <button
                        onClick={() => handleToggleStatus(pollId, poll.isActive)}
                        disabled={isToggling}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium transition-colors disabled:opacity-50"
                      >
                        {poll.isActive ? <XCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                        <span>{poll.isActive ? t('Close Poll', 'முடி') : t('Reopen', 'மீளத்திற')}</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(pollId)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 font-medium transition-colors disabled:opacity-50"
                        title={t('Delete Poll', 'நீக்கு')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
