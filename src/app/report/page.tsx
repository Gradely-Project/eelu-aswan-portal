"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
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

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/tracks").then((r) => r.json()),
    ])
      .then(([meData, trackData]) => {
        const u = meData.user;
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
          setReportRows(data.reportRows || []);
          setGeneratedAt(data.generatedAt || new Date().toLocaleDateString("en-US"));
          if (data.reportRows?.length > 0 && !selectedStudentId) {
            setSelectedStudentId(data.reportRows[0].id);
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

  const handlePrint = () => {
    window.print();
  };

  const headInstructor = track?.instructors.find((i) => i.trackTeamRole === "HEAD");
  const viceInstructor = track?.instructors.find((i) => i.trackTeamRole === "VICE_HEAD");
  const coreInstructors = track?.instructors.filter((i) => i.trackTeamRole === "CORE_TEAM") || [];

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole="ADMIN" />

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

            <div className="flex flex-wrap items-center gap-3">
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

              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
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
            <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-300 print-page text-xs font-sans">
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

              {/* Official Academic Signatures */}
              <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-4 gap-4 text-center text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                    Academic Supervisor
                  </span>
                  <span className="text-slate-400 block font-mono">...................................</span>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                    Head of Track
                  </span>
                  <span className="text-slate-400 block font-mono">...................................</span>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                    Branch Chairperson
                  </span>
                  <span className="text-slate-400 block font-mono">...................................</span>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                    Official Branch Seal
                  </span>
                  <span className="text-slate-400 block font-mono">...................................</span>
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
              <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-300 print-page text-xs font-sans">
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
                    <span className="text-xs text-slate-600 block mt-1 font-semibold">
                      Student ID: {studentAuditData.student.id.slice(-8).toUpperCase()}
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
                        <th className="py-2 px-3">Classroom / Location</th>
                        <th className="py-2 px-3 text-center">Attendance Status</th>
                        <th className="py-2 px-3">Remarks / Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentAuditData.attendanceHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">
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
                            <td className="py-2 px-3 text-slate-600">
                              {att.location || "-"}
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
                        <th className="py-2 px-3">Submission Link</th>
                        <th className="py-2 px-3 text-center">Score</th>
                        <th className="py-2 px-3">Instructor Feedback</th>
                        <th className="py-2 px-3">Graded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentAuditData.taskSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">
                            No assignments assigned yet.
                          </td>
                        </tr>
                      ) : (
                        studentAuditData.taskSubmissions.map((task: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-950">
                              {task.taskTitle}
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
                                <span className="text-rose-600 font-bold text-[10px]">
                                  Not Submitted
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

                {/* Official Signatures */}
                <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-4 gap-4 text-center text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                      Academic Supervisor
                    </span>
                    <span className="text-slate-400 block font-mono">...................................</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                      Head of Track
                    </span>
                    <span className="text-slate-400 block font-mono">...................................</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                      Branch Chairperson
                    </span>
                    <span className="text-slate-400 block font-mono">...................................</span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-12 uppercase text-[10px]">
                      Official Branch Seal
                    </span>
                    <span className="text-slate-400 block font-mono">...................................</span>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
