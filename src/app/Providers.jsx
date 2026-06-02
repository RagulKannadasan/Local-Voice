"use client";

import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/LanguageContext';

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
