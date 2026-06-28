"use client";

import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowLeft, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    const searchPosts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/feed?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (res.ok) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    searchPosts();
  }, [debouncedQuery]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 pb-20 px-4 md:px-0">
      
      {/* Search Header */}
      <div className="flex items-center space-x-3 bg-white dark:bg-[#0a0a0a] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 sticky top-4 z-10 shadow-sm">
        <Link href="/feed" className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-xl px-3 py-2 border border-transparent focus-within:border-blue-500 transition-colors">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search posts, authors...", "பதிவுகள், ஆசிரியர்களைத் தேடுங்கள்...")}
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Results Area */}
      <div className="space-y-4 mt-4">
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-800 dark:text-sky-500" />
          </div>
        )}

        {!isLoading && debouncedQuery && posts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 text-sm">{t('No results found for', 'இதற்கு முடிவுகள் ஏதுமில்லை')} &quot;{debouncedQuery}&quot;</p>
          </div>
        )}

        {!isLoading && posts.length > 0 && posts.map((post) => (
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
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>

            {post.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[300px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageUrl} alt="Post Attachment" className="max-w-full max-h-[300px] object-contain rounded-xl" />
              </div>
            )}
          </article>
        ))}

        {!debouncedQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">{t('Type to start searching community posts.', 'சமூகப் பதிவுகளைத் தேட தட்டச்சு செய்யவும்.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
