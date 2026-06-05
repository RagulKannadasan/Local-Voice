"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SwipeHandler({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;
  const tabOrder = ['/feed', '/announcements', '/complaints', '/profile'];

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
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

    const currentIndex = tabOrder.findIndex(path => pathname?.startsWith(path) || pathname === path);
    if (currentIndex === -1) return;

    if (dir === 'Left' && currentIndex < tabOrder.length - 1) {
      document.documentElement.classList.remove('slide-backward');
      document.documentElement.classList.add('slide-forward');
      router.push(tabOrder[currentIndex + 1]);
    } else if (dir === 'Right' && currentIndex > 0) {
      document.documentElement.classList.remove('slide-forward');
      document.documentElement.classList.add('slide-backward');
      router.push(tabOrder[currentIndex - 1]);
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
