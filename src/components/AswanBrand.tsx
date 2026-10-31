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
      className={`inline-flex items-center justify-center select-none transition-all duration-300 ${
        onToggleTheme ? "cursor-pointer group hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${
        showContainer
          ? isDark
            ? "px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#09182A]/90 hover:bg-[#0D1F35] border border-[#1E3A5F]/80 hover:border-amber-400/50 shadow-lg shadow-black/25 backdrop-blur-md"
            : "px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 hover:bg-slate-50 border border-slate-200/90 hover:border-amber-400/60 shadow-md shadow-slate-200/60 backdrop-blur-md"
          : ""
      } ${className}`}
      title={
        onToggleTheme
          ? isDark
            ? "AswaN • Click to switch to Light Theme (وضع النهار)"
            : "AswaN • Click to switch to Dark Navy Theme (الوضع الليلي)"
          : "AswaN - Student Branch"
      }
    >
      <div className="flex items-end justify-center gap-1 sm:gap-1.5 relative">
        {/* Column 1: First Letter 'A' (Capital) crowned with Golden Sun Crown */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-4 sm:h-5 flex items-center justify-center mb-1">
            <span className="relative flex items-center justify-center">
              <Sun
                className={`${
                  isSm ? "w-3 h-3" : "w-3.5 h-3.5 sm:w-4 sm:h-4"
                } text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.65)] group-hover:rotate-12 transition-transform duration-300`}
                strokeWidth={2.3}
              />
            </span>
          </div>
          <span
            className={`font-black ${
              isSm ? "text-sm sm:text-base" : "text-base sm:text-lg"
            } leading-none tracking-normal ${
              isDark
                ? "text-amber-400 group-hover:text-amber-300"
                : "text-amber-600 group-hover:text-amber-500"
            } transition-colors`}
          >
            A
          </span>
        </div>

        {/* Column 2: Center Lowercase 'swa' with Celestial Day/Night Switcher directly above */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-4 sm:h-5 flex items-center justify-center mb-1">
            {onToggleTheme ? (
              <div
                className={`relative flex items-center justify-center ${
                  isSm ? "w-5 h-5" : "w-5.5 h-5.5 sm:w-6 sm:h-6"
                } rounded-full transition-all duration-300 ${
                  isDark
                    ? "bg-[#061220] border border-amber-400/40 text-amber-300 shadow-sm shadow-amber-400/10 group-hover:border-amber-400 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : "bg-amber-50 border border-amber-300/80 text-amber-600 shadow-sm shadow-amber-600/10 group-hover:border-amber-500 group-hover:shadow-[0_0_10px_rgba(217,119,6,0.25)]"
                }`}
                aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  /* In Dark mode: Ethereal crescent moon representing night, comfortable for the eyes */
                  <Moon
                    className={`${
                      isSm ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-3.5 sm:h-3.5"
                    } text-amber-300 fill-amber-300/35 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300`}
                    strokeWidth={2.4}
                  />
                ) : (
                  /* In Light mode: Radiant golden sun representing daylight */
                  <Sun
                    className={`${
                      isSm ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-3.5 sm:h-3.5"
                    } text-amber-600 fill-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300`}
                    strokeWidth={2.4}
                  />
                )}
              </div>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            )}
          </div>
          <span
            className={`font-black ${
              isSm ? "text-sm sm:text-base" : "text-base sm:text-lg"
            } leading-none tracking-normal px-0.5 ${
              isDark
                ? "text-slate-100 group-hover:text-white"
                : "text-slate-800 group-hover:text-slate-900"
            } transition-colors`}
          >
            swa
          </span>
        </div>

        {/* Column 3: Last Letter 'N' (Capital) crowned with Golden Sun Crown */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-4 sm:h-5 flex items-center justify-center mb-1">
            <span className="relative flex items-center justify-center">
              <Sun
                className={`${
                  isSm ? "w-3 h-3" : "w-3.5 h-3.5 sm:w-4 sm:h-4"
                } text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.65)] group-hover:-rotate-12 transition-transform duration-300`}
                strokeWidth={2.2}
              />
            </span>
          </div>
          <span
            className={`font-black ${
              isSm ? "text-sm sm:text-base" : "text-base sm:text-lg"
            } leading-none tracking-normal ${
              isDark
                ? "text-amber-400 group-hover:text-amber-300"
                : "text-amber-600 group-hover:text-amber-500"
            } transition-colors`}
          >
            N
          </span>
        </div>
      </div>
    </div>
  );
}
