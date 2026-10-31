"use client";

import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowLeft, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import EmptyState from '@/components/EmptyState';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

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
          setPosts(data.posts || []);
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
    <div className="space-y-4 pb-24">
      {/* Search Header Bar */}
      <div className="flex items-center space-x-2 sticky top-2 z-10">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors -ml-1 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Link>
        <div className="flex-1 flex items-center bg-[var(--surface-2)] rounded-[var(--r-control)] px-3.5 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <Search className="w-4 h-4 text-[var(--text-3)] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search posts or residents...", "பதிவுகள் அல்லது ஊர் மக்களைத் தேடு...")}
            className="w-full bg-transparent border-none outline-none text-[14px] text-[var(--text)] placeholder-[var(--text-3)]"
          />
        </div>
      </div>

      {/* Results / Status Area */}
      <div className="space-y-4 pt-2">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          </div>
        )}

        {!isLoading && debouncedQuery && posts.length === 0 && (
          <EmptyState
            icon={Search}
            title={t("No results found", "முடிவுகள் ஏதுமில்லை")}
            description={`${t("No matching posts found for", "இதற்கான பதிவுகள் எதுவும் இல்லை")} "${debouncedQuery}"`}
          />
        )}

        {!isLoading && !debouncedQuery && (
          <EmptyState
            icon={Search}
            title={t("Search Kavarappattu Feed", "தேடல்")}
            description={t(
              "Type words or resident names to search across community discussions.",
              "செய்திகள் அல்லது நபர்களின் பெயர்களை தட்டச்சு செய்து தேடுங்கள்."
            )}
          />
        )}

        {!isLoading && posts.length > 0 && (
          <div className="divide-y divide-[var(--hairline)]">
            {posts.map((post) => (
              <article key={post._id} className="py-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] text-[var(--text)] flex-shrink-0 flex items-center justify-center font-semibold text-xs">
                    {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[14px] text-[var(--text)] truncate">
                      {post.authorName}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-2)]">
                      {post.authorUsername && <span>@{post.authorUsername}</span>}
                      <span>·</span>
                      <time dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </div>

                <p className="text-[14px] text-[var(--text)] leading-relaxed whitespace-pre-wrap mb-2">
                  {post.content}
                </p>

                {post.imageUrl && (
                  <div className="rounded-[var(--r-control)] overflow-hidden bg-[var(--surface-2)] max-h-[260px] flex items-center justify-center mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.imageUrl} alt="Attachment" className="w-full h-auto max-h-[260px] object-cover rounded-[var(--r-control)]" />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
