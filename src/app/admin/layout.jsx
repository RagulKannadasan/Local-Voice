"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  AlertCircle, 
  Users, 
  ArrowLeft, 
  Megaphone, 
  BarChart2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Languages, 
  Sparkles 
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasAnnouncementPerm, setHasAnnouncementPerm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setUserProfile(profile);
      if (profile.role === 'super_admin') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setHasAnnouncementPerm(true);
      } else if (profile.role === 'admin') {
        setIsAdmin(true);
        if ((profile.permissions || []).includes('manage_announcements')) {
          setHasAnnouncementPerm(true);
        }
      } else {
        router.push('/');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!isAdmin) {
    return null;
  }

  const adminLinks = [
    { 
      name: t('Dashboard', 'முகப்பு பலகை'), 
      href: '/admin', 
      icon: LayoutDashboard 
    },
    { 
      name: t('Complaints', 'புகார்கள்'), 
      href: '/admin/complaints', 
      icon: AlertCircle 
    },
  ];

  if (hasAnnouncementPerm) {
    adminLinks.push({ 
      name: t('Announcements', 'அறிவிப்புகள்'), 
      href: '/admin/announcements', 
      icon: Megaphone 
    });
    adminLinks.push({ 
      name: t('Polls', 'கருத்துக் கணிப்புகள்'), 
      href: '/admin/polls', 
      icon: BarChart2 
    });
  }

  if (isSuperAdmin) {
    adminLinks.push({ 
      name: t('Users', 'பயனர்கள்'), 
      href: '/admin/users', 
      icon: Users 
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--surface-1)]/90 backdrop-blur-md border-b border-[var(--hairline)] z-40 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
            aria-label="Exit admin to public app"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[var(--accent)] to-amber-300 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-contrast)]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight">
                {language === 'ta' ? 'காவராப்பட்டு' : 'Kavarappattu'}
              </span>
              <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider block -mt-0.5">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Mobile Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors flex items-center space-x-1"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 fixed top-0 left-0 h-screen bg-[var(--surface-1)] border-r border-[var(--hairline)] z-50 flex-col transition-colors">
        {/* Brand Banner */}
        <div className="p-5 border-b border-[var(--hairline)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-contrast)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight leading-tight truncate">
                {language === 'ta' ? 'காவராப்பட்டு' : 'Kavarappattu'}
              </h2>
              <span className="text-[11px] font-medium text-[var(--text-3)] block -mt-0.5">
                {t('Admin Management', 'நிர்வாக மையம்')}
              </span>
            </div>
          </div>
          
          <div className="mt-3.5 flex items-center justify-between bg-[var(--surface-2)] px-2.5 py-1.5 rounded-xl border border-[var(--hairline)]">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-semibold text-[var(--text-2)] truncate">
                {userProfile?.name || 'Administrator'}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
              {isSuperAdmin ? 'Super' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-[var(--text-3)] uppercase">
            {t('Navigation', 'வழிகாட்டல்')}
          </div>
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={clsx(
                  "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
                  isActive 
                    ? "bg-[var(--accent)]/12 text-[var(--text)] font-semibold shadow-sm border border-[var(--accent)]/20" 
                    : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Icon className={clsx("w-5 h-5 flex-shrink-0", isActive ? "text-[var(--accent)]" : "text-[var(--text-3)]")} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-[var(--hairline)] space-y-2 bg-[var(--surface-1)]">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors"
            >
              <Languages className="w-4 h-4 text-[var(--accent)]" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-[var(--accent)]" />
                  <span>{t('Light', 'வெளிச்சம்')}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[var(--accent)]" />
                  <span>{t('Dark', 'இருட்டு')}</span>
                </>
              )}
            </button>
          </div>

          <Link 
            href="/"
            className="flex items-center justify-center space-x-2 w-full p-2.5 rounded-xl text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--hairline)]"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--accent)]" />
            <span>{t('Back to Community', 'பொது தளத்திற்குச் செல்')}</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface-1)]/95 backdrop-blur-md border-t border-[var(--hairline)] z-50 flex items-center justify-around px-2 pb-safe">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all",
                isActive 
                  ? "text-[var(--accent)] font-semibold" 
                  : "text-[var(--text-3)] hover:text-[var(--text)]"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
