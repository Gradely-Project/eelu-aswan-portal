"use client";

import React from "react";
import { Sun } from "lucide-react";

interface AswanBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSunEmblem?: boolean;
}

export default function AswanBrand({
  size = "md",
  className = "",
  showSunEmblem = true,
}: AswanBrandProps) {
  // Sizing definitions for font, sun crowns, and breathing spacing
  const config = {
    sm: {
      font: "text-xs sm:text-sm",
      sun: "w-2.5 h-2.5 -top-2.5",
      containerPt: "pt-1.5",
      spacing: "gap-[1px]",
    },
    md: {
      font: "text-base sm:text-lg",
      sun: "w-3 h-3 -top-3.5",
      containerPt: "pt-2",
      spacing: "gap-[1px]",
    },
    lg: {
      font: "text-2xl sm:text-3xl",
      sun: "w-4 h-4 -top-5",
      containerPt: "pt-2.5",
      spacing: "gap-0.5",
    },
    xl: {
      font: "text-4xl sm:text-5xl",
      sun: "w-5 h-5 -top-6",
      containerPt: "pt-3",
      spacing: "gap-1",
    },
  }[size];

  return (
    <span
      className={`inline-flex items-center ${config.containerPt} ${config.spacing} font-black tracking-normal select-none relative ${config.font} ${className}`}
      title="AswaN - Student Branch"
    >
      {/* 1. First Letter: Capital 'A' crowned with glowing Aswan Golden Sun */}
      <span className="relative inline-flex flex-col items-center">
        {showSunEmblem && (
          <span
            className={`absolute ${config.sun} left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center`}
          >
            <Sun
              className="w-full h-full text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-pulse"
              strokeWidth={2.5}
            />
          </span>
        )}
        <span className="text-amber-400 font-black drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]">
          A
        </span>
      </span>

      {/* 2. Middle Letters: Lowercase 'swa' with Nubian Sunset into Nile Azure gradient */}
      <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-[#269CF0] bg-clip-text text-transparent font-black tracking-tight px-[0.5px]">
        swa
      </span>

      {/* 3. Last Letter: Capital 'N' crowned with glowing Aswan Golden Sun */}
      <span className="relative inline-flex flex-col items-center">
        {showSunEmblem && (
          <span
            className={`absolute ${config.sun} left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center`}
          >
            <Sun
              className="w-full h-full text-amber-400 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-pulse"
              strokeWidth={2.5}
            />
          </span>
        )}
        <span className="text-[#269CF0] font-black drop-shadow-[0_2px_8px_rgba(38,156,240,0.25)]">
          N
        </span>
      </span>
    </span>
  );
}
