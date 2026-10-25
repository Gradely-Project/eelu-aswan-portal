"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  FileCheck2,
  Users,
  Award,
  CalendarDays,
  FileText,
  UserCheck,
  Layers,
  Crown,
  Sparkles,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  Building2,
  Edit2,
  Phone,
  Mail,
  X,
  CheckCircle2,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface SupervisorInfo {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  linkedin: string;
  statusBadge: string;
}

export default function Sidebar({
  userRole,
  mobileOpen: propMobileOpen,
  onClose: propOnClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const [effectiveRole, setEffectiveRole] = useState<string>(userRole || "");

  // Dynamic Supervisor Card State
  const [supervisor, setSupervisor] = useState<SupervisorInfo>({
    name: "Abdelrahman Mahmoud",
    title: "Software Engineer & Branch Supervisor",
    phone: "",
    email: "",
    linkedin: "https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0",
    statusBadge: "Active Supervision",
  });

  // Edit Modal State for Main Admin
  const [showEditSupervisorModal, setShowEditSupervisorModal] = useState(false);
  const [editName, setEditName] = useState(supervisor.name);
  const [editTitle, setEditTitle] = useState(supervisor.title);
  const [editPhone, setEditPhone] = useState(supervisor.phone || "");
  const [editEmail, setEditEmail] = useState(supervisor.email || "");
  const [editLinkedin, setEditLinkedin] = useState(supervisor.linkedin);
  const [savingSupervisor, setSavingSupervisor] = useState(false);
  const [supervisorSavedMsg, setSupervisorSavedMsg] = useState(false);

  useEffect(() => {
    if (userRole) {
      setEffectiveRole(userRole);
      if (typeof window !== "undefined") {
        localStorage.setItem("eelu_user_role", userRole);
      }
    } else {
      setEffectiveRole("");
      if (typeof window !== "undefined") {
        localStorage.removeItem("eelu_user_role");
      }
    }
  }, [userRole]);

  // Fetch Supervisor Info
  useEffect(() => {
    fetch("/api/admin/supervisor-info", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.info) {
          setSupervisor(data.info);
          setEditName(data.info.name || "Abdelrahman Mahmoud");
          setEditTitle(data.info.title || "Software Engineer & Branch Supervisor");
          setEditPhone(data.info.phone || "");
          setEditEmail(data.info.email || "");
          setEditLinkedin(data.info.linkedin || "https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleToggle = () => setInternalMobileOpen((prev) => !prev);
    const handleClose = () => setInternalMobileOpen(false);

    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    window.addEventListener("close-mobile-sidebar", handleClose);

    return () => {
      window.removeEventListener("toggle-mobile-sidebar", handleToggle);
      window.removeEventListener("close-mobile-sidebar", handleClose);
    };
  }, []);

  const isDrawerOpen = propMobileOpen !== undefined ? propMobileOpen : internalMobileOpen;
  const handleClose = () => {
    setInternalMobileOpen(false);
    if (propOnClose) propOnClose();
  };

  const isAdmin = effectiveRole === "ADMIN";
  const isExec = isAdmin || effectiveRole === "CHAIR_PERSON" || effectiveRole === "VICE_CHAIR";
  const isInstructor = effectiveRole === "INSTRUCTOR";
  const isStudent = effectiveRole === "STUDENT";

  const handleSaveSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupervisor(true);
    try {
      const res = await fetch("/api/admin/supervisor-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          title: editTitle,
          phone: editPhone,
          email: editEmail,
          linkedin: editLinkedin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSupervisor(data.info);
        setSupervisorSavedMsg(true);
        setTimeout(() => {
          setSupervisorSavedMsg(false);
          setShowEditSupervisorModal(false);
        }, 800);
      } else {
        alert(data.error || "Failed to update supervisor info.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSavingSupervisor(false);
    }
  };

  const navigation = [
    {
      name: isStudent ? "Student Portal" : "Dashboard Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      activeColor: "bg-[#269CF0] text-white",
    },
    {
      name: isStudent ? "My Lectures & Materials" : "Session Hubs",
      href: "/sessions",
      icon: Calendar,
      activeColor: "bg-[#269CF0] text-white",
    },
    {
      name: isStudent ? "Assignments & Submissions" : "Tasks & Assignments",
      href: "/tasks",
      icon: FileCheck2,
      activeColor: "bg-[#269CF0] text-white",
    },
    {
      name: isStudent ? "Attendance & Check-in" : "Classroom Attendance",
      href: "/attendance",
      icon: Users,
      activeColor: "bg-[#269CF0] text-white",
    },
    {
      name: "Hall & Lab Reservations",
      href: "/halls",
      icon: Building2,
      activeColor: "bg-[#48D5F5] text-[#07172A] font-black",
      show: !isStudent, // Available to Admin, Chairperson, Head, Vice Head, Core
    },
    {
      name: isStudent ? "Track Leaderboard" : "Weighted Leaderboard",
      href: "/leaderboard",
      icon: Award,
      activeColor: "bg-[#E5A93C] text-[#07172A] font-black",
    },
    {
      name: isStudent ? "My Certificates" : "Certificates Hub",
      href: "/certificates",
      icon: GraduationCap,
      activeColor: "bg-[#48D5F5] text-[#07172A] font-black",
      badge: undefined, // Removed per user request
    },
    {
      name: "Weekly Schedules & Broadcast",
      href: "/schedules",
      icon: CalendarDays,
      activeColor: "bg-[#269CF0] text-white",
      show: isAdmin, // Strictly locked to Main Admin
    },
    {
      name: "Reports & Export Suite",
      href: "/report",
      icon: FileText,
      activeColor: "bg-[#269CF0] text-white",
      show: isExec,
    },
    {
      name: "Student Admissions & Suspension",
      href: "/admin/students",
      icon: UserCheck,
      activeColor: "bg-[#269CF0] text-white",
      show: isExec,
    },
    {
      name: "Tracks & Team Structure",
      href: "/admin/teams",
      icon: Layers,
      activeColor: "bg-[#269CF0] text-white",
      show: isAdmin,
    },
    {
      name: "Manage Tracks (Add/Delete)",
      href: "/admin/tracks",
      icon: Layers,
      activeColor: "bg-[#269CF0] text-white",
      show: isAdmin,
    },
    {
      name: "Leadership Board",
      href: "/admin/leadership",
      icon: Crown,
      activeColor: "bg-[#E5A93C] text-[#07172A] font-black",
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`w-64 bg-[#07172A] border-r border-[#1E3A5F] flex flex-col flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4 no-print select-none z-40 transition-all duration-300 ${
          isDrawerOpen
            ? "fixed inset-y-0 left-0 top-0 h-full z-50 shadow-2xl flex"
            : "hidden lg:flex"
        }`}
      >
        {/* Category Header & Close Button on Mobile */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#E5A93C] uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NAVIGATION MENU</span>
          </div>
          {isDrawerOpen && (
            <button
              onClick={handleClose}
              className="lg:hidden p-1 rounded-lg text-[#8FA4BD] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {navigation
            .filter((item) => item.show !== false)
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                    isActive
                      ? `${item.activeColor} shadow-md glow-blue`
                      : "text-[#8FA4BD] hover:text-[#F5F7FB] hover:bg-[#10243C]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive
                          ? "text-current"
                          : "text-[#8FA4BD] group-hover:text-[#269CF0]"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                        isActive
                          ? "bg-[#07172A]/30 text-current"
                          : "bg-[#E5A93C]/10 text-[#E5A93C]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Bottom Branch Supervisor Card (Dynamic & Editable by Main Admin) */}
        <div className="pt-3 mt-3 border-t border-[#1E3A5F]">
          <div className="bg-[#0D1D32] p-3 rounded-2xl border border-[#1E3A5F] hover:border-[#269CF0] transition-all relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E5A93C] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#E5A93C]" />
                Branch Supervisor
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" title={supervisor.statusBadge} />
                {isAdmin && (
                  <button
                    onClick={() => setShowEditSupervisorModal(true)}
                    title="Edit Supervisor Details"
                    className="p-1 rounded bg-[#07172A] text-[#8FA4BD] hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <h4 className="text-xs font-black text-[#F5F7FB] leading-snug">{supervisor.name}</h4>
            <p className="text-[10px] text-[#8FA4BD] mb-1.5 font-medium leading-tight">{supervisor.title}</p>

            <div className="space-y-1 mb-2">
              {supervisor.phone && (
                <div className="flex items-center gap-1.5 text-[9px] text-[#8FA4BD]">
                  <Phone className="w-2.5 h-2.5 text-[#269CF0]" />
                  <span>{supervisor.phone}</span>
                </div>
              )}
              {supervisor.email && (
                <div className="flex items-center gap-1.5 text-[9px] text-[#8FA4BD]">
                  <Mail className="w-2.5 h-2.5 text-[#48D5F5]" />
                  <span className="truncate">{supervisor.email}</span>
                </div>
              )}
            </div>

            <a
              href={supervisor.linkedin || "https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#48D5F5] hover:text-[#269CF0] transition-colors"
            >
              <span>LinkedIn Profile</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* Main Admin Supervisor Edit Modal */}
      {showEditSupervisorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#F5F7FB]">Edit Branch Supervisor Card</h3>
                  <span className="text-[10px] text-[#8FA4BD]">Updates the bottom-left profile card across the site</span>
                </div>
              </div>
              <button
                onClick={() => setShowEditSupervisorModal(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {supervisorSavedMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Supervisor details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSupervisor} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Supervisor Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Role / Job Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +20 100 123 4567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Official Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. abdelrahman@branch.eelu.edu.eg"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/..."
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setShowEditSupervisorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupervisor}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingSupervisor ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
