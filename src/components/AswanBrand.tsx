"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

interface AswanBrandProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
  className?: string;
}

export default function AswanBrand({
  isDark = true,
  onToggleTheme,
  className = "",
}: AswanBrandProps) {
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
      className={`h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-white/95 dark:bg-[#0B1A2D] border border-[#E2D7C3] dark:border-[#1E3A5F] hover:border-amber-500/80 dark:hover:border-amber-400/70 shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center select-none flex-shrink-0 my-auto transition-all duration-300 ${
        onToggleTheme ? "cursor-pointer group hover:scale-[1.04] active:scale-[0.96]" : ""
      } ${className}`}
      title={
        onToggleTheme
          ? isDark
            ? "AswaN • انقر للتبديل للوضع النهاري (Light Mode)"
            : "AswaN • انقر للتبديل للوضع الليلي (Dark Mode)"
          : "AswaN Student Branch"
      }
      aria-label="AswaN Theme Toggle"
    >
      {/* 1. Top Row: The Radiant Sun / Moon Icon with Smooth Micro-Animation */}
      <div className="flex items-center justify-center mb-0.5">
        {onToggleTheme ? (
          isDark ? (
            <Sun
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-300/80 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)] group-hover:rotate-90 group-hover:scale-115 transition-transform duration-500 ease-out"
              strokeWidth={2.4}
            />
          ) : (
            <Moon
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1D6FB8] dark:text-[#48D5F5] fill-[#1D6FB8]/20 dark:fill-[#48D5F5]/40 drop-shadow-[0_0_6px_rgba(29,111,184,0.5)] group-hover:-rotate-20 group-hover:scale-115 transition-transform duration-500 ease-out"
              strokeWidth={2.4}
            />
          )
        ) : (
          <Sun
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.85)]"
            strokeWidth={2.4}
          />
        )}
      </div>

      {/* 2. Bottom Row: High-Contrast 'AswaN' wordmark */}
      <div className="flex items-baseline justify-center select-none leading-none tracking-normal">
        {/* Capital 'A' in Nubian Golden Amber */}
        <span className="font-black text-xs sm:text-[13px] text-amber-600 dark:text-amber-400 drop-shadow-sm">
          A
        </span>

        {/* Lowercase 'swa' in Rich Contrast Color */}
        <span className="font-black text-xs sm:text-[13px] text-[#0F172A] dark:text-white px-[0.5px]">
          swa
        </span>

        {/* Capital 'N' in Nubian Golden Amber */}
        <span className="font-black text-xs sm:text-[13px] text-amber-600 dark:text-amber-400 drop-shadow-sm">
          N
        </span>
      </div>
    </div>
  );
}
