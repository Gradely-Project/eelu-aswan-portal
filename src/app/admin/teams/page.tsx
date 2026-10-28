"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import { UserPlus, Trash2, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

interface Instructor {
  id: string;
  name: string;
  email: string;
  trackTeamRole: string | null;
  assignedTrackId: string | null;
}

interface Track {
  id: string;
  name: string;
  description: string | null;
  instructors: Instructor[];
}

export default function AdminTeamsPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "password123",
    trackId: "",
    trackTeamRole: "CORE_TEAM",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/tracks", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
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
      .then((d) => {
        if (d.user?.role !== "ADMIN") {
          window.location.href = "/dashboard";
        }
      })
      .catch(() => {});
    fetchTracks();
  }, []);

  const handleOpenAdd = (trackId?: string) => {
    setForm({
      name: "",
      email: "",
      password: "password123",
      trackId: trackId || (tracks[0]?.id || ""),
      trackTeamRole: "CORE_TEAM",
    });
    setError(null);
    setSuccess(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/assign-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to assign team member.");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message);
      setShowAddModal(false);
      await fetchTracks();
    } catch {
      setError("Server connection error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this track team?`)) return;

    try {
      const res = await fetch("/api/admin/assign-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeUserId: userId }),
      });

      if (res.ok) {
        await fetchTracks();
      } else {
        alert("Failed to remove member.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const getTeamRoleBadge = (role: string | null) => {
    if (role === "HEAD") {
      return <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30">👑 Lead Instructor (Head)</span>;
    }
    if (role === "VICE_HEAD") {
      return <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30">⭐ Vice Head</span>;
    }
    return <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#07172A] text-[#8FA4BD] border border-[#1E3A5F]">⚡ Core Instructor</span>;
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole="ADMIN" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                FACULTY & INSTRUCTOR STRUCTURE
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-2">
                <Layers className="w-7 h-7 text-[#269CF0]" />
                Track Instructional Teams (Head & Core Teams)
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Each bootcamp track is governed by a dedicated team of 4 members: Head, Vice Head, and 2 Core Instructors.
              </p>
            </div>

            <button
              onClick={() => handleOpenAdd()}
              className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Assign Team Member
            </button>
          </div>

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track) => {
              const head = track.instructors.find((i) => i.trackTeamRole === "HEAD");
              const vice = track.instructors.find((i) => i.trackTeamRole === "VICE_HEAD");
              const cores = track.instructors.filter((i) => i.trackTeamRole === "CORE_TEAM");

              return (
                <div
                  key={track.id}
                  className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E3A5F]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-[#48D5F5] font-black text-xs flex items-center justify-center">
                          {track.name.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <h3 className="font-black text-base text-[#F5F7FB]">{track.name}</h3>
                          <span className="text-[10px] text-[#8FA4BD] font-semibold">
                            Instructional Team: {track.instructors.length} / 4 Assigned
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAdd(track.id)}
                        className="px-3 py-1 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-[#269CF0] font-bold text-xs border border-[#1E3A5F] transition-all flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Head */}
                      <div className="p-3 rounded-2xl border border-[#1E3A5F] bg-[#07172A] flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getTeamRoleBadge("HEAD")}
                            <span className="font-bold text-xs text-[#F5F7FB]">
                              {head ? head.name : <span className="text-[#8FA4BD] italic">Unassigned Vacancy</span>}
                            </span>
                          </div>
                          {head && <span className="text-[10px] text-[#8FA4BD] block font-mono">{head.email}</span>}
                        </div>
                        {head && (
                          <button
                            onClick={() => handleRemove(head.id, head.name)}
                            className="p-1.5 text-[#8FA4BD] hover:text-rose-400 rounded-lg"
                            title="Remove from track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Vice Head */}
                      <div className="p-3 rounded-2xl border border-[#1E3A5F] bg-[#07172A] flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getTeamRoleBadge("VICE_HEAD")}
                            <span className="font-bold text-xs text-[#F5F7FB]">
                              {vice ? vice.name : <span className="text-[#8FA4BD] italic">Unassigned Vacancy</span>}
                            </span>
                          </div>
                          {vice && <span className="text-[10px] text-[#8FA4BD] block font-mono">{vice.email}</span>}
                        </div>
                        {vice && (
                          <button
                            onClick={() => handleRemove(vice.id, vice.name)}
                            className="p-1.5 text-[#8FA4BD] hover:text-rose-400 rounded-lg"
                            title="Remove from track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Core Members */}
                      <div className="p-3 rounded-2xl border border-[#1E3A5F] bg-[#07172A]">
                        <span className="text-[10px] font-bold text-[#8FA4BD] uppercase block mb-2">
                          Core Instructors (Up to 2 Members):
                        </span>
                        {cores.length === 0 ? (
                          <span className="text-xs text-[#8FA4BD] italic">No core instructors assigned yet.</span>
                        ) : (
                          <div className="space-y-2">
                            {cores.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between bg-[#0D1D32] p-2 rounded-xl border border-[#1E3A5F]"
                              >
                                <div>
                                  <span className="font-bold text-xs text-[#F5F7FB] block">{c.name}</span>
                                  <span className="text-[10px] text-[#8FA4BD] font-mono">{c.email}</span>
                                </div>
                                <button
                                  onClick={() => handleRemove(c.id, c.name)}
                                  className="p-1.5 text-[#8FA4BD] hover:text-rose-400 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
                <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#269CF0]" />
                  Assign Instructor to Track Team
                </h3>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Target Track *</label>
                    <select
                      value={form.trackId}
                      onChange={(e) => setForm({ ...form, trackId: e.target.value })}
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

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Team Role *</label>
                    <select
                      value={form.trackTeamRole}
                      onChange={(e) => setForm({ ...form, trackTeamRole: e.target.value })}
                      required
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    >
                      <option value="HEAD">Head (Lead Instructor & Supervisor)</option>
                      <option value="VICE_HEAD">Vice Head (Assistant Lead)</option>
                      <option value="CORE_TEAM">Core Team Member (Instructor / Grader)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Mostafa Mahmoud"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="instructor@eelu.edu.eg"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Initial Password *</label>
                    <input
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                      {submitting ? "Saving..." : "Confirm Assignment"}
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
