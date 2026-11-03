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

  return (
    <div
      onClick={onToggleTheme}
      role={onToggleTheme ? "button" : undefined}
      tabIndex={onToggleTheme ? 0 : undefined}
      onKeyDown={(e) => {
        if (onToggleTheme && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggleTheme();
        }
      }}
      className={`inline-flex items-center justify-center select-none transition-all duration-200 flex-shrink-0 ${
        onToggleTheme ? "cursor-pointer group hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${
        showContainer
          ? "h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] hover:border-amber-400/60 shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.18)]"
          : ""
      } ${className}`}
      title={
        onToggleTheme
          ? isDark
            ? "AswaN • انقر للتبديل للوضع النهاري (Light Mode)"
            : "AswaN • انقر للتبديل للوضع الليلي (Dark Mode)"
          : "AswaN Student Branch"
      }
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Interactive Celestial Orb (Day / Night Switcher) */}
        {onToggleTheme && (
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#07172A] border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:border-amber-400 group-hover:scale-110 shadow-sm transition-all duration-300 flex-shrink-0"
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-amber-300/40 group-hover:-rotate-12 transition-transform" />
            ) : (
              <Sun className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 fill-amber-400 group-hover:rotate-45 transition-transform" />
            )}
          </div>
        )}

        {/* Prominent & Bold 'AswaN' Wordmark with Sun Crowns */}
        <div className="flex items-baseline font-black tracking-normal leading-none select-none">
          {/* First Letter 'A' crowned with Golden Sun */}
          <span className="relative inline-flex flex-col items-center">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center">
              <Sun
                className="w-2 h-2 text-amber-400 fill-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.9)] animate-pulse"
                strokeWidth={2.4}
              />
            </span>
            <span
              className={`${
                isSm ? "text-sm sm:text-base" : "text-base sm:text-lg"
              } text-amber-400 drop-shadow-[0_1px_3px_rgba(245,158,11,0.3)] font-black`}
            >
              A
            </span>
          </span>

          {/* Lowercase 'swa' */}
          <span
            className={`${
              isSm ? "text-sm sm:text-base" : "text-base sm:text-lg"
            } text-[#F5F7FB] px-[1px] font-black group-hover:text-amber-200 transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}
          >
            swa
          </span>

          {/* Last Letter 'N' crowned with Golden Sun */}
          <span className="relative inline-flex flex-col items-center">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center">
              <Sun
                className="w-2 h-2 text-amber-400 fill-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.9)] animate-pulse"
                strokeWidth={2.4}
              />
            </span>
            <span
              className={`${
                isSm ? "text-sm sm:text-base" : "text-base sm:text-lg"
              } text-amber-400 drop-shadow-[0_1px_3px_rgba(245,158,11,0.3)] font-black`}
            >
              N
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
