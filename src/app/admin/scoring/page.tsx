"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScoringEngineRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#07172A] flex items-center justify-center text-[#8FA4BD] text-xs">
      Redirecting to dashboard...
    </div>
  );
}
