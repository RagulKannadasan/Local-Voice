"use client";

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import SwipeHandler from '@/components/SwipeHandler';
import SpaContainer from '@/components/SpaContainer';
import RightRail from '@/components/RightRail';

export default function AppShell({ children }) {
  const pathname = usePathname();

  // Landing page (/), Login page (/login), and Admin (/admin) render full-width without portal navigation shell
  const isStandalonePage = pathname === '/' || pathname === '/login' || pathname.startsWith('/admin');

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <SwipeHandler>
        <main className="md:ml-64 pb-20 md:pb-8 min-h-screen bg-[var(--bg)] transition-colors">
          <div className="flex justify-center w-full min-h-screen">
            {/* Center Content Stream (Mobile: max-w-[480px], Desktop: max-w-[640px]) */}
            <div className="w-full max-w-[480px] md:max-w-[640px] px-3 sm:px-5 py-3 min-h-screen lg:border-r lg:border-[var(--hairline)] flex-1">
              <SpaContainer>
                {children}
              </SpaContainer>
            </div>

            {/* Desktop Companion Sidebar (Locality, Helplines, Polls, Guidelines) */}
            <RightRail />
          </div>
        </main>
      </SwipeHandler>
    </>
  );
}
