"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Whenever navigating between pages (e.g. to /notifications, /post/new, /search, /login, /, etc.),
    // ensure the browser window is reset back to the top.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
