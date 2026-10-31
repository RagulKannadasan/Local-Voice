"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, User, Moon, Sun, Languages, Megaphone, Plus, Bell, Search, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/LanguageContext';
import { useTab } from '@/lib/TabContext';

export default function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { activeTab, switchTab, isSpaMode, spaRoutes } = useTab();

  const [mounted, setMounted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Check for unread alerts (e.g. profile incomplete)
    const checkUnread = () => {
      try {
        const saved = localStorage.getItem('localVoice_profile');
        if (saved) {
          const profile = JSON.parse(saved);
          if (!profile.username || !profile.phone || !profile.address) {
            setHasUnread(true);
            return;
          }
        } else {
          setHasUnread(true);
        }
      } catch (e) {
        setHasUnread(false);
      }
    };
    checkUnread();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  const allLinks = [
    { name: 'Feed', href: '/feed', icon: Home, ta: 'முகப்பு' },
    { name: 'Announcements', href: '/announcements', icon: Megaphone, ta: 'அறிவிப்பு' },
    { name: 'Notifications', href: '/notifications', icon: Bell, ta: 'அறிவிப்புகள்', desktopOnly: true },
    { name: 'Complaints', href: '/complaints', icon: FileText, ta: 'புகார்' },
    { name: 'Profile', href: '/profile', icon: User, ta: 'அக்கவுண்ட்' },
  ];

  const mobileLinks = allLinks.filter(l => !l.desktopOnly);

  const handleLinkClick = (e, href) => {
    const idx = spaRoutes?.indexOf(href);
    if (idx !== undefined && idx !== -1) {
      e.preventDefault();
      switchTab(idx);
    }
  };

  const checkIsActive = (href) => {
    const idx = spaRoutes?.indexOf(href);
    if (idx !== undefined && idx !== -1 && isSpaMode) {
      return activeTab === idx;
    }
    return pathname === href || (pathname.startsWith(href) && href !== '/');
  };

  const isPostNew = pathname === '/post/new';

  return (
    <>
      {/* Mobile Top App Bar */}
      {!isPostNew && (
        <>
          <header
            className={clsx(
              "md:hidden fixed top-0 left-0 right-0 h-14 z-40 px-4 transition-all duration-200 flex justify-between items-center",
              hasScrolled
                ? "bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--hairline)]"
                : "bg-[var(--bg)]/80 backdrop-blur-md"
            )}
          >
            {/* App Title: Kavarappattu */}
            <Link href="/feed" className="flex items-center group py-1">
              <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text)] leading-tight">
                {t("Kavarappattu", "காவராப்பட்டு")}
              </span>
            </Link>

            {/* Action Buttons: Search & Bell (Borderless 40x40 icon buttons) */}
            <div className="flex items-center space-x-1">
              <Link
                href="/search"
                aria-label={t("Search", "தேடு")}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.96] transition-all"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </Link>
              <Link
                href="/notifications"
                aria-label={t("Notifications", "அறிவிப்புகள்")}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.96] transition-all relative"
              >
                <Bell className="w-5 h-5" strokeWidth={1.5} />
                {hasUnread && (
                  <span
                    aria-label="Unread notifications"
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--accent)]"
                  />
                )}
              </Link>
            </div>
          </header>

          {/* Spacer for sticky header */}
          <div className="md:hidden h-14 w-full" aria-hidden="true" />
        </>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!isPostNew && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)]/85 backdrop-blur-2xl border-t border-[var(--hairline)] flex justify-around items-center h-16 pb-safe px-1"
        >
        {/* First 2 Tabs: Feed, Announcements */}
        {mobileLinks.slice(0, 2).map((link) => {
          const Icon = link.icon;
          const isActive = checkIsActive(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors group"
            >
              <div className="relative flex flex-col items-center">
                <Icon
                  className={clsx(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-[var(--accent)]" : "text-[var(--text-3)] group-hover:text-[var(--text-2)]"
                  )}
                  strokeWidth={1.5}
                />
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1 transition-all" />
                )}
              </div>
              <span
                className={clsx(
                  "text-[11px] font-medium leading-none tracking-tight transition-colors",
                  isActive ? "text-[var(--accent)] mt-0.5" : "text-[var(--text-3)] mt-1.5 group-hover:text-[var(--text-2)]"
                )}
              >
                {t(link.name, link.ta)}
              </span>
            </Link>
          );
        })}

        {/* Center Primary Action (52px slightly raised amber circle, scale 0.96 press) */}
        <div className="flex flex-col items-center justify-center px-1 -mt-4 relative z-10">
          <Link
            href="/post/new"
            aria-label={t("Create Post", "புதிய பதிவு")}
            className="w-[50px] h-[50px] rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center shadow-[var(--shadow-lift)] active:scale-[0.96] transition-transform"
          >
            <Plus className="w-6 h-6" strokeWidth={2} />
          </Link>
        </div>

        {/* Last 2 Tabs: Complaints, Profile */}
        {mobileLinks.slice(2).map((link) => {
          const Icon = link.icon;
          const isActive = checkIsActive(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors group"
            >
              <div className="relative flex flex-col items-center">
                <Icon
                  className={clsx(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-[var(--accent)]" : "text-[var(--text-3)] group-hover:text-[var(--text-2)]"
                  )}
                  strokeWidth={1.5}
                />
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1 transition-all" />
                )}
              </div>
              <span
                className={clsx(
                  "text-[11px] font-medium leading-none tracking-tight transition-colors",
                  isActive ? "text-[var(--accent)] mt-0.5" : "text-[var(--text-3)] mt-1.5 group-hover:text-[var(--text-2)]"
                )}
              >
                {t(link.name, link.ta)}
              </span>
            </Link>
          );
        })}
        </nav>
      )}

      {/* Desktop Navigation Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--surface-1)] border-r border-[var(--hairline)] h-screen fixed top-0 left-0 z-30">
        <div className="p-6 pb-4">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t("Kavarappattu", "காவராப்பட்டு")}
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {allLinks.map((link) => {
            const Icon = link.icon;
            const isActive = checkIsActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "flex items-center space-x-3 px-3.5 py-2.5 rounded-[var(--r-control)] text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                    : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span>{t(link.name, link.ta)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Create Post Button on Desktop */}
        <div className="px-4 py-3">
          <Link
            href="/post/new"
            className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] font-medium text-sm shadow-[var(--shadow-soft)] hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>{t("New Post", "புதிய பதிவு")}</span>
          </Link>
        </div>

        {/* Theme & Language Controls */}
        <div className="p-3 border-t border-[var(--hairline)] space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center space-x-3 px-3.5 py-2.5 w-full rounded-[var(--r-control)] text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.5} />
            )}
            <span>
              {mounted && theme === 'dark' ? t('Light Mode', 'வெளிச்சம்') : t('Dark Mode', 'இருட்டு')}
            </span>
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-3 px-3.5 py-2.5 w-full rounded-[var(--r-control)] text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Languages className="w-4 h-4" strokeWidth={1.5} />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
