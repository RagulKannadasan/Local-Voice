"use client";

import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/LanguageContext';
import { TabProvider } from '@/lib/TabContext';
export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <TabProvider>
          {children}
        </TabProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
