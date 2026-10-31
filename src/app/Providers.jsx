"use client";

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/LanguageContext';
import { TabProvider } from '@/lib/TabContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Providers({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-google-client-id.apps.googleusercontent.com';

  useEffect(() => {
    // In development mode, unregister any stale service workers from prior production builds
    // to prevent bad-precaching-response 404 errors on localhost.
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
        <LanguageProvider>
          <TabProvider>
            {children}
          </TabProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
