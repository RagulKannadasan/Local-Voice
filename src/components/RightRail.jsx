"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  PhoneCall, 
  Sun, 
  Vote, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles, 
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function RightRail() {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState('');
  const [activePoll, setActivePoll] = useState(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Fetch real active poll from MongoDB
    fetch('/api/landing')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activePoll) {
          setActivePoll(data.activePoll);
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, [language]);

  const emergencyContacts = [
    {
      title: t("Primary Health Center", "ஆரம்ப சுகாதார நிலையம்"),
      phone: "04372-232233",
      desc: t("24/7 Ambulance & First Aid", "24/7 அவசர ஊர்தி")
    },
    {
      title: t("TNEB Electricity Help", "மின்வாரிய உதவி மையம்"),
      phone: "94987 94987",
      desc: t("Power cuts & Transformer faults", "மின் தடை புகார்கள்")
    },
    {
      title: t("Panchayat Secretary", "பஞ்சாயத்து செயலர்"),
      phone: "04372-232224",
      desc: t("Office Hours: 9:30 AM - 5:30 PM", "அலுவலக நேரம்: 9:30 - 5:30")
    }
  ];

  return (
    <aside 
      aria-label="Desktop Community Sidebar"
      className="hidden lg:block w-80 sticky top-0 h-screen overflow-y-auto px-4 py-4 space-y-4 flex-shrink-0"
    >
      {/* 1. Locality & Weather Overview Card */}
      <div className="p-4 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <a 
              href="https://www.google.com/maps/place/Kavarappattu,+Tamil+Nadu/@10.6393587,79.3431364,3068m/data=!3m1!1e3!4m6!3m5!1s0x3baab285a2951c79:0xeffa85f7ec447ca0!8m2!3d10.6378874!4d79.3462699!16s%2Fg%2F1q5bmfdmw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-[var(--accent)] text-[12px] font-semibold tracking-wide uppercase hover:underline"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t("Thanjavur Dist, TN", "தஞ்சாவூர் மாவட்டம்")}</span>
            </a>
            <h2 className="text-[17px] font-bold text-[var(--text)] mt-0.5">
              {t("Kavarappattu", "காவராப்பட்டு")}
            </h2>
            <p className="text-[12px] text-[var(--text-3)]">
              {t("PIN: 614625 · Orathanadu Taluk", "அஞ்சல்: 614625 · ஒரத்தநாடு வட்டம்")}
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center space-x-1 text-[11px] font-semibold">
            <Sun className="w-3 h-3 text-[var(--accent)]" />
            <span>31°C</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[12px] text-[var(--text-2)]">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[var(--text-3)]" />
            <span>{currentTime || "10:30 AM"}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("Active Network", "செயலில் உள்ளது")}</span>
          </span>
        </div>
      </div>

      {/* 2. Active Civic Poll Spotlight */}
      <div className="p-4 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[var(--accent)] text-[12px] font-semibold uppercase tracking-wide">
            <Vote className="w-3.5 h-3.5" />
            <span>{t("Active Community Poll", "நடப்பு வாக்கெடுப்பு")}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] font-medium">
            {t("Live", "செயலில்")}
          </span>
        </div>

        {activePoll ? (
          <>
            <div>
              <h4 className="text-[13px] font-semibold text-[var(--text)] leading-snug line-clamp-3">
                {activePoll.question}
              </h4>
            </div>

            {/* Top option progress bar */}
            {activePoll.options && activePoll.options.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-[var(--accent)] font-semibold line-clamp-1 pr-2">
                    {activePoll.options[0].text} ({activePoll.totalVotes > 0 ? Math.round((activePoll.options[0].votes / activePoll.totalVotes) * 100) : 0}%)
                  </span>
                  <span className="text-[var(--text-3)] flex-shrink-0">
                    {activePoll.totalVotes} {t("votes", "வாக்குகள்")}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div 
                    className="h-full bg-[var(--accent)] rounded-full transition-all" 
                    style={{ 
                      width: `${activePoll.totalVotes > 0 ? Math.round((activePoll.options[0].votes / activePoll.totalVotes) * 100) : 0}%` 
                    }} 
                  />
                </div>
              </div>
            )}

            <Link
              href="/announcements"
              className="flex items-center justify-between w-full pt-1 text-[12px] font-medium text-[var(--accent)] hover:underline"
            >
              <span>{t("Cast Your Vote", "வாக்களியுங்கள்")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </>
        ) : (
          <p className="text-[12px] text-[var(--text-3)] py-2">
            {t("No active community polls at the moment.", "தற்போது தீவிர வாக்கெடுப்புகள் ஏதுமில்லை.")}
          </p>
        )}
      </div>

      {/* 3. Quick Helpline Shortcuts */}
      <div className="p-4 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[var(--text)] text-[13px] font-bold">
            <Building2 className="w-4 h-4 text-[var(--accent)]" />
            <span>{t("Emergency & Helplines", "அவசர உதவி எண்கள்")}</span>
          </div>
          <span className="text-[11px] text-[var(--text-3)] font-mono">24/7</span>
        </div>

        <div className="space-y-2">
          {emergencyContacts.map((contact, i) => (
            <div
              key={i}
              className="p-2.5 rounded-[var(--r-control)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5 pr-2">
                <span className="block text-[12px] font-semibold text-[var(--text)] line-clamp-1">
                  {contact.title}
                </span>
                <span className="block text-[11px] text-[var(--text-3)]">
                  {contact.desc}
                </span>
              </div>
              <a
                href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                aria-label={`Call ${contact.title}`}
                className="w-8 h-8 rounded-full bg-[var(--surface-1)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-sm border border-[var(--hairline)] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Hyperlocal Civic Guidelines */}
      <div className="p-3.5 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] space-y-1.5 text-[11px] text-[var(--text-3)] leading-relaxed">
        <div className="flex items-center space-x-1.5 text-[var(--text-2)] font-semibold text-[12px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t("Civic Community Guidelines", "கிராம விதிகள்")}</span>
        </div>
        <p>
          {t(
            "Kavarappattu is a verified village community network. Please maintain respect and share constructive, factual updates.",
            "காவராப்பட்டு சரிபார்க்கப்பட்ட உள்ளூர் தளம். மரியாதையுடனும் உண்மைத் தகவல்களுடனும் பதியவும்."
          )}
        </p>
        <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[10px] text-[var(--text-3)]">
          <span>© 2026 Kavarappattu</span>
          <Link href="/complaints" className="hover:text-[var(--accent)] transition-colors">
            {t("Report Issue", "புகார்")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
