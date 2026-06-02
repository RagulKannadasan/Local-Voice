"use client";

import { useState, useEffect } from 'react';
import { Camera, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

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
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('Create Post', 'புதிய பதிவு')}</h1>
        {!currentUser.username && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-200 dark:border-amber-800/30 text-sm flex items-start space-x-2">
            <span className="font-bold">⚠️</span>
            <span>{t('You must set a unique username in your Profile before you can post.', 'நீங்கள் பதிவிடுவதற்கு முன் உங்கள் சுயவிவரத்தில் தனித்துவமான பயனர்பெயரை (Username) அமைக்க வேண்டும்.')}</span>
          </div>
        )}
        <form onSubmit={handlePostSubmit} className="flex flex-col space-y-3">
          <textarea
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 resize-none transition-colors"
            placeholder={t("What's happening in Kavarappattu?", "நமது ஊரில் என்ன நடக்கிறது?")}
            rows={5}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />

          {imageString && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300 mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageString} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageString(null)}
                className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 cursor-pointer p-2 rounded-full hover:bg-blue-50 transition-colors">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">{t('Add Photo', 'புகைப்படம் சேர்')}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !newPostContent.trim() || !currentUser.username}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              title={!currentUser.username ? "Set a username in your profile to post" : ""}
            >
              <span>{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("Post", "பதிவிடு")}</span>
              {!isSubmitting && <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
