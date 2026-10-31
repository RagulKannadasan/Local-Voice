"use client";

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Camera, MapPin, Tag, CheckCircle2, Clock, Mail, Loader2, FileText, AlertCircle, Plus, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import EmptyState from '@/components/EmptyState';
import { ListCardSkeleton } from '@/components/Skeleton';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);

  const [category, setCategory] = useState('Roads');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageString, setImageString] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        setCurrentUser(profile);
      } catch (e) {}
    }
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`/api/complaints?public=true`);
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageString(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !area) return;

    setIsSubmitting(true);

    try {
      let finalImageString = null;
      if (imageFile) {
        finalImageString = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
              const MAX_WIDTH = 600;
              const MAX_HEIGHT = 600;
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
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.src = reader.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const email = currentUser?.email || 'guest@localvoice.app';
      const name = currentUser?.name || 'Resident';
      const username = currentUser?.username || 'resident';

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${category} Issue at ${area}`,
          category,
          description,
          location: area,
          userEmail: email,
          userName: name,
          userUsername: username,
          imageUrl: finalImageString
        })
      });

      const data = await res.json();
      if (res.ok) {
        setComplaints([data.complaint, ...complaints]);
        setShowForm(false);
        setDescription('');
        setArea('');
        setImageFile(null);
        setImageString(null);
      }
    } catch (error) {
      alert("Failed to submit complaint: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Pending':
      default:
        return 'bg-amber-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Resolved':
        return t('Resolved', 'தீர்க்கப்பட்டது');
      case 'In Progress':
        return t('In Progress', 'நடவடிக்கையில்');
      case 'Pending':
      default:
        return t('Pending', 'நிலுவையில்');
    }
  };

  const categories = [
    { id: 'Roads', en: 'Roads', ta: 'சாலைகள்' },
    { id: 'Water', en: 'Water', ta: 'குடிநீர்' },
    { id: 'Electricity', en: 'Electricity', ta: 'மின்சாரம்' },
    { id: 'Sanitation', en: 'Sanitation', ta: 'சுகாதாரம்' },
    { id: 'Others', en: 'Others', ta: 'பிற' },
  ];

  return (
    <div className="space-y-5 pb-20">
      {/* Top Header & New Complaint Toggle */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-[17px] font-semibold text-[var(--text)] tracking-tight">
            {t('Complaints & Issues', 'பொதுமக்கள் புகார்கள்')}
          </h1>
          <p className="text-[13px] text-[var(--text-2)] mt-0.5">
            {t('Track community issues and Panchayat resolution.', 'புகார்களை பதிவு செய்து தீர்வை அறியுங்கள்.')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={clsx(
            "min-h-[44px] px-3.5 py-2 rounded-[var(--r-control)] text-[13px] font-medium transition-all active:scale-[0.97] flex items-center space-x-1.5",
            showForm
              ? "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold"
          )}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" strokeWidth={1.5} />
              <span>{t('Cancel', 'ரத்து')}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>{t('Report Issue', 'புகார் செய்')}</span>
            </>
          )}
        </button>
      </div>

      {/* New Complaint Form Card */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface-1)] p-4 rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)] space-y-4 animate-fade-up"
        >
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-2)] mb-2">
              {t('Category', 'பிரிவு')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-[var(--r-control)] text-[12px] font-medium transition-all active:scale-95",
                    category === cat.id
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold"
                      : "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                  )}
                >
                  {t(cat.en, cat.ta)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-1.5 text-[12px] font-medium text-[var(--text-2)] mb-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--text-3)]" strokeWidth={1.5} />
              <span>{t('Area / Street Name', 'பகுதி / தெரு பெயர்')} *</span>
            </label>
            <input
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-[var(--surface-2)] text-[var(--text)] text-[14px] rounded-[var(--r-control)] px-3.5 py-2.5 focus:outline-none transition-colors placeholder-[var(--text-3)]"
              placeholder={t("e.g., North Street / Mettu Palayam", "எ.கா., வடக்கு தெரு")}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-2)] mb-1">
              {t('Describe the issue', 'பிரச்சனையை விவரிக்கவும்')} *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--surface-2)] text-[var(--text)] text-[14px] rounded-[var(--r-control)] px-3.5 py-2.5 focus:outline-none transition-colors placeholder-[var(--text-3)] resize-none"
              placeholder={t("Provide clear details to help Panchayat inspect...", "விவரங்களை வழங்கவும்...")}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-2)] mb-1">
              {t('Photo (Optional)', 'புகைப்படம் (விருப்பத்தேர்வு)')}
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 px-3 py-2 rounded-[var(--r-control)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] cursor-pointer text-xs font-medium transition-colors">
                <Camera className="w-4 h-4" strokeWidth={1.5} />
                <span>{t('Choose Image', 'புகைப்படம் தேர்வு')}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {imageString && (
                <div className="relative w-10 h-10 rounded-[var(--r-control)] overflow-hidden bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageString} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] font-semibold text-[13px] rounded-[var(--r-control)] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('Submit Complaint', 'புகாரை சமர்ப்பி')
            )}
          </button>
        </form>
      )}

      {/* Complaints List */}
      {isLoading ? (
        <div className="space-y-3">
          <ListCardSkeleton />
          <ListCardSkeleton />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('No complaints filed yet', 'புகார்கள் எதுவும் பதிவு செய்யப்படவில்லை')}
          description={t('Report road damage, streetlights, or water supply issues directly to Panchayat authorities.', 'ஊரின் குறைகளை எளிதில் புகார் செய்யலாம்.')}
          actionLabel={t('Report an issue', 'புகார் செய்')}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div
              key={c._id}
              className="bg-[var(--surface-1)] p-4 rounded-[var(--r-card)] border border-[var(--hairline)] shadow-[var(--shadow-soft)] transition-colors"
            >
              <div className="flex justify-between items-start mb-2.5">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="inline-block text-[11px] font-medium text-[var(--text-3)] mb-1">
                    {c.category}
                  </span>
                  <h3 className="font-semibold text-[15px] text-[var(--text)] leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-[12px] text-[var(--text-2)] mt-0.5">
                    {t('By', 'பதிவிட்டவர்')} {c.userName}
                    {c.userUsername && <span className="ml-1 text-[var(--text-3)]">@{c.userUsername}</span>}
                  </p>
                </div>

                {/* Status chip: neutral surface-2 pill with small colored dot */}
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[11px] font-medium text-[var(--text-2)] whitespace-nowrap">
                  <span className={clsx("w-1.5 h-1.5 rounded-full", getStatusDotColor(c.status))} />
                  <span>{getStatusLabel(c.status)}</span>
                </div>
              </div>

              <p className="text-[14px] text-[var(--text-2)] leading-relaxed mb-3 whitespace-pre-wrap">
                {c.description}
              </p>

              {c.imageUrl && (
                <div className="mb-3 rounded-[var(--r-control)] overflow-hidden bg-[var(--surface-2)] max-h-[300px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt="Complaint photo"
                    className="w-full h-auto max-h-[300px] object-cover rounded-[var(--r-control)]"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[var(--text-3)] pt-2 border-t border-[var(--hairline)]">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" strokeWidth={1.5} />
                  <span>{c.location || 'Kavarappattu'}</span>
                </span>
                <time dateTime={c.createdAt}>
                  {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
