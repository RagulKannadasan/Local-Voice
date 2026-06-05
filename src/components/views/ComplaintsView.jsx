"use client";

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Camera, MapPin, Tag, CheckCircle, Clock, Mail, Loader2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

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
      const profile = JSON.parse(saved);
      setCurrentUser(profile);
      setCurrentUser(JSON.parse(saved));
    }
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`/api/complaints?public=true`);
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints);
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
      let imageString = null;
      if (imageFile) {
        imageString = await new Promise((resolve, reject) => {
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

      // Guest Fallbacks
      const email = currentUser?.email || 'guest@localvoice.app';
      const name = currentUser?.name || 'Unauthorized User';
      const username = currentUser?.username || 'unauthorized';

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
          imageUrl: imageString
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

        // Trigger NodeMailer API in background
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_COMPLAINT',
            category,
            area,
            description,
            userEmail: email
          })
        });
      }
    } catch (error) {
      alert("Failed to submit complaint: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('Complaints', 'புகார்கள்')}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Track your submitted issues', 'உங்கள் புகார்களைக் கண்காணிக்கவும்')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? t('Cancel', 'ரத்து செய்') : t('+ New', '+ புதிய')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4 animate-in fade-in slide-in-from-top-4 transition-colors">
          <div className="grid grid-cols-2 gap-3">
            {['Roads', 'Water', 'Electricity', 'Sanitation', 'Others'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={clsx(
                  "p-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center space-x-2",
                  category === cat
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                )}
              >
                <Tag className="w-4 h-4" />
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MapPin className="w-4 h-4" />
              <span>{t('Area / Street Name', 'பகுதி / தெரு பெயர்')}</span>
            </label>
            <input
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:text-white"
              placeholder={t("e.g., North Street", "எ.கா., வடக்கு தெரு")}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              {t('Describe the issue', 'பிரச்சனையை விவரிக்கவும்')}
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors dark:text-white"
              placeholder={t("Please provide details...", "விவரங்களை வழங்கவும்...")}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              {t('Attach Photo (Optional)', 'புகைப்படம் (விருப்பமானவை)')}
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {imageString && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageString} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-blue-700 transition-colors flex justify-center items-center disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Submit Complaint', 'புகாரை சமர்ப்பி')}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-8">{t('No complaints found.', 'புகார்கள் ஏதுமில்லை.')}</p>
        ) : complaints.map((c) => (
          <div key={c._id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-md font-medium mb-2">
                  {c.category}
                </span>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{c.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-1">
                  <span>{t('By', 'பதிவிட்டவர்')} {c.userName}</span>
                  {c.userUsername && <span className="text-blue-500 font-medium">@{c.userUsername}</span>}
                </p>
              </div>
              <span className={clsx(
                "text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap",
                c.status === 'Pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                c.status === 'In Progress' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                c.status === 'Resolved' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              )}>
                {c.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{c.description}</p>

            {c.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[400px] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imageUrl} alt="Complaint Attachment" className="max-w-full max-h-[400px] object-contain rounded-xl" />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {new Date(c.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Timeline */}
            {c.timeline && c.timeline.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Activity Timeline</p>
                <div className="space-y-3">
                  {c.timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{event.action}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">By {event.author} on {new Date(event.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
