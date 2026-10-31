"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Languages, ArrowRight, Menu, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/LanguageContext';

export default function LandingNavbar() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    try {
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.isLoggedIn) setIsLoggedIn(true);
      }
    } catch (e) {}

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: t("About", "பற்றி"), href: "#about" },
    { label: t("Community", "சமூகம்"), href: "#posts" },
    { label: t("Civic Issues", "புகார்கள்"), href: "#complaints" },
    { label: t("Contacts", "தொடர்புகள்"), href: "#contacts" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled
          ? "bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--hairline)] shadow-[var(--shadow-card)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold text-base shadow-[var(--shadow-lift)] group-hover:scale-105 transition-transform">
            K
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[18px] tracking-[-0.02em] text-[var(--text)] leading-none">
              {t("Kavarappattu", "காவராப்பட்டு")}
            </span>
            <span className="text-[10px] text-[var(--text-3)] font-medium tracking-wide uppercase mt-0.5">
              {t("Community Platform", "சமூக தளம்")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="h-9 px-3 rounded-[var(--r-control)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] text-[13px] font-semibold flex items-center space-x-1.5 transition-colors border border-[var(--hairline)]"
          >
            <Languages className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-[var(--r-control)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors border border-[var(--hairline)]"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            )}
          </button>

          {/* Auth Flow Button: Sign In or Enter Portal */}
          {isLoggedIn ? (
            <Link
              href="/feed"
              className="h-9 px-4 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] text-[13px] font-semibold flex items-center space-x-1.5 shadow-[var(--shadow-lift)] active:scale-[0.98] transition-all"
            >
              <span>{t("Enter Portal", "தளத்திற்குச் செல்")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="h-9 px-3.5 rounded-[var(--r-control)] text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                {t("Sign In", "உள்நுழை")}
              </Link>
              <Link
                href="/feed"
                className="h-9 px-4 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] text-[13px] font-semibold flex items-center space-x-1.5 shadow-[var(--shadow-lift)] active:scale-[0.98] transition-all"
              >
                <span>{t("Explore Portal", "தளத்தை பார்")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="h-8 px-2.5 rounded-[var(--r-control)] bg-[var(--surface-1)] text-[12px] font-bold text-[var(--accent)] border border-[var(--hairline)]"
          >
            {language === 'en' ? 'த' : 'En'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-[var(--r-control)] bg-[var(--surface-1)] text-[var(--text-2)] flex items-center justify-center border border-[var(--hairline)]"
          >
            {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            className="w-9 h-9 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg)]/95 backdrop-blur-2xl border-b border-[var(--hairline)] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-[15px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] rounded-[var(--r-control)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-[var(--hairline)] flex flex-col gap-2">
            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-[14px] font-semibold text-[var(--text)] bg-[var(--surface-1)] rounded-[var(--r-control)] border border-[var(--hairline)]"
              >
                {t("Sign In", "உள்நுழை")}
              </Link>
            )}
            <Link
              href="/feed"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-[14px] font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] rounded-[var(--r-control)] shadow-[var(--shadow-lift)] flex items-center justify-center space-x-1.5"
            >
              <span>{isLoggedIn ? t("Enter Portal", "தளத்திற்குச் செல்") : t("Explore Community Feed", "முகப்புக்குச் செல்")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
