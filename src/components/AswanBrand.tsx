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
      className={`h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-[#0B1A2D] border border-[#1E3A5F] hover:border-amber-400/70 shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center select-none flex-shrink-0 my-auto transition-all duration-300 ${
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
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#48D5F5] fill-[#48D5F5]/40 drop-shadow-[0_0_6px_rgba(72,213,245,0.85)] group-hover:-rotate-20 group-hover:scale-115 transition-transform duration-500 ease-out"
              strokeWidth={2.4}
            />
          )
        ) : (
          <Sun
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.85)]"
            strokeWidth={2.4}
          />
        )}
      </div>

      {/* 2. Bottom Row: High-Contrast 'AswaN' wordmark */}
      <div className="flex items-baseline justify-center select-none leading-none tracking-normal">
        {/* Capital 'A' in Nubian Golden Amber */}
        <span className="font-black text-xs sm:text-[13px] text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          A
        </span>

        {/* Lowercase 'swa' in Brilliant Crisp White */}
        <span className="font-black text-xs sm:text-[13px] text-white px-[0.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
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
