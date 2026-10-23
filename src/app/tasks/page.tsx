"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  FileCheck2,
  Clock,
  ExternalLink,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  Trash2,
  ArrowRight,
  FolderOpen,
} from "lucide-react";

interface TaskItem {
  id: string;
  trackId: string;
  title: string;
  description: string;
  maxScore: number;
  deadline: string;
  isClosed: boolean;
  materialsLink: string | null;
  isPastDeadline: boolean;
  isSubmissionLocked: boolean;
  _count: {
    submissions: number;
  };
  mySubmission?: {
    id: string;
    solutionLink: string;
    score: number | null;
    feedback: string | null;
    submittedAt: string;
  } | null;
}

interface Track {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  assignedTrackId?: string | null;
}

export default function TasksPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [deadline, setDeadline] = useState("");
  const [materialsLink, setMaterialsLink] = useState("");
  const [targetTrackId, setTargetTrackId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extend Deadline Modal
  const [extendModalTask, setExtendModalTask] = useState<TaskItem | null>(null);
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        fetch("/api/tracks")
          .then((tRes) => tRes.json())
          .then((tData) => {
            const list = tData.tracks || [];
            setTracks(list);
            if (data.user?.assignedTrackId) {
              setSelectedTrackId(data.user.assignedTrackId);
              setTargetTrackId(data.user.assignedTrackId);
            } else if (list.length > 0) {
              setTargetTrackId(list[0].id);
            }
          });
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchTasks = async (trkId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?trackId=${trkId}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(selectedTrackId);
  }, [selectedTrackId]);

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "CHAIR_PERSON" ||
    (user?.role === "INSTRUCTOR" && (selectedTrackId === "ALL" || user?.assignedTrackId === selectedTrackId));

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTrackId = user?.assignedTrackId || targetTrackId;
    if (!finalTrackId) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: finalTrackId,
          title,
          description,
          maxScore,
          deadline,
          materialsLink,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create task.");
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setMaxScore(100);
      setDeadline("");
      setMaterialsLink("");
      await fetchTasks(selectedTrackId);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskClosed = async (task: TaskItem) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClosed: !task.isClosed }),
      });
      if (res.ok) await fetchTasks(selectedTrackId);
    } catch {
      alert("Network error.");
    }
  };

  const handleExtendDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendModalTask || !newDeadline) return;

    try {
      const res = await fetch(`/api/tasks/${extendModalTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline: newDeadline,
          isClosed: false,
        }),
      });

      if (res.ok) {
        setExtendModalTask(null);
        await fetchTasks(selectedTrackId);
      } else {
        alert("Failed to extend deadline.");
      }
    } catch {
      alert("Network error.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav selectedTrackId={selectedTrackId} onTrackChange={(id) => setSelectedTrackId(id)} />

      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                ACADEMIC SUBMISSIONS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-2">
                <FileCheck2 className="w-7 h-7 text-emerald-400" />
                Tasks & Assignment Hub
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Submit assignments via Google Drive links, monitor countdown deadlines, and grade student submissions.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  setError(null);
                  setShowAddModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Create New Task
              </button>
            )}
          </div>

          {/* Tasks Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-60 bg-[#0D1D32] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center">
              <FileCheck2 className="w-12 h-12 text-[#8FA4BD] mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-base text-[#F5F7FB]">No active tasks found</h3>
              <p className="text-xs text-[#8FA4BD] mt-1 mb-4">
                {canEdit ? "Publish the first assignment for students." : "Assignments will appear once published by instructors."}
              </p>
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#269CF0] text-white font-bold text-xs"
                >
                  Create Task Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.map((task) => {
                const deadlineDate = new Date(task.deadline);

                return (
                  <div
                    key={task.id}
                    className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-7 shadow-sm hover:border-[#269CF0] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {task.isSubmissionLocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              LOCKED (DEADLINE CLOSED)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              SUBMISSIONS OPEN
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30">
                            {task.maxScore} PTS
                          </span>
                        </div>

                        {canEdit && (
                          <button
                            onClick={() => toggleTaskClosed(task)}
                            className="text-xs font-bold text-[#8FA4BD] hover:text-white"
                            title="Toggle lock"
                          >
                            {task.isClosed ? "Open" : "Lock"}
                          </button>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-[#F5F7FB] mb-2">{task.title}</h3>
                      <p className="text-xs text-[#8FA4BD] mb-4 line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="bg-[#07172A] p-3 rounded-2xl border border-[#1E3A5F] mb-4 space-y-1.5 text-xs text-[#8FA4BD]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          <span className="font-bold text-[#F5F7FB]">Deadline:</span>
                          <span className="font-mono">{deadlineDate.toLocaleString("en-US")}</span>
                        </div>
                        {task.materialsLink && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <FolderOpen className="w-3.5 h-3.5 text-[#269CF0]" />
                            <a
                              href={task.materialsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#48D5F5] hover:underline font-bold inline-flex items-center gap-1"
                            >
                              Open Task Guide / Starter Kit
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Student view banner */}
                      {user?.role === "STUDENT" && (
                        <div className="mb-4 p-3 rounded-xl border text-xs">
                          {task.mySubmission ? (
                            <div className="flex items-center justify-between text-emerald-400 bg-emerald-500/10 border-emerald-500/30 p-2 rounded-lg">
                              <span className="font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" />
                                Solution Submitted
                              </span>
                              {task.mySubmission.score !== null ? (
                                <span className="font-black bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                                  Score: {task.mySubmission.score} / {task.maxScore}
                                </span>
                              ) : (
                                <span className="text-[#8FA4BD] text-[10px]">Pending Grading</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-amber-400 bg-[#E5A93C]/10 border-[#E5A93C]/30 p-2 rounded-lg flex items-center justify-between font-bold">
                              <span>Not submitted yet</span>
                              {task.isSubmissionLocked && <span className="text-rose-400">Deadline Missed</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between">
                      {canEdit ? (
                        <>
                          <span className="text-xs text-[#8FA4BD] font-bold">
                            {task._count.submissions} Submissions
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setExtendModalTask(task);
                                setNewDeadline("");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#07172A] hover:bg-[#10243C] text-[#8FA4BD] hover:text-white font-bold text-xs border border-[#1E3A5F]"
                            >
                              Extend Deadline
                            </button>
                            <Link
                              href={`/tasks/${task.id}`}
                              className="px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                            >
                              Grade Submissions
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </>
                      ) : (
                        <Link
                          href={`/tasks/${task.id}`}
                          className={`w-full py-2.5 rounded-xl font-black text-xs text-center transition-all ${
                            task.mySubmission
                              ? "bg-[#07172A] text-[#F5F7FB] border border-[#1E3A5F] hover:bg-[#10243C]"
                              : task.isSubmissionLocked
                              ? "bg-[#07172A] text-[#8FA4BD] border border-[#1E3A5F] cursor-not-allowed"
                              : "bg-[#269CF0] hover:bg-[#1E82CB] text-white"
                          }`}
                        >
                          {task.mySubmission ? "Review My Submission" : "Submit Google Drive Solution →"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Task Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#269CF0]" />
                  Create New Track Assignment
                </h3>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                  {!user?.assignedTrackId && (
                    <div>
                      <label className="block font-bold text-[#8FA4BD] mb-1">Target Track *</label>
                      <select
                        value={targetTrackId}
                        onChange={(e) => setTargetTrackId(e.target.value)}
                        required
                        className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                      >
                        {tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Project 1: Responsive E-Commerce Landing Page"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Description & Deliverables *</label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify requirements, technologies, and what students must include in their Drive upload..."
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#8FA4BD] mb-1">Max Score *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={maxScore}
                        onChange={(e) => setMaxScore(Number(e.target.value))}
                        className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#8FA4BD] mb-1">Deadline Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">
                      Starter Kit / Template Link (Google Drive / GitHub)
                    </label>
                    <input
                      type="url"
                      value={materialsLink}
                      onChange={(e) => setMaterialsLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#1E3A5F] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-[#8FA4BD] hover:text-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold"
                    >
                      {submitting ? "Publishing..." : "Publish Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Extend Deadline Modal */}
          {extendModalTask && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-black text-[#F5F7FB] mb-2">Reopen / Extend Deadline</h3>
                <p className="text-xs text-[#8FA4BD] mb-4">Task: {extendModalTask.title}</p>
                <form onSubmit={handleExtendDeadline} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">New Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>
                  <div className="pt-4 border-t border-[#1E3A5F] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setExtendModalTask(null)}
                      className="px-4 py-2 rounded-xl text-[#8FA4BD] hover:text-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Save & Unlock Submissions
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
