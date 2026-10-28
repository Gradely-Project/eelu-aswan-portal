"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import QRCode from "qrcode";
import { exportToCSV } from "@/lib/exportCsv";
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Save,
  CheckCheck,
  AlertCircle,
  Calendar,
  QrCode,
  Sparkles,
  KeyRound,
  Filter,
  RefreshCw,
  ShieldCheck,
  Timer,
  FileSpreadsheet,
} from "lucide-react";

interface StudentAttendance {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    college: string | null;
    academicYear: string | null;
  };
  status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
  isMarked: boolean;
  notes: string;
  verificationMethod?: string | null;
  verifiedBy?: string | null;
}

interface SessionData {
  id: string;
  title: string;
  date: string;
  time: string | null;
  trackId: string;
  checkInCode: string | null;
  codeExpiresAt: string | null;
  track: {
    id: string;
    name: string;
  };
}

export default function ClassroomAttendanceSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eelu_user_role") || "STUDENT";
    }
    return "STUDENT";
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status Filter: "ALL" | "PRESENT" | "LATE" | "EXCUSED" | "ABSENT"
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dynamic Check-In Code & QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  // Student Self Check-in Input
  const [studentCodeInput, setStudentCodeInput] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  const fetchAttendance = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      setUserRole(meData.user?.role || "STUDENT");

      const res = await fetch(`/api/attendance?sessionId=${sessionId}`);
      const data = await res.json();

      if (res.ok) {
        setSession(data.session);
        setStudents(data.students || []);
        if (data.session?.checkInCode) setActiveCode(data.session.checkInCode);
      } else {
        setError(data.error || "Failed to load classroom attendance.");
      }
    } catch {
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeDirect = async (codeToVerify: string) => {
    setVerifyingCode(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY", sessionId, code: codeToVerify.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Attendance recorded successfully via QR code!");
        setStudentCodeInput("");
        await fetchAttendance();
      } else {
        setError(data.error || "Invalid or expired check-in code.");
      }
    } catch {
      setError("Network error while verifying QR code.");
    } finally {
      setVerifyingCode(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchAttendance();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get("code");
      if (codeParam) {
        setStudentCodeInput(codeParam);
        // Automatically check in if user is logged in
        verifyCodeDirect(codeParam);
      }
    }
  }, [sessionId]);

  // Generate dynamic QR base64 data URL instantly when activeCode changes
  useEffect(() => {
    if (activeCode) {
      const checkInUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/attendance/${sessionId}?code=${activeCode}`
          : `CODE:${activeCode}`;

      QRCode.toDataURL(checkInUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: "#07172A",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR rendering error:", err));
    }
  }, [activeCode, sessionId]);

  // 15-second auto-rotation timer for anti-cheating QR code
  useEffect(() => {
    if (!showQrModal || !isAutoRotating) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGenerateCode(true);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQrModal, isAutoRotating, sessionId]);

  const setStatusForStudent = (studentId: string, status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT") => {
    setStudents((prev) =>
      prev.map((s) => (s.student.id === studentId ? { ...s, status } : s))
    );
  };

  const setNotesForStudent = (studentId: string, notes: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.student.id === studentId ? { ...s, notes } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
  };

  const markAllAbsent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "ABSENT" })));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const records = students.map((s) => ({
        studentId: s.student.id,
        status: s.status,
        notes: s.notes,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, records }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Attendance saved and points updated in leaderboard.");
      } else {
        setError(data.error || "Failed to save attendance.");
      }
    } catch {
      setError("Connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = async (silent = false) => {
    if (!silent) setGeneratingCode(true);
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE", sessionId }),
      });
      const data = await res.json();
      if (res.ok && data.code) {
        setActiveCode(data.code);
        setTimeLeft(15);
        if (!silent) setShowQrModal(true);
      } else if (!silent) {
        alert(data.error || "Failed to generate code.");
      }
    } catch {
      if (!silent) alert("Network error.");
    } finally {
      if (!silent) setGeneratingCode(false);
    }
  };

  const handleExportCSV = () => {
    if (!session) return;
    const headers = [
      "#",
      "Student Name",
      "Email",
      "Phone",
      "College / Faculty",
      "Academic Year",
      "Attendance Status",
      "Verification Method",
      "Verified By",
      "Notes / Comments",
      "Recorded",
      "Session Title",
      "Track Name",
      "Session Date",
    ];

    const rows = students.map((s, idx) => [
      idx + 1,
      s.student.name,
      s.student.email,
      s.student.phone || "-",
      s.student.college || "-",
      s.student.academicYear || "-",
      s.status,
      s.verificationMethod || (s.isMarked ? "MANUAL" : "NOT_MARKED"),
      s.verifiedBy || (s.isMarked ? "Staff" : "-"),
      s.notes || "-",
      s.isMarked ? "Yes" : "No",
      session.title,
      session.track?.name || "-",
      session.date,
    ]);

    exportToCSV(`Attendance_${session.track?.name || "Track"}_${session.title}`, headers, rows);
  };

  const handleVerifyStudentCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingCode(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY", sessionId, code: studentCodeInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setStudentCodeInput("");
        await fetchAttendance();
      } else {
        setError(data.error || "Invalid code.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(userRole);

  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const lateCount = students.filter((s) => s.status === "LATE").length;
  const excusedCount = students.filter((s) => s.status === "EXCUSED").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;

  const filteredStudents = students.filter((s) => {
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={userRole} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Back link */}
          <div>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#8FA4BD] hover:text-[#48D5F5] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Session Hubs
            </Link>
          </div>

          {/* Session Header Card */}
          {session && (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-black text-[#48D5F5] uppercase tracking-wider bg-[#10243C] px-3 py-1 rounded-full border border-[#1E3A5F] inline-block mb-2">
                    TRACK: {session.track?.name}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] mb-1">
                    {session.title}
                  </h1>
                  <div className="flex items-center gap-4 text-xs font-semibold text-[#8FA4BD]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#269CF0]" />
                      {session.date}
                    </span>
                    {session.time && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        {session.time}
                      </span>
                    )}
                    <span>•</span>
                    <span>Total Enrolled: {students.length} Students</span>
                  </div>
                </div>

                {/* QR Code / Dynamic Code Action */}
                <div className="flex items-center gap-3">
                  {isStaff && (
                    <button
                      onClick={() => handleGenerateCode(false)}
                      disabled={generatingCode}
                      className="px-4 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      {activeCode ? `Show Code: ${activeCode}` : "Broadcast Check-in Code"}
                    </button>
                  )}

                  {/* Stat Counters */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <span className="text-base font-black text-emerald-400 block leading-tight">
                        {presentCount}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 uppercase">Present</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-center">
                      <span className="text-base font-black text-[#E5A93C] block leading-tight">
                        {lateCount}
                      </span>
                      <span className="text-[9px] font-bold text-[#E5A93C] uppercase">Late</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                      <span className="text-base font-black text-blue-400 block leading-tight">
                        {excusedCount}
                      </span>
                      <span className="text-[9px] font-bold text-blue-500 uppercase">Excused</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
                      <span className="text-base font-black text-rose-400 block leading-tight">
                        {absentCount}
                      </span>
                      <span className="text-[9px] font-bold text-rose-500 uppercase">Absent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Self Check-in Panel (if student) */}
          {!isStaff && (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm text-[#F5F7FB] mb-1 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#E5A93C]" />
                Live Classroom Check-in
              </h3>
              <p className="text-xs text-[#8FA4BD] mb-3">
                Enter the dynamic 6-digit code announced or displayed on screen by your instructor:
              </p>
              <form onSubmit={handleVerifyStudentCode} className="flex items-center gap-3 max-w-md">
                <input
                  type="text"
                  maxLength={6}
                  value={studentCodeInput}
                  onChange={(e) => setStudentCodeInput(e.target.value)}
                  placeholder="e.g. 748291"
                  className="flex-1 bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                />
                <button
                  type="submit"
                  disabled={verifyingCode}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  {verifyingCode ? "Verifying..." : "Confirm Presence"}
                </button>
              </form>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Attendance Controls Bar with Status Filters (User Requirement!) */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            {/* Filter Pills (All, Present, Late, Excused, Absent) */}
            <div className="flex items-center gap-1.5 bg-[#07172A] p-1 rounded-xl border border-[#1E3A5F] text-[11px] font-black">
              <span className="text-[#8FA4BD] px-2 text-[10px] uppercase">Filter:</span>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "ALL" ? "bg-[#269CF0] text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                All ({students.length})
              </button>
              <button
                onClick={() => setStatusFilter("PRESENT")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "PRESENT" ? "bg-emerald-600 text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                onClick={() => setStatusFilter("LATE")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "LATE" ? "bg-[#E5A93C] text-[#07172A]" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Late ({lateCount})
              </button>
              <button
                onClick={() => setStatusFilter("EXCUSED")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "EXCUSED" ? "bg-blue-600 text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Excused ({excusedCount})
              </button>
              <button
                onClick={() => setStatusFilter("ABSENT")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "ABSENT" ? "bg-rose-600 text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>

            {/* Quick Actions & Save (Staff only) */}
            {isStaff && (
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllPresent}
                  className="px-3 py-1.5 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="px-3 py-1.5 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition-colors"
                >
                  Mark All Absent
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0F243A] hover:bg-[#1E3A5F] border border-[#269CF0]/40 text-[#48D5F5] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Export classroom attendance to Excel / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export Excel (.csv)
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            )}
          </div>

          {/* Students Table */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#10243C] text-[#8FA4BD] font-black border-b border-[#1E3A5F]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Faculty & Academic Year</th>
                    <th className="py-3 px-4 text-center">Classroom Attendance Status</th>
                    <th className="py-3 px-4 min-w-[220px]">Verification Method & Verifier (طريقة التسجيل والمسؤول)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60">
                  {filteredStudents.map((item, idx) => (
                    <tr key={item.student.id} className="hover:bg-[#10243C]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#8FA4BD]">{idx + 1}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#F5F7FB] block">{item.student.name}</span>
                        <span className="text-[11px] text-[#8FA4BD] font-mono">{item.student.email}</span>
                      </td>

                      <td className="py-3.5 px-4 text-[#8FA4BD]">
                        <span>{item.student.college || "-"}</span>
                        {item.student.academicYear && (
                          <span className="block text-[10px] text-[#8FA4BD] mt-0.5">{item.student.academicYear}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isStaff ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setStatusForStudent(item.student.id, "PRESENT")}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                                item.status === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-[#07172A] text-[#8FA4BD] hover:text-emerald-400 border border-[#1E3A5F]"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusForStudent(item.student.id, "LATE")}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                                item.status === "LATE"
                                  ? "bg-[#E5A93C] text-[#07172A] shadow-sm"
                                  : "bg-[#07172A] text-[#8FA4BD] hover:text-[#E5A93C] border border-[#1E3A5F]"
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusForStudent(item.student.id, "EXCUSED")}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                                item.status === "EXCUSED"
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-[#07172A] text-[#8FA4BD] hover:text-blue-400 border border-[#1E3A5F]"
                              }`}
                            >
                              Excused
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusForStudent(item.student.id, "ABSENT")}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                                item.status === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-sm"
                                  : "bg-[#07172A] text-[#8FA4BD] hover:text-rose-400 border border-[#1E3A5F]"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            {item.status === "PRESENT" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                PRESENT
                              </span>
                            )}
                            {item.status === "LATE" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30">
                                LATE
                              </span>
                            )}
                            {item.status === "EXCUSED" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                EXCUSED
                              </span>
                            )}
                            {item.status === "ABSENT" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                ABSENT
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {item.isMarked || item.status === "PRESENT" ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.verificationMethod === "QR_CODE" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <QrCode className="w-3 h-3 text-emerald-400" />
                                  QR Code (سكان الطالب)
                                </span>
                              ) : item.verificationMethod === "ADMIN" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                                  Admin (الادمن الرئيسي)
                                </span>
                              ) : item.verificationMethod === "INSTRUCTOR" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30">
                                  <Users className="w-3 h-3 text-[#269CF0]" />
                                  Instructor (هيد/مدرب)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                  Manual (يدوي)
                                </span>
                              )}
                              {item.verifiedBy && (
                                <span className="text-[10px] text-[#8FA4BD] font-medium">
                                  بواسطة: {item.verifiedBy}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8FA4BD] italic">
                              — لم يُسجل بعد (غائب)
                            </span>
                          )}

                          {isStaff && (
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => setNotesForStudent(item.student.id, e.target.value)}
                              placeholder="ملاحظات / عذر إضافي..."
                              className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-[11px] text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                            />
                          )}
                          {!isStaff && item.notes && (
                            <p className="text-[10px] text-amber-300/80 italic">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isStaff && (
              <div className="p-4 bg-[#10243C] border-t border-[#1E3A5F] flex items-center justify-between">
                <span className="text-xs text-[#8FA4BD]">
                  Points will automatically re-calculate for the weighted leaderboard upon clicking Save.
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dynamic QR Code & Check-in Code Modal */}
      {showQrModal && activeCode && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative">
            <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-widest block mb-1">
              ANTI-CHEATING ACTIVE CHECK-IN
            </span>
            <h3 className="text-xl font-black text-[#F5F7FB] mb-3">
              Classroom Attendance QR
            </h3>

            {/* 15-second rotation countdown bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5 px-0.5">
                <span className="flex items-center gap-1.5 font-bold text-[#48D5F5] text-[11px]">
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingCode ? "animate-spin text-[#E5A93C]" : ""}`} />
                  Auto-rotates in: <span className="font-mono text-xs font-black text-white bg-[#10243C] px-1.5 py-0.5 rounded border border-[#1E3A5F]">{timeLeft}s</span>
                </span>
                <button
                  onClick={() => handleGenerateCode(false)}
                  disabled={generatingCode}
                  className="text-[10px] font-bold text-[#8FA4BD] hover:text-[#48D5F5] transition-colors"
                >
                  Rotate Now
                </button>
              </div>
              <div className="w-full bg-[#07172A] rounded-full h-2 overflow-hidden border border-[#1E3A5F]">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    timeLeft <= 4 ? "bg-rose-500" : timeLeft <= 8 ? "bg-[#E5A93C]" : "bg-[#48D5F5]"
                  }`}
                  style={{ width: `${(timeLeft / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Generated Dynamic Local QR Code for phone scanning */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border-2 border-[#269CF0] mb-3 shadow-xl">
              {qrDataUrl ? (
                <img
                  key={activeCode}
                  src={qrDataUrl}
                  alt={`Attendance Check-in QR Code ${activeCode}`}
                  className="w-48 h-48 object-contain transition-all duration-300 no-theme-invert"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-600 font-bold">
                  Generating secure dynamic QR...
                </div>
              )}
              <span className="text-[10px] font-bold text-gray-800 mt-1">
                Scan with mobile camera to check in
              </span>
            </div>

            {/* Big Code Display */}
            <div className="bg-[#07172A] border-2 border-[#269CF0] rounded-2xl p-3.5 mb-3 shadow-lg glow-blue">
              <span className="text-[10px] text-[#8FA4BD] uppercase font-bold block mb-1">
                or enter 6-digit code manually:
              </span>
              <span className="font-mono text-3xl font-black text-[#48D5F5] tracking-[0.25em] block">
                {activeCode}
              </span>
            </div>

            {/* Anti-Cheating Note */}
            <div className="bg-[#10243C] border border-emerald-500/30 rounded-xl p-2.5 mb-4 flex items-start gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#8FA4BD] leading-snug">
                <strong className="text-emerald-400 font-bold block">Anti-Proxy Security:</strong>
                QR code and digit token automatically rotate every 15 seconds. Screenshots sent outside the lecture hall expire instantly.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
