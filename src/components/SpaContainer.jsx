"use client";

import { useState, useEffect } from 'react';
import { useTab } from '@/lib/TabContext';
import FeedView from '@/components/views/FeedView';
import AnnouncementsView from '@/components/views/AnnouncementsView';
import ComplaintsView from '@/components/views/ComplaintsView';
import ProfileView from '@/components/views/ProfileView';

export default function SpaContainer({ children }) {
  const { isSpaMode, activeTab, registerTabRef, handleTabScroll } = useTab();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // During SSR and initial client render, we MUST return exactly what Next.js expects 
  // (the actual page content) to ensure perfect hydration and SEO!
  if (!isSpaMode || !mounted) {
    return <>{children}</>;
  }

  const tabs = [
    { key: 'feed', Component: FeedView },
    { key: 'announcements', Component: AnnouncementsView },
    { key: 'complaints', Component: ComplaintsView },
    { key: 'profile', Component: ProfileView },
  ];

  // 1. DESKTOP VIEW: NO SLIDE, NO SWIPE! Direct full-width tab panels with instant switching
  if (isDesktop) {
    return (
      <div className="w-full h-full relative">
        {tabs.map((tab, idx) => {
          const Component = tab.Component;
          const isActive = idx === activeTab;
          return (
            <div
              key={`desktop-${tab.key}`}
              ref={(el) => registerTabRef(idx, el)}
              onScroll={(e) => handleTabScroll(idx, e)}
              className={`w-full h-full overflow-y-auto overscroll-y-contain px-5 lg:px-8 py-5 [scrollbar-width:thin] [scrollbar-color:var(--hairline)_transparent] ${
                isActive ? 'block' : 'hidden'
              }`}
            >
              <Component />
            </div>
          );
        })}
      </div>
    );
  }

  // 2. MOBILE VIEW: Fluid touch sliding track with independent scroll containers
  return (
    <div className="overflow-hidden w-full relative h-full">
      <div 
        className="flex transition-transform duration-300 ease-out h-full" 
        style={{ width: '400%', transform: `translateX(-${activeTab * 25}%)` }}
      >
        {tabs.map((tab, idx) => {
          const Component = tab.Component;
          return (
            <div
              key={`mobile-${tab.key}`}
              ref={(el) => registerTabRef(idx, el)}
              onScroll={(e) => handleTabScroll(idx, e)}
              className="w-1/4 h-full overflow-y-auto overscroll-y-contain px-3 sm:px-5 py-3 [scrollbar-width:thin] [scrollbar-color:var(--hairline)_transparent] [-webkit-overflow-scrolling:touch]"
            >
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
}
