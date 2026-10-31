/* eslint-disable @next/next/no-page-custom-font */
import "./globals.css";
import Providers from "./Providers";
import AppShell from "@/components/AppShell";
export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0C" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Kavarappattu",
  description: "Hyperlocal community platform for Kavarappattu",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kavarappattu",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] transition-colors duration-200 overflow-x-hidden min-h-screen">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
