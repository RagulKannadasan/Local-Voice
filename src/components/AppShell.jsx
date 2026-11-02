"use client";

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import SwipeHandler from '@/components/SwipeHandler';
import SpaContainer from '@/components/SpaContainer';
import RightRail from '@/components/RightRail';
import { useTab } from '@/lib/TabContext';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { isSpaMode } = useTab();

  // Landing page (/), Login page (/login), and Admin (/admin) render full-width without portal navigation shell
  const isStandalonePage = pathname === '/' || pathname === '/login' || pathname.startsWith('/admin');

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <SwipeHandler>
        <main
          className={`md:ml-64 bg-[var(--bg)] transition-colors ${
            isSpaMode
              ? 'h-[calc(100dvh-3.5rem)] md:h-screen overflow-hidden'
              : 'pb-20 md:pb-8 min-h-screen'
          }`}
        >
          <div className="flex justify-center w-full h-full min-h-0">
            {/* Center Content Stream (Mobile: max-w-[480px], Desktop: up to 860px) */}
            <div
              className={`w-full max-w-[480px] md:max-w-[720px] lg:max-w-[800px] xl:max-w-[860px] lg:border-r lg:border-[var(--hairline)] flex-1 min-h-0 ${
                isSpaMode ? 'h-full overflow-hidden' : 'px-4 sm:px-6 md:px-8 py-5 min-h-screen'
              }`}
            >
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
