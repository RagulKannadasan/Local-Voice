"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TabContext = createContext();

const SPA_ROUTES = ['/feed', '/announcements', '/complaints', '/profile'];

export function TabProvider({ children }) {
  const pathname = usePathname();
  
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
    } else {
      setIsSpaMode(false);
    }
  }, [pathname]);

  const switchTab = (index) => {
    if (index < 0 || index >= SPA_ROUTES.length) return;
    setActiveTab(index);
    // Push native history state without triggering a Next.js server payload fetch
    window.history.pushState(null, '', SPA_ROUTES[index]);
  };

  return (
    <TabContext.Provider value={{ activeTab, switchTab, isSpaMode, spaRoutes: SPA_ROUTES }}>
      {children}
    </TabContext.Provider>
  );
}

export const useTab = () => useContext(TabContext);
