"use client";

import { useState, useEffect } from 'react';
import { BarChart2, Plus, Trash2, Loader2, PlayCircle, Share2, CheckCircle, XCircle, Download, Mail } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function AdminPolls() {
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
      router.push('/');
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
        setPolls(data.polls);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) return; // Limit to 6 options max
    setOptions([...options, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveOption = (id) => {
    if (options.length <= 2) return; // Minimum 2 options required
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleOptionChange = (id, text) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (!question || validOptions.length < 2) {
      alert("Please enter a question and at least 2 options.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          question,
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
          { id: Date.now().toString() + '1', text: '' },
          { id: Date.now().toString() + '2', text: '' }
        ]);
      } else {
        alert(data.error || 'Failed to create poll');
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this poll? This cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/polls?id=${id}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPolls(polls.filter(p => (p.id || p._id) !== id));
      } else {
        alert("Failed to delete poll");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const actionText = currentStatus ? 'close' : 're-open';
    if (!confirm(`Are you sure you want to ${actionText} this poll?`)) return;

    setTogglingId(id);
    try {
      const res = await fetch('/api/polls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: id,
          requesterEmail: currentUser.email,
          isActive: !currentStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPolls(polls.map(p => (p.id || p._id) === id ? { ...p, isActive: data.isActive } : p));
      } else {
        alert("Failed to update poll status");
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
    if (!confirm('Are you sure you want to broadcast an email notification for this poll to all users?')) return;
    
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
        alert("Emails are being sent in the background!");
      } else {
        alert(data.error || "Failed to send email");
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
            // Legacy fallback
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

  if (!hasPermission) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <BarChart2 className="w-6 h-6 mr-2 text-blue-500" />
          Manage Polls
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create community polls to gather public opinion.</p>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">New Poll</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poll Question</label>
            <input 
              type="text" 
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g., What should we name the new park?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Display Language</label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-gray-100"
            >
              <option value="en">English</option>
              <option value="ta">Tamil (தமிழ்)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options (Min 2, Max 6)</label>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    required={index < 2} // First two are required
                    value={opt.text}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    className="flex-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <button 
                type="button" 
                onClick={handleAddOption}
                className="mt-3 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Option
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="sendEmail" 
              checked={sendEmail} 
              onChange={(e) => setSendEmail(e.target.checked)} 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Send Email Notification to All Users
            </label>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 dark:bg-sky-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center justify-center hover:bg-blue-700 dark:hover:bg-sky-600 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlayCircle className="w-5 h-5 mr-2" /> Publish Poll</>}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Active Polls</h2>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : polls.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No active polls found.</p>
        ) : (
          polls.map((poll) => (
            <div key={poll.id || poll._id} className="p-5 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{poll.question}</h3>
                  {!poll.isActive && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full whitespace-nowrap mt-1">
                      Closed
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {poll.totalVotes} Votes
                </span>
              </div>
              <div className="space-y-3">
                {poll.options.map(opt => {
                  const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{opt.text}</span>
                        <span className="text-gray-500 dark:text-gray-400">{percentage}% ({opt.votes})</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800/50 rounded-full h-2 mb-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {opt.voters && opt.voters.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg mt-2 border border-gray-200 dark:border-gray-800">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Voters:</span>
                          <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                            {opt.voters.map((voter, idx) => {
                              let isGuest = false;
                              let displayVoter = voter;
                              let guestPhone = '';
                              
                              if (voter.startsWith('GUEST::')) {
                                const parts = voter.split('::');
                                isGuest = true;
                                displayVoter = parts[1] || 'Unknown Guest';
                                guestPhone = parts[2] && parts[2] !== 'N/A' ? parts[2] : '';
                              } else if (voter.startsWith('USER::')) {
                                const parts = voter.split('::');
                                displayVoter = parts[1] || 'User';
                                guestPhone = parts[2] || '';
                              }

                              return (
                                <li key={idx} className="flex items-center before:content-['•'] before:mr-1.5 before:text-gray-400 truncate py-0.5">
                                  <span className={isGuest ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-800 dark:text-gray-200 font-medium'}>{displayVoter}</span>
                                  {guestPhone && <span className="ml-1.5 text-[10px] text-gray-400">({guestPhone})</span>}
                                  {isGuest && (
                                    <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded">
                                      Unauthorized
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <span>By {poll.author}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleExportExcel(poll)}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => handleShare(poll.id || poll._id)}
                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    {copiedId === (poll.id || poll._id) ? <CheckCircle className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedId === (poll.id || poll._id) ? 'Copied' : 'Share'}</span>
                  </button>

                  <button
                    onClick={() => handleSendEmailNotification(poll.id || poll._id)}
                    disabled={sendingEmailId === (poll.id || poll._id)}
                    className="flex items-center space-x-1 text-purple-500 hover:text-purple-600 font-medium disabled:opacity-50 transition-colors"
                  >
                    {sendingEmailId === (poll.id || poll._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>{sendingEmailId === (poll.id || poll._id) ? 'Sending...' : 'Send Email'}</span>
                  </button>
                  
                      <button
                        onClick={() => handleToggleStatus(poll.id || poll._id, poll.isActive)}
                        disabled={togglingId === (poll.id || poll._id)}
                        className="flex items-center space-x-1 text-amber-500 hover:text-amber-600 font-medium disabled:opacity-50 transition-colors"
                      >
                        {poll.isActive ? <XCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                        <span>{poll.isActive ? 'Close Poll' : 'Re-open'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(poll.id || poll._id)}
                        disabled={deletingId === (poll.id || poll._id)}
                        className="flex items-center space-x-1 text-red-500 hover:text-red-600 font-medium disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
