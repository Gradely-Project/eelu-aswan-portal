"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  Layers,
  Plus,
  Trash2,
  Users,
  Calendar,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Clock,
  Edit3,
} from "lucide-react";

interface Track {
  id: string;
  name: string;
  description: string | null;
  _count: {
    enrollments: number;
    sessions: number;
    tasks: number;
    instructors: number;
  };
  instructors: Array<{
    id: string;
    name: string;
    trackTeamRole: string | null;
  }>;
}

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTrackTarget, setDeleteTrackTarget] = useState<Track | null>(null);
  const [editTrackTarget, setEditTrackTarget] = useState<Track | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create track.");
        setSubmitting(false);
        return;
      }

      setSuccess(`Track "${data.track.name}" created successfully!`);
      setName("");
      setDescription("");
      setShowAddModal(false);
      await fetchTracks();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTrackTarget) return;
    setError(null);
    setUpdating(true);

    try {
      const res = await fetch("/api/tracks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTrackTarget.id,
          name: editName,
          description: editDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update track.");
        setUpdating(false);
        return;
      }

      setSuccess(`Track "${data.track.name}" updated successfully!`);
      setEditTrackTarget(null);
      await fetchTracks();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTrack = async () => {
    if (!deleteTrackTarget) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tracks?id=${deleteTrackTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete track.");
        setDeleting(false);
        return;
      }

      const targetId = deleteTrackTarget.id;
      setSuccess(data.message || `Track "${deleteTrackTarget.name}" deleted.`);
      setDeleteTrackTarget(null);
      setTracks((prev) => prev.filter((t) => t.id !== targetId));
      await fetchTracks();
    } catch {
      setError("Failed to delete track.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole="ADMIN" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                CURRICULUM & TRACK ADMINISTRATION
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-2.5">
                <Layers className="w-7 h-7 text-[#269CF0]" />
                Bootcamp Track Catalog & Management
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                The Main Administrator has full control to create new specialized training tracks or safely retire existing ones at any time.
              </p>
            </div>

            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md shadow-[#269CF0]/25 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              + Add New Track
            </button>
          </div>

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tracks Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-52 bg-[#0D1D32] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center text-[#8FA4BD]">
              No training tracks created yet. Click &quot;+ Add New Track&quot; above to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tracks.map((trk) => (
                <div
                  key={trk.id}
                  className="bg-[#0D1D32] border border-[#1E3A5F] hover:border-[#269CF0]/50 rounded-3xl p-6 transition-all shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#07172A] border border-[#1E3A5F] flex items-center justify-center text-[#269CF0]">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditTrackTarget(trk);
                            setEditName(trk.name);
                            setEditDescription(trk.description || "");
                            setError(null);
                            setSuccess(null);
                          }}
                          className="p-2 rounded-xl bg-[#07172A] hover:bg-[#269CF0]/20 text-[#8FA4BD] hover:text-[#48D5F5] border border-[#1E3A5F] transition-colors cursor-pointer"
                          title="Edit Track Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTrackTarget(trk)}
                          className="p-2 rounded-xl bg-[#07172A] hover:bg-rose-500/20 text-[#8FA4BD] hover:text-rose-400 border border-[#1E3A5F] transition-colors cursor-pointer"
                          title="Delete Track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-[#F5F7FB] mb-1 group-hover:text-[#269CF0] transition-colors">
                      {trk.name}
                    </h3>
                    <p className="text-xs text-[#8FA4BD] line-clamp-2 mb-4 leading-relaxed font-medium">
                      {trk.description || "Official specialized bootcamp curriculum."}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1E3A5F] text-center text-[10px]">
                      <div className="bg-[#07172A] p-2 rounded-xl border border-[#1E3A5F]">
                        <span className="font-bold text-[#8FA4BD] block">Students</span>
                        <span className="font-black text-sm text-[#48D5F5]">
                          {trk._count?.enrollments || 0}
                        </span>
                      </div>
                      <div className="bg-[#07172A] p-2 rounded-xl border border-[#1E3A5F]">
                        <span className="font-bold text-[#8FA4BD] block">Sessions</span>
                        <span className="font-black text-sm text-[#E5A93C]">
                          {trk._count?.sessions || 0}
                        </span>
                      </div>
                      <div className="bg-[#07172A] p-2 rounded-xl border border-[#1E3A5F]">
                        <span className="font-bold text-[#8FA4BD] block">Tasks</span>
                        <span className="font-black text-sm text-emerald-400">
                          {trk._count?.tasks || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-[11px] text-[#8FA4BD]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Shield className="w-3.5 h-3.5 text-[#269CF0]" />
                      Team: {trk.instructors?.length || 0} Members
                    </span>
                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Create Track */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#F5F7FB] mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#269CF0]" />
              Add New Bootcamp Track
            </h3>
            <p className="text-xs text-[#8FA4BD] mb-5">
              Define the track title and curriculum syllabus overview.
            </p>

            <form onSubmit={handleCreateTrack} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Track Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cloud Computing & DevOps"
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Curriculum Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of workshops, tools, and technical focus..."
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Track */}
      {editTrackTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#269CF0]/20 text-[#269CF0] border border-[#269CF0]/30 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#F5F7FB]">Edit Track Information</h3>
                <span className="text-xs text-[#8FA4BD]">Update public name and description</span>
              </div>
            </div>

            <form onSubmit={handleUpdateTrack} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Track Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Public Description & Syllabus</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Comprehensive description of topics covered and practical deliverables..."
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditTrackTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {updating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Track Confirmation */}
      {deleteTrackTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-[#F5F7FB] mb-2">
              Delete Track: {deleteTrackTarget.name}?
            </h3>
            <p className="text-xs text-[#8FA4BD] leading-relaxed mb-6">
              This action will permanently delete track <strong className="text-white">&quot;{deleteTrackTarget.name}&quot;</strong> along with its enrollments ({deleteTrackTarget._count?.enrollments || 0}), sessions ({deleteTrackTarget._count?.sessions || 0}), and task records. This cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTrackTarget(null)}
                className="px-5 py-2.5 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-[#8FA4BD] hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTrack}
                disabled={deleting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
