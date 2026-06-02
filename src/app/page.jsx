"use client";

import Link from 'next/link';
import { ArrowRight, MessageSquareHeart, HandHeart, CheckCircle, Globe2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 space-y-16">

      {/* Hero Section */}
      <div className="relative w-full max-w-4xl text-center space-y-8 z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-pulse translate-x-20"></div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 relative z-20">
          {t("Local Voice", "உள்ளூர் குரல்")}
        </h1>

        <p className="mt-4 text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium relative z-20">
          {t("Connecting Kavarappattu. Your community, your voice, your platform.", "கவரப்பட்டுவை இணைக்கிறது. உங்கள் சமூகம், உங்கள் குரல், உங்கள் தளம்.")}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 relative z-20">
          <Link
            href="/feed"
            className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
          >
            <span>{t("Join the Community", "சமூகத்தில் இணையுங்கள்")}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/complaints"
            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full font-bold text-lg shadow-md border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 w-full sm:w-auto hover:-translate-y-1"
          >
            {t("Report an Issue", "பிரச்சனையை புகார் செய்")}
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-20">

        {/* Feature 1 */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <MessageSquareHeart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t("Social Feed", "சமூக பதிவுகள்")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("Share updates, photos, and connect with your neighbors instantly.", "உடனடி தகவல்களை பகிர்ந்து, உங்கள் அண்டை வீட்டாருடன் இணையுங்கள்.")}
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HandHeart className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t("Direct Impact", "நேரடி தாக்கம்")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("Report local issues directly to authorities and track their resolution status.", "உள்ளூர் பிரச்சனைகளை அதிகாரிகளிடம் புகார் செய்து தீர்வை அறியுங்கள்.")}
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t("Opinion Polls", "கருத்துக்கணிப்புகள்")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("Have your say in village decisions through secure and transparent voting.", "பாதுகாப்பான வாக்கெடுப்பு மூலம் கிராம முடிவுகளில் உங்கள் கருத்தை பதிவு செய்யுங்கள்.")}
          </p>
        </div>

      </div>
    </div>
  );
}
