"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, AlertCircle, Users, Settings, ArrowLeft, Megaphone, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasAnnouncementPerm, setHasAnnouncementPerm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('localVoice_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      if (profile.role === 'super_admin') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setHasAnnouncementPerm(true);
      } else if (profile.role === 'admin') {
        setIsAdmin(true);
        if ((profile.permissions || []).includes('manage_announcements')) {
          setHasAnnouncementPerm(true);
        }
      } else {
        // Not authorized, redirect
        router.push('/');
      }
    } else {
      router.push('/profile');
    }
  }, [router]);

  if (!isAdmin) {
    return null; // Don't render anything while redirecting
  }

  const adminLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Complaints', href: '/admin/complaints', icon: AlertCircle },
  ];

  if (hasAnnouncementPerm) {
    adminLinks.push({ name: 'Announcements', href: '/admin/announcements', icon: Megaphone });
    adminLinks.push({ name: 'Polls', href: '/admin/polls', icon: BarChart2 });
  }

  if (isSuperAdmin) {
    adminLinks.push({ name: 'Users', href: '/admin/users', icon: Users });
  }

  return (
    <>
      {/* Admin Sidebar (Desktop) & Bottom Nav (Mobile) */}
      <nav className="md:w-64 fixed bottom-0 md:top-0 left-0 md:h-screen w-full bg-slate-900 text-slate-300 border-t md:border-t-0 md:border-r border-slate-800 z-50 flex md:flex-col pb-safe transition-all">
        
        <div className="hidden md:flex flex-col items-start p-6 border-b border-slate-800">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-blue-500 mr-3" />
            <h2 className="text-xl font-bold text-white">Admin Portal</h2>
          </div>
          {isSuperAdmin && (
            <span className="mt-2 text-[10px] uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">Super Admin</span>
          )}
        </div>

        <div className="flex md:flex-col flex-1 justify-around md:justify-start md:p-4 w-full h-16 md:h-auto">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={clsx(
                  "flex flex-col md:flex-row items-center md:space-x-3 w-full md:w-auto p-2 md:p-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-white bg-slate-800/50 font-medium" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                )}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] md:text-sm mt-1 md:mt-0">{link.name}</span>
              </Link>
            );
          })}
          
          <div className="md:mt-auto hidden md:block w-full">
            <Link 
              href="/"
              className="flex items-center space-x-3 text-slate-400 hover:text-white p-3 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to App</span>
            </Link>
          </div>
          
          {/* Mobile Back Button */}
          <Link 
            href="/"
            className="md:hidden flex flex-col items-center justify-center p-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[10px] mt-1">Exit</span>
          </Link>
        </div>
      </nav>

      <div className="pb-16 md:pb-0">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          {children}
        </div>
      </div>
    </>
  );
}
