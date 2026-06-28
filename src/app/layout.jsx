import "./globals.css";
import Navigation from "@/components/Navigation";
import Providers from "./Providers";

export const dynamic = 'force-dynamic';

export const viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Local Voice",
  description: "Community platform for Kavarappattu village",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Local Voice",
  },
};

import SwipeHandler from "@/components/SwipeHandler";
import SpaContainer from "@/components/SpaContainer";
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
        <Providers>
          <Navigation />
          <SwipeHandler>
            <main className="md:ml-64 pb-16 md:pb-0 min-h-screen">
              <div className="max-w-3xl mx-auto p-4 md:p-8 h-full">
                <SpaContainer>
                  {children}
                </SpaContainer>
              </div>
            </main>
          </SwipeHandler>
        </Providers>
      </body>
    </html>
  );
}
