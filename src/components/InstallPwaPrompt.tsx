"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (dismissed) {
        setIsDismissed(true);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa_prompt_dismissed", "true");
    }
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-[#0D1D32] border border-[#269CF0]/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#269CF0]/20 border border-[#269CF0]/40 flex items-center justify-center text-[#48D5F5] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">EELU Academy Portal App</h4>
            <p className="text-[11px] text-[#8FA4BD]">تثبيت البوابة كتطبيق هاتف لتسجيل الحضور السريع</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            تثبيت
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-[#8FA4BD] hover:text-white hover:bg-[#10243C] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
