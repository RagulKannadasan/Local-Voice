import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Providers from "./Providers";

const inter = Inter({ subsets: ["latin"] });

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Local Voice",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <Providers>
          <Navigation />
          <main className="md:ml-64 pb-16 md:pb-0 min-h-screen">
            <div className="max-w-3xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
