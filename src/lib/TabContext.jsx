"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const TabContext = createContext();

const SPA_ROUTES = ['/feed', '/announcements', '/complaints', '/profile'];

export function TabProvider({ children }) {
  const pathname = usePathname();
  const tabRefs = useRef([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // Calculate initial active tab based on current URL path.
  // We don't check typeof window here so the Server and Client match exactly!
  const [activeTab, setActiveTab] = useState(() => {
    const idx = SPA_ROUTES.indexOf(pathname);
    return idx !== -1 ? idx : 0;
  });

  const [isSpaMode, setIsSpaMode] = useState(() => {
    return SPA_ROUTES.includes(pathname);
  });

  // Sync state when pathname changes from outside (e.g. browser back/forward or regular links)
  useEffect(() => {
    const idx = SPA_ROUTES.indexOf(pathname);
    if (idx !== -1) {
      setIsSpaMode(true);
      setActiveTab(idx);
      // Update header elevation based on newly activated tab's scroll position
      const el = tabRefs.current[idx];
      setHasScrolled(el ? el.scrollTop > 10 : false);
    } else {
      setIsSpaMode(false);
      setHasScrolled(false);
    }
  }, [pathname]);

  const registerTabRef = (index, el) => {
    tabRefs.current[index] = el;
  };

  const scrollToTop = (index = activeTab) => {
    const el = tabRefs.current[index];
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const switchTab = (index) => {
    if (index < 0 || index >= SPA_ROUTES.length) return;
    
    // If clicking the ALREADY ACTIVE tab: smoothly scroll back to top (mobile app pattern)
    if (index === activeTab) {
      scrollToTop(index);
      return;
    }

    setActiveTab(index);
    // Push native history state without triggering a Next.js server payload fetch
    window.history.pushState(null, '', SPA_ROUTES[index]);

    // Immediately sync header shadow state to the target tab's scroll position
    const targetEl = tabRefs.current[index];
    setHasScrolled(targetEl ? targetEl.scrollTop > 10 : false);
  };

  const handleTabScroll = (index, e) => {
    if (index === activeTab) {
      setHasScrolled(e.target.scrollTop > 10);
    }
  };

  return (
    <TabContext.Provider value={{ 
      activeTab, 
      switchTab, 
      scrollToTop,
      registerTabRef,
      handleTabScroll,
      hasScrolled,
      setHasScrolled,
      isSpaMode, 
      spaRoutes: SPA_ROUTES 
    }}>
      {children}
    </TabContext.Provider>
  );
}

export const useTab = () => useContext(TabContext);
