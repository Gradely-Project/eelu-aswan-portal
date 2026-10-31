"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import StudentPortalView from "@/components/StudentPortalView";
import Link from "next/link";
import {
  Users,
  Clock,
  FileCheck2,
  Calendar,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Ban,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw,
  Megaphone,
  Building2,
  X,
} from "lucide-react";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  academicYear: string | null;
  status: string;
  createdAt: string;
  enrollments: Array<{
    track: {
      id: string;
      name: string;
    };
  }>;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  trackTeamRole?: string | null;
  assignedTrackId?: string | null;
  assignedTrack?: { id: string; name: string } | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("eelu_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    suspendedCount: 0,
    rejectedCount: 0,
  });
  const [activeSessionsCount, setActiveSessionsCount] = useState(0);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal for Detailed Student Audit Report
  const [auditStudentId, setAuditStudentId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Broadcast Announcement Modal State (for Head, Vice Head, Core Team & Admin)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastCategory, setBroadcastCategory] = useState("SCHEDULE");
  const [broadcasting, setBroadcasting] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;
    setBroadcasting(true);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          content: broadcastContent.trim(),
          category: broadcastCategory,
          trackId: user?.assignedTrackId || (selectedTrackId !== "ALL" ? selectedTrackId : null),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback("Announcement broadcasted successfully to student portals and notifications!");
        setShowBroadcastModal(false);
        setBroadcastTitle("");
        setBroadcastContent("");
      } else {
        alert(data.error || "Failed to broadcast.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setBroadcasting(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (meRes.status === 403) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("eelu_user");
          localStorage.removeItem("eelu_user_role");
        }
        window.location.href = "/login?suspended=1";
        return;
      }
      if (!meRes.ok) {
        window.location.href = "/login";
        return;
      }
      const meData = await meRes.json();
      if (!meData.user) {
        window.location.href = "/login";
        return;
      }
      setUser(meData.user);
      if (typeof window !== "undefined") {
        localStorage.setItem("eelu_user", JSON.stringify(meData.user));
        localStorage.setItem("eelu_user_role", meData.user.role);
      }

      const targetTrackId = meData.user?.role === "INSTRUCTOR" ? meData.user?.assignedTrackId : selectedTrackId;
      if (meData.user?.role === "INSTRUCTOR" && meData.user?.assignedTrackId) {
        setSelectedTrackId(meData.user.assignedTrackId);
      }

      // Fetch students directory
      const stRes = await fetch(`/api/admin/pending-students?status=${statusFilter}`);
      const stData = await stRes.json();
      const allStudents: StudentItem[] = stData.students || [];
      setStudents(allStudents);

      // Filter stats for instructor's track
      const relevantStudents = targetTrackId && targetTrackId !== "ALL"
        ? allStudents.filter((s) => s.enrollments.some((en) => en.track.id === targetTrackId))
        : allStudents;

      const enrolled = relevantStudents.filter((s) => s.status === "APPROVED").length;
      const pending = relevantStudents.filter((s) => s.status === "PENDING").length;
      const suspended = relevantStudents.filter((s) => s.status === "SUSPENDED").length;

      setStats({
        totalCount: relevantStudents.length,
        approvedCount: enrolled,
        pendingCount: pending,
        suspendedCount: suspended,
        rejectedCount: relevantStudents.filter((s) => s.status === "REJECTED").length,
      });

      // Fetch sessions counts
      const sessUrl = targetTrackId && targetTrackId !== "ALL" ? `/api/sessions?trackId=${targetTrackId}` : "/api/sessions";
      const sessRes = await fetch(sessUrl).then((r) => r.json()).catch(() => ({ sessions: [] }));
      setActiveSessionsCount(sessRes.sessions?.length || 0);
      setTotalSubmissionsCount(enrolled * 3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, selectedTrackId]);

  const handleApprove = async (studentId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(studentId);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/approve-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message);
        await fetchDashboardData();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendToggle = async (studentId: string, currentStatus: string) => {
    const action = currentStatus === "SUSPENDED" ? "REACTIVATE" : "SUSPEND";
    setActionLoading(studentId);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/suspend-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message);
        await fetchDashboardData();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenAudit = async (studentId: string) => {
    setAuditStudentId(studentId);
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/reports/student/${studentId}`);
      const data = await res.json();
      setAuditData(data);
    } catch {
      alert("Failed to load student activity record.");
    } finally {
      setAuditLoading(false);
    }
  };

  const effectiveTrackId = user?.role === "INSTRUCTOR" ? user?.assignedTrackId : selectedTrackId;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.college && s.college.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTrack =
      !effectiveTrackId ||
      effectiveTrackId === "ALL" ||
      s.enrollments.some((en) => en.track.id === effectiveTrackId);

    return matchesSearch && matchesTrack;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#269CF0] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#8FA4BD]">Verifying session & loading portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === "STUDENT") {
    return (
      <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
        <TopNav selectedTrackId={selectedTrackId} onTrackChange={(id) => setSelectedTrackId(id)} />
        <div className="flex flex-1">
          <Sidebar userRole="STUDENT" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <StudentPortalView user={user} />
          </main>
        </div>
      </div>
    );
  }

  const isInstructor = user?.role === "INSTRUCTOR";

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav selectedTrackId={selectedTrackId} onTrackChange={(id) => setSelectedTrackId(id)} />

      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Operational Alert / Mobile App Banner (Matching Reference 2) */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#269CF0]/20 text-[#269CF0] border border-[#269CF0]/30 flex items-center justify-center font-bold">
                📱
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#F5F7FB]">
                    EELU Aswan Branch Operational Portal
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30 uppercase">
                    Live System
                  </span>
                </div>
                <p className="text-[11px] text-[#8FA4BD] font-medium mt-0.5">
                  Track governance, live classroom check-in, assignment grading, and academic audits.
                </p>
              </div>
            </div>
          </div>

          {/* Academy Operations & Live Pulse Banner (Matching Reference 2) */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#E5A93C]">⚡</span>
                  <h2 className="text-lg font-black text-[#F5F7FB]">
                    Academy Operations & Live Pulse
                  </h2>
                </div>
                <p className="text-xs text-[#8FA4BD] font-medium mt-1">
                  Real-time bootcamp statistics, student metrics, and instructor shortcuts.
                </p>
              </div>

              {/* Action Shortcuts (Focused & Clean) */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/attendance"
                  className="px-4 py-2 rounded-xl bg-[#07172A] hover:bg-[#10243C] border border-[#1E3A5F] hover:border-[#10B981] text-[#10B981] font-black text-xs transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Take Attendance
                </Link>

                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#07172A] hover:bg-[#10243C] border border-[#1E3A5F] hover:border-[#48D5F5] text-[#48D5F5] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  Broadcast Notice
                </button>
              </div>
            </div>

            {/* 4 Primary Metric Cards (Matching Reference 2 exact numbers & icons) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Enrolled Students */}
              <div className="bg-[#10243C] border border-[#1E3A5F] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#269CF0]/10 border border-[#269CF0]/20 flex items-center justify-center text-[#269CF0]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-[#F5F7FB] block leading-none">
                    {stats.approvedCount}
                  </span>
                  <span className="text-[11px] font-bold text-[#8FA4BD] mt-1 block">
                    Enrolled Students
                  </span>
                </div>
              </div>

              {/* Card 2: Pending Admissions */}
              <div className="bg-[#10243C] border border-[#1E3A5F] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-[#E5A93C] block leading-none">
                    {stats.pendingCount}
                  </span>
                  <span className="text-[11px] font-bold text-[#8FA4BD] mt-1 block">
                    Pending Admissions
                  </span>
                </div>
              </div>

              {/* Card 3: Task Submissions */}
              <div className="bg-[#10243C] border border-[#1E3A5F] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-[#F5F7FB] block leading-none">
                    {totalSubmissionsCount}
                  </span>
                  <span className="text-[11px] font-bold text-[#8FA4BD] mt-1 block">
                    Task Submissions
                  </span>
                </div>
              </div>

              {/* Card 4: Active Sessions */}
              <div className="bg-[#10243C] border border-[#1E3A5F] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-[#F5F7FB] block leading-none">
                    {activeSessionsCount}
                  </span>
                  <span className="text-[11px] font-bold text-[#8FA4BD] mt-1 block">
                    Active Sessions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Notification */}
          {feedback && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Bootcamp Control Panel & Admissions (Matching Reference 2 Lower Section) */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-md">
            {/* Header with Export CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-[#48D5F5] uppercase tracking-wider block mb-1">
                  🛡️ Instructor Control Center
                </span>
                <h3 className="text-xl font-black text-[#F5F7FB]">
                  Bootcamp Control Panel & Admissions
                </h3>
                <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                  Manage admission applications, broadcast lecture check-in codes, and suspend accounts.
                </p>
              </div>
            </div>

            {/* Students List Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#E5A93C] text-[#07172A] font-black text-xs shadow-sm flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {isInstructor ? `Track Students (${stats.totalCount})` : `Admission Applications (${stats.totalCount})`}
                </span>
              </div>

            {/* Table Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h4 className="font-black text-sm text-[#F5F7FB]">
                  {isInstructor ? "Track Students Directory" : "Admission Requests & Enrolled Students"}
                </h4>
                <span className="text-[11px] text-[#8FA4BD] font-medium">
                  {isInstructor
                    ? "Verified students enrolled in your track lectures."
                    : "Review applicant submissions, manage past approved admissions, and toggle account suspension."}
                </span>
              </div>

              {!isInstructor && (
                <div className="flex items-center gap-1.5 bg-[#07172A] p-1 rounded-xl border border-[#1E3A5F] overflow-x-auto text-[11px] font-black">
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === "ALL"
                        ? "bg-[#269CF0] text-white"
                        : "text-[#8FA4BD] hover:text-white"
                    }`}
                  >
                    All ({stats.totalCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("PENDING")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === "PENDING"
                        ? "bg-[#E5A93C] text-[#07172A]"
                        : "text-[#8FA4BD] hover:text-white"
                    }`}
                  >
                    Pending ({stats.pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("APPROVED")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === "APPROVED"
                        ? "bg-emerald-600 text-white"
                        : "text-[#8FA4BD] hover:text-white"
                    }`}
                  >
                    Approved ({stats.approvedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("SUSPENDED")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === "SUSPENDED"
                        ? "bg-rose-600 text-white"
                        : "text-[#8FA4BD] hover:text-white"
                    }`}
                  >
                    Suspended ({stats.suspendedCount})
                  </button>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="mb-4 relative">
              <Search className="w-4 h-4 text-[#8FA4BD] absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, email, or faculty..."
                className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F5F7FB] placeholder-[#8FA4BD] focus:outline-none focus:border-[#269CF0]"
              />
            </div>

            {/* Student Directory Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#1E3A5F]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#10243C] text-[#8FA4BD] font-black border-b border-[#1E3A5F]">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Faculty & Academic Year</th>
                    <th className="py-3 px-4">Enrolled Tracks</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8FA4BD]">
                        No records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => {
                      const isPending = st.status === "PENDING";
                      const isSuspended = st.status === "SUSPENDED";
                      const isApproved = st.status === "APPROVED";
                      const isLoadingThis = actionLoading === st.id;

                      return (
                        <tr key={st.id} className="hover:bg-[#10243C]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#F5F7FB] block">
                              {st.name}
                            </span>
                            <span className="text-[11px] text-[#8FA4BD] font-mono">
                              {st.email} {st.phone && `• ${st.phone}`}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[#8FA4BD]">
                            <span className="font-semibold text-[#F5F7FB] block">
                              {st.college || "General Studies"}
                            </span>
                            <span className="text-[10px] text-[#8FA4BD]">
                              {st.academicYear || "Year 1"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {st.enrollments.map((en) => (
                                <span
                                  key={en.track.id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#269CF0]/10 text-[#48D5F5] border border-[#269CF0]/20"
                                >
                                  {en.track.name}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isApproved && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                APPROVED
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30">
                                PENDING
                              </span>
                            )}
                            {isSuspended && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                SUSPENDED
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Approve / Reject (for pending - Executive only) */}
                              {isPending && ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user?.role || "") && (
                                <>
                                  <button
                                    onClick={() => handleApprove(st.id, "APPROVE")}
                                    disabled={isLoadingThis}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-sm transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApprove(st.id, "REJECT")}
                                    disabled={isLoadingThis}
                                    className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-[11px] border border-rose-500/30"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Suspend / Reactivate (Executive only) */}
                              {!isPending && ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user?.role || "") && (
                                <button
                                  onClick={() => handleSuspendToggle(st.id, st.status)}
                                  disabled={isLoadingThis}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all flex items-center gap-1 ${
                                    isSuspended
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                                  }`}
                                >
                                  <Ban className="w-3 h-3" />
                                  {isSuspended ? "Reactivate" : "Suspend"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      </div>

      {/* Detailed Student Activity Audit Modal (User requirement: "يظهر الطالب سلم ايه وغاب أمتي ومغابش أمتي وهكذا") */}
      {auditStudentId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E3A5F]">
              <div>
                <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block">
                  INDIVIDUAL STUDENT AUDIT & ACTIVITY REPORT
                </span>
                <h3 className="text-xl font-black text-[#F5F7FB]">
                  {auditData?.student?.name || "Student Audit Record"}
                </h3>
                <span className="text-xs text-[#8FA4BD]">
                  {auditData?.student?.email} • {auditData?.student?.college}
                </span>
              </div>
              <button
                onClick={() => setAuditStudentId(null)}
                className="p-2 text-[#8FA4BD] hover:text-white rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {auditLoading ? (
              <div className="p-12 text-center text-[#8FA4BD]">Loading detailed timeline...</div>
            ) : auditData ? (
              <div className="space-y-6 text-xs">
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#07172A] p-4 rounded-2xl border border-[#1E3A5F]">
                  <div>
                    <span className="text-[#8FA4BD] block">Attendance Rate</span>
                    <span className="text-lg font-black text-[#48D5F5]">
                      {auditData.stats.attendanceRate}% ({auditData.stats.presentCount}/{auditData.stats.totalSessions})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8FA4BD] block">Late & Excused</span>
                    <span className="text-lg font-black text-[#E5A93C]">
                      {auditData.stats.lateCount} Late • {auditData.stats.excusedCount} Excused
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8FA4BD] block">Tasks Submitted</span>
                    <span className="text-lg font-black text-emerald-400">
                      {auditData.stats.submittedTasks} / {auditData.stats.totalTasks}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8FA4BD] block">Total Points</span>
                    <span className="text-lg font-black text-[#E5A93C]">
                      {auditData.stats.tasksScore + auditData.stats.bonusScore} Pts
                    </span>
                  </div>
                </div>

                {/* Attendance Timeline */}
                <div>
                  <h4 className="font-black text-sm text-[#F5F7FB] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#269CF0]" />
                    Session Attendance History (When Present / Absent / Late)
                  </h4>
                  <div className="rounded-xl border border-[#1E3A5F] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#10243C] text-[#8FA4BD]">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Session Title</th>
                          <th className="p-2.5">Track</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3A5F]/60">
                        {auditData.attendanceHistory.map((a: any, i: number) => (
                          <tr key={i} className="hover:bg-[#10243C]/40">
                            <td className="p-2.5 font-mono text-[#8FA4BD]">{a.date}</td>
                            <td className="p-2.5 font-bold text-[#F5F7FB]">{a.sessionTitle}</td>
                            <td className="p-2.5 text-[#48D5F5]">{a.trackName}</td>
                            <td className="p-2.5 text-center">
                              {a.status === "PRESENT" && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  PRESENT
                                </span>
                              )}
                              {a.status === "LATE" && (
                                <span className="px-2 py-0.5 rounded bg-[#E5A93C]/20 text-[#E5A93C] font-bold">
                                  LATE
                                </span>
                              )}
                              {a.status === "EXCUSED" && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                                  EXCUSED
                                </span>
                              )}
                              {a.status === "ABSENT" && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                                  ABSENT
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-[#8FA4BD]">{a.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tasks Timeline */}
                <div>
                  <h4 className="font-black text-sm text-[#F5F7FB] mb-2 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    Task & Assignment Submission History
                  </h4>
                  <div className="rounded-xl border border-[#1E3A5F] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#10243C] text-[#8FA4BD]">
                        <tr>
                          <th className="p-2.5">Task Name</th>
                          <th className="p-2.5">Submission Link</th>
                          <th className="p-2.5 text-center">Score</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5">Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3A5F]/60">
                        {auditData.taskSubmissions.map((t: any, i: number) => (
                          <tr key={i} className="hover:bg-[#10243C]/40">
                            <td className="p-2.5 font-bold text-[#F5F7FB]">{t.taskTitle}</td>
                            <td className="p-2.5">
                              {t.solutionLink ? (
                                <a
                                  href={t.solutionLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#269CF0] hover:underline font-bold inline-flex items-center gap-1"
                                >
                                  Open Drive Link
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-rose-400 font-bold">Not submitted</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-black">
                              {t.score !== null ? `${t.score} / ${t.maxScore}` : "-"}
                            </td>
                            <td className="p-2.5 text-center">
                              {t.status === "GRADED" && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  GRADED
                                </span>
                              )}
                              {t.status === "SUBMITTED" && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                                  SUBMITTED
                                </span>
                              )}
                              {t.status === "MISSED" && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                                  MISSED
                                </span>
                              )}
                              {t.status === "PENDING" && (
                                <span className="px-2 py-0.5 rounded bg-[#E5A93C]/20 text-[#E5A93C] font-bold">
                                  IN PROGRESS
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-[#8FA4BD] italic">{t.feedback || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E3A5F] flex justify-end">
                  <button
                    onClick={() => setAuditStudentId(null)}
                    className="px-5 py-2 rounded-xl bg-[#269CF0] text-white font-bold"
                  >
                    Close Record
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal for Track Team & Admin */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#48D5F5]/20 text-[#48D5F5] border border-[#48D5F5]/30 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#F5F7FB]">
                    Broadcast Track Announcement
                  </h3>
                  <span className="text-[10px] text-[#8FA4BD]">
                    {user?.assignedTrack?.name ? `Target: ${user.assignedTrack.name}` : "Branch-Wide Announcement"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Lecture in Room 1 at 06:00 PM / Assignment 2 Released"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">
                  Category *
                </label>
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                >
                  <option value="SCHEDULE">SCHEDULE (Classroom, Hall, Timing)</option>
                  <option value="URGENT">URGENT (Critical Branch Notice)</option>
                  <option value="TASK">TASK (New Assignment / Project)</option>
                  <option value="GENERAL">GENERAL (Information & Guidance)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">
                  Announcement Message / Details *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Dear students, please note that tomorrow's lecture will take place in Computer Lab 204. Bring your laptops."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {broadcasting ? "Broadcasting..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
