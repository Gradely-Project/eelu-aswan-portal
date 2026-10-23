"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  FileCheck2,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  ExternalLink,
  Star,
  Send,
  AlertCircle,
  Megaphone,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

interface StudentPortalProps {
  user: any;
}

export default function StudentPortalView({ user }: StudentPortalProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Self Check-in Code input
  const [checkInCode, setCheckInCode] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Task Submission modal/inline
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [solutionLink, setSolutionLink] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Session Evaluation modal
  const [evalSession, setEvalSession] = useState<any | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<{ name: string; role: string } | null>(null);
  const [clarityRating, setClarityRating] = useState(5);
  const [materialRating, setMaterialRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingEval, setSavingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState<string | null>(null);

  const fetchStudentData = async () => {
    try {
      const [sessRes, annRes] = await Promise.all([
        fetch("/api/sessions").then((r) => r.json()).catch(() => ({ sessions: [] })),
        fetch("/api/announcements").then((r) => r.json()).catch(() => ({ announcements: [] })),
      ]);

      if (sessRes.sessions) setSessions(sessRes.sessions);
      if (annRes.announcements) setAnnouncements(annRes.announcements);

      // Fetch tasks for each enrolled track
      const enrolledTracks = user?.enrollments || [];
      if (enrolledTracks.length > 0) {
        const taskPromises = enrolledTracks.map((en: any) =>
          fetch(`/api/tasks?trackId=${en.trackId}`).then((r) => r.json()).catch(() => ({ tasks: [] }))
        );
        const taskResults = await Promise.all(taskPromises);
        const allTasks = taskResults.flatMap((res) => res.tasks || []);
        setTasks(allTasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStudentData();
  }, [user]);

  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;

    setCheckingIn(true);
    setCheckInMsg(null);

    // Look for active session in student's tracks
    if (sessions.length === 0) {
      setCheckInMsg({ text: "No active lecture found for your enrolled tracks.", isError: true });
      setCheckingIn(false);
      return;
    }

    try {
      const targetSession = sessions[0]; // Nearest or latest session
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY",
          sessionId: targetSession.id,
          code: checkInCode.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setCheckInMsg({ text: data.message || "Attendance recorded successfully!", isError: false });
        setCheckInCode("");
        await fetchStudentData();
      } else {
        setCheckInMsg({ text: data.error || "Invalid or expired check-in code.", isError: true });
      }
    } catch {
      setCheckInMsg({ text: "Connection error. Please try again.", isError: true });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSubmitTask = async (taskId: string) => {
    if (!solutionLink.trim()) return;
    setTaskSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          solutionLink: solutionLink.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittingTaskId(null);
        setSolutionLink("");
        await fetchStudentData();
      } else {
        alert(data.error || "Failed to submit assignment.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalSession) return;

    setSavingEval(true);
    try {
      const res = await fetch("/api/sessions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: evalSession.id,
          instructorName: selectedInstructor?.name,
          instructorRole: selectedInstructor?.role,
          clarityRating,
          materialRating,
          overallRating,
          feedbackText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvalSuccess("Evaluation saved! Thank you for your feedback.");
        setTimeout(() => {
          setEvalSession(null);
          setEvalSuccess(null);
        }, 1200);
      } else {
        alert(data.error || "Failed to submit evaluation.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSavingEval(false);
    }
  };

  const enrolledTracks = user?.enrollments || [];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D1D32] to-[#10243C] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider bg-[#E5A93C]/10 px-2.5 py-0.5 rounded-full border border-[#E5A93C]/20">
                Official Student Portal
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Active Enrolled
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] mb-1">
              Welcome back, {user?.name}! 👋
            </h1>

            <p className="text-xs text-[#8FA4BD] font-medium max-w-xl">
              Track your lecture schedules, submit practical assignments, confirm live classroom attendance, and review certified materials.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs font-bold text-[#8FA4BD]">Enrolled Tracks:</span>
              {enrolledTracks.map((en: any) => (
                <span
                  key={en.track.id}
                  className="px-3 py-1 rounded-xl text-xs font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30 shadow-sm"
                >
                  {en.track.name}
                </span>
              ))}
            </div>
          </div>

          {/* Academic Info Card */}
          <div className="bg-[#07172A] border border-[#1E3A5F] rounded-2xl p-4 min-w-[220px] text-xs">
            <span className="text-[10px] uppercase font-bold text-[#8FA4BD] block mb-2">Academic Profile</span>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8FA4BD]">Faculty:</span>
                <span className="font-bold text-white">{user?.college || "IT / CS"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4BD]">Year:</span>
                <span className="font-bold text-white">{user?.academicYear || "Year 1"}</span>
              </div>
              {user?.studentIdNumber && (
                <div className="flex justify-between">
                  <span className="text-[#8FA4BD]">University ID:</span>
                  <span className="font-mono font-bold text-[#48D5F5]">{user?.studentIdNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Live Check-in Card (6-digit token) */}
      <div className="bg-[#0D1D32] border border-[#269CF0]/40 rounded-3xl p-6 shadow-lg glow-blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E5A93C] block mb-0.5">
                CLASSROOM LIVE PRESENCE
              </span>
              <h3 className="text-lg font-black text-[#F5F7FB]">
                Lecture Quick Check-In
              </h3>
              <p className="text-xs text-[#8FA4BD]">
                Enter the 6-digit dynamic code projected on the hall screen to confirm your attendance.
              </p>
            </div>
          </div>

          <form onSubmit={handleQuickCheckIn} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit code..."
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value)}
              className="bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-sm font-mono tracking-widest text-[#48D5F5] placeholder-[#8FA4BD] focus:outline-none focus:border-[#269CF0] w-36 text-center"
            />
            <button
              type="submit"
              disabled={checkingIn || checkInCode.length < 6}
              className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              {checkingIn ? "Verifying..." : "Check-in"}
            </button>
          </form>
        </div>

        {checkInMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              checkInMsg.isError
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            }`}
          >
            {checkInMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{checkInMsg.text}</span>
          </div>
        )}
      </div>

      {/* Main Content Grid: Lectures & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Track Announcements & Live Broadcasts (Replaces Lectures per user request) */}
        <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#269CF0]" />
                <h3 className="text-lg font-black text-[#F5F7FB]">Track Broadcasts & Announcements</h3>
              </div>
              <Link
                href="/announcements"
                className="text-xs font-bold text-[#48D5F5] hover:underline flex items-center gap-1"
              >
                All Notices <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-[#07172A] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8FA4BD]">
                <Megaphone className="w-8 h-8 text-[#8FA4BD] mx-auto mb-2 opacity-50" />
                <p>No new broadcasts or announcements for your tracks yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((ann: any) => (
                  <div
                    key={ann.id}
                    className="bg-[#07172A] border border-[#1E3A5F] rounded-2xl p-4 hover:border-[#269CF0] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-black uppercase text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded-md border border-[#E5A93C]/20 flex-shrink-0">
                          {ann.category || "BROADCAST"}
                        </span>
                        <h4 className="font-bold text-sm text-[#F5F7FB] truncate">{ann.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#8FA4BD] bg-[#10243C] px-2 py-0.5 rounded border border-[#1E3A5F] flex-shrink-0">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] font-medium leading-relaxed mb-2 line-clamp-2">
                      {ann.content}
                    </p>

                    <div className="pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between text-[10px] text-[#8FA4BD]">
                      <span className="text-[#48D5F5] font-semibold">
                        Posted by {ann.authorName}
                      </span>
                      <span>EELU ASWAN</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignments to Submit */}
        <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-[#F5F7FB]">Assignments & Tasks</h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-bold text-[#48D5F5] hover:underline flex items-center gap-1"
              >
                All Tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-[#07172A] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-[#8FA4BD] text-center py-8">No assignments posted for your tracks.</p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 4).map((task) => {
                  const mySub = task.mySubmission;
                  const isSubmitted = !!mySub;
                  const isGraded = mySub?.score !== null && mySub?.score !== undefined;

                  return (
                    <div
                      key={task.id}
                      className="bg-[#07172A] border border-[#1E3A5F] rounded-2xl p-4 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#F5F7FB]">{task.title}</h4>
                          <span className="text-[10px] text-[#8FA4BD] block">
                            Max score: {task.maxScore} pts • Deadline: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>

                        {isGraded ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Grade: {mySub.score}/{task.maxScore}
                          </span>
                        ) : isSubmitted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30">
                            Under Review
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30">
                            Due Soon
                          </span>
                        )}
                      </div>

                      {/* Inline Submission Input */}
                      {submittingTaskId === task.id ? (
                        <div className="mt-3 pt-3 border-t border-[#1E3A5F] space-y-2">
                          <input
                            type="url"
                            required
                            placeholder="Paste your Google Drive solution link..."
                            value={solutionLink}
                            onChange={(e) => setSolutionLink(e.target.value)}
                            className="w-full bg-[#0D1D32] border border-[#1E3A5F] rounded-xl px-3 py-1.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-emerald-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSubmittingTaskId(null)}
                              className="px-3 py-1 rounded-lg text-[11px] text-[#8FA4BD] hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitTask(task.id)}
                              disabled={taskSubmitting || !solutionLink}
                              className="px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm"
                            >
                              {taskSubmitting ? "Submitting..." : "Submit Solution"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-2 border-t border-[#1E3A5F]/60">
                          <button
                            onClick={() => {
                              setSubmittingTaskId(task.id);
                              setSolutionLink(mySub?.solutionLink || "");
                            }}
                            className="text-[11px] font-bold text-[#48D5F5] hover:text-white flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            {isSubmitted ? "Update Submission Link" : "Submit Google Drive Solution"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Evaluation Modal */}
      {evalSession && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#F5F7FB] mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#E5A93C] fill-current" />
              Rate Lecture & Specific Instructor
            </h3>
            <span className="text-xs font-bold text-[#48D5F5] block mb-4">
              {evalSession.title} ({evalSession.track?.name})
            </span>

            {evalSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                {evalSuccess}
              </div>
            ) : (
              <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                {/* Specific Instructor Selection */}
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Select Instructor / Team Member to Rate *
                  </label>
                  {evalSession.track?.instructors && evalSession.track.instructors.length > 0 ? (
                    <div className="space-y-1.5">
                      {evalSession.track.instructors.map((inst: any) => {
                        const isChosen = selectedInstructor?.name === inst.name;
                        const roleTitle = inst.trackTeamRole === "HEAD"
                          ? "Lead Instructor (Head)"
                          : inst.trackTeamRole === "VICE_HEAD"
                          ? "Vice Lead"
                          : "Core Instructor";
                        return (
                          <div
                            key={inst.id}
                            onClick={() => setSelectedInstructor({ name: inst.name, role: roleTitle })}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isChosen
                                ? "bg-[#10243C] border-[#E5A93C] text-white"
                                : "bg-[#07172A] border-[#1E3A5F] text-[#8FA4BD] hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isChosen ? "bg-[#E5A93C]" : "bg-slate-600"}`} />
                              <span className="font-bold text-xs text-white">{inst.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-[#E5A93C] uppercase">
                              {roleTitle}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={selectedInstructor?.name || "Assigned Track Lead & Instruction Team"}
                      disabled
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  )}
                </div>

                {/* Clarity */}
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Explanation Quality & Clarity (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setClarityRating(star)}
                        className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                          clarityRating >= star
                            ? "bg-[#E5A93C] text-[#07172A] border-[#E5A93C]"
                            : "bg-[#07172A] text-[#8FA4BD] border-[#1E3A5F]"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Lecture Materials & Resources (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setMaterialRating(star)}
                        className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                          materialRating >= star
                            ? "bg-[#269CF0] text-white border-[#269CF0]"
                            : "bg-[#07172A] text-[#8FA4BD] border-[#1E3A5F]"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overall */}
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Overall Lecture Experience</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setOverallRating(star)}
                        className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                          overallRating >= star
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-[#07172A] text-[#8FA4BD] border-[#1E3A5F]"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Constructive Feedback & Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any suggestions or questions for the instructor team..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEvalSession(null)}
                    className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEval}
                    className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    {savingEval ? "Submitting..." : "Submit Evaluation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
