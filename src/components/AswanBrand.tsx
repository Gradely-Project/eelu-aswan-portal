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
        onToggleTheme ? "cursor-pointer group hover:scale-[1.03] active:scale-[0.98]" : ""
      } ${
        showContainer
          ? "h-8 sm:h-9 px-2.5 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] hover:border-amber-400/60 shadow-sm"
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
      <div className="flex flex-col items-center justify-center leading-none">
        {/* Top: 3 aligned emblems - Sun over A, Switcher over swa, Sun over N */}
        <div className="flex items-center justify-between w-full px-0.5 mb-0.5">
          {/* Micro Sun Crown over 'A' */}
          <span className="flex items-center justify-center w-2.5 h-2.5 text-amber-400">
            <Sun
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.85)] group-hover:rotate-12 transition-transform duration-300"
              strokeWidth={2.4}
            />
          </span>

          {/* Celestial Theme Toggle directly over 'swa' */}
          <div className="flex items-center justify-center px-0.5">
            <span
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#07172A] border border-amber-400/50 flex items-center justify-center group-hover:border-amber-400 shadow-sm transition-all duration-300"
            >
              {isDark ? (
                <Moon className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-amber-300 fill-amber-300/40 group-hover:-rotate-12 transition-transform" />
              ) : (
                <Sun className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-amber-500 fill-amber-400 group-hover:rotate-45 transition-transform" />
              )}
            </span>
          </div>

          {/* Micro Sun Crown over 'N' */}
          <span className="flex items-center justify-center w-2.5 h-2.5 text-amber-400">
            <Sun
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.85)] group-hover:-rotate-12 transition-transform duration-300"
              strokeWidth={2.4}
            />
          </span>
        </div>

        {/* Bottom: Unified Wordmark 'AswaN' - Letters tightly grouped with ZERO awkward spacing */}
        <div
          className={`font-black ${
            isSm ? "text-xs sm:text-[13px]" : "text-xs sm:text-sm"
          } tracking-tighter leading-none flex items-baseline select-none`}
        >
          <span className="text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            A
          </span>
          <span className="text-[#F5F7FB] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] group-hover:text-amber-200 transition-colors">
            swa
          </span>
          <span className="text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            N
          </span>
        </div>
      </div>
    </div>
  );
}
