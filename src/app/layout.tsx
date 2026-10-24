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
    <html lang="en" dir="ltr" className="dark">
      <head>
        <meta name="theme-color" content="#0F243A" />
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
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            background-color: #07172A !important;
            color: #F5F7FB;
            margin: 0;
            padding: 0;
          }
          img {
            max-width: 100%;
          }
        `}} />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col font-sans bg-[#07172A] text-[#F5F7FB]"
        style={{ backgroundColor: "#07172A", color: "#F5F7FB" }}
      >
        {children}
        <InstallPwaPrompt />
      </body>
    </html>
  );
}
