"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Layers,
  X,
  FileCheck2,
  Calendar,
  Users,
  Megaphone,
  CheckCircle2,
  KeyRound,
  Lock,
  AlertCircle,
  Menu,
  Phone,
  Settings,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  trackTeamRole?: string | null;
  assignedTrackId?: string | null;
  assignedTrack?: { id: string; name: string } | null;
  enrollments?: Array<{ track: { id: string; name: string } }>;
  college?: string | null;
  academicYear?: string | null;
}

interface Track {
  id: string;
  name: string;
}

export default function TopNav({
  selectedTrackId,
  onTrackChange,
}: {
  selectedTrackId?: string;
  onTrackChange?: (trackId: string) => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search dialog
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notifications Popover
  const [notifOpen, setNotifOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Profile Menu Popover
  const [profileOpen, setProfileOpen] = useState(false);

  // Account Settings Modal (Phone & Password)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light") {
        document.documentElement.classList.add("light-mode");
        setIsDark(false);
      }
    }

    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return { user: null };
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setPhone(data.user.phone || "");
          if (data.user.role === "INSTRUCTOR" && data.user.assignedTrackId && onTrackChange) {
            onTrackChange(data.user.assignedTrackId);
          }
        }
      })
      .catch(() => {});

    fetch("/api/tracks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setTracks(data.tracks || []))
      .catch(() => {});

    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements || []))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("eelu_user_role");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = () => {
    setSyncing(true);
    setToastMsg("Syncing data with database...");
    setTimeout(() => {
      setSyncing(false);
      setToastMsg("Database sync complete. All metrics up to date.");
      router.refresh();
      setTimeout(() => setToastMsg(null), 3000);
    }, 700);
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add("light-mode");
      if (typeof window !== "undefined") localStorage.setItem("theme", "light");
      setIsDark(false);
      setToastMsg("Switched to Light Theme");
    } else {
      document.documentElement.classList.remove("light-mode");
      if (typeof window !== "undefined") localStorage.setItem("theme", "dark");
      setIsDark(true);
      setToastMsg("Switched to Dark Navy Theme");
    }
    setTimeout(() => setToastMsg(null), 2500);
  };

  const toggleMobileSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError("New passwords do not match.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setSettingsError("New password must be at least 6 characters.");
      return;
    }

    setSavingSettings(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSettingsError(data.error || "Failed to update profile settings.");
      } else {
        setSettingsSuccess("Profile details updated successfully!");
        if (user) {
          setUser({ ...user, phone: data.user?.phone || phone });
        }
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setSettingsModalOpen(false);
          setSettingsSuccess(null);
        }, 1800);
      }
    } catch {
      setSettingsError("Network error. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const getRoleBadge = (role?: string, teamRole?: string | null) => {
    if (role === "ADMIN") return "Main Administrator";
    if (role === "CHAIR_PERSON") return "Branch Chairperson";
    if (role === "VICE_CHAIR") return "Vice Chair / Assistant";
    if (role === "INSTRUCTOR") {
      if (teamRole === "HEAD") return "Lead Instructor (Head)";
      if (teamRole === "VICE_HEAD") return "Vice Lead";
      return "Core Instructor";
    }
    return "Enrolled Student";
  };

  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";
  const isExec = user?.role === "ADMIN" || user?.role === "CHAIR_PERSON" || user?.role === "VICE_CHAIR";

  const searchResults = [
    { title: "Classroom Attendance & Live QR", href: "/attendance", icon: Users },
    { title: "Tasks, Projects & Submissions", href: "/tasks", icon: FileCheck2 },
    { title: "Session Hubs & Lectures", href: "/sessions", icon: Calendar },
    { title: "Branch Announcements & Broadcasts", href: "/announcements", icon: Megaphone },
    { title: "Weighted Leaderboard", href: "/leaderboard", icon: Layers },
    { title: "Accredited Certificates", href: "/certificates", icon: Shield },
  ].filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 bg-[#07172A] border-b border-[#1E3A5F] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 no-print select-none">
        {/* Left: Mobile Drawer Button + Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Hamburger Drawer Toggle */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group">
            <div
              className="relative w-8 sm:w-9 h-8 sm:h-9 rounded-xl overflow-hidden border border-cyan-500/20 bg-[#0B1A2D] p-1 shadow-sm ring-1 ring-cyan-500/10 group-hover:scale-105 transition-transform flex-shrink-0"
              style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px" }}
            >
              <Image
                src="/logo.jpeg"
                alt="EELU Branch Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xs sm:text-sm text-[#F5F7FB] tracking-tight group-hover:text-[#269CF0] transition-colors leading-none">
                EELU Aswan Branch
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#E5A93C] tracking-wider uppercase mt-1">
                STUDENT ACADEMY PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Input (Desktop) */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
          <div
            onClick={() => setSearchOpen(true)}
            className="relative w-full bg-[#0D1D32] border border-[#1E3A5F] hover:border-[#269CF0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#8FA4BD] cursor-pointer transition-colors flex items-center justify-between select-none"
          >
            <Search className="w-4 h-4 text-[#8FA4BD] absolute left-3 top-2" />
            <span>Search portal (tasks, sessions)...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#07172A] border border-[#1E3A5F] text-[9px] font-mono text-[#8FA4BD]">
              /
            </kbd>
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Track Selector Pill: Strictly Role Scoped! */}
          {isInstructor ? (
            <div className="hidden sm:flex bg-[#0D1D32] border border-[#269CF0]/50 text-[#48D5F5] font-black text-xs py-1.5 sm:py-2 px-3 sm:px-4 rounded-full shadow-sm uppercase items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[150px]">● {user.assignedTrack?.name || "ASSIGNED TRACK"}</span>
            </div>
          ) : isStudent ? (
            <div className="hidden md:flex bg-[#0D1D32] border border-[#1E3A5F] text-[#48D5F5] font-black text-xs py-1.5 px-3 rounded-full shadow-sm uppercase items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate max-w-[150px]">
                {user.enrollments && user.enrollments.length > 0
                  ? user.enrollments.map((en) => en.track.name).join(" • ")
                  : "ENROLLED STUDENT"}
              </span>
            </div>
          ) : isExec && tracks.length > 0 && onTrackChange ? (
            <div className="relative hidden sm:block">
              <select
                value={selectedTrackId || ""}
                onChange={(e) => onTrackChange(e.target.value)}
                className="appearance-none bg-[#0D1D32] border border-[#1E3A5F] hover:border-[#269CF0] text-[#48D5F5] font-black text-xs py-1.5 sm:py-2 pl-4 sm:pl-6 pr-7 sm:pr-8 rounded-full shadow-sm focus:outline-none cursor-pointer uppercase transition-colors"
              >
                <option value="ALL">● ALL TRACKS</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    ● {t.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#48D5F5] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          ) : null}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-[#F5F7FB] hover:border-[#269CF0] text-xs font-bold transition-all cursor-pointer"
            title="Synchronize state with database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#269CF0] ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Real Working Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-[#E5A93C] transition-colors cursor-pointer"
            title={isDark ? "Toggle Light Theme" : "Toggle Dark Navy Theme"}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#E5A93C]" /> : <Moon className="w-4 h-4 text-[#48D5F5]" />}
          </button>

          {/* Notifications Bell with Popover */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-[#F5F7FB] hover:border-[#269CF0] transition-colors relative cursor-pointer"
              title="View live announcements & broadcasts"
            >
              <Bell className="w-4 h-4" />
              {announcements.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#269CF0] absolute top-1.5 right-1.5 animate-pulse" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E3A5F]">
                  <span className="text-xs font-black text-[#F5F7FB] flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-[#269CF0]" />
                    Live Announcements ({announcements.length})
                  </span>
                  <Link
                    href="/announcements"
                    onClick={() => setNotifOpen(false)}
                    className="text-[10px] text-[#48D5F5] hover:underline font-bold"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-[#8FA4BD] text-center py-4">No active announcements</p>
                  ) : (
                    announcements.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase text-[#E5A93C]">
                            {item.category}
                          </span>
                          <span className="text-[9px] text-[#8FA4BD]">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-xs mb-0.5 line-clamp-1">{item.title}</h5>
                        <p className="text-[11px] text-[#8FA4BD] line-clamp-2">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge with Clean Popover */}
          {user ? (
            <div className="relative">
              <div
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-[#1E3A5F] cursor-pointer group"
              >
                <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-[#E5A93C] text-[#07172A] font-black text-xs flex items-center justify-center uppercase shadow-sm group-hover:ring-2 group-hover:ring-[#269CF0] transition-all">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-bold text-xs text-[#F5F7FB] leading-tight group-hover:text-[#48D5F5] transition-colors truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#48D5F5] font-semibold truncate max-w-[120px]">
                    {getRoleBadge(user.role, user.trackTeamRole)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8FA4BD] group-hover:text-white transition-colors" />
              </div>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-xs">
                  <div className="pb-3 mb-3 border-b border-[#1E3A5F]">
                    <span className="font-black text-white text-sm block truncate">{user.name}</span>
                    <span className="text-[11px] text-[#8FA4BD] block truncate">{user.email}</span>
                    {user.phone && (
                      <span className="text-[10px] text-[#48D5F5] block font-mono mt-0.5">
                        📞 {user.phone}
                      </span>
                    )}
                    <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30 uppercase">
                      {getRoleBadge(user.role, user.trackTeamRole)}
                    </span>
                    {user.college && (
                      <span className="mt-1 text-[10px] text-[#8FA4BD] block">
                        {user.college} {user.academicYear ? `• Year ${user.academicYear}` : ""}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setSettingsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#CBD5E1] hover:text-white hover:bg-[#10243C] font-semibold transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-[#E5A93C]" />
                      <span>Account Settings & Profile</span>
                    </button>

                    <div className="pt-2 border-t border-[#1E3A5F]">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer"
                      >
                        <span>Sign Out (Logout)</span>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/#signin"
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs shadow-md transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Account Settings & Credentials Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/20 border border-[#E5A93C]/30 flex items-center justify-center text-[#E5A93C]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Account Settings</h3>
                  <span className="text-[10px] text-[#8FA4BD]">Update phone number & password</span>
                </div>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settingsError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            {settingsSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              {/* Phone Number */}
              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#269CF0]" />
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01012345678"
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              {/* New Password (Optional) */}
              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#E5A93C]" />
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to keep current password"
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              {/* Confirm New Password */}
              {newPassword && (
                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0D1D32] border border-[#269CF0] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#269CF0] animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Quick Search Dialog Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-[#269CF0]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick find pages, tasks, attendance..."
                  className="w-full bg-transparent text-sm text-[#F5F7FB] placeholder-[#8FA4BD] focus:outline-none"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8FA4BD]">
                  No matching sections found.
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="p-2.5 rounded-xl bg-[#07172A] hover:bg-[#10243C] border border-[#1E3A5F] flex items-center gap-3 text-xs font-bold text-[#F5F7FB] hover:text-[#48D5F5] transition-all"
                    >
                      <Icon className="w-4 h-4 text-[#269CF0]" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
