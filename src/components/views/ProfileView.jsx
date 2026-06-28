"use client";

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Edit3, LogOut, FileText, Settings, Loader2, Camera, Moon, Sun, Languages } from 'lucide-react';
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
      setProfile(JSON.parse(saved));
    }
  }, []);

  // Sync profile data with backend whenever the Profile tab becomes active
  useEffect(() => {
    if (activeTab === 3) {
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
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
      alert('Network error while saving profile. Please check your internet connection.');
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
          name: data.user.name || 'Local Voice User',
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

  if (!profile.isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
        <div className="w-20 h-20 bg-blue-50 dark:bg-sky-900/20 border border-blue-200 dark:border-sky-900/50 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-blue-800 dark:text-sky-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Welcome to Local Voice', 'உள்ளூர் குரலுக்கு வரவேற்கிறோம்')}</h1>
          <p className="text-gray-500 mt-2">{t('Join your Kavarappattu community', 'கவரப்பட்டு சமூகத்தில் இணையுங்கள்')}</p>
        </div>

        {loginStep === 'EMAIL' ? (
          <div className="w-full max-w-sm bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5 shadow-sm">
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setLoginError('Google Login Failed')}
                useOneTap
                theme={theme === 'dark' ? 'filled_black' : 'outline'}
                shape="pill"
                text="continue_with"
                width="100%"
              />
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-wider">Or continue with Email</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Email Address', 'மின்னஞ்சல் முகவரி')}</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 bg-transparent text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-800 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50 font-medium py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-sky-900/40 transition-colors disabled:opacity-70">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Send Login Code', 'உள்நுழைவு குறியீட்டை அனுப்பு')}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full max-w-sm bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Code sent to <strong className="text-gray-900 dark:text-white">{emailInput}</strong></p>
              <button type="button" onClick={() => setLoginStep('EMAIL')} className="text-xs text-blue-800 dark:text-sky-500 hover:underline mt-1">Change email</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Enter 6-Digit OTP', '6 இலக்க OTP-ஐ உள்ளிடவும்')}</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full p-2.5 bg-transparent text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-800 focus:outline-none text-center text-xl tracking-widest font-bold transition-colors"
                placeholder="------"
                required
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50 font-medium py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-sky-900/40 transition-colors disabled:opacity-70">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Verify & Login', 'சரிபார்த்து உள்நுழைக')}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="h-32 bg-gradient-to-b from-sky-100 dark:from-sky-900/40 to-transparent"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 bg-white dark:bg-[#0a0a0a] rounded-full p-1">
                <div className="w-full h-full bg-blue-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center text-3xl font-bold text-blue-800 dark:text-sky-500 overflow-hidden relative border border-blue-200 dark:border-sky-900/30">
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0)
                  )}
                </div>
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-2 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const MAX_WIDTH = 250;
                          const MAX_HEIGHT = 250;
                          let width = img.width;
                          let height = img.height;

                          if (width > height) {
                            if (width > MAX_WIDTH) {
                              height *= MAX_WIDTH / width;
                              width = MAX_WIDTH;
                            }
                          } else {
                            if (height > MAX_HEIGHT) {
                              width *= MAX_HEIGHT / height;
                              height = MAX_HEIGHT;
                            }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                          setProfile(prev => ({ ...prev, profilePhoto: compressedBase64 }));
                        };
                        img.src = event.target.result;
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="bg-transparent border border-gray-200 dark:border-gray-800 p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input name="name" value={profile.name} onChange={handleChange} className="w-full font-bold text-xl p-2 bg-transparent text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:border-blue-800 focus:outline-none" />
              <div>
                <input name="username" value={profile.username || ''} onChange={handleChange} placeholder="Username (e.g. ragul99)" className={clsx("w-full text-gray-900 dark:text-gray-300 p-2 bg-transparent border rounded-lg focus:outline-none", usernameStatus === 'TAKEN' || usernameStatus === 'INVALID' ? "border-red-200 dark:border-red-900/50 focus:border-red-500 text-red-600 dark:text-red-500" : usernameStatus === 'AVAILABLE' ? "border-blue-300 dark:border-sky-900/50 focus:border-blue-800 text-blue-800 dark:text-sky-500" : "border-gray-200 dark:border-gray-800 focus:border-blue-800")} />
                {usernameStatus === 'CHECKING' && <p className="text-xs text-blue-800 dark:text-sky-500 mt-1 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Checking availability...</p>}
                {usernameStatus === 'AVAILABLE' && <p className="text-xs text-blue-800 dark:text-sky-500 mt-1 font-medium">Username is available!</p>}
                {usernameStatus === 'TAKEN' && <p className="text-xs text-red-500 mt-1 font-medium">Username is already taken.</p>}
                {usernameStatus === 'INVALID' && <p className="text-xs text-red-500 mt-1 font-medium">3-20 chars, lowercase letters, numbers, underscores only.</p>}
              </div>
              <input name="email" type="email" value={profile.email} disabled className="w-full text-gray-500 dark:text-gray-600 p-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-lg opacity-60 cursor-not-allowed" title="Email cannot be changed" />
              <input name="phone" value={profile.phone} onChange={handleChange} className="w-full text-gray-900 dark:text-gray-300 p-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-lg focus:border-blue-800 focus:outline-none" />
              <input name="address" value={profile.address} onChange={handleChange} className="w-full text-gray-900 dark:text-gray-300 p-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-lg focus:border-blue-800 focus:outline-none" />
              <div className="flex space-x-2 pt-2">
                <button onClick={handleSave} disabled={isSaving} className="flex-1 flex justify-center items-center bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/50 font-medium py-2 rounded-xl disabled:opacity-70">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Save', 'சேமி')}
                </button>
                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 bg-transparent border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-70">{t('Cancel', 'ரத்து செய்')}</button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              {profile.username && <p className="text-blue-800 dark:text-sky-500 font-medium text-sm mt-1">@{profile.username}</p>}
              {!profile.username && <p className="text-amber-600 dark:text-amber-500 font-medium text-xs mt-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 py-1 px-2 rounded-lg inline-block">Set a unique username to post!</p>}
              <div className="mt-4 space-y-3">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-600" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-600" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-600" />
                  <span className="text-sm">{profile.address}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats/Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center space-x-3 transition-colors">
          <div className="p-3 bg-blue-50 dark:bg-sky-900/20 text-blue-800 dark:text-sky-500 border border-blue-200 dark:border-sky-900/30 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{t('My Posts', 'என் பதிவுகள்')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center space-x-3 transition-colors">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-900/30 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{t('Complaints', 'புகார்கள்')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>
      </div>

      {/* Settings / Preferences */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors mb-6">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-between p-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{mounted && theme === 'dark' ? t('Light Mode', 'வெளிச்சம்') : t('Dark Mode', 'இருட்டு')}</span>
          </div>
        </button>
        <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
          <div className="flex items-center space-x-3">
            <Languages className="w-5 h-5" />
            <span className="font-medium">{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        {(profile.role === 'admin' || profile.role === 'super_admin') && (
          <a href="/admin" className="w-full flex items-center space-x-3 p-4 text-blue-800 dark:text-sky-500 hover:bg-blue-50 dark:hover:bg-sky-900/10 transition-colors border-b border-gray-200 dark:border-gray-800">
            <Settings className="w-5 h-5" />
            <span className="font-medium">{t('Admin Portal', 'நிர்வாகி போர்டல்')}</span>
          </a>
        )}
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 p-4 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('Logout', 'வெளியேறு')}</span>
        </button>
      </div>
    </div>
  );
}
