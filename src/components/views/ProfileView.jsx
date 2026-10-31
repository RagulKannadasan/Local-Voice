"use client";

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Edit3, LogOut, FileText, Settings, Loader2, Camera, Moon, Sun, Languages, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/lib/LanguageContext';
import { useTab } from '@/lib/TabContext';
import { useTheme } from 'next-themes';
import { GoogleLogin } from '@react-oauth/google';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    profilePhoto: '',
    isLoggedIn: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
  const { activeTab } = useTab();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Login States
  const [loginStep, setLoginStep] = useState('EMAIL'); // 'EMAIL' or 'OTP'
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Username Availability States
  const [usernameStatus, setUsernameStatus] = useState(''); // 'CHECKING', 'AVAILABLE', 'TAKEN', 'INVALID'
  const checkTimeoutRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (activeTab === 3) {
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.email && parsed.isLoggedIn) {
            fetch(`/api/profile?email=${encodeURIComponent(parsed.email)}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.user) {
                  const updatedProfile = { ...parsed, ...data.user };
                  setProfile(updatedProfile);
                  localStorage.setItem('localVoice_profile', JSON.stringify(updatedProfile));
                }
              })
              .catch(err => console.error('Failed to sync profile:', err));
          }
        } catch (e) {}
      }
    }
  }, [activeTab]);

  const saveProfile = (data) => {
    setProfile(data);
    localStorage.setItem('localVoice_profile', JSON.stringify(data));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'username') {
      finalValue = value.toLowerCase();
    }
    setProfile({ ...profile, [name]: finalValue });

    if (name === 'username') {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      
      const newUsername = finalValue.trim();
      if (!newUsername) {
        setUsernameStatus('');
        return;
      }

      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(newUsername)) {
        setUsernameStatus('INVALID');
        return;
      }

      setUsernameStatus('CHECKING');
      checkTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/profile/check-username?username=${newUsername}&excludeEmail=${profile.email}`);
          const data = await res.json();
          setUsernameStatus(data.available ? 'AVAILABLE' : 'TAKEN');
        } catch (err) {
          setUsernameStatus('');
        }
      }, 500);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          username: profile.username,
          profilePhoto: profile.profilePhoto
        }),
      });
      const data = await res.json();
      if (res.ok) {
        saveProfile({ ...profile, ...data.user });
        setIsEditing(false);
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      alert('Network error while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    const emptyProfile = {
      name: '',
      email: '',
      phone: '',
      address: '',
      username: '',
      profilePhoto: '',
      isLoggedIn: false
    };
    setProfile(emptyProfile);
    localStorage.removeItem('localVoice_profile');
    setLoginStep('EMAIL');
    setEmailInput('');
    setOtpInput('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginStep('OTP');
      } else {
        setLoginError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setLoginError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput) return;
    setIsLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, otp: otpInput }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const loggedIn = {
          ...profile,
          isLoggedIn: true,
          email: data.user.email,
          name: data.user.name || 'Kavarappattu Member',
          username: data.user.username || '',
          profilePhoto: data.user.profilePhoto || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          role: data.user.role,
          permissions: data.user.permissions || []
        };
        saveProfile(loggedIn);
      } else {
        setLoginError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setLoginError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const loggedIn = {
          ...profile,
          isLoggedIn: true,
          email: data.user.email,
          name: data.user.name,
          username: data.user.username || '',
          profilePhoto: data.user.profilePhoto || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          role: data.user.role,
          permissions: data.user.permissions || []
        };
        saveProfile(loggedIn);
      } else {
        setLoginError(data.error || 'Google Login Failed');
      }
    } catch (err) {
      setLoginError('Network error during Google Login');
    } finally {
      setIsLoading(false);
    }
  };

  // Not Logged In View
  if (!profile.isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-2 py-6 space-y-6">
        <div className="w-16 h-16 bg-[var(--surface-2)] text-[var(--text)] rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-[var(--text-2)]" strokeWidth={1.5} />
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight">
            {t('Join Kavarappattu', 'காவராப்பட்டுவில் இணையுங்கள்')}
          </h2>
          <p className="text-[13px] text-[var(--text-2)] mt-1.5 leading-relaxed">
            {t('Log in to post updates, vote in panchayat polls, and track local issues.', 'ஊர் செய்திகளை பகிரவும், வாக்கெடுப்பில் கலந்துகொள்ளவும் உள்நுழையவும்.')}
          </p>
        </div>

        <div className="w-full max-w-sm bg-[var(--surface-1)] p-5 rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)] space-y-4">
          {loginError && (
            <div className="p-3 bg-red-500/10 text-red-500 text-[13px] rounded-[var(--r-control)] font-medium">
              {loginError}
            </div>
          )}

          {loginStep === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-2)] mb-1">
                  {t('Email Address', 'மின்னஞ்சல் முகவரி')}
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="resident@example.com"
                  className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !emailInput}
                className="w-full min-h-[44px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[13px] rounded-[var(--r-control)] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('Continue with Email', 'மின்னஞ்சல் மூலம் தொடரவும்')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-2)] mb-1">
                  {t('Enter OTP sent to', 'அனுப்பப்பட்ட OTP எண்')} {emailInput}
                </label>
                <input
                  type="text"
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--accent)] text-center tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !otpInput}
                className="w-full min-h-[44px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[13px] rounded-[var(--r-control)] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('Verify & Login', 'உள்நுழைக')}
              </button>

              <button
                type="button"
                onClick={() => setLoginStep('EMAIL')}
                className="w-full text-[12px] text-[var(--text-2)] hover:text-[var(--text)] py-1 text-center"
              >
                {t('Change Email', 'வேறு மின்னஞ்சல் பயன்படுத்த')}
              </button>
            </form>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--hairline)]" />
            </div>
            <div className="relative flex justify-center text-[11px] text-[var(--text-3)] uppercase tracking-wider">
              <span className="bg-[var(--surface-1)] px-2">{t('Or', 'அல்லது')}</span>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setLoginError('Google sign in failed')}
              shape="pill"
              size="medium"
            />
          </div>
        </div>
      </div>
    );
  }

  // Logged In Profile View
  return (
    <div className="space-y-5 pb-24">
      {/* Profile Header Card */}
      <div className="bg-[var(--surface-1)] p-5 rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
              {profile.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-[var(--text)] leading-snug">
                {profile.name || 'Resident'}
              </h2>
              <p className="text-[13px] text-[var(--text-2)]">
                {profile.username ? `@${profile.username}` : t('No username set', 'பயனர்பெயர் இல்லை')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-[var(--r-control)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[12px] font-medium text-[var(--text)] active:scale-[0.97] transition-all flex items-center space-x-1"
          >
            <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{isEditing ? t('Cancel', 'ரத்து') : t('Edit', 'மாற்று')}</span>
          </button>
        </div>

        {/* Profile Details or Edit Form */}
        {isEditing ? (
          <div className="space-y-3 pt-3 border-t border-[var(--hairline)]">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-2)] mb-1">
                {t('Full Name', 'முழுப் பெயர்')}
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-2)] mb-1">
                {t('Username', 'பயனர்பெயர்')}
              </label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleChange}
                placeholder="your_handle"
                className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              {usernameStatus === 'AVAILABLE' && (
                <span className="text-[11px] text-emerald-500 mt-1 block">✓ {t('Username is available', 'பயனர்பெயர் கிடைக்கிறது')}</span>
              )}
              {usernameStatus === 'TAKEN' && (
                <span className="text-[11px] text-red-500 mt-1 block">✗ {t('Username is already taken', 'பயனர்பெயர் பயன்பாட்டில் உள்ளது')}</span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-2)] mb-1">
                {t('Phone Number', 'கைபேசி எண்')}
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-2)] mb-1">
                {t('Address / Street', 'முகவரி / தெரு')}
              </label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                placeholder="East Street, Kavarappattu"
                className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-[var(--r-control)] px-3.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full min-h-[44px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[13px] rounded-[var(--r-control)] active:scale-[0.98] transition-all flex items-center justify-center mt-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('Save Changes', 'சேமிக்கவும்')}
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-3 border-t border-[var(--hairline)] text-[13px]">
            <div className="flex items-center space-x-2.5 text-[var(--text-2)] py-1">
              <Mail className="w-4 h-4 text-[var(--text-3)] flex-shrink-0" strokeWidth={1.5} />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center space-x-2.5 text-[var(--text-2)] py-1">
              <Phone className="w-4 h-4 text-[var(--text-3)] flex-shrink-0" strokeWidth={1.5} />
              <span>{profile.phone || t('No phone number added', 'கைபேசி எண் சேர்க்கப்படவில்லை')}</span>
            </div>
            <div className="flex items-center space-x-2.5 text-[var(--text-2)] py-1">
              <MapPin className="w-4 h-4 text-[var(--text-3)] flex-shrink-0" strokeWidth={1.5} />
              <span>{profile.address || 'Kavarappattu'}</span>
            </div>
          </div>
        )}
      </div>

      {/* App Preferences & Settings Card */}
      <div className="bg-[var(--surface-1)] p-4 rounded-[var(--r-card)] border border-[var(--hairline)] space-y-1">
        <h3 className="text-[12px] font-semibold text-[var(--text-3)] uppercase tracking-wider px-2 mb-2">
          {t('Preferences', 'அமைப்புகள்')}
        </h3>

        {/* Theme Switcher Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-[var(--r-control)] hover:bg-[var(--surface-2)] text-[13px] font-medium text-[var(--text)] transition-colors"
        >
          <div className="flex items-center space-x-3">
            {mounted && theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[var(--text-2)]" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4 text-[var(--text-2)]" strokeWidth={1.5} />
            )}
            <span>{t('Appearance', 'தோற்றம்')}</span>
          </div>
          <span className="text-[12px] text-[var(--text-2)]">
            {mounted && theme === 'dark' ? t('Dark', 'இருட்டு') : t('Light', 'வெளிச்சம்')}
          </span>
        </button>

        {/* Language Switcher Button */}
        <button
          onClick={toggleLanguage}
          className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-[var(--r-control)] hover:bg-[var(--surface-2)] text-[13px] font-medium text-[var(--text)] transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Languages className="w-4 h-4 text-[var(--text-2)]" strokeWidth={1.5} />
            <span>{t('Language', 'மொழி')}</span>
          </div>
          <span className="text-[12px] font-semibold text-[var(--accent)]">
            {language === 'en' ? 'தமிழ்' : 'English'}
          </span>
        </button>
      </div>

      {/* Logout Action */}
      <div className="pt-2 px-1">
        <button
          onClick={handleLogout}
          className="w-full min-h-[44px] flex items-center justify-center space-x-2 py-2.5 rounded-[var(--r-control)] text-red-500 bg-red-500/10 hover:bg-red-500/15 text-[13px] font-medium transition-colors active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span>{t('Log Out', 'வெளியேறு')}</span>
        </button>
      </div>
    </div>
  );
}
