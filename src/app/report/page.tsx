"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import { exportToCSV } from "@/lib/exportCsv";
import {
  Printer,
  Calendar,
  Layers,
  Award,
  FileSpreadsheet,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  X,
} from "lucide-react";

interface ReportStudentRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  academicYear: string;
  presentCount: number;
  attendanceRate: number;
  attendanceScore: number;
  tasksScore: number;
  bonusScore: number;
  totalScore: number;
  rank: number;
}

interface TrackData {
  id: string;
  name: string;
  description: string | null;
  instructors: Array<{
    id: string;
    name: string;
    email: string;
    trackTeamRole: string | null;
  }>;
}

interface Signatory {
  name: string;
  role: string;
  order: number;
  enabled: boolean;
}

interface SignatoriesConfig {
  showOfficialSeal: boolean;
  sealText: string;
  reportSignatories: Signatory[];
  certificateSignatories: Signatory[];
}

export default function ReportExportSuitePage() {
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [track, setTrack] = useState<TrackData | null>(null);
  const [sessionsCount, setSessionsCount] = useState<number>(0);
  const [reportRows, setReportRows] = useState<ReportStudentRow[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Mode: "TRACK_MATRIX" | "INDIVIDUAL_STUDENT"
  const [reportMode, setReportMode] = useState<"TRACK_MATRIX" | "INDIVIDUAL_STUDENT">("TRACK_MATRIX");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentAuditData, setStudentAuditData] = useState<any | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eelu_user_role") || "ADMIN";
    }
    return "ADMIN";
  });

  // Dynamic Signatories Configuration
  const [signatoriesConfig, setSignatoriesConfig] = useState<SignatoriesConfig | null>(null);
  const [showSignatoriesModal, setShowSignatoriesModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SignatoriesConfig | null>(null);
  const [savingSignatories, setSavingSignatories] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/tracks").then((r) => r.json()),
      fetch("/api/admin/signatories").then((r) => r.json()),
    ])
      .then(([meData, trackData, sigData]) => {
        const u = meData.user;
        if (u?.role) setUserRole(u.role);
        if (sigData.config) setSignatoriesConfig(sigData.config);

        const allTracks = trackData.tracks || [];
        if (u?.role === "INSTRUCTOR" && u.assignedTrackId) {
          const myTracks = allTracks.filter((t: any) => t.id === u.assignedTrackId);
          setTracks(myTracks.length > 0 ? myTracks : (u.assignedTrack ? [u.assignedTrack] : []));
          setSelectedTrackId(u.assignedTrackId);
        } else {
          setTracks(allTracks);
          if (allTracks.length > 0) setSelectedTrackId(allTracks[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (!selectedTrackId) return;

    setLoading(true);
    fetch(`/api/reports/track?trackId=${selectedTrackId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.track) {
          setTrack(data.track);
          setSessionsCount(data.sessions?.length || 0);
          const rows = data.reportRows || [];
          setReportRows(rows);
          setGeneratedAt(data.generatedAt || new Date().toLocaleDateString("en-US"));
          if (rows.length > 0) {
            const exists = rows.some((r: any) => r.id === selectedStudentId);
            if (!exists) {
              setSelectedStudentId(rows[0].id);
            }
          } else {
            setSelectedStudentId("");
            setStudentAuditData(null);
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedTrackId]);

  useEffect(() => {
    if (reportMode === "INDIVIDUAL_STUDENT" && selectedStudentId) {
      setStudentLoading(true);
      fetch(`/api/reports/student/${selectedStudentId}`)
        .then((r) => r.json())
        .then((d) => setStudentAuditData(d))
        .catch((e) => console.error(e))
        .finally(() => setStudentLoading(false));
    }
  }, [reportMode, selectedStudentId]);

  const handleOpenSignatoriesModal = () => {
    if (signatoriesConfig) {
      setEditingConfig(JSON.parse(JSON.stringify(signatoriesConfig)));
      setShowSignatoriesModal(true);
    }
  };

  const handleSaveSignatories = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    setSavingSignatories(true);
    try {
      const res = await fetch("/api/admin/signatories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingConfig),
      });
      const data = await res.json();
      if (data.config) {
        setSignatoriesConfig(data.config);
        setShowSignatoriesModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSignatories(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportTrackCSV = () => {
    if (!track) return;
    const headers = [
      "Rank",
      "Student Name",
      "Email",
      "Phone",
      "College / Faculty",
      "Academic Year",
      "Sessions Attended",
      "Attendance Rate (%)",
      "Attendance Points",
      "Tasks Score",
      "Bonus Points",
      "Cumulative Total Score",
      "Track Name",
      "Report Date",
    ];

    const rows = reportRows.map((r) => [
      r.rank,
      r.name,
      r.email,
      r.phone || "-",
      r.college || "-",
      r.academicYear || "-",
      r.presentCount,
      `${r.attendanceRate}%`,
      r.attendanceScore,
      r.tasksScore,
      r.bonusScore,
      r.totalScore,
      track.name,
      generatedAt,
    ]);

    exportToCSV(`EELU_Report_${track.name}`, headers, rows);
  };

  const headInstructor = track?.instructors.find((i) => i.trackTeamRole === "HEAD");
  const viceInstructor = track?.instructors.find((i) => i.trackTeamRole === "VICE_HEAD");
  const coreInstructors = track?.instructors.filter((i) => i.trackTeamRole === "CORE_TEAM") || [];

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans overflow-x-hidden">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={userRole} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Control Bar (Screen only, hidden during print) */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-sm">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-0.5">
                EXECUTIVE EXPORT SUITE
              </span>
              <h1 className="text-xl font-black text-[#F5F7FB] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#269CF0]" />
                Official Academic Performance & Audit Report
              </h1>
              <p className="text-xs text-[#8FA4BD]">
                Formatted for formal A4 printing and PDF export with academic supervisor certification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Report Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#07172A] p-1 rounded-xl border border-[#1E3A5F] text-xs font-bold">
                <button
                  onClick={() => setReportMode("TRACK_MATRIX")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reportMode === "TRACK_MATRIX"
                      ? "bg-[#269CF0] text-white shadow-sm"
                      : "text-[#8FA4BD] hover:text-white"
                  }`}
                >
                  Full Track Matrix
                </button>
                <button
                  onClick={() => setReportMode("INDIVIDUAL_STUDENT")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reportMode === "INDIVIDUAL_STUDENT"
                      ? "bg-[#269CF0] text-white shadow-sm"
                      : "text-[#8FA4BD] hover:text-white"
                  }`}
                >
                  Individual Student Audit
                </button>
              </div>

              {/* Track Selector */}
              {tracks.length > 0 && (
                <div className="flex items-center gap-2 bg-[#07172A] px-3 py-1.5 rounded-xl border border-[#1E3A5F]">
                  <span className="text-xs font-bold text-[#8FA4BD]">Track:</span>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="font-bold text-xs text-[#48D5F5] bg-transparent focus:outline-none cursor-pointer"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#0D1D32] text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Selector (If Individual Mode) */}
              {reportMode === "INDIVIDUAL_STUDENT" && reportRows.length > 0 && (
                <div className="flex items-center gap-2 bg-[#07172A] px-3 py-1.5 rounded-xl border border-[#1E3A5F]">
                  <span className="text-xs font-bold text-[#8FA4BD]">Student:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="font-bold text-xs text-[#E5A93C] bg-transparent focus:outline-none cursor-pointer max-w-[160px] truncate"
                  >
                    {reportRows.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0D1D32] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reportMode === "TRACK_MATRIX" && reportRows.length > 0 && (
                <button
                  onClick={handleExportTrackCSV}
                  className="px-3.5 py-2 rounded-xl bg-[#0F243A] hover:bg-[#1E3A5F] border border-[#269CF0]/40 text-[#48D5F5] font-black text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Export official performance matrix to Excel (.csv)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Export Excel (.csv)</span>
                </button>
              )}

              {/* Signatories Manager Button (Admin / Chairperson) */}
              {["ADMIN", "CHAIR_PERSON"].includes(userRole) && signatoriesConfig && (
                <button
                  onClick={handleOpenSignatoriesModal}
                  className="px-3.5 py-2 rounded-xl bg-[#0D1D32] hover:bg-[#1E3A5F] border border-[#E5A93C]/40 text-[#E5A93C] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Customize who signs the report, their titles, order, and toggle the official seal"
                >
                  <Settings className="w-4 h-4 text-[#E5A93C]" />
                  <span className="hidden md:inline">Signatures & Seal</span>
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Printable Sheet (Stylized for screen and print) */}
          {loading ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center text-[#8FA4BD]">
              Loading report matrix...
            </div>
          ) : !track ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center text-[#8FA4BD]">
              No track records available.
            </div>
          ) : reportMode === "TRACK_MATRIX" ? (
            /* VIEW 1: FULL TRACK MATRIX REPORT */
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-[760px] bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-300 print-page text-xs font-sans">
                {/* Report Header with Official Logo */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-300 bg-white p-1">
                      <Image
                        src="/logo.jpeg"
                        alt="Branch Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                        EELU Aswan Student Branch
                      </h2>
                      <span className="text-xs font-black text-blue-900 block mt-0.5 uppercase tracking-wider">
                        Academy Academic Operations & Track Roster Report
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Generated On: {generatedAt}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Specialized Bootcamp Track
                    </span>
                    <span className="text-xl font-black text-blue-900 uppercase">
                      {track.name}
                    </span>
                    <span className="text-xs text-slate-600 block mt-1 font-semibold">
                      Total Enrolled: {reportRows.length} Students
                    </span>
                  </div>
                </div>

                {/* Instructors in Charge */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-xs grid grid-cols-3 gap-4">
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">
                      Lead Instructor (Head)
                    </span>
                    <span className="font-black text-slate-900">
                      {headInstructor ? headInstructor.name : "Not Assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">
                      Vice Head
                    </span>
                    <span className="font-black text-slate-900">
                      {viceInstructor ? viceInstructor.name : "Not Assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">
                      Core Instructors
                    </span>
                    <span className="font-black text-slate-900">
                      {coreInstructors.length > 0
                        ? coreInstructors.map((c) => c.name).join(", ")
                        : "Not Assigned"}
                    </span>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto mb-10">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black border-y-2 border-slate-300">
                        <th className="py-2.5 px-3 text-center">Rank</th>
                        <th className="py-2.5 px-3">Student Full Name</th>
                        <th className="py-2.5 px-3">Faculty & Year</th>
                        <th className="py-2.5 px-3 text-center">Attendance %</th>
                        <th className="py-2.5 px-3 text-center">Att. Pts</th>
                        <th className="py-2.5 px-3 text-center">Tasks Pts</th>
                        <th className="py-2.5 px-3 text-center">Bonus Pts</th>
                        <th className="py-2.5 px-3 text-center bg-slate-200">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportRows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-black">
                            #{r.rank}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-950 block">{r.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{r.email}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {r.college} {r.academicYear && `(${r.academicYear})`}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            {r.attendanceRate}% ({r.presentCount}/{sessionsCount})
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-blue-800">
                            {r.attendanceScore}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-800">
                            {r.tasksScore}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-amber-700">
                            +{r.bonusScore}
                          </td>
                          <td className="py-2 px-3 text-center font-black text-sm bg-slate-100 text-slate-950">
                            {r.totalScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Official Academic Signatures (Controlled Dynamically by Admin) */}
                <div
                  className={`pt-8 border-t-2 border-slate-300 grid gap-4 text-center text-xs ${
                    signatoriesConfig?.showOfficialSeal
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {(signatoriesConfig?.reportSignatories || [
                    { name: "Eng. Abdelrahman Mahmoud", role: "Software & Technology Director", order: 1, enabled: true },
                    { name: "Eng. Mostafa Hassan", role: "Branch Chairperson", order: 2, enabled: true },
                    { name: "Prof. Dr. Ahmed El-Sayed", role: "Academic Branch Supervisor", order: 3, enabled: true },
                  ])
                    .filter((s) => s.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map((sig, idx) => (
                      <div key={idx} className="flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-slate-600 block uppercase text-[10px]">
                            {sig.role}
                          </span>
                          <span className="font-black text-slate-900 block mt-1 text-xs">
                            {sig.name}
                          </span>
                        </div>
                        <span className="text-slate-400 block font-mono mt-10">
                          ...................................
                        </span>
                      </div>
                    ))}

                  {/* Official Branch Seal (Toggleable by Admin) */}
                  {signatoriesConfig?.showOfficialSeal && (
                    <div className="flex flex-col justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-600 block uppercase text-[10px]">
                          Official Branch Seal
                        </span>
                        <div className="w-10 h-10 mx-auto rounded-full border border-blue-900/30 flex items-center justify-center my-1.5">
                          <ShieldCheck className="w-5 h-5 text-blue-900" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-blue-950 block">
                          {signatoriesConfig.sealText || "Verified Branch Seal"}
                        </span>
                      </div>
                      <span className="text-slate-400 block font-mono mt-4">
                        ...................................
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: INDIVIDUAL STUDENT AUDIT REPORT */
            studentLoading || !studentAuditData ? (
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center text-[#8FA4BD]">
                Loading student transcript & timeline...
              </div>
            ) : (
              <div className="w-full overflow-x-auto pb-4">
                <div className="min-w-[760px] bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-300 print-page text-xs font-sans">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-300 bg-white p-1">
                        <Image
                          src="/logo.jpeg"
                          alt="Branch Logo"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                          EELU Aswan Student Branch
                        </h2>
                        <span className="text-xs font-black text-blue-900 block mt-0.5 uppercase tracking-wider">
                          Official Student Academic Performance Transcript
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Generated On: {generatedAt}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Enrolled Track
                      </span>
                      <span className="text-xl font-black text-blue-900 uppercase">
                        {track.name}
                      </span>
                    </div>
                  </div>

                  {/* Student Personal Profile Box */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Student Full Name
                      </span>
                      <span className="text-sm font-black text-slate-950 block mt-0.5">
                        {studentAuditData.student.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Personal Email
                      </span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5 font-mono">
                        {studentAuditData.student.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Faculty & Year
                      </span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">
                        {studentAuditData.student.college || "-"} ({studentAuditData.student.academicYear || "-"})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Phone / WhatsApp
                      </span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5 font-mono">
                        {studentAuditData.student.phone || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Score Summary Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <span className="text-[10px] font-black uppercase text-blue-800 block">
                        Attendance Rate
                      </span>
                      <span className="text-2xl font-black text-blue-900 mt-1 block">
                        {studentAuditData.stats.attendanceRate}%
                      </span>
                      <span className="text-[10px] text-blue-700">
                        {studentAuditData.stats.presentCount}/{studentAuditData.stats.totalSessions} Sessions Attended
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[10px] font-black uppercase text-emerald-800 block">
                        Tasks Completed
                      </span>
                      <span className="text-2xl font-black text-emerald-900 mt-1 block">
                        {studentAuditData.stats.submittedTasks}/{studentAuditData.stats.totalTasks}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Score: {studentAuditData.stats.tasksScore} Pts
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <span className="text-[10px] font-black uppercase text-amber-800 block">
                        Bonus Points
                      </span>
                      <span className="text-2xl font-black text-amber-900 mt-1 block">
                        +{studentAuditData.stats.bonusScore}
                      </span>
                      <span className="text-[10px] text-amber-700">
                        Tournaments & Activities
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-center">
                      <span className="text-[10px] font-black uppercase text-slate-800 block">
                        Total Standing Score
                      </span>
                      <span className="text-2xl font-black text-slate-950 mt-1 block">
                        {(studentAuditData.stats.presentCount * 10) + studentAuditData.stats.tasksScore + studentAuditData.stats.bonusScore}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        Total Calculated Points
                      </span>
                    </div>
                  </div>

                  {/* Section A: Attendance Timeline */}
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-slate-900 mb-3 pb-1 border-b border-slate-300 flex items-center justify-between">
                      <span>A. Detailed Session Attendance Record</span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Total Lectures: {studentAuditData.attendanceHistory.length}
                      </span>
                    </h3>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-y border-slate-300">
                          <th className="py-2 px-3">Session Title</th>
                          <th className="py-2 px-3">Date & Time</th>
                          <th className="py-2 px-3 text-center">Attendance Status</th>
                          <th className="py-2 px-3">Remarks / Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {studentAuditData.attendanceHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-500">
                              No session records recorded yet.
                            </td>
                          </tr>
                        ) : (
                          studentAuditData.attendanceHistory.map((att: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-950">
                                {att.sessionTitle}
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                {att.date} {att.time ? `• ${att.time}` : ""}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    att.status === "PRESENT"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : att.status === "LATE"
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : att.status === "EXCUSED"
                                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                                      : "bg-rose-100 text-rose-800 border border-rose-300"
                                  }`}
                                >
                                  {att.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {att.notes || (att.status === "PRESENT" ? "Verified" : "-")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section B: Task Submissions */}
                  <div className="mb-10">
                    <h3 className="text-sm font-black text-slate-900 mb-3 pb-1 border-b border-slate-300 flex items-center justify-between">
                      <span>B. Practical Task Assignments & Project Submissions</span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Total Tasks: {studentAuditData.taskSubmissions.length}
                      </span>
                    </h3>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-y border-slate-300">
                          <th className="py-2 px-3">Task Title</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3">Submission Link</th>
                          <th className="py-2 px-3 text-center">Score</th>
                          <th className="py-2 px-3">Instructor Feedback</th>
                          <th className="py-2 px-3">Graded By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {studentAuditData.taskSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-500">
                              No assignments assigned yet.
                            </td>
                          </tr>
                        ) : (
                          studentAuditData.taskSubmissions.map((task: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-950">
                                {task.taskTitle}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {task.status === "GRADED" && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Graded
                                  </span>
                                )}
                                {task.status === "SUBMITTED" && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                                    Submitted
                                  </span>
                                )}
                                {task.status === "PENDING" && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                    Pending
                                  </span>
                                )}
                                {task.status === "MISSED" && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                    Missed
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {task.solutionLink ? (
                                  <a
                                    href={task.solutionLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline font-mono text-[11px] truncate max-w-[200px] block"
                                  >
                                    {task.solutionLink}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-medium text-[10px]">
                                    {task.status === "PENDING" ? "Waiting submission" : "No submission"}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center font-black text-sm">
                                {task.submitted ? (
                                  <span className="text-emerald-800">
                                    {task.score !== null ? task.score : "-"}/{task.maxScore}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0/{task.maxScore}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-700 italic">
                                {task.feedback || "-"}
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {task.gradedBy || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Official Signatures (Dynamically configured) */}
                  <div
                    className={`pt-8 border-t-2 border-slate-300 grid gap-6 text-center text-xs ${
                      signatoriesConfig?.showOfficialSeal
                        ? "grid-cols-2 sm:grid-cols-4"
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}
                  >
                    {(signatoriesConfig?.reportSignatories || [
                      { name: "Eng. Abdelrahman Mahmoud", role: "Software & Technology Director", order: 1, enabled: true },
                      { name: "Eng. Mostafa Hassan", role: "Branch Chairperson", order: 2, enabled: true },
                      { name: "Prof. Dr. Ahmed El-Sayed", role: "Academic Branch Supervisor", order: 3, enabled: true },
                    ])
                      .filter((s) => s.enabled)
                      .sort((a, b) => a.order - b.order)
                      .map((sig, idx) => (
                        <div key={idx} className="flex flex-col justify-between">
                          <div>
                            <span className="font-bold text-slate-600 block uppercase text-[10px]">
                              {sig.role}
                            </span>
                            <span className="font-black text-slate-900 block mt-1 text-xs">
                              {sig.name}
                            </span>
                          </div>
                          <span className="text-slate-400 block font-mono mt-10">
                            ...................................
                          </span>
                        </div>
                      ))}

                    {/* Optional Branch Seal */}
                    {signatoriesConfig?.showOfficialSeal && (
                      <div className="flex flex-col justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-600 block uppercase text-[10px]">
                            Official Branch Seal
                          </span>
                          <div className="w-10 h-10 mx-auto rounded-full border border-blue-900/30 flex items-center justify-center my-1.5">
                            <ShieldCheck className="w-5 h-5 text-blue-900" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-blue-950 block">
                            {signatoriesConfig.sealText || "Verified Branch Seal"}
                          </span>
                        </div>
                        <span className="text-slate-400 block font-mono mt-4">
                          ...................................
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Admin Signatories Customization Modal */}
          {showSignatoriesModal && editingConfig && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-5 my-auto">
                <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#E5A93C]" />
                    <h3 className="font-black text-base text-[#F5F7FB]">
                      Report & Certificate Signatures Control
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowSignatoriesModal(false)}
                    className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSignatories} className="space-y-4">
                  {/* Seal Toggle */}
                  <div className="p-3 bg-[#07172A] rounded-xl border border-[#1E3A5F] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs block text-[#F5F7FB]">
                        Official Branch Seal
                      </span>
                      <span className="text-[11px] text-[#8FA4BD]">
                        Display the official verification seal and badge on printed documents
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingConfig.showOfficialSeal}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            showOfficialSeal: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#269CF0]"></div>
                    </label>
                  </div>

                  {/* Report Signatories List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                        Report Signatories ({editingConfig.reportSignatories.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingConfig({
                            ...editingConfig,
                            reportSignatories: [
                              ...editingConfig.reportSignatories,
                              {
                                name: "New Official Name",
                                role: "Position / Role",
                                order: editingConfig.reportSignatories.length + 1,
                                enabled: true,
                              },
                            ],
                          })
                        }
                        className="text-xs text-[#48D5F5] hover:underline flex items-center gap-1 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Signer
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {editingConfig.reportSignatories.map((sig, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-[#07172A] p-2 rounded-xl border border-[#1E3A5F]"
                        >
                          <input
                            type="number"
                            value={sig.order}
                            onChange={(e) => {
                              const updated = [...editingConfig.reportSignatories];
                              updated[idx].order = Number(e.target.value);
                              setEditingConfig({ ...editingConfig, reportSignatories: updated });
                            }}
                            className="w-12 bg-[#0D1D32] border border-[#1E3A5F] rounded-lg px-2 py-1 text-xs text-center font-bold"
                            title="Order"
                          />
                          <input
                            type="text"
                            value={sig.name}
                            onChange={(e) => {
                              const updated = [...editingConfig.reportSignatories];
                              updated[idx].name = e.target.value;
                              setEditingConfig({ ...editingConfig, reportSignatories: updated });
                            }}
                            placeholder="Signatory Name"
                            className="flex-1 bg-[#0D1D32] border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-xs"
                          />
                          <input
                            type="text"
                            value={sig.role}
                            onChange={(e) => {
                              const updated = [...editingConfig.reportSignatories];
                              updated[idx].role = e.target.value;
                              setEditingConfig({ ...editingConfig, reportSignatories: updated });
                            }}
                            placeholder="Role / Title"
                            className="flex-1 bg-[#0D1D32] border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingConfig.reportSignatories.filter((_, i) => i !== idx);
                              setEditingConfig({ ...editingConfig, reportSignatories: updated });
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSignatoriesModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSignatories}
                      className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {savingSignatories ? "Saving..." : "Save Signatures"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
