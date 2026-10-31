"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  MapPin, 
  Users, 
  CheckCircle2, 
  FileText, 
  Megaphone, 
  Vote, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  Building2, 
  AlertCircle,
  Sparkles,
  Camera,
  ChevronRight
} from 'lucide-react';
import LandingNavbar from '@/components/LandingNavbar';
import { useLanguage } from '@/lib/LanguageContext';

export default function LandingPage() {
  const { t, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dbData, setDbData] = useState(null);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('localVoice_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.isLoggedIn) setIsLoggedIn(true);
      }
    } catch (e) {}

    const loadData = async () => {
      try {
        const res = await fetch('/api/landing');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDbData(data);
          }
        }
      } catch (err) {
        console.error("Failed to load landing data:", err);
      } finally {
        setIsLoadingDb(false);
      }
    };
    loadData();
  }, []);

  const stats = [
    { 
      label: t("Registered Residents", "பதிவுசெய்த ஊர் மக்கள்"), 
      value: dbData ? `${dbData.stats.residentsCount}` : (isLoadingDb ? "..." : "0"), 
      icon: Users 
    },
    { 
      label: t("Civic Complaints", "பதிவான புகார்கள்"), 
      value: dbData ? `${dbData.stats.totalComplaints}` : (isLoadingDb ? "..." : "0"), 
      icon: CheckCircle2 
    },
    { 
      label: t("Community Poll Votes", "பதிவான வாக்குகளின் எண்ணிக்கை"), 
      value: dbData ? `${dbData.stats.totalVotes}` : (isLoadingDb ? "..." : "0"), 
      icon: Vote 
    },
    { 
      label: t("Hyperlocal Platform", "உள்ளூர் இயங்குதளம்"), 
      value: "100%", 
      icon: ShieldCheck 
    },
  ];

  const pillars = [
    {
      icon: Megaphone,
      title: t("Village Social Feed", "உள்ளூர் செய்தி பகிர்வு"),
      desc: t(
        "Share agriculture tips, festival announcements, school achievements, and neighborhood updates directly with Kavarappattu residents.",
        "விவசாய ஆலோசனைகள், திருவிழா அறிவிப்புகள், பள்ளி சாதனைகள் மற்றும் ஊர் செய்திகளை மக்களுடன் நேரடியாக பகிருங்கள்."
      ),
      badge: t("Social Hub", "செய்திகள்")
    },
    {
      icon: FileText,
      title: t("Transparent Civic Grievances", "வெளிப்படையான கிராம புகார்கள்"),
      desc: t(
        "Report street lights, drinking water pipeline leaks, or road damages with photo evidence. Track real-time progress from submission to resolution.",
        "தெருவிளக்கு பழுது, குடிநீர் குழாய் உடைப்பு, சாலை சேதங்களை புகைப்படத்துடன் பதிவு செய்து அதன் தீர்வை கண்காணிக்கவும்."
      ),
      badge: t("Accountability", "நிர்வாகம்")
    },
    {
      icon: Vote,
      title: t("Panchayat Democracy & Polls", "கிராம ஜனநாயக வாக்கெடுப்பு"),
      desc: t(
        "Vote securely on village development decisions, festival planning, and public works. Make your voice count in local governance.",
        "ஊர் வளர்ச்சி பணிகள், திருவிழா ஏற்பாடுகள் மற்றும் மக்கள் நல திட்டங்களில் உங்கள் வாக்கை பாதுகாப்பாக பதிவு செய்யுங்கள்."
      ),
      badge: t("Democracy", "ஜனநாயகம்")
    }
  ];

  const complaintSteps = [
    {
      step: "01",
      title: t("Photo & Area Submission", "புகைப்படத்துடன் பதிவு"),
      desc: t("Snap a photo of the damaged road, leak, or dark street lamp and select the ward.", "பாதிக்கப்பட்ட இடம் மற்றும் புகைப்படத்தை இணைத்து புகாரை சமர்ப்பிக்கவும்.")
    },
    {
      step: "02",
      title: t("Panchayat Action", "பஞ்சாயத்து நடவடிக்கை"),
      desc: t("Ward members and officials review the complaint and dispatch maintenance staff.", "பஞ்சாயத்து உறுப்பினர்கள் புகாரை ஆய்வு செய்து ஊழியர்களை அனுப்பி பணியை தொடங்குவர்.")
    },
    {
      step: "03",
      title: t("Verified Resolution", "சரிபார்க்கப்பட்ட தீர்வு"),
      desc: t("Status is marked 'Resolved' with before/after confirmation visible to the village.", "பணி முடிவடைந்ததும் தீர்க்கப்பட்டது என உறுதி செய்யப்பட்டு பொதுவில் பகிரப்படும்.")
    }
  ];

  const contacts = [
    {
      category: t("Primary Health Centre (PHC)", "ஆரம்ப சுகாதார நிலையம்"),
      phone: "108 / 04372-232233",
      desc: t("24/7 Emergency medical assistance and ambulance", "24/7 அவசர மருத்துவ உதவி மற்றும் ஆம்புலன்ஸ்"),
      highlight: true
    },
    {
      category: t("TNEB Electricity Office", "மின்சார வாரிய அலுவலகம் (TNEB)"),
      phone: "1912 / 94987 94987",
      desc: t("Power cuts, transformer issues, line damages", "மின் தடை, மின்மாற்றி பழுது மற்றும் மின்கம்பி சேதங்கள்")
    },
    {
      category: t("Panchayat Office & Water Supply", "பஞ்சாயத்து & குடிநீர் விநியோகம்"),
      phone: "04372-232224",
      desc: t("Water supply schedule, sanitation, streetlight maintenance", "குடிநீர் விநியோகம், துப்புரவு மற்றும் தெருவிளக்கு பராமரிப்பு")
    },
    {
      category: t("Village Administrative Officer (VAO)", "கிராம நிர்வாக அலுவலர் (VAO)"),
      phone: "04372-232100",
      desc: t("Land records, certificates, revenue matters", "நில ஆவணங்கள், சான்றிதழ்கள் மற்றும் வருவாய் விவரங்கள்")
    }
  ];

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen flex flex-col font-sans selection:bg-[var(--accent)] selection:text-[var(--accent-contrast)]">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Landing Page Content */}
      <main className="flex-1 pt-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32 px-4 sm:px-6">
          {/* Subtle Ambient Radial Glow */}
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-[var(--accent)]" 
            aria-hidden="true" 
          />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
            {/* Locality Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-1)] border border-[var(--hairline)] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.5} />
              <span className="text-[12px] font-semibold text-[var(--text-2)] tracking-wide">
                {t("Official Hyperlocal Platform • Kavarappattu", "அதிகாரப்பூர்வ உள்ளூர் தளம் • காவராப்பட்டு")}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] text-[var(--text)] leading-[1.08]">
              {t("Our", "நம்ம")}{" "}
              <span className="text-[var(--accent)]">
                {t("Kavarappattu", "காவராப்பட்டு")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[16px] sm:text-[19px] text-[var(--text-2)] max-w-2xl mx-auto leading-relaxed">
              {t(
                "The unified civic and social hub for Kavarappattu residents. Share updates, report village issues directly to the panchayat, vote on community decisions, and stay connected.",
                "காவராப்பட்டு மக்களின் ஒருங்கிணைந்த சமூக மற்றும் சேவை தளம். செய்திகளை பகிருங்கள், ஊர் பிரச்சினைகளை பஞ்சாயத்திடம் தெரிவியுங்கள், வாக்கெடுப்பில் பங்கேற்று ஊரை மேம்படுத்துங்கள்."
              )}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              {isLoggedIn ? (
                <Link
                  href="/feed"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[15px] shadow-[var(--shadow-lift)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  <span>{t("Enter Community Portal", "தளத்திற்குச் செல்")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[15px] shadow-[var(--shadow-lift)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{t("Sign In / Join", "உள்நுழை / இணை")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/feed"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-[var(--r-control)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text)] font-semibold text-[15px] border border-[var(--hairline)] transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{t("Explore Village Feed", "முகப்பை பார்")}</span>
                  </Link>
                </>
              )}
              <Link
                href="/complaints"
                className="w-full sm:w-auto px-6 py-3.5 rounded-[var(--r-control)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] font-medium text-[15px] border border-[var(--hairline)] transition-all flex items-center justify-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                <span>{t("Report an Issue", "புகார் பதிவு")}</span>
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-12 max-w-4xl mx-auto">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] flex flex-col items-center justify-center text-center shadow-sm"
                  >
                    <Icon className="w-5 h-5 text-[var(--accent)] mb-2" strokeWidth={1.5} />
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                      {stat.value}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--text-2)] mt-1">
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-20 md:py-28 px-4 sm:px-6 bg-[var(--surface-1)]/50 border-y border-[var(--hairline)]">
          <div className="max-w-6xl mx-auto space-y-14">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[12px] font-bold text-[var(--accent)] tracking-wider uppercase">
                {t("Community Pillars", "அடிப்படை நோக்கங்கள்")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
                {t("Built for Kavarappattu, Governed by Residents", "காவராப்பட்டு மக்களுக்காக, மக்களால் உருவாக்கப்பட்டது")}
              </h2>
              <p className="text-[15px] text-[var(--text-2)] leading-relaxed">
                {t(
                  "Empowering every household with direct, real-time connectivity to panchayat leadership and community initiatives.",
                  "ஒவ்வொரு குடும்பத்தையும் பஞ்சாயத்து நிர்வாகம் மற்றும் கிராம வளர்ச்சி பணிகளுடன் நேரடியாக இணைக்கும் நவீன தளம்."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-[var(--r-card)] bg-[var(--bg)] border border-[var(--hairline)] shadow-sm hover:border-[var(--accent)]/40 transition-colors space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center">
                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        {pillar.badge}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
                        {pillar.title}
                      </h3>
                      <p className="text-[14px] text-[var(--text-2)] leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMMUNITY POSTS SHOWCASE */}
        <section id="posts" className="py-20 md:py-28 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[12px] font-bold text-[var(--accent)] tracking-wider uppercase">
                  {t("Village Voice", "ஊர் செய்திகள்")}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
                  {t("What's Happening in Kavarappattu", "நமது ஊரில் என்ன நடக்கிறது?")}
                </h2>
                <p className="text-[15px] text-[var(--text-2)] max-w-xl">
                  {t("Real-time public updates shared by village members, farmers, and youth.", "ஊர் மக்கள், விவசாயிகள் மற்றும் இளைஞர்கள் பகிரும் உண்மை தகவல்கள்.")}
                </p>
              </div>

              <Link
                href="/feed"
                className="inline-flex items-center space-x-1.5 text-[14px] font-semibold text-[var(--accent)] hover:underline"
              >
                <span>{t("Open Full Feed", "முழு முகப்பை பார்")}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Real Posts from MongoDB */}
            {dbData?.recentPosts && dbData.recentPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {dbData.recentPosts.map((post) => (
                  <div
                    key={post._id}
                    className="p-5 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center font-bold text-xs">
                            {post.author ? post.author.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="block text-[13px] font-semibold text-[var(--text)] leading-tight">
                              {post.author}
                            </span>
                            <span className="text-[11px] text-[var(--text-3)]">
                              {post.username ? `@${post.username} • ` : ''}
                              {new Date(post.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[14px] text-[var(--text)] leading-relaxed">
                        &ldquo;{post.content}&rdquo;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--text-3)]">
                      <span>{post.likesCount} {t("likes", "விருப்பங்கள்")}</span>
                      <span>{post.commentsCount} {t("comments", "கருத்துகள்")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] mx-auto flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {t("No posts yet in Kavarappattu", "காவராப்பட்டில் இன்னும் பதிவுகள் இல்லை")}
                  </h3>
                  <p className="text-[13px] text-[var(--text-2)] max-w-md mx-auto leading-relaxed">
                    {t(
                      "Be the first resident to share village news, agriculture updates, or festival announcements.",
                      "நமது ஊரின் முதல் செய்தியை அல்லது விவசாய தகவலை ஊர் மக்களுடன் பகிர்ந்து கொள்ளுங்கள்."
                    )}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/feed"
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[13px] shadow-[var(--shadow-lift)] transition-all"
                  >
                    <span>{t("Post on Community Feed", "முகப்பில் பதியுங்கள்")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COMPLAINTS & CIVIC ACTION */}
        <section id="complaints" className="py-20 md:py-28 px-4 sm:px-6 bg-[var(--surface-1)]/50 border-y border-[var(--hairline)]">
          <div className="max-w-5xl mx-auto space-y-14">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[12px] font-bold text-[var(--accent)] tracking-wider uppercase">
                {t("Civic Transparency", "பொது நலன் & தீர்வுகள்")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
                {t("How Grievance Tracking Works", "புகார்கள் எவ்வாறு தீர்க்கப்படுகின்றன?")}
              </h2>
              <p className="text-[15px] text-[var(--text-2)] leading-relaxed">
                {t(
                  "No more forgotten complaints. Every reported issue receives a public tracking ID and status updates until verified resolved.",
                  "மறக்கப்பட்ட புகார்களுக்கு இடமில்லை. சமர்ப்பிக்கப்படும் ஒவ்வொரு பிரச்சினைக்கும் எண் வழங்கப்பட்டு தீர்வு வரை கண்காணிக்கப்படுகிறது."
                )}
              </p>
            </div>

            {/* Real complaints from database */}
            {dbData?.recentComplaints && dbData.recentComplaints.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">
                    {t("Live Grievance Tracker from Kavarappattu", "நேரடி கிராமப் புகார்கள்")}
                  </span>
                  <Link href="/complaints" className="text-[13px] font-medium text-[var(--accent)] hover:underline">
                    {t("View All Complaints", "அனைத்து புகார்களும்")} &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbData.recentComplaints.map((c) => (
                    <div
                      key={c._id}
                      className="p-5 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--accent)]">
                            {c.category}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                              c.status === 'Resolved'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : c.status === 'In Progress'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>

                        <h4 className="font-bold text-[15px] text-[var(--text)] line-clamp-1">
                          {c.title}
                        </h4>
                        <p className="text-[13px] text-[var(--text-2)] line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--text-3)]">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-[var(--accent)]" />
                          <span className="line-clamp-1">{c.location}</span>
                        </span>
                        <span>{new Date(c.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {complaintSteps.map((step, i) => (
                <div
                  key={i}
                  className="p-6 rounded-[var(--r-card)] bg-[var(--bg)] border border-[var(--hairline)] space-y-3 relative overflow-hidden"
                >
                  <span className="text-4xl font-black text-[var(--accent)]/20 absolute top-4 right-4 select-none">
                    {step.step}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)] pt-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[var(--text-2)] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 sm:p-8 rounded-[var(--r-card)] bg-[var(--surface-2)] border border-[var(--hairline)] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <h4 className="text-lg font-bold text-[var(--text)]">
                  {t("Have an issue in your street?", "உங்கள் தெருவில் ஏதேனும் பழுதா?")}
                </h4>
                <p className="text-[13px] text-[var(--text-2)]">
                  {t("Report drinking water leaks, broken street lights, or uncollected garbage instantly.", "குடிநீர் குழாய் உடைப்பு, தெருவிளக்கு பழுது அல்லது துப்புரவு புகாரை உடனே பதிவு செய்யுங்கள்.")}
                </p>
              </div>

              <Link
                href="/complaints"
                className="px-6 py-3 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[14px] shadow-[var(--shadow-lift)] flex-shrink-0 flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>{t("File a Complaint", "புகார் பதிவு")}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* REAL COMMUNITY POLL SPOTLIGHT */}
        {dbData?.activePoll && (
          <section id="polls" className="py-16 md:py-24 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto p-6 sm:p-10 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] shadow-[var(--shadow-card)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-[var(--accent)] text-[12px] font-bold uppercase tracking-wider">
                  <Vote className="w-4 h-4" />
                  <span>{t("Live Community Poll from Database", "நேரடி ஊர் வாக்கெடுப்பு")}</span>
                </div>
                <span className="text-[12px] font-semibold text-[var(--text-3)]">
                  {dbData.activePoll.totalVotes} {t("votes recorded", "வாக்குகள் பதிவாகியுள்ளன")}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-snug">
                  {dbData.activePoll.question}
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {dbData.activePoll.options.map((opt) => {
                  const pct = dbData.activePoll.totalVotes > 0 
                    ? Math.round((opt.votes / dbData.activePoll.totalVotes) * 100) 
                    : 0;
                  return (
                    <div key={opt.id} className="p-3.5 rounded-[var(--r-control)] bg-[var(--surface-2)]/60 border border-[var(--hairline)] space-y-2">
                      <div className="flex items-center justify-between text-[13px] font-semibold">
                        <span className="text-[var(--text)]">{opt.text}</span>
                        <span className="text-[var(--accent)] font-bold">{pct}% ({opt.votes})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                        <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--hairline)]">
                <span className="text-[12px] text-[var(--text-3)]">
                  {t("Verified resident voting with tamper-proof tallying", "சரிபார்க்கப்பட்ட வாக்களிப்பு முறை")}
                </span>
                <Link
                  href="/announcements"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--r-control)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[13px] shadow-[var(--shadow-lift)] transition-all flex items-center justify-center space-x-2"
                >
                  <span>{t("Participate in Poll", "வாக்களியுங்கள்")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CONTACTS & PANCHAYAT DIRECTORY */}
        <section id="contacts" className="py-20 md:py-28 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-14">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[12px] font-bold text-[var(--accent)] tracking-wider uppercase">
                {t("Emergency & Directory", "அவசர தொடர்பு & வழிகாட்டி")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
                {t("Panchayat & Essential Helplines", "பஞ்சாயத்து மற்றும் அத்தியாவசிய எண்கள்")}
              </h2>
              <p className="text-[15px] text-[var(--text-2)] leading-relaxed">
                {t(
                  "Verified contact details for Kavarappattu village administration and emergency public services.",
                  "காவராப்பட்டு கிராம நிர்வாகம் மற்றும் அவசர சேவைகளின் சரிபார்க்கப்பட்ட தொடர்பு எண்கள்."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contacts.map((contact, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-[var(--r-card)] border transition-all ${
                    contact.highlight 
                      ? "bg-[var(--surface-1)] border-[var(--accent)]/50 shadow-md"
                      : "bg-[var(--surface-1)] border-[var(--hairline)]"
                  } flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <PhoneCall className="w-4 h-4 text-[var(--accent)]" />
                      <h4 className="font-bold text-[16px] text-[var(--text)]">
                        {contact.category}
                      </h4>
                    </div>
                    <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                      {contact.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between">
                    <span className="text-[15px] font-mono font-bold text-[var(--accent)]">
                      {contact.phone}
                    </span>
                    <a
                      href={`tel:${contact.phone.split('/')[0].trim()}`}
                      className="px-3 py-1 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[12px] font-semibold text-[var(--text)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors"
                    >
                      {t("Call Now", "அழை")}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Office Location Banner */}
            <div className="p-6 rounded-[var(--r-card)] bg-[var(--surface-1)] border border-[var(--hairline)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-center md:text-left">
                <Building2 className="w-8 h-8 text-[var(--accent)] flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <span className="block font-semibold text-[15px] text-[var(--text)]">
                    {t("Kavarappattu Village Panchayat Office", "காவராப்பட்டு கிராம பஞ்சாயத்து அலுவலகம்")}
                  </span>
                  <span className="text-[13px] text-[var(--text-2)] flex items-center mt-0.5">
                    <Clock className="w-3.5 h-3.5 mr-1 text-[var(--text-3)]" />
                    {t("Orathanadu Taluk, Thanjavur Dist · Mon-Sat (9:30 AM – 5:30 PM)", "ஒரத்தநாடு வட்டம், தஞ்சாவூர் மாவட்டம் · திங்கள் – சனி (9:30 – 5:30)")}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href="https://www.google.com/maps/place/Kavarappattu,+Tamil+Nadu/@10.6393587,79.3431364,3068m/data=!3m1!1e3!4m6!3m5!1s0x3baab285a2951c79:0xeffa85f7ec447ca0!8m2!3d10.6378874!4d79.3462699!16s%2Fg%2F1q5bmfdmw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] font-medium text-[13px] border border-[var(--hairline)] transition-colors flex items-center space-x-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)] hover:text-inherit" />
                  <span>{t("Google Maps", "வரைபடம்")}</span>
                </a>
                <Link
                  href="/complaints"
                  className="px-4 py-2.5 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] font-medium text-[13px] border border-[var(--hairline)] transition-colors"
                >
                  {t("File Grievance", "புகார் பதிவு")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--hairline)] bg-[var(--surface-1)] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold text-sm">
                K
              </div>
              <span className="font-bold text-[17px] text-[var(--text)]">
                {t("Kavarappattu", "காவராப்பட்டு")}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-3)] text-center md:text-left max-w-sm">
              {t(
                "A dedicated hyperlocal civic network empowering Kavarappattu village community through transparent connectivity.",
                "காவராப்பட்டு கிராம மக்களுக்கான வெளிப்படையான உள்ளூர் சமூக மற்றும் சேவை தளம்."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-[var(--text-2)]">
            <Link href="/feed" className="hover:text-[var(--text)] transition-colors">
              {t("Community Feed", "முகப்பு")}
            </Link>
            <Link href="/announcements" className="hover:text-[var(--text)] transition-colors">
              {t("Announcements", "அறிவிப்புகள்")}
            </Link>
            <Link href="/complaints" className="hover:text-[var(--text)] transition-colors">
              {t("Complaints", "புகார்கள்")}
            </Link>
            <Link href="/login" className="hover:text-[var(--text)] transition-colors">
              {t("Sign In", "உள்நுழை")}
            </Link>
            <a href="#about" className="hover:text-[var(--text)] transition-colors">
              {t("About", "பற்றி")}
            </a>
          </div>

          <div className="text-[12px] text-[var(--text-3)] text-center md:text-right">
            <span>© 2026 Kavarappattu Community. {t("All rights reserved.", "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
