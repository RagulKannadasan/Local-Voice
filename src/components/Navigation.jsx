"use client";

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BarChart2, User, Moon, Sun, Languages, Megaphone, Plus, Bell } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/LanguageContext';

export default function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

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

  const handleTransition = (targetPath) => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) {
      document.documentElement.classList.remove('slide-forward', 'slide-backward');
      return;
    }
    
    const tabOrder = ['/feed', '/announcements', '/post/new', '/complaints', '/profile'];
    const currentIndex = tabOrder.findIndex(path => pathname.startsWith(path) || pathname === path);
    const targetIndex = tabOrder.findIndex(path => targetPath.startsWith(path) || targetPath === path);
    
    document.documentElement.classList.remove('slide-forward', 'slide-backward');
    
    if (currentIndex !== -1 && targetIndex !== -1 && currentIndex !== targetIndex) {
      if (targetIndex > currentIndex) {
        document.documentElement.classList.add('slide-forward');
      } else {
        document.documentElement.classList.add('slide-backward');
      }
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 z-50 pb-safe">
        {mobileLinks.slice(0, 2).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
          return (
            <Link key={link.name} href={link.href} onClick={() => handleTransition(link.href)} className="flex flex-col items-center justify-center w-full h-full">
              <Icon className={clsx("w-6 h-6", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")} />
              <span className={clsx("text-[10px] mt-1 font-medium", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")}>
                {t(link.name, link.ta)}
              </span>
            </Link>
          );
        })}

        {/* Center Floating Action Button */}
        <Link href="/post/new" onClick={() => handleTransition('/post/new')} className="flex flex-col items-center justify-center px-2">
          <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 transform -translate-y-4 border-4 border-white dark:border-gray-900 transition-transform active:scale-95">
            <Plus className="w-6 h-6" />
          </div>
        </Link>

        {mobileLinks.slice(2).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
          return (
            <Link key={link.name} href={link.href} onClick={() => handleTransition(link.href)} className="flex flex-col items-center justify-center w-full h-full">
              <Icon className={clsx("w-6 h-6", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")} />
              <span className={clsx("text-[10px] mt-1 font-medium", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")}>
                {t(link.name, link.ta)}
              </span>
            </Link>
          );
        })}
      </nav>

      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen fixed top-0 left-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Local Voice</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kavarappattu</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {allLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
                  isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{mounted && theme === 'dark' ? t('Light Mode', 'வெளிச்சம்') : t('Dark Mode', 'இருட்டு')}</span>
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Languages className="w-5 h-5" />
            <span className="font-medium">{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Settings Bar (Only visible on mobile to toggle theme/lang since sidebar is hidden) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center px-4 z-40">
        <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">Local Voice</h1>
        <div className="flex items-center space-x-2">
          <Link href="/notifications" className="p-2 text-gray-600 dark:text-gray-300 relative">
            <Bell className="w-5 h-5" />
            {/* Notification Badge Example: */}
            {/* <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </Link>
          <button onClick={toggleLanguage} className="p-2 text-gray-600 dark:text-gray-300">
            <span className="font-bold text-sm">{language === 'en' ? 'த' : 'En'}</span>
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-600 dark:text-gray-300">
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {/* Spacer for mobile top bar */}
      <div className="md:hidden h-14 w-full"></div>
    </>
  );
}
