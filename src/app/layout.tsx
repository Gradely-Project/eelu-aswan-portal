import type { Metadata } from "next";
import "./globals.css";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";

export const metadata: Metadata = {
  title: "EELU Aswan Student Branch Portal | Academy & Tracks Platform",
  description: "Official educational operations, session hubs, assignment submissions, live attendance, and weighted leaderboards.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EELU Academy",
  },
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#07172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Instant Theme Detection Script: prevents any flash of inverted/wrong theme on reload or navigation */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light-mode');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light-mode');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans transition-colors duration-150">
        {children}
        <InstallPwaPrompt />
      </body>
    </html>
  );
}
