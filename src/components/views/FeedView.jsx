"use client";

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Camera, Loader2, Trash2, MoreHorizontal, MessageSquare, Image as ImageIcon, Send } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/lib/LanguageContext';
import EmptyState from '@/components/EmptyState';
import { FeedItemSkeleton } from '@/components/Skeleton';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [imageString, setImageString] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useLanguage();

  const textareaRef = useRef(null);

  // Comment UI state
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isCommenting, setIsCommenting] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
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
        setIsExpanded(true);
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
          content: newPostContent.trim(),
          imageUrl: imageString
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPosts([data.post, ...posts]);
        setNewPostContent('');
        setImageString(null);
        setIsExpanded(false);
      }
    } catch (error) {
      alert("Network error while posting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async (post) => {
    const shareData = {
      title: 'Kavarappattu',
      text: `"${post.content.substring(0, 60)}..." — ${post.authorName}`,
      url: window.location.origin + '/feed'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        await fetch('/api/feed', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post._id, action: 'share' })
        });
        setPosts(posts.map(p => p._id === post._id ? { ...p, shares: (p.shares || 0) + 1 } : p));
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert(t('Link copied to clipboard!', 'இணைப்பு நகலெடுக்கப்பட்டது!'));
      }
    } catch (err) {
      console.log('Share canceled or failed', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
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

  const hasText = Boolean(newPostContent.trim());

  return (
    <div className="space-y-6 pb-20">
      {/* Top Composer Card */}
      {currentUser ? (
        <div className="bg-[var(--surface-1)] rounded-[var(--r-card)] shadow-[var(--shadow-soft)] p-4 transition-all duration-200">
          <form onSubmit={handlePostSubmit}>
            <div className="flex items-start space-x-3">
              {/* Avatar: Filled circle in surface-2, no outline */}
              <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--text)] flex-shrink-0 flex items-center justify-center font-semibold text-sm">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Textarea: smooth animated expansion */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  rows={isExpanded || hasText ? 3 : 1}
                  onFocus={() => setIsExpanded(true)}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={t("Kavarappattu-la enna nadakkirathu?", "காவராப்பட்டு-ல என்ன நடக்கிறது?")}
                  className="w-full bg-transparent text-[var(--text)] text-[15px] placeholder-[var(--text-3)] focus:outline-none focus-visible:outline-none resize-none pt-2 leading-relaxed transition-all duration-200 border-none"
                />

                {/* Media Preview if attached */}
                {imageString && (
                  <div className="relative w-28 h-28 rounded-[var(--r-control)] overflow-hidden mt-2 bg-[var(--surface-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageString} alt="Attached preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageString(null)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Composer Footer Actions */}
            {(isExpanded || hasText) && (
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--hairline)]">
                <label
                  aria-label={t("Attach image", "புகைப்படம் சேர்க்க")}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors active:scale-95"
                >
                  <Camera className="w-5 h-5" strokeWidth={1.5} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasText) setIsExpanded(false);
                    }}
                    className="px-3 py-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
                  >
                    {t("Cancel", "ரத்து")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !hasText || !currentUser.username}
                    className={clsx(
                      "px-4 py-1.5 rounded-[var(--r-control)] text-xs font-semibold tracking-tight transition-all active:scale-[0.97]",
                      hasText && currentUser.username
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-sm"
                        : "bg-[var(--surface-2)] text-[var(--text-3)] cursor-not-allowed"
                    )}
                    title={!currentUser.username ? "Set a username in your profile to post" : ""}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      t("Post", "பதிவிடு")
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="bg-[var(--surface-1)] p-4 rounded-[var(--r-card)] border border-[var(--hairline)] text-center">
          <p className="text-[13px] text-[var(--text-2)]">
            {t("Log in from the Profile tab to share updates.", "பதிவிட சுயவிவரப் பக்கத்தில் உள்நுழையவும்.")}
          </p>
        </div>
      )}

      {/* Date Section Header: Sentence case, 13px, --text-2 */}
      <div className="pt-1 px-1 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-[var(--text-2)]">
          {t("Today", "இன்று")}
        </h2>
        <span className="text-[11px] text-[var(--text-3)]">
          Kavarappattu
        </span>
      </div>

      {/* Posts List / Loading / Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          <FeedItemSkeleton />
          <FeedItemSkeleton />
          <FeedItemSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t("Nothing here yet in Kavarappattu", "காவராப்பட்டில் இன்னும் பதிவுகள் இல்லை")}
          description={t(
            "Be the first to share news, updates, or photos with your neighbors.",
            "உங்கள் ஊர் மக்களுடன் தகவல்களை முதலில் பகிருங்கள்."
          )}
          actionLabel={t("Create a post", "புதிய பதிவு")}
          actionHref="/post/new"
        />
      ) : (
        <div className="divide-y divide-[var(--hairline)]">
          {posts.map((post) => {
            const isLikedByMe = currentUser && post.likes?.includes(currentUser.email);
            const isCommentsExpanded = expandedComments[post._id];
            const commentCount = post.comments && Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);

            return (
              <article key={post._id} className="py-5 animate-fade-up">
                {/* Header: Avatar, Name + Timestamp, More Menu */}
                <div className="flex items-center space-x-3 mb-2.5">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--text)] flex-shrink-0 flex items-center justify-center font-semibold text-sm">
                    {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] text-[var(--text)] truncate leading-snug">
                      {post.authorName}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-[12px] text-[var(--text-2)]">
                      {post.authorUsername && (
                        <span>@{post.authorUsername}</span>
                      )}
                      <span>·</span>
                      <time dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        aria-label="Delete post"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-3)] hover:text-red-500 hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    )}
                    <button
                      aria-label="More options"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <p className="text-[15px] text-[var(--text)] mb-3 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Attached Media */}
                {post.imageUrl && (
                  <div className="mb-3 rounded-[var(--r-card)] overflow-hidden bg-[var(--surface-2)] max-h-[440px] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt="Post attachment"
                      className="w-full h-auto max-h-[440px] object-cover rounded-[var(--r-card)]"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Action Row: 44px min hit targets, muted by default, active states in accent/red */}
                <div className="flex items-center space-x-1 -ml-2 pt-1">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post._id)}
                    aria-label={`Like, ${post.likes?.length || 0} likes`}
                    className={clsx(
                      "min-h-[44px] px-3 flex items-center space-x-1.5 rounded-full text-[13px] font-medium transition-colors interactive-press",
                      isLikedByMe
                        ? "text-red-500"
                        : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    )}
                  >
                    <Heart
                      className={clsx("w-4 h-4", isLikedByMe && "fill-current")}
                      strokeWidth={1.5}
                    />
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => toggleComments(post._id)}
                    aria-label={`Comments, ${commentCount} comments`}
                    className="min-h-[44px] px-3 flex items-center space-x-1.5 rounded-full text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors interactive-press"
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                    <span>{commentCount}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post)}
                    aria-label={`Share, ${post.shares || 0} shares`}
                    className="min-h-[44px] px-3 flex items-center space-x-1.5 rounded-full text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors interactive-press"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={1.5} />
                    <span>{post.shares || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsExpanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--hairline)] space-y-3">
                    {/* Add Comment Input */}
                    {currentUser ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder={t("Write a comment...", "கருத்தை எழுதவும்...")}
                          value={commentInputs[post._id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post._id); }}
                          className="flex-1 bg-[var(--surface-2)] text-[var(--text)] text-[13px] rounded-[var(--r-control)] px-3.5 py-2 focus:outline-none transition-colors placeholder-[var(--text-3)]"
                        />
                        <button
                          onClick={() => handleCommentSubmit(post._id)}
                          disabled={isCommenting[post._id] || !commentInputs[post._id]?.trim()}
                          aria-label={t("Submit comment", "கருத்தை அனுப்பு")}
                          className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--accent-hover)] active:scale-95 transition-all"
                        >
                          {isCommenting[post._id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[12px] text-[var(--text-3)] text-center py-2">
                        {t("Log in to comment.", "கருத்து தெரிவிக்க உள்நுழையவும்.")}
                      </p>
                    )}

                    {/* Comment List */}
                    <div className="space-y-2 pt-1">
                      {Array.isArray(post.comments) && post.comments.length > 0 ? (
                        post.comments.map((comment, idx) => (
                          <div
                            key={idx}
                            className="bg-[var(--surface-2)] p-3 rounded-[var(--r-control)] flex space-x-2.5"
                          >
                            <div className="w-6 h-6 rounded-full bg-[var(--surface-3)] text-[var(--text)] flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
                              {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <span className="font-medium text-[13px] text-[var(--text)] truncate">
                                  {comment.authorName}
                                </span>
                                <span className="text-[10px] text-[var(--text-3)]">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[13px] text-[var(--text-2)] mt-0.5 whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12px] text-[var(--text-3)] text-center py-2">
                          {t("No comments yet. Start the conversation!", "இன்னும் கருத்துக்கள் இல்லை.")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
