"use client";

import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      if (profile.role === 'super_admin' || (profile.permissions || []).includes('manage_complaints')) {
        fetchData(profile.email);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchData = async (email) => {
    try {
      const res = await fetch(`/api/complaints?all=true&userEmail=${email}`);
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;

  // SLA Calculation: Complaints pending for more than 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const slaViolations = complaints.filter(c => 
    c.status === 'Pending' && new Date(c.createdAt) < threeDaysAgo
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-800 dark:text-sky-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Live Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time metrics from the Kavarappattu database.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{total}</span>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/50">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-500 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Resolved</span>
          </div>
          <span className="text-3xl font-bold text-green-700 dark:text-green-400">{resolved}</span>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/50">
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{pending}</span>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
          <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">{inProgress}</span>
        </div>
      </div>

      {slaViolations.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-900/50 flex items-start space-x-4 animate-pulse">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-bold">Service Level Alert</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {slaViolations.length} complaint(s) have been pending for more than 3 days. Please review them immediately.
            </p>
            <Link href="/admin/complaints" className="inline-block mt-3 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              Review Now
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Navigate to the Complaints tab to update statuses, add timeline actions, and trigger email notifications to users.</p>
      </div>
    </div>
  );
}
