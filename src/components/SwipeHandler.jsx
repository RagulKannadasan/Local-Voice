"use client";

import { useState } from 'react';
import { useTab } from '@/lib/TabContext';

export default function SwipeHandler({ children }) {
  const { isSpaMode, activeTab, switchTab, spaRoutes } = useTab();
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !isSpaMode) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    
    // If the user scrolled vertically more than horizontally, ignore the swipe
    if (distanceY > Math.abs(distanceX)) return;

    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    if (isLeftSwipe) handleSwipe('Left');
    if (isRightSwipe) handleSwipe('Right');
  };

  const handleSwipe = (dir) => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;

    if (dir === 'Left' && activeTab < spaRoutes.length - 1) {
      switchTab(activeTab + 1);
    } else if (dir === 'Right' && activeTab > 0) {
      switchTab(activeTab - 1);
    }
  };

  return (
    <div 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd} 
      className="w-full min-h-screen outline-none"
    >
      {children}
    </div>
  );
}
