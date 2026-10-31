"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Bell, AlertCircle, Megaphone, CheckCircle2, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (!profile.username || !profile.phone || !profile.address) {
          setProfileIncomplete(true);
        }
      } catch (e) {}
    } else {
      setProfileIncomplete(true);
    }
  }, []);

  let notifications = [];

  if (profileIncomplete) {
    notifications.unshift({
      id: 'profile-incomplete',
      type: 'alert',
      title: t('Complete Your Profile', 'சுயவிவரத்தை நிறைவு செய்யவும்'),
      message: t(
        'Add your username, phone, and street address to post in the feed and track complaints.',
        'பதிவிடவும் புகார்களை கண்காணிக்கவும் உங்கள் பயனர்பெயர், தொலைபேசி மற்றும் முகவரியை சேர்க்கவும்.'
      ),
      time: t('Action Required', 'தேவைப்படும் செயல்'),
      read: false,
      icon: User,
      actionUrl: '/profile'
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <Link
            href="/feed"
            aria-label="Back to feed"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-[17px] font-semibold text-[var(--text)] tracking-tight">
            {t('Notifications', 'அறிவிப்புகள்')}
          </h1>
        </div>
      </div>

      {/* Notifications List or Empty State */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('No notifications yet', 'இன்னும் புதிய அறிவிப்புகள் இல்லை')}
          description={t(
            "We'll alert you here when new village announcements or responses to your issues arrive.",
            "புதிய பஞ்சாயத்து அறிவிப்புகள் வரும்போது இங்கு காண்பிக்கப்படும்."
          )}
          actionLabel={t('View Community Feed', 'முகப்புக்குச் செல்')}
          actionHref="/feed"
        />
      ) : (
        <div className="divide-y divide-[var(--hairline)] bg-[var(--surface-1)] rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)] overflow-hidden">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            const content = (
              <div
                key={notification.id}
                className="p-4 flex items-start space-x-3.5 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h3 className="font-semibold text-[14px] text-[var(--text)] leading-snug truncate">
                      {notification.title}
                    </h3>
                    <span className="text-[11px] text-[var(--accent)] font-medium whitespace-nowrap ml-2">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0 mt-2" />
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
