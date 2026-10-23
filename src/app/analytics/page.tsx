"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  LineChart,
  Search,
  Eye,
  Calendar,
  FileCheck2,
  ExternalLink,
  Award,
  Users,
} from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  academicYear: string | null;
  status: string;
  enrollments: Array<{ track: { id: string; name: string } }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Detailed Modal
  const [auditStudentId, setAuditStudentId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        const role = me.user?.role;
        if (!["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(role)) {
          router.replace("/dashboard");
          return;
        }

        Promise.all([
          fetch("/api/admin/pending-students?status=ALL").then((r) => r.json()),
          fetch("/api/tracks").then((r) => r.json()),
        ])
          .then(([studentsRes, tracksRes]) => {
            if (studentsRes.students) setStudents(studentsRes.students);
            if (tracksRes.tracks) setTracks(tracksRes.tracks);
          })
          .catch((e) => console.error(e))
          .finally(() => setLoading(false));
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  const handleOpenAudit = async (studentId: string) => {
    setAuditStudentId(studentId);
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/reports/student/${studentId}`);
      const data = await res.json();
      setAuditData(data);
    } catch {
      alert("Failed to load audit history.");
    } finally {
      setAuditLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.college && s.college.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTrack =
      selectedTrackId === "ALL" ||
      s.enrollments.some((en) => en.track.id === selectedTrackId);

    return matchesSearch && matchesTrack;
  });

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav
        selectedTrackId={selectedTrackId}
        onTrackChange={(tId) => setSelectedTrackId(tId)}
      />

      <div className="flex flex-1">
        <Sidebar userRole="ADMIN" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                STUDENT PERFORMANCE ANALYTICS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB]">
                Student Activity & Performance Audits
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Inspect any student's complete historical timeline: exact sessions attended, late arrivals, absences, and submitted task drive links.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8FA4BD]">Showing:</span>
              <span className="px-3 py-1 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-xs font-black text-[#48D5F5]">
                {filtered.length} Students
              </span>
            </div>
          </div>

          {/* Track Filter Pills Bar */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-black text-[#8FA4BD] uppercase tracking-wider pl-2 flex-shrink-0">
              Filter By Track:
            </span>
            <button
              onClick={() => setSelectedTrackId("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                selectedTrackId === "ALL"
                  ? "bg-[#269CF0] text-white shadow-md shadow-[#269CF0]/25"
                  : "bg-[#07172A] text-[#8FA4BD] hover:text-white border border-[#1E3A5F]"
              }`}
            >
              All Tracks ({students.length})
            </button>
            {tracks.map((t) => {
              const count = students.filter((s) =>
                s.enrollments.some((en) => en.track.id === t.id)
              ).length;
              const isSelected = selectedTrackId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-[#269CF0] text-white shadow-md shadow-[#269CF0]/25"
                      : "bg-[#07172A] text-[#8FA4BD] hover:text-white border border-[#1E3A5F]"
                  }`}
                >
                  {t.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8FA4BD] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, faculty, or email..."
              className="w-full bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl pl-10 pr-4 py-3 text-xs text-[#F5F7FB] placeholder-[#8FA4BD] focus:outline-none focus:border-[#269CF0]"
            />
          </div>

          {/* Table */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#10243C] text-[#8FA4BD] font-black border-b border-[#1E3A5F]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Faculty & Year</th>
                    <th className="py-3 px-4">Enrolled Tracks</th>
                    <th className="py-3 px-4 text-center">Account Status</th>
                    <th className="py-3 px-4 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8FA4BD]">
                        Loading analytics data...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8FA4BD]">
                        No students match search query.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((st) => (
                      <tr key={st.id} className="hover:bg-[#10243C]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#F5F7FB] block">{st.name}</span>
                          <span className="text-[11px] text-[#8FA4BD] font-mono">{st.email}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#8FA4BD]">
                          <span className="font-semibold text-[#F5F7FB] block">{st.college || "-"}</span>
                          <span className="text-[10px] text-[#8FA4BD]">{st.academicYear || "-"}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {st.enrollments.map((en) => (
                              <span
                                key={en.track.id}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#269CF0]/10 text-[#48D5F5] border border-[#269CF0]/20"
                              >
                                {en.track.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              st.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : st.status === "SUSPENDED"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-[#E5A93C]/20 text-[#E5A93C]"
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAudit(st.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Full Audit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Student Audit Modal */}
      {auditStudentId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E3A5F]">
              <div>
                <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block">
                  DETAILED INDIVIDUAL AUDIT
                </span>
                <h3 className="text-xl font-black text-[#F5F7FB]">
                  {auditData?.student?.name || "Student Activity Record"}
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
    </div>
  );
}
