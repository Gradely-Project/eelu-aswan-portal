"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  FileCheck2,
  Clock,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Unlock,
  Award,
  Users,
  FolderOpen,
} from "lucide-react";

interface Submission {
  id: string;
  studentId: string;
  solutionLink: string;
  notes: string | null;
  score: number | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    college: string | null;
  };
}

interface TaskData {
  id: string;
  trackId: string;
  title: string;
  description: string;
  maxScore: number;
  deadline: string;
  isClosed: boolean;
  materialsLink: string | null;
  track: {
    id: string;
    name: string;
  };
  submissions: Submission[];
}

interface UserData {
  id: string;
  name: string;
  role: string;
  assignedTrackId?: string | null;
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);

  // Student Form
  const [solutionLink, setSolutionLink] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Instructor Grading States
  const [gradingScores, setGradingScores] = useState<Record<string, number | "">>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [gradingSaving, setGradingSaving] = useState<string | null>(null);
  const [gradingSuccess, setGradingSuccess] = useState<string | null>(null);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();

      if (res.ok && data.task) {
        setTask(data.task);

        const scores: Record<string, number | ""> = {};
        const feedbacks: Record<string, string> = {};
        data.task.submissions?.forEach((sub: Submission) => {
          scores[sub.id] = sub.score !== null ? sub.score : "";
          feedbacks[sub.id] = sub.feedback || "";
        });
        setGradingScores(scores);
        setGradingFeedbacks(feedbacks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch((e) => console.error(e));

    if (taskId) fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (user && task && user.role === "STUDENT") {
      const mySub = task.submissions?.find((s) => s.studentId === user.id);
      if (mySub) {
        setSolutionLink(mySub.solutionLink);
        setStudentNotes(mySub.notes || "");
      }
    }
  }, [user, task]);

  const isInstructorOrAdmin =
    user?.role === "ADMIN" ||
    user?.role === "CHAIR_PERSON" ||
    user?.role === "VICE_CHAIR" ||
    (user?.role === "INSTRUCTOR" && user?.assignedTrackId === task?.trackId);

  const isPastDeadline = task ? new Date(task.deadline) < new Date() : false;
  const isLocked = Boolean(task?.isClosed || isPastDeadline);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setSubmissionSuccess(null);
    setSubmittingSolution(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          solutionLink,
          notes: studentNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmissionError(data.error || "Failed to submit assignment.");
        setSubmittingSolution(false);
        return;
      }

      setSubmissionSuccess("Assignment submitted successfully via Google Drive! You can update the link until the deadline.");
      await fetchTask();
    } catch {
      setSubmissionError("Network error.");
    } finally {
      setSubmittingSolution(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const scoreVal = gradingScores[submissionId];
    if (scoreVal === "" || scoreVal === undefined) {
      alert("Please input a valid score.");
      return;
    }

    setGradingSaving(submissionId);
    setGradingSuccess(null);

    try {
      const res = await fetch("/api/submissions/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          score: Number(scoreVal),
          feedback: gradingFeedbacks[submissionId] || "",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setGradingSuccess(data.message || "Grade recorded successfully.");
        await fetchTask();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Network error.");
    } finally {
      setGradingSaving(null);
    }
  };

  if (loading || !task) {
    return (
      <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
        <TopNav />
        <div className="flex flex-1">
          <Sidebar userRole={user?.role} />
          <main className="p-8 max-w-5xl mx-auto w-full">
            <div className="h-64 bg-[#0D1D32] rounded-3xl animate-pulse" />
          </main>
        </div>
      </div>
    );
  }

  const mySubmission = task.submissions?.find((s) => s.studentId === user?.id);

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
          <div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#8FA4BD] hover:text-[#48D5F5] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Tasks Hub
            </Link>
          </div>

          {/* Task Header Card */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-[10px] font-black text-[#48D5F5] uppercase tracking-wider bg-[#10243C] px-3 py-1 rounded-full border border-[#1E3A5F]">
                TRACK: {task.track?.name}
              </span>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30">
                  MAX SCORE: {task.maxScore} PTS
                </span>
                {isLocked ? (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    LOCKED (DEADLINE CLOSED)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    SUBMISSIONS OPEN
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] mb-3">
              {task.title}
            </h1>

            <div className="bg-[#07172A] p-5 rounded-2xl border border-[#1E3A5F] mb-6 text-xs text-[#8FA4BD] leading-relaxed whitespace-pre-line font-medium">
              {task.description}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#8FA4BD] pt-4 border-t border-[#1E3A5F]">
              <div className="flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-[#F5F7FB]">Deadline:</span>
                <span>{new Date(task.deadline).toLocaleString("en-US")}</span>
              </div>

              {task.materialsLink && (
                <a
                  href={task.materialsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#07172A] text-[#48D5F5] font-bold hover:bg-[#10243C] border border-[#1E3A5F] transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#269CF0]" />
                  Open Task Starter Kit / Drive Guidelines
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Student View: Google Drive Solution Submission */}
          {user?.role === "STUDENT" && (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 shadow-md">
              <h2 className="text-xl font-black text-[#F5F7FB] mb-1 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#269CF0]" />
                Submit Assignment Solution
              </h2>
              <p className="text-xs text-[#8FA4BD] mb-6">
                Upload your project code or report to Google Drive / GitHub and paste the shareable link below:
              </p>

              {/* Graded Box */}
              {mySubmission?.score !== null && mySubmission?.score !== undefined && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Graded Result
                    </span>
                    <span className="text-base font-black bg-emerald-500/20 px-3 py-1 rounded-lg">
                      {mySubmission.score} / {task.maxScore} PTS
                    </span>
                  </div>
                  {mySubmission.feedback && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 italic">
                      Instructor Feedback: &quot;{mySubmission.feedback}&quot;
                    </div>
                  )}
                </div>
              )}

              {submissionSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submissionSuccess}</span>
                </div>
              )}

              {submissionError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{submissionError}</span>
                </div>
              )}

              <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Google Drive or GitHub Solution Link *
                  </label>
                  <input
                    type="url"
                    required
                    disabled={isLocked}
                    value={solutionLink}
                    onChange={(e) => setSolutionLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#8FA4BD] mt-1 block">
                    * Ensure link permissions are set to &quot;Anyone with the link can view&quot;.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Comments / Notes for the Instructor (Optional)
                  </label>
                  <textarea
                    rows={3}
                    disabled={isLocked}
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    placeholder="Any technical clarifications regarding your implementation..."
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] disabled:opacity-50 resize-none"
                  />
                </div>

                {isLocked ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Submissions are locked because the deadline has passed. Contact your lead instructor if you need an extension.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submittingSolution}
                    className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {submittingSolution ? "Saving..." : mySubmission ? "Update Drive Solution" : "Submit Assignment"}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Instructor Grading Table */}
          {isInstructorOrAdmin && (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E3A5F]">
                <div>
                  <h2 className="text-xl font-black text-[#F5F7FB] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#269CF0]" />
                    Student Submissions & Evaluation ({task.submissions?.length || 0})
                  </h2>
                  <p className="text-xs text-[#8FA4BD] mt-0.5">
                    Click the Drive link to review the student solution, then input the score out of {task.maxScore}.
                  </p>
                </div>
              </div>

              {gradingSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{gradingSuccess}</span>
                </div>
              )}

              {task.submissions?.length === 0 ? (
                <div className="p-10 text-center text-[#8FA4BD]">
                  No student solutions submitted for this task yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {task.submissions.map((sub) => {
                    const isSaving = gradingSaving === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className="bg-[#07172A] border border-[#1E3A5F] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#F5F7FB]">{sub.student.name}</span>
                            <span className="text-[10px] text-[#8FA4BD] font-mono">{sub.student.email}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <a
                              href={sub.solutionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open Student Drive Link
                            </a>
                            <span className="text-[10px] text-[#8FA4BD] font-mono">
                              Submitted: {new Date(sub.submittedAt).toLocaleString("en-US")}
                            </span>
                          </div>

                          {sub.notes && (
                            <p className="text-[11px] text-[#8FA4BD] bg-[#0D1D32] p-2 rounded-lg border border-[#1E3A5F]/60">
                              <span className="font-bold text-[#F5F7FB]">Student Notes: </span>
                              {sub.notes}
                            </p>
                          )}
                        </div>

                        {/* Grading Inputs */}
                        <div className="flex items-center gap-2 bg-[#0D1D32] p-2.5 rounded-xl border border-[#1E3A5F]">
                          <div>
                            <span className="text-[9px] font-bold text-[#8FA4BD] uppercase block mb-1">
                              Score / {task.maxScore}:
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={task.maxScore}
                              value={gradingScores[sub.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                setGradingScores({ ...gradingScores, [sub.id]: val });
                              }}
                              className="w-20 bg-[#07172A] border border-[#1E3A5F] rounded-lg px-2 py-1 text-xs text-center font-black text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                            />
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-[#8FA4BD] uppercase block mb-1">
                              Feedback:
                            </span>
                            <input
                              type="text"
                              value={gradingFeedbacks[sub.id] || ""}
                              onChange={(e) => {
                                setGradingFeedbacks({ ...gradingFeedbacks, [sub.id]: e.target.value });
                              }}
                              placeholder="Great code formatting..."
                              className="w-40 sm:w-52 bg-[#07172A] border border-[#1E3A5F] rounded-lg px-2 py-1 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleGradeSubmission(sub.id)}
                            disabled={isSaving}
                            className="px-3.5 py-2 mt-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            {isSaving ? "..." : "Save"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
