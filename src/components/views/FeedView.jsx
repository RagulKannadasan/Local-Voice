"use client";

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Camera, Loader2, ArrowRight, Trash2, MoreHorizontal, Megaphone } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/lib/LanguageContext';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [imageString, setImageString] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useLanguage();

  // Comment UI state
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isCommenting, setIsCommenting] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setImageString(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLike = async (postId) => {
    if (!currentUser) return alert('Please log in to like posts.');

    // Optimistic UI update
    const previousPosts = [...posts];
    setPosts(posts.map(post => {
      if (post._id === postId) {
        const hasLiked = post.likes.includes(currentUser.email);
        const newLikes = hasLiked
          ? post.likes.filter(email => email !== currentUser.email)
          : [...post.likes, currentUser.email];
        return { ...post, likes: newLikes };
      }
      return post;
    }));

    try {
      const res = await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userEmail: currentUser.email, action: 'like' })
      });
      if (!res.ok) {
        // Revert on failure
        setPosts(previousPosts);
      }
    } catch (error) {
      setPosts(previousPosts);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          authorUsername: currentUser.username,
          content: newPostContent,
          imageUrl: imageString
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPosts([data.post, ...posts]);
        setNewPostContent('');
        setImageString(null);
      }
    } catch (error) {
      alert("Network error while posting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async (post) => {
    const shareData = {
      title: 'Local Voice Kavarappattu',
      text: `Check out this post by ${post.authorName}: "${post.content.substring(0, 50)}..."`,
      url: window.location.origin + '/feed'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        // Track share count
        await fetch('/api/feed', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post._id, action: 'share' })
        });
        setPosts(posts.map(p => p._id === post._id ? { ...p, shares: (p.shares || 0) + 1 } : p));
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.log('Share canceled or failed', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    // Optimistic update
    const previousPosts = [...posts];
    setPosts(posts.filter(p => p._id !== postId));

    try {
      const res = await fetch(`/api/feed?id=${postId}&requesterEmail=${currentUser.email}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        setPosts(previousPosts);
        const data = await res.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch (error) {
      setPosts(previousPosts);
      alert('Network error while deleting post');
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = async (postId) => {
    if (!currentUser) return alert('Please log in to comment.');
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    setIsCommenting(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userEmail: currentUser.email,
          userName: currentUser.name,
          action: 'comment',
          content: content.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p._id === postId ? data.post : p));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setIsCommenting(prev => ({ ...prev, [postId]: false }));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-800 dark:text-sky-500" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {currentUser ? (
        <div className="bg-white dark:bg-[#0a0a0a] transition-colors rounded-2xl">
          <form onSubmit={handlePostSubmit} className="border border-gray-200 dark:border-gray-800 p-3 rounded-2xl flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 flex-shrink-0 flex items-center justify-center font-bold uppercase border border-blue-200 dark:border-sky-900/30">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 flex flex-col justify-center min-h-[40px]">
              <textarea
                className="w-full bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 self-center leading-tight mt-1"
                placeholder={t("Kavarappattu-la enna nadakkirathu?", "கவரப்பட்டு-ல என்ன நடக்கிறது?")}
                rows={newPostContent ? 3 : 1}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              
              {imageString && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageString} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImageString(null)} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">&times;</button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <label className="text-gray-500 hover:text-blue-800 dark:hover:text-sky-500 cursor-pointer p-2 rounded-full transition-colors hidden md:block">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <button
                type="submit"
                disabled={isSubmitting || !newPostContent.trim() || !currentUser.username}
                className="bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={!currentUser.username ? "Set a username in your profile to post" : ""}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-gray-500 text-sm">Log in from the Profile tab to post.</p>
        </div>
      )}

      <div className="pt-2">
        <h2 className="text-[10px] font-bold text-gray-600 tracking-widest uppercase ml-1">Today</h2>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const isLikedByMe = currentUser && post.likes.includes(currentUser.email);
          const isCommentsExpanded = expandedComments[post._id];
          const commentCount = post.comments && Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);

          return (
            <article key={post._id} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 flex-shrink-0 flex items-center justify-center font-bold uppercase border border-blue-200 dark:border-sky-900/30">
                  {post.authorName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>{post.authorName}</span>
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    {post.authorUsername && <span className="text-[11px] text-gray-500">@{post.authorUsername}</span>}
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(post.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentUser?.role === 'super_admin' && (
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button className="text-gray-500 hover:text-gray-300 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3 inline-flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-[10px] px-2 py-1 rounded-full">
                <Megaphone className="w-3 h-3" />
                <span>அறிவிப்பு</span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[500px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt="Post Attachment" className="max-w-full max-h-[500px] object-contain rounded-xl" />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50 px-3 py-1 rounded-full text-[11px]">பசுமை</span>
                <span className="text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50 px-3 py-1 rounded-full text-[11px]">சுற்றுச்சூழல்</span>
                <span className="text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50 px-3 py-1 rounded-full text-[11px]">பொதுமக்கள்</span>
              </div>

              <div className="flex items-center space-x-3 pt-2 transition-colors">
                <button
                  onClick={() => handleLike(post._id)}
                  className={clsx(
                    "flex-1 flex justify-center items-center space-x-2 text-sm font-medium transition-colors border rounded-xl py-2",
                    isLikedByMe ? "border-red-900/50 text-red-500 bg-red-900/10" : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Heart className={clsx("w-4 h-4", isLikedByMe && "fill-current")} />
                  <span className="text-xs">{post.likes.length}</span>
                </button>

                <button
                  onClick={() => toggleComments(post._id)}
                  className="flex-1 flex justify-center items-center space-x-2 text-sm font-medium transition-colors border border-gray-200 dark:border-gray-800 rounded-xl py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{commentCount}</span>
                </button>

                <button
                  onClick={() => handleShare(post)}
                  className="flex-1 flex justify-center items-center space-x-2 text-sm font-medium transition-colors border border-gray-200 dark:border-gray-800 rounded-xl py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">{post.shares || 0}</span>
                </button>
              </div>

              {/* Comments Section */}
              {isCommentsExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {/* Comment Input */}
                  {currentUser ? (
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="text"
                        placeholder={t("Write a comment...", "கமெண்ட் எழுதவும்...")}
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post._id); }}
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post._id)}
                        disabled={isCommenting[post._id] || !commentInputs[post._id]}
                        className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        {isCommenting[post._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center mb-4">Log in to add a comment.</p>
                  )}

                  {/* Comment List */}
                  <div className="space-y-3">
                    {Array.isArray(post.comments) && post.comments.length > 0 ? (
                      post.comments.map((comment, idx) => (
                        <div key={idx} className="flex space-x-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl rounded-tl-none">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase">
                            {comment.authorName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-baseline space-x-2">
                              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.authorName}</span>
                              <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center">No comments yet. Be the first to start the discussion!</p>
                    )}
                  </div>
                </div>
              )}

            </article>
          );
        })}
      </div>
    </div>
  );
}
