"use client";

import { useState, useEffect } from 'react';
import { BarChart2, Plus, Trash2, Loader2, PlayCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  const [question, setQuestion] = useState('');
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
      const res = await fetch('/api/polls');
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

      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">New Poll</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poll Question</label>
            <input 
              type="text" 
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g., What should we name the new park?"
            />
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
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-70"
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
            <div key={poll.id || poll._id} className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{poll.question}</h3>
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
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>By {poll.author}</span>
                <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
