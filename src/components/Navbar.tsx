"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogOut,
  User,
  Shield,
  Layers,
  Award,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Menu,
  X,
  FileText,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  trackTeamRole?: string | null;
  assignedTrackId?: string | null;
  assignedTrack?: { id: string; name: string } | null;
  enrollments?: Array<{ track: { id: string; name: string } }>;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return { user: null };
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleLabel = (role: string, teamRole?: string | null) => {
    if (role === "ADMIN") return "الآدمن الرئيسي";
    if (role === "CHAIR_PERSON") return "رئيس مجلس الإدارة (Chairperson)";
    if (role === "VICE_CHAIR") return "نائب الرئيس والمساعد (Vice Chair)";
    if (role === "INSTRUCTOR") {
      if (teamRole === "HEAD") return "قائد التراك (Head)";
      if (teamRole === "VICE_HEAD") return "نائب قائد التراك (Vice Head)";
      return "فريق التراك (Core Team)";
    }
    return "طالب";
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="relative w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-slate-100 group-hover:scale-105 transition-transform bg-white flex-shrink-0"
                style={{ width: "44px", height: "44px", minWidth: "44px", minHeight: "44px" }}
              >
                <Image
                  src="/logo.jpeg"
                  alt="Branch Logo"
                  width={44}
                  height={44}
                  className="w-full h-full object-contain p-0.5"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                  منصة التراكات والأنشطة
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Student Branch Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 space-x-reverse">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              href="/leaderboard"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-500" />
              لوحة الشرف (Leaderboard)
            </Link>

            {user && (
              <>
                <Link
                  href="/sessions"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  السيشنز والماتريال
                </Link>
                <Link
                  href="/tasks"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-500" />
                  التاسكات
                </Link>
                {(user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "CHAIR_PERSON" || user.role === "VICE_CHAIR") && (
                  <Link
                    href="/report"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" />
                    طباعة التقرير
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/students"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="w-4 h-4" />
                    إدارة البرانش
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User actions */}
          <div className="hidden md:flex items-center space-x-3 space-x-reverse">
            {loading ? (
              <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-800">
                    {user.name}
                  </span>
                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    {getRoleLabel(user.role, user.trackTeamRole)}
                    {user.assignedTrack && ` - ${user.assignedTrack.name}`}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  تسجيل طالب جديد
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            الرئيسية
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            لوحة الشرف (Leaderboard)
          </Link>
          {user ? (
            <>
              <Link
                href="/sessions"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                السيشنز والماتريال
              </Link>
              <Link
                href="/tasks"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                التاسكات
              </Link>
              <Link
                href="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                طباعة تقرير الطلاب
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/students"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-purple-700 hover:bg-purple-50"
                >
                  لوحة الآدمن (إدارة البرانش)
                </Link>
              )}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-800">{user.name}</p>
                  <p className="text-xs text-blue-600">{getRoleLabel(user.role, user.trackTeamRole)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg"
                >
                  خروج
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-bold text-white bg-blue-600 rounded-lg"
              >
                تسجيل طالب جديد
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
