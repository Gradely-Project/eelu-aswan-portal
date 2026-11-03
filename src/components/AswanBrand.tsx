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
      className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] hover:border-amber-400/50 shadow-sm flex flex-col items-center justify-center select-none flex-shrink-0 my-auto transition-all duration-200 ${
        onToggleTheme ? "cursor-pointer group hover:scale-[1.03] active:scale-[0.97]" : ""
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
      {/* 1. Top Row: The Radiant Sun directly ABOVE the word */}
      <div className="flex items-center justify-center mb-0.5">
        {onToggleTheme ? (
          isDark ? (
            <Sun
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.85)] group-hover:rotate-45 group-hover:scale-110 transition-all duration-300"
              strokeWidth={2.3}
            />
          ) : (
            <Moon
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#48D5F5] fill-[#48D5F5]/30 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-300"
              strokeWidth={2.3}
            />
          )
        ) : (
          <Sun
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.85)]"
            strokeWidth={2.3}
          />
        )}
      </div>

      {/* 2. Bottom Row: The wordmark 'AswaN' tightly grouped as one cohesive word */}
      <div className="flex items-baseline justify-center select-none leading-none tracking-normal">
        {/* Capital 'A' in Nubian Golden Amber */}
        <span className="font-black text-xs sm:text-[13px] text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          A
        </span>

        {/* Lowercase 'swa' in Pure Contrast */}
        <span className="font-black text-xs sm:text-[13px] text-[#F5F7FB] px-[0.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] group-hover:text-amber-100 transition-colors">
          swa
        </span>

        {/* Capital 'N' in Nubian Golden Amber */}
        <span className="font-black text-xs sm:text-[13px] text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          N
        </span>
      </div>
    </div>
  );
}
