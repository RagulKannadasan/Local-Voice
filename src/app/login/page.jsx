"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  KeyRound, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [loginStep, setLoginStep] = useState('EMAIL'); // 'EMAIL' | 'OTP'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect straight to the community feed
    try {
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.isLoggedIn) {
          router.replace('/feed');
        }
      }
    } catch (e) {}
  }, [router]);

  const saveProfileAndRedirect = (userData) => {
    const profile = {
      isLoggedIn: true,
      email: userData.email,
      name: userData.name || 'Kavarappattu Member',
      username: userData.username || '',
      profilePhoto: userData.profilePhoto || '',
      phone: userData.phone || '',
      address: userData.address || '',
      role: userData.role || 'user',
      permissions: userData.permissions || []
    };
    localStorage.setItem('localVoice_profile', JSON.stringify(profile));
    router.replace('/feed');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage(t('Please enter a valid email address.', 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'));
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginStep('OTP');
      } else {
        setErrorMessage(data.error || t('Failed to send verification code.', 'சரிபார்ப்புக் குறியீட்டை அனுப்ப முடியவில்லை.'));
      }
    } catch (err) {
      setErrorMessage(t('Network error. Please try again.', 'இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput) {
      setErrorMessage(t('Please enter the 6-digit code.', '6 இலக்கக் குறியீட்டை உள்ளிடவும்.'));
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), otp: otpInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        saveProfileAndRedirect(data.user);
      } else {
        setErrorMessage(data.error || t('Invalid or expired code.', 'தவறான அல்லது காலாவதியான குறியீடு.'));
      }
    } catch (err) {
      setErrorMessage(t('Network error. Please try again.', 'இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        saveProfileAndRedirect(data.user);
      } else {
        setErrorMessage(data.error || t('Google sign in failed.', 'கூகுள் உள்நுழைவு தோல்வியடைந்தது.'));
      }
    } catch (err) {
      setErrorMessage(t('Network error during Google sign in.', 'கூகுள் உள்நுழைவில் பிழை ஏற்பட்டது.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-[var(--accent-contrast)]">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-[var(--hairline)]">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-[14px] font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("Back to Kavarappattu", "முகப்புக்குத் திரும்பு")}</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="h-8 px-2.5 rounded-[var(--r-control)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[12px] font-bold text-[var(--accent)] border border-[var(--hairline)] transition-colors"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-[var(--r-control)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-2)] flex items-center justify-center border border-[var(--hairline)] transition-colors"
          >
            {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4 text-[var(--accent)]" />}
          </button>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--hairline)] rounded-[var(--r-card)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] mx-auto flex items-center justify-center font-bold text-xl shadow-[var(--shadow-lift)]">
              K
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] pt-1">
              {t("Welcome to Kavarappattu", "காவராப்பட்டுவிற்கு நல்வரவு")}
            </h1>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
              {t(
                "Sign in to post village updates, report civic issues, and vote in community polls.",
                "ஊர் செய்திகளை பகிரவும், புகார்களை தெரிவிக்கவும், வாக்கெடுப்பில் பங்கேற்கவும் உள்நுழையவும்."
              )}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--r-control)] text-red-600 dark:text-red-400 text-[12px] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {loginStep === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">
                  {t("Email Address", "மின்னஞ்சல் முகவரி")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-3)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--text-3)] text-[14px] border border-[var(--hairline)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[14px] shadow-[var(--shadow-lift)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t("Send One-Time Code", "சரிபார்ப்புக் குறியீடு அனுப்பு")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification Form */}
          {loginStep === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">
                    {t("Enter 6-Digit Code", "6 இலக்க குறியீடு")}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setLoginStep('EMAIL'); setErrorMessage(''); }}
                    className="text-[12px] text-[var(--accent)] hover:underline"
                  >
                    {t("Change Email", "மாற்று")}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--text-3)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--text-3)] text-[16px] font-mono tracking-widest border border-[var(--hairline)] focus:outline-none focus:border-[var(--accent)] transition-colors text-center"
                    autoFocus
                  />
                </div>
                <span className="block text-[11px] text-[var(--text-3)]">
                  {t(`Sent to ${emailInput}`, `${emailInput} முகவரிக்கு அனுப்பப்பட்டது`)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[14px] shadow-[var(--shadow-lift)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t("Verify & Enter Portal", "சரிபார்த்து தளத்திற்குள் செல்")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[var(--hairline)]" />
            <span className="bg-[var(--surface-1)] px-3 text-[11px] text-[var(--text-3)] uppercase tracking-wider relative z-10">
              {t("Or continue with", "அல்லது")}
            </span>
          </div>

          {/* Google Sign In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMessage(t('Google sign in failed.', 'கூகுள் உள்நுழைவு தோல்வியடைந்தது.'))}
              theme={theme === 'dark' ? 'filled_black' : 'outline'}
              shape="pill"
              text="continue_with"
            />
          </div>

          {/* Guest Access Alternative */}
          <div className="pt-2 text-center border-t border-[var(--hairline)]">
            <Link
              href="/feed"
              className="text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors inline-flex items-center space-x-1"
            >
              <span>{t("Explore as Guest without signing in", "உள்நுழையாமல் விருந்தினராக தொடரவும்")}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
