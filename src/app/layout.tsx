import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EELU Aswan Student Branch Portal | Academy & Tracks Platform",
  description: "Official educational operations, session hubs, assignment submissions, live attendance, and weighted leaderboards.",
  icons: {
    icon: "/favicon.ico",
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
      </body>
    </html>
  );
}
