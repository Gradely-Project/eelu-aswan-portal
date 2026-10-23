"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  Search,
  Check,
  X,
  Ban,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  FileCheck2,
  ExternalLink,
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
  enrollments: Array<{ track: { id: string; name: string } }>;
}

export default function AdminStudentsDirectoryPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    suspendedCount: 0,
    rejectedCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Audit Modal
  const [auditStudentId, setAuditStudentId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const [studentsRes, tracksRes] = await Promise.all([
        fetch(`/api/admin/pending-students?status=${statusFilter}`).then((r) => r.json()),
        fetch("/api/tracks").then((r) => r.json()),
      ]);
      setStudents(studentsRes.students || []);
      if (studentsRes.stats) setStats(studentsRes.stats);
      if (tracksRes.tracks) setTracks(tracksRes.tracks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

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
        await fetchStudents();
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
        await fetchStudents();
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
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            {user?.role && user.role !== "ADMIN" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10243C] border border-[#1E3A5F] text-[#E5A93C] text-[11px] font-bold mb-2">
                <span>🛡️ Governance Inspection Mode (View student performance & activity timeline)</span>
              </div>
            )}
            <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
              ADMINISTRATION & ADMISSIONS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB]">
              Student Admission Applications & Account Governance
            </h1>
            <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
              Review applicant requests, approve active accounts, and temporarily suspend student access when needed.
            </p>
          </div>

          {feedback && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

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
              All Tracks
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

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-[#0D1D32] p-1.5 rounded-xl border border-[#1E3A5F] text-xs font-black">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "ALL" ? "bg-[#269CF0] text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                All Applications ({stats.totalCount})
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "PENDING" ? "bg-[#E5A93C] text-[#07172A]" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Pending ({stats.pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "APPROVED" ? "bg-emerald-600 text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Approved ({stats.approvedCount})
              </button>
              <button
                onClick={() => setStatusFilter("SUSPENDED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "SUSPENDED" ? "bg-rose-600 text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Suspended ({stats.suspendedCount})
              </button>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-[#8FA4BD] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by name, email, faculty..."
                className="w-full bg-[#0D1D32] border border-[#1E3A5F] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F7FB] placeholder-[#8FA4BD] focus:outline-none focus:border-[#269CF0]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
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
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8FA4BD]">
                        Loading applications directory...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8FA4BD]">
                        No records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((st) => {
                      const isPending = st.status === "PENDING";
                      const isSuspended = st.status === "SUSPENDED";
                      const isApproved = st.status === "APPROVED";
                      const isLoadingThis = actionLoading === st.id;

                      return (
                        <tr key={st.id} className="hover:bg-[#10243C]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#F5F7FB] block">{st.name}</span>
                            <span className="text-[11px] text-[#8FA4BD] font-mono">
                              {st.email} {st.phone && `• ${st.phone}`}
                            </span>
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
                              <button
                                onClick={() => handleOpenAudit(st.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#10243C] hover:bg-[#1E3A5F] text-[#48D5F5] font-bold text-[11px] border border-[#1E3A5F] transition-all flex items-center gap-1"
                                title="Inspect activity audit"
                              >
                                <Eye className="w-3 h-3" />
                                Audit
                              </button>

                              {user?.role === "ADMIN" && isPending && (
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
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-[11px] border border-rose-500/30"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {user?.role === "ADMIN" && !isPending && (
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
        </main>
      </div>

      {/* Individual Student Audit Modal */}
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
