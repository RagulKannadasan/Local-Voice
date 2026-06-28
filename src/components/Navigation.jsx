"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, User, Moon, Sun, Languages, Megaphone, Plus, Bell, Search } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname.startsWith('/admin')) {
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
      
      // Also apply slide animation classes manually for view transition if Next.js handles it natively
      // But since we are using a slider, we don't need CSS view transition classes anymore! The slider handles the animation.
    }
  };

  const checkIsActive = (href) => {
    const idx = spaRoutes?.indexOf(href);
    if (idx !== undefined && idx !== -1 && isSpaMode) {
      return activeTab === idx;
    }
    return pathname === href || (pathname.startsWith(href) && href !== '/');
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0a0a0a] flex justify-around items-center h-16 z-50 pb-safe">
        {mobileLinks.slice(0, 2).map((link) => {
          const Icon = link.icon;
          const isActive = checkIsActive(link.href);
          return (
            <Link key={link.name} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="flex flex-col items-center justify-center w-full h-full">
              <Icon className={clsx("w-6 h-6", isActive ? "text-blue-800 dark:text-sky-500" : "text-gray-500 dark:text-gray-400")} />
              <span className={clsx("text-[10px] mt-1 font-medium", isActive ? "text-blue-800 dark:text-sky-500" : "text-gray-500 dark:text-gray-400")}>
                {t(link.name, link.ta)}
              </span>
            </Link>
          );
        })}

        {/* Center Floating Action Button */}
        <Link href="/post/new" className="flex flex-col items-center justify-center px-2 -mt-5 relative z-10">
          <div className="bg-blue-600 dark:bg-sky-500 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 dark:shadow-sky-500/20 transition-transform active:scale-95 border-4 border-white dark:border-[#0a0a0a]">
            <Plus className="w-6 h-6 stroke-[2.5px]" />
          </div>
        </Link>

        {mobileLinks.slice(2).map((link) => {
          const Icon = link.icon;
          const isActive = checkIsActive(link.href);
          return (
            <Link key={link.name} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="flex flex-col items-center justify-center w-full h-full">
              <Icon className={clsx("w-6 h-6", isActive ? "text-blue-800 dark:text-sky-500" : "text-gray-500 dark:text-gray-400")} />
              <span className={clsx("text-[10px] mt-1 font-medium", isActive ? "text-blue-800 dark:text-sky-500" : "text-gray-500 dark:text-gray-400")}>
                {t(link.name, link.ta)}
              </span>
            </Link>
          );
        })}
      </nav>

      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 h-screen fixed top-0 left-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Local Voice</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kavarappattu</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {allLinks.map((link) => {
            const Icon = link.icon;
            const isActive = checkIsActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
                  isActive ? "bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{t(link.name, link.ta)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{mounted && theme === 'dark' ? t('Light Mode', 'வெளிச்சம்') : t('Dark Mode', 'இருட்டு')}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <Languages className="w-5 h-5" />
            <span className="font-medium">{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Settings Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-gray-800 flex justify-between items-center px-5 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-0.5"></div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Local Voice</h1>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Kavarappattu</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/search" className="p-2 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          <Link href="/notifications" className="p-2 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
            <Bell className="w-5 h-5" />
          </Link>
        </div>
      </div>
      {/* Spacer for mobile top bar */}
      <div className="md:hidden h-14 w-full"></div>
    </>
  );
}
