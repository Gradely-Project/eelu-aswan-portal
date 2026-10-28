"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("suspended") === "1") {
        setError("⚠️ تم تجميد وتعليق حسابك بواسطة إدارة الفرع. برجاء مراجعة الإدارة.");
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to sign in.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("eelu_user_role", data.user.role);
        localStorage.setItem("eelu_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again later.");
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex flex-col items-center group">
          <div
            className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#1E3A5F] bg-white p-1 mb-3 group-hover:scale-105 transition-transform shadow-lg flex-shrink-0"
            style={{ width: "64px", height: "64px", minWidth: "64px", minHeight: "64px" }}
          >
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h2 className="text-center text-2xl font-black text-[#F5F7FB]">
            Sign In to Academy Portal
          </h2>
          <p className="mt-1 text-center text-xs text-[#8FA4BD] font-medium">
            EELU Aswan Student Branch Platform
          </p>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0D1D32] py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-[#1E3A5F] relative glow-blue">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="font-bold leading-relaxed">{error}</div>
            </div>
          )}

          <form className="space-y-4 text-left" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold text-[#8FA4BD] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@eelu.edu.eg"
                className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#8FA4BD] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 rounded-xl shadow-lg shadow-[#269CF0]/25 text-xs font-black text-white bg-[#269CF0] hover:bg-[#1E82CB] focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#8FA4BD]">
            New applicant without an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[#269CF0] hover:text-[#48D5F5] underline ml-1"
            >
              Apply Here
            </Link>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-4 border-t border-[#1E3A5F]/70">
            <span className="block text-[10px] font-black text-[#8FA4BD] mb-2 text-center uppercase tracking-wider">
              Instant One-Click Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@branch.org", "admin123")}
                className="p-1.5 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-[#E5A93C] font-bold border border-[#1E3A5F] text-left truncate"
              >
                👑 Main Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("chair@branch.org", "chair123")}
                className="p-1.5 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-[#48D5F5] font-bold border border-[#1E3A5F] text-left truncate"
              >
                🏛️ Chairperson
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("web.head@branch.org", "head123")}
                className="p-1.5 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-[#269CF0] font-bold border border-[#1E3A5F] text-left truncate"
              >
                💻 Lead Instructor
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("ahmed@student.com", "student123")}
                className="p-1.5 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-emerald-400 font-bold border border-[#1E3A5F] text-left truncate"
              >
                🎓 Active Student
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("omar.pending@student.com", "student123")}
                className="col-span-2 p-1.5 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-amber-400 font-bold border border-[#1E3A5F] text-center"
              >
                ⏳ Pending Student (Test Rejection Barrier)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
