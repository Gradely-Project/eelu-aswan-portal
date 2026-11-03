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
      className={`h-9 px-2.5 sm:px-3 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] hover:border-amber-400/50 shadow-sm flex items-center gap-2 select-none flex-shrink-0 my-auto transition-all duration-200 ${
        onToggleTheme ? "cursor-pointer group hover:scale-[1.02] active:scale-[0.98]" : ""
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
      {/* 1. Interactive Theme Switcher Icon (Sun / Moon) */}
      {onToggleTheme && (
        <div className="w-5.5 h-5.5 rounded-lg bg-[#07172A] border border-amber-400/30 flex items-center justify-center flex-shrink-0 group-hover:border-amber-400 transition-colors">
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-300 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)] group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[#48D5F5] fill-[#48D5F5]/30 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </div>
      )}

      {/* 2. Elegant Divider */}
      {onToggleTheme && <div className="w-px h-3.5 bg-[#1E3A5F]" />}

      {/* 3. AswaN Signature Wordmark - Golden Nubian Solar Crowns on A & N */}
      <div className="flex items-end gap-[1.5px] leading-none pb-0.5">
        {/* Capital 'A' with Golden Sun Crown */}
        <div className="flex flex-col items-center justify-end">
          <Sun
            className="w-2.5 h-2.5 text-amber-400 fill-amber-300 mb-0.5 drop-shadow-[0_0_3px_rgba(245,158,11,0.8)]"
            strokeWidth={2.4}
          />
          <span className="font-black text-xs sm:text-sm text-amber-400 leading-none">
            A
          </span>
        </div>

        {/* Lowercase 'swa' */}
        <div className="flex flex-col items-center justify-end">
          <span className="font-black text-xs sm:text-sm text-[#F5F7FB] leading-none tracking-tight">
            swa
          </span>
        </div>

        {/* Capital 'N' with Golden Sun Crown */}
        <div className="flex flex-col items-center justify-end">
          <Sun
            className="w-2.5 h-2.5 text-amber-400 fill-amber-300 mb-0.5 drop-shadow-[0_0_3px_rgba(245,158,11,0.8)]"
            strokeWidth={2.4}
          />
          <span className="font-black text-xs sm:text-sm text-amber-400 leading-none">
            N
          </span>
        </div>
      </div>
    </div>
  );
}
