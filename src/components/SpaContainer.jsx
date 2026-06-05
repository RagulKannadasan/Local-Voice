"use client";

import { useState, useEffect } from 'react';
import { useTab } from '@/lib/TabContext';
import FeedView from '@/components/views/FeedView';
import AnnouncementsView from '@/components/views/AnnouncementsView';
import ComplaintsView from '@/components/views/ComplaintsView';
import ProfileView from '@/components/views/ProfileView';

export default function SpaContainer({ children }) {
  const { isSpaMode, activeTab } = useTab();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, we MUST return exactly what Next.js expects 
  // (the actual page content) to ensure perfect hydration and SEO!
  if (!isSpaMode || !mounted) {
    return <>{children}</>;
  }

  return (
    <div className="overflow-hidden w-full relative h-full">
      <div 
        className="flex transition-transform duration-300 ease-out h-full" 
        style={{ width: '400%', transform: `translateX(-${activeTab * 25}%)` }}
      >
        <div className="w-1/4 h-full"><FeedView /></div>
        <div className="w-1/4 h-full"><AnnouncementsView /></div>
        <div className="w-1/4 h-full"><ComplaintsView /></div>
        <div className="w-1/4 h-full"><ProfileView /></div>
      </div>
    </div>
  );
}
