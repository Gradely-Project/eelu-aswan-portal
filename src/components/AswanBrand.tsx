"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

interface AswanBrandProps {
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
  onToggleTheme?: () => void;
  className?: string;
  showContainer?: boolean;
}

export default function AswanBrand({
  size = "md",
  isDark = true,
  onToggleTheme,
  className = "",
  showContainer = true,
}: AswanBrandProps) {
  const isSm = size === "sm";

  const containerStyles = showContainer
    ? isDark
      ? "bg-[#0D1D32]/90 border-[#1E3A5F] hover:border-amber-400/50 shadow-md shadow-black/25"
      : "bg-white/95 border-slate-200 hover:border-amber-500/50 shadow-sm"
    : "";

  return (
    <div
      onClick={onToggleTheme}
      className={`inline-flex items-center justify-center select-none ${
        onToggleTheme ? "cursor-pointer group" : ""
      } ${
        showContainer
          ? `px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all ${containerStyles}`
          : ""
      } ${className}`}
      title={onToggleTheme ? (isDark ? "AswaN • Switch to Light Theme" : "AswaN • Switch to Dark Navy Theme") : "AswaN - Student Branch"}
    >
      <div className="flex items-end gap-1 sm:gap-1.5 relative">
        {/* Column 1: First Letter 'A' (Capital) crowned with Aswan Sun */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-4 sm:h-4.5 flex items-center justify-center mb-0.5">
            <Sun
              className={`${
                isSm ? "w-3 h-3" : "w-3.5 h-3.5 sm:w-4 sm:h-4"
              } text-amber-400 fill-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.7)] animate-pulse`}
              strokeWidth={2.4}
            />
          </div>
          <span
            className={`font-black ${
              isSm ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            } leading-none tracking-tight ${
              isDark ? "text-amber-400" : "text-amber-600"
            }`}
          >
            A
          </span>
        </div>

        {/* Column 2: Center Lowercase 'swa' with Day/Night Theme Switcher directly above */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-4 sm:h-4.5 flex items-center justify-center mb-0.5">
            {onToggleTheme ? (
              <div
                className={`p-0.5 sm:p-1 rounded-md border transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-[#07172A] border-[#1E3A5F] text-[#48D5F5] group-hover:border-amber-400 group-hover:scale-110 shadow-sm"
                    : "bg-amber-50 border-amber-200 text-amber-600 group-hover:border-amber-500 group-hover:scale-110 shadow-sm"
                }`}
                aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-300 transition-transform" />
                ) : (
                  <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 fill-blue-500/40 transition-transform" />
                )}
              </div>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            )}
          </div>
          <span
            className={`font-black ${
              isSm ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            } leading-none tracking-tight px-0.5 ${
              isDark ? "text-slate-100 group-hover:text-amber-300" : "text-slate-800 group-hover:text-amber-700"
            } transition-colors`}
          >
            swa
          </span>
        </div>

        {/* Column 3: Last Letter 'N' (Capital) crowned with Aswan Sun */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-4 sm:h-4.5 flex items-center justify-center mb-0.5">
            <Sun
              className={`${
                isSm ? "w-3 h-3" : "w-3.5 h-3.5 sm:w-4 sm:h-4"
              } text-amber-400 fill-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.7)] animate-pulse`}
              strokeWidth={2.4}
            />
          </div>
          <span
            className={`font-black ${
              isSm ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            } leading-none tracking-tight ${
              isDark ? "text-amber-400" : "text-amber-600"
            }`}
          >
            N
          </span>
        </div>
      </div>
    </div>
  );
}
