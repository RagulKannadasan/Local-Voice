"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Megaphone, 
  Vote, 
  Users, 
  RefreshCw, 
  Sparkles,
  MapPin,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminDashboard() {
  const { language, t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loadData = async (email) => {
    try {
      const res = await fetch(`/api/complaints?all=true&userEmail=${email}`);
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setCurrentUser(profile);
      if (profile.role === 'super_admin' || (profile.permissions || []).includes('manage_complaints')) {
        loadData(profile.email);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    if (currentUser?.email) {
      setIsRefreshing(true);
      loadData(currentUser.email);
    }
  };

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // SLA Calculation: Complaints pending for more than 3 days (72 hours)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const slaViolations = complaints.filter(c => 
    c.status === 'Pending' && new Date(c.createdAt) < threeDaysAgo
  );

  // Group by category
  const categoryCounts = complaints.reduce((acc, c) => {
    const cat = c.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const recentComplaints = complaints.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-3)] font-medium">
          {t('Loading administrative data...', 'நிர்வாக தரவு ஏற்றப்படுகிறது...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              {t('Command Dashboard', 'நிர்வாக முகப்பு')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
              {t('Live', 'நேரலை')}
            </span>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {t(
              'Real-time civic issues, resolution velocity, and village metrics for Kavarappattu.',
              'காவராப்பட்டு கிராமத்தின் நிகழ்நேர புகார்கள், தீர்வு வேகம் மற்றும் சேவை அளவீடுகள்.'
            )}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-1)] border border-[var(--hairline)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-all shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? t('Refreshing...', 'புதுப்பிக்கப்படுகிறது...') : t('Refresh Data', 'புதுப்பி')}</span>
        </button>
      </div>

      {/* SLA Alert Banner */}
      {slaViolations.length > 0 ? (
        <div className="rounded-2xl p-5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-red-700 dark:text-red-300">
                {t('SLA Overdue Warning (72h+)', 'சேவை காலக்கெடு எச்சரிக்கை (72+ மணி)')}
              </h3>
              <p className="text-xs sm:text-sm text-red-600/90 dark:text-red-400/90 mt-0.5">
                {t(
                  `${slaViolations.length} citizen complaint(s) have been pending for more than 3 days without status progression.`,
                  `${slaViolations.length} குடிமக்கள் புகார்கள் 3 நாட்களுக்கும் மேலாக எவ்வித முன்னேற்றமும் இன்றி நிலுவையில் உள்ளன.`
                )}
              </p>
            </div>
          </div>
          <Link
            href="/admin/complaints"
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm flex-shrink-0"
          >
            <span>{t('Resolve Now', 'உடனே தீர்க்க')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs sm:text-sm font-medium">
              {t(
                'Healthy SLA: All open citizen grievances are within the target 72-hour operational window.',
                'சிறப்பான செயல்திறன்: அனைத்து புகார்களும் 72 மணி நேர இலக்குக்குள் கண்காணிக்கப்படுகின்றன.'
              )}
            </p>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            {t('On Track', 'சரியான நிலை')}
          </span>
        </div>
      )}

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-4 sm:p-5 shadow-soft hover:border-[var(--accent)]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">
              {t('Total Reports', 'மொத்த புகார்கள்')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-2)]">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
              {total}
            </span>
            <span className="text-xs font-medium text-[var(--text-3)]">
              {t('logged', 'பதிவு')}
            </span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-4 sm:p-5 shadow-soft hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {t('Resolved', 'தீர்க்கப்பட்டவை')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {resolved}
            </span>
            <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">
              ({resolutionRate}%)
            </span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-4 sm:p-5 shadow-soft hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              {t('In Progress', 'நடவடிக்கையில்')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
              {inProgress}
            </span>
            <span className="text-xs font-medium text-[var(--text-3)]">
              {t('active', 'செயலில்')}
            </span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-4 sm:p-5 shadow-soft hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
              {t('Pending', 'நிலுவை')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[var(--accent)] tracking-tight">
              {pending}
            </span>
            <span className="text-xs font-medium text-[var(--text-3)]">
              {t('awaiting', 'காத்திருக்கிறது')}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Quick Hub Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-1 bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--text)] flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-[var(--accent)]" />
              {t('Issues by Category', 'வகைப்பாடு புள்ளிவிவரம்')}
            </h2>
            <span className="text-xs text-[var(--text-3)] font-medium">
              {Object.keys(categoryCounts).length} {t('types', 'வகைகள்')}
            </span>
          </div>

          {Object.keys(categoryCounts).length === 0 ? (
            <p className="text-xs text-[var(--text-3)] py-6 text-center">
              {t('No issues recorded yet.', 'இதுவரை புகார்கள் இல்லை.')}
            </p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / total) * 100) || 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[var(--text)]">{cat}</span>
                      <span className="text-[var(--text-3)] font-semibold">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Hub Navigation */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Complaints Hub */}
          <Link
            href="/admin/complaints"
            className="group bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft hover:shadow-lift hover:border-[var(--accent)]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                {t('Complaints Hub', 'புகார் மேலாண்மை')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1.5 leading-relaxed">
                {t(
                  'Update status, dispatch field teams, and post timeline events with instant email alerts.',
                  'புகார்களின் நிலையை மாற்றி, களப்பணியாளர்களை அனுப்பி, குடிமக்களுக்கு அறிவிக்கலாம்.'
                )}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
              <span>{pending} {t('Pending Needs Action', 'நிலுவை')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Announcements Hub */}
          <Link
            href="/admin/announcements"
            className="group bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft hover:shadow-lift hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text)] group-hover:text-amber-500 transition-colors">
                {t('Official Announcements', 'அரசு அறிவிப்புகள்')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1.5 leading-relaxed">
                {t(
                  'Broadcast emergency weather bulletins, power outages, and village council resolutions.',
                  'மின்வெட்டு, மழை எச்சரிக்கை மற்றும் பஞ்சாயத்து அறிவிப்புகளை வெளியிடலாம்.'
                )}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-amber-500">
              <span>{t('Broadcast New', 'புதிய அறிவிப்பு')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Polls Hub */}
          <Link
            href="/admin/polls"
            className="group bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft hover:shadow-lift hover:border-sky-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Vote className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text)] group-hover:text-sky-500 transition-colors">
                {t('Civic Polls', 'கருத்துக் கணிப்பு')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1.5 leading-relaxed">
                {t(
                  'Gather transparent village consensus on community projects and export voter analytics.',
                  'கிராம வளர்ச்சித் திட்டங்கள் குறித்த பொது மக்களின் கருத்துக்களைக் கண்டறியலாம்.'
                )}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-sky-500">
              <span>{t('Manage Polls', 'கணிப்புகளை நிர்வகி')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Users Hub (Super Admin) */}
          <Link
            href="/admin/users"
            className="group bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft hover:shadow-lift hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text)] group-hover:text-purple-500 transition-colors">
                {t('User & Role Access', 'பயனர் & பங்கு மேலாண்மை')}
              </h3>
              <p className="text-xs text-[var(--text-2)] mt-1.5 leading-relaxed">
                {t(
                  'Super Admin portal to assign community officers, manage roles, and review accounts.',
                  'அதிகாரிகள் நியமனம், அனுமதி பகிர்வு மற்றும் பயனர்களை நிர்வகிக்கும் தளம்.'
                )}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-purple-500">
              <span>{t('Manage Roles', 'பங்குகளை நிர்வகி')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Grievances Preview */}
      <div className="bg-[var(--surface-1)] border border-[var(--hairline)] rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {t('Recent Grievances', 'சமீபத்திய புகார்கள்')}
            </h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              {t('Latest 5 citizen submissions requiring oversight', 'கடைசி 5 புகார்களின் நிலை')}
            </p>
          </div>
          <Link
            href="/admin/complaints"
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center space-x-1"
          >
            <span>{t('View All', 'அனைத்தும்')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <p className="text-xs text-[var(--text-3)] py-8 text-center">
            {t('No complaints found.', 'புகார்கள் ஏதுமில்லை.')}
          </p>
        ) : (
          <div className="divide-y divide-[var(--hairline)]">
            {recentComplaints.map(c => (
              <div key={c._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full">
                      {c.category}
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--text)] truncate">
                      {c.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-[var(--text-3)] mt-1">
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {c.location}</span>
                    <span>•</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{c.userName}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    c.status === 'Resolved' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : c.status === 'In Progress'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {c.status}
                  </span>
                  <Link
                    href="/admin/complaints"
                    className="p-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
