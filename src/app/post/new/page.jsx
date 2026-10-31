"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';

export default function CreatePostPage() {
  const [newPostContent, setNewPostContent] = useState('');
  const [imageString, setImageString] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        router.push('/profile');
      }
    } else {
      router.push('/profile');
    }
  }, [router]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImageString(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
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

      if (res.ok) {
        router.push('/feed');
      }
    } catch (error) {
      alert("Network error while posting.");
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  const hasText = Boolean(newPostContent.trim());

  return (
    <div className="bg-[var(--bg)] min-h-[calc(100vh-4rem)] flex flex-col -mx-4 sm:-mx-5 -my-3">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hairline)] sticky top-0 bg-[var(--bg)]/90 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <Link
            href="/feed"
            aria-label="Back"
            className="w-9 h-9 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-full transition-colors -ml-1"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <span className="font-semibold text-[16px] text-[var(--text)]">
            {t('New Post', 'புதிய பதிவு')}
          </span>
        </div>

        <button
          onClick={handlePostSubmit}
          disabled={isSubmitting || !hasText || !currentUser.username}
          className="px-4 py-1.5 rounded-[var(--r-control)] text-[13px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t("Post", "பதிவிடு")}
        </button>
      </div>

      {!currentUser.username && (
        <div className="mx-4 mt-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-[var(--r-control)] text-[12px] flex items-center space-x-2">
          <span>{t('Please set a unique username in your Profile before posting.', 'பதிவிடுவதற்கு முன் உங்கள் சுயவிவரத்தில் பயனர்பெயரை அமைக்கவும்.')}</span>
        </div>
      )}

      {/* Composer Area */}
      <div className="flex flex-1 p-4 space-x-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
          {currentUser.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUser.profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
          )}
        </div>

        {/* Input & Attachments */}
        <div className="flex-1 flex flex-col pt-1 min-w-0">
          <textarea
            className="w-full bg-transparent text-[var(--text)] text-[16px] placeholder-[var(--text-3)] resize-none leading-relaxed border-none borderless-textarea"
            placeholder={t("What's happening in Kavarappattu?", "நமது ஊரில் என்ன நடக்கிறது?")}
            rows={6}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            autoFocus
          />

          {imageString && (
            <div className="relative w-full max-w-sm rounded-[var(--r-card)] overflow-hidden bg-[var(--surface-2)] mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageString} alt="Attached media" className="w-full h-auto object-cover max-h-[360px]" />
              <button
                type="button"
                onClick={() => setImageString(null)}
                aria-label="Remove image"
                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Media Bar */}
      <div className="mt-auto border-t border-[var(--hairline)] p-3 px-4 bg-[var(--bg)] flex items-center justify-between sticky bottom-0">
        <label className="flex items-center space-x-2 text-[var(--text-2)] hover:text-[var(--text)] cursor-pointer py-1 px-2 rounded-[var(--r-control)] hover:bg-[var(--surface-2)] transition-colors">
          <Camera className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[13px] font-medium">{t('Attach Photo', 'புகைப்படம் சேர்')}</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        <span className="text-[12px] text-[var(--text-3)]">
          {newPostContent.length}/500
        </span>
      </div>
    </div>
  );
}
