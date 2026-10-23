"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import {
  Crown,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Shield,
  Layers,
} from "lucide-react";

interface Leader {
  id: string;
  name: string;
  roleTitle: string;
  affiliation: string | null;
  displayOrder: number;
}

export default function LeadershipManagementPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaders = async () => {
    try {
      const res = await fetch("/api/leadership");
      const data = await res.json();
      if (data.leaders) {
        setLeaders(data.leaders);
        setDisplayOrder(data.leaders.length + 1);
      }
      setLoading(false);
    } catch {
      setError("Failed to load leadership list.");
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
    fetchLeaders();
  }, []);

  const handleEdit = (leader: Leader) => {
    setEditingId(leader.id);
    setName(leader.name);
    setRoleTitle(leader.roleTitle);
    setAffiliation(leader.affiliation || "");
    setDisplayOrder(leader.displayOrder);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setRoleTitle("");
    setAffiliation("");
    setDisplayOrder(leaders.length + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const url = "/api/leadership";
      const method = editingId ? "PUT" : "POST";
      const payload = editingId
        ? { id: editingId, name, roleTitle, affiliation, displayOrder }
        : { name, roleTitle, affiliation, displayOrder };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save leadership member.");
        setSubmitting(false);
        return;
      }

      setSuccess(
        editingId
          ? `Updated "${name}" successfully.`
          : `Added "${name}" to Leadership Board.`
      );
      handleCancel();
      fetchLeaders();
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, leaderName: string) => {
    if (!confirm(`Are you sure you want to remove "${leaderName}" from the leadership board?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/leadership?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete.");
        return;
      }
      setSuccess(`Removed "${leaderName}" successfully.`);
      fetchLeaders();
    } catch {
      setError("Failed to delete leadership member.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole="ADMIN" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div>
            <span className="text-xs font-bold text-[#E5A93C] uppercase tracking-wider block mb-1">
              CAMPUS GOVERNANCE & OVERSIGHT
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-3">
              <Crown className="w-8 h-8 text-[#E5A93C]" />
              Branch Leadership & Supervision Board
            </h1>
            <p className="text-xs sm:text-sm text-[#8FA4BD] mt-1">
              Manage the executive academic leaders displayed on the public landing page hero (Supervisor, Chairperson, Vice Chair, Technical Directors).
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Form (Add / Edit) */}
            <div className="lg:col-span-5 bg-[#0D1D32] rounded-3xl p-6 border border-[#1E3A5F] shadow-xl">
              <h2 className="text-base font-black text-[#F5F7FB] mb-4 pb-2 border-b border-[#1E3A5F] flex items-center justify-between">
                <span>{editingId ? "Edit Leader" : "Add Leadership Member"}</span>
                {editingId && (
                  <button
                    onClick={handleCancel}
                    className="text-xs text-[#8FA4BD] hover:text-white"
                  >
                    Cancel
                  </button>
                )}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Full Name & Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Prof. Dr. Ahmed El-Sayed"
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Role Title / Designation *</label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Academic Branch Supervisor / Branch Chairperson"
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Affiliation / Faculty</label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. Faculty of Information Technology, EELU"
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Display Order (Sort Index)</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                  <span className="text-[10px] text-[#8FA4BD] mt-1 block">
                    Lower numbers appear at the top of the board.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 py-3 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-lg shadow-[#269CF0]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editingId ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {submitting ? "Updating..." : "Save Changes"}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {submitting ? "Adding..." : "Add to Board"}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Existing Leaders List */}
            <div className="lg:col-span-7 bg-[#0D1D32] rounded-3xl p-6 border border-[#1E3A5F] shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1E3A5F]">
                <h2 className="text-base font-black text-[#F5F7FB] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#48D5F5]" />
                  Active Leadership Board ({leaders.length})
                </h2>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  Live on Landing Page
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#8FA4BD]">Loading board members...</div>
              ) : leaders.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8FA4BD]">
                  No leadership members configured yet. Add the first one using the form.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaders.map((leader, index) => (
                    <div
                      key={leader.id}
                      className="p-4 rounded-2xl bg-[#07172A] border border-[#1E3A5F] hover:border-[#269CF0]/40 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#10243C] border border-[#1E3A5F] text-[#E5A93C] font-black text-xs flex items-center justify-center flex-shrink-0">
                          #{leader.displayOrder || index + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#F5F7FB] truncate">
                            {leader.name}
                          </h4>
                          <span className="text-[11px] font-black text-[#48D5F5] block truncate">
                            {leader.roleTitle}
                          </span>
                          {leader.affiliation && (
                            <span className="text-[10px] text-[#8FA4BD] block truncate mt-0.5">
                              {leader.affiliation}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(leader)}
                          className="p-2 rounded-xl bg-[#0D1D32] hover:bg-[#1E3A5F] text-[#8FA4BD] hover:text-[#269CF0] transition-colors"
                          title="Edit Leader"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(leader.id, leader.name)}
                          className="p-2 rounded-xl bg-[#0D1D32] hover:bg-rose-500/20 text-[#8FA4BD] hover:text-rose-400 transition-colors"
                          title="Remove from Board"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
