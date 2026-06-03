"use client";

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Edit3, LogOut, FileText, Settings, Loader2, Camera } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/lib/LanguageContext';

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
  const { t } = useLanguage();

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

  if (!profile.isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('Welcome to Local Voice', 'உள்ளூர் குரலுக்கு வரவேற்கிறோம்')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('Join your Kavarappattu community', 'கவரப்பட்டு சமூகத்தில் இணையுங்கள்')}</p>
        </div>

        {loginStep === 'EMAIL' ? (
          <form onSubmit={handleSendOtp} className="w-full max-w-sm bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Email Address', 'மின்னஞ்சல் முகவரி')}</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-blue-600 text-white font-medium py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Send Login Code', 'உள்நுழைவு குறியீட்டை அனுப்பு')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full max-w-sm bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Code sent to <strong>{emailInput}</strong></p>
              <button type="button" onClick={() => setLoginStep('EMAIL')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">Change email</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Enter 6-Digit OTP', '6 இலக்க OTP-ஐ உள்ளிடவும்')}</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-xl tracking-widest font-bold"
                placeholder="------"
                required
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-blue-600 text-white font-medium py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70">
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-900"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-full p-1 shadow-md">
                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400 overflow-hidden relative">
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0)
                  )}
                </div>
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
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
              <button onClick={() => setIsEditing(true)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input name="name" value={profile.name} onChange={handleChange} className="w-full font-bold text-xl p-2 bg-transparent text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <div>
                <input name="username" value={profile.username || ''} onChange={handleChange} placeholder="Username (e.g. ragul99)" className={clsx("w-full text-gray-600 dark:text-gray-400 p-2 bg-transparent border rounded-lg focus:ring-2 focus:outline-none", usernameStatus === 'TAKEN' || usernameStatus === 'INVALID' ? "border-red-500 focus:ring-red-500" : usernameStatus === 'AVAILABLE' ? "border-green-500 focus:ring-green-500" : "border-gray-200 dark:border-gray-700 focus:ring-blue-500")} />
                {usernameStatus === 'CHECKING' && <p className="text-xs text-blue-500 mt-1 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Checking availability...</p>}
                {usernameStatus === 'AVAILABLE' && <p className="text-xs text-green-500 mt-1 font-medium">Username is available!</p>}
                {usernameStatus === 'TAKEN' && <p className="text-xs text-red-500 mt-1 font-medium">Username is already taken.</p>}
                {usernameStatus === 'INVALID' && <p className="text-xs text-red-500 mt-1 font-medium">3-20 chars, lowercase letters, numbers, underscores only.</p>}
              </div>
              <input name="email" type="email" value={profile.email} disabled className="w-full text-gray-500 dark:text-gray-500 p-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg opacity-60 cursor-not-allowed" title="Email cannot be changed" />
              <input name="phone" value={profile.phone} onChange={handleChange} className="w-full text-gray-600 dark:text-gray-400 p-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <input name="address" value={profile.address} onChange={handleChange} className="w-full text-gray-600 dark:text-gray-400 p-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <div className="flex space-x-2 pt-2">
                <button onClick={handleSave} disabled={isSaving} className="flex-1 flex justify-center items-center bg-blue-600 text-white font-medium py-2 rounded-xl disabled:opacity-70">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Save', 'சேமி')}
                </button>
                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-xl disabled:opacity-70">{t('Cancel', 'ரத்து செய்')}</button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h1>
              {profile.username && <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-1">@{profile.username}</p>}
              {!profile.username && <p className="text-amber-500 dark:text-amber-400 font-medium text-xs mt-1 bg-amber-50 dark:bg-amber-900/20 py-1 px-2 rounded-lg inline-block">Set a unique username to post!</p>}
              <div className="mt-4 space-y-3">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm">{profile.address}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats/Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-3 transition-colors">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('My Posts', 'என் பதிவுகள்')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">0</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-3 transition-colors">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
            <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('Complaints', 'புகார்கள்')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">0</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        {(profile.role === 'admin' || profile.role === 'super_admin') && (
          <a href="/admin" className="w-full flex items-center space-x-3 p-4 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-800">
            <Settings className="w-5 h-5" />
            <span className="font-medium">{t('Admin Portal', 'நிர்வாகி போர்டல்')}</span>
          </a>
        )}
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 p-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('Logout', 'வெளியேறு')}</span>
        </button>
      </div>
    </div>
  );
}
