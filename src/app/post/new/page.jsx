"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, Send, X, ArrowLeft } from 'lucide-react';
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
      setCurrentUser(JSON.parse(saved));
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
          content: newPostContent,
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

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/60 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <Link href="/feed" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold text-lg text-gray-900 dark:text-white">{t('New Post', 'புதிய பதிவு')}</span>
        </div>
        <button
          onClick={handlePostSubmit}
          disabled={isSubmitting || !newPostContent.trim() || !currentUser.username}
          className="bg-blue-600 dark:bg-sky-500 text-white px-5 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700 dark:hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-sm shadow-blue-500/20"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{t("Post", "பதிவிடு")}</span>
        </button>
      </div>

      {!currentUser.username && (
        <div className="mx-4 mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-200 dark:border-amber-800/30 text-sm flex items-start space-x-3">
          <span className="font-bold text-lg leading-none">!</span>
          <span>{t('You must set a unique username in your Profile before you can post.', 'நீங்கள் பதிவிடுவதற்கு முன் உங்கள் சுயவிவரத்தில் தனித்துவமான பயனர்பெயரை அமைக்க வேண்டும்.')}</span>
        </div>
      )}

      {/* Composer Area */}
      <div className="flex flex-1 p-4 space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 flex items-center justify-center font-bold text-lg uppercase border border-blue-200 dark:border-sky-900/30 overflow-hidden">
            {currentUser.profilePhoto ? (
              <img src={currentUser.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
        </div>

        {/* Input & Attachments */}
        <div className="flex-1 flex flex-col pt-2 min-w-0">
          <textarea
            className="w-full bg-transparent text-gray-900 dark:text-white text-lg sm:text-xl placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none resize-none leading-relaxed"
            placeholder={t("What's happening in Kavarappattu?", "நமது ஊரில் என்ன நடக்கிறது?")}
            rows={newPostContent ? Math.max(5, newPostContent.split('\n').length + 1) : 5}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            autoFocus
          />

          {imageString && (
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 mt-4 bg-gray-50 dark:bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageString} alt="Attached media" className="w-full h-auto object-cover max-h-[400px]" />
              <button
                type="button"
                onClick={() => setImageString(null)}
                className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur-sm text-white p-2 rounded-full hover:bg-gray-900 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="mt-auto border-t border-gray-100 dark:border-gray-800/60 p-3 bg-white dark:bg-[#0a0a0a] flex items-center z-10 sticky bottom-0">
        <label className="flex items-center justify-center w-10 h-10 rounded-full text-blue-600 dark:text-sky-500 hover:bg-blue-50 dark:hover:bg-sky-900/20 cursor-pointer transition-colors group">
          <Camera className="w-5 h-5 group-active:scale-90 transition-transform" />
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        <span className="text-sm font-medium text-blue-600 dark:text-sky-500 ml-2 hidden sm:block">
          {t('Add media', 'புகைப்படம் சேர்')}
        </span>
      </div>
    </div>
  );
}
