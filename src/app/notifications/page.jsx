"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Bell, AlertCircle, Megaphone, CheckCircle2, User } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      // Profile is considered incomplete if username, phone, or address is missing
      if (!profile.username || !profile.phone || !profile.address) {
        setProfileIncomplete(true);
      }
    }
  }, []);

  // Base mock data for notifications
  let notifications = [];

  // Inject 'Profile Incomplete' notification if needed
  if (profileIncomplete) {
    notifications.unshift({
      id: 'profile-incomplete',
      type: 'alert',
      title: t('Complete Your Profile', 'உங்கள் சுயவிவரத்தை முழுமையாக்கவும்'),
      message: t('Please complete your profile details (username, phone, address) to fully participate in the community.', 'சமூகத்தில் முழுமையாகப் பங்கேற்க உங்கள் சுயவிவர விவரங்களை (பயனர்பெயர், தொலைபேசி, முகவரி) நிரப்பவும்.'),
      time: t('Action Required', 'செயல் தேவை'),
      read: false,
      icon: User,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      actionUrl: '/profile'
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-800 dark:text-sky-500" />
          {t('Notifications', 'அறிவிப்புகள்')}
        </h1>
        {notifications.length > 0 && (
          <button className="text-sm text-blue-800 dark:text-sky-500 font-medium hover:underline">
            {t('Mark all as read', 'அனைத்தையும் வாசித்ததாக குறிக்கவும்')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="bg-blue-50 dark:bg-sky-900/20 border border-blue-200 dark:border-sky-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-blue-800 dark:text-sky-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {t('No notifications yet', 'இன்னும் அறிவிப்புகள் இல்லை')}
          </h3>
          <p className="text-gray-500 text-sm">
            {t("We'll let you know when something new happens.", 'புதிய நிகழ்வுகள் ஏற்படும் போது உங்களுக்கு தெரிவிப்போம்.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            const content = (
              <div
                key={notification.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex gap-4 ${
                  !notification.read
                    ? 'bg-blue-50 dark:bg-sky-900/10 border-blue-200 dark:border-sky-900/30'
                    : 'bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-3 rounded-full h-fit flex-shrink-0 ${notification.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-sm sm:text-base ${
                      !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    !notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'
                  }`}>
                    {notification.message}
                  </p>
                </div>
                
                {!notification.read && (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                )}
              </div>
            );

            if (notification.actionUrl) {
              return (
                <Link href={notification.actionUrl} key={notification.id} className="block">
                  {content}
                </Link>
              );
            }
            return content;
          })}
        </div>
      )}
    </div>
  );
}
