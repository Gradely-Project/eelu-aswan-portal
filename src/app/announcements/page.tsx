"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  Megaphone,
  Plus,
  Calendar,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Layers,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "GENERAL" | "SCHEDULE" | "TASK" | "URGENT";
  targetAudience?: string;
  trackId: string | null;
  authorName: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [userRole, setUserRole] = useState("STUDENT");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"GENERAL" | "SCHEDULE" | "TASK" | "URGENT">("GENERAL");
  const [targetAudience, setTargetAudience] = useState<"ALL" | "STUDENTS_ONLY" | "STAFF_ONLY">("ALL");
  const [selectedTrack, setSelectedTrack] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const [meRes, aRes, tRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/announcements").then((r) => r.json()),
        fetch("/api/tracks").then((r) => r.json()),
      ]);

      setUserRole(meRes.user?.role || "STUDENT");
      if (aRes.announcements) setAnnouncements(aRes.announcements);
      if (tRes.tracks) setTracks(tRes.tracks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          targetAudience,
          trackId: selectedTrack === "ALL" ? null : selectedTrack,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Announcement broadcasted successfully.");
        setTitle("");
        setContent("");
        setTargetAudience("ALL");
        setSelectedTrack("ALL");
        setShowAddModal(false);
        await fetchAnnouncements();
      } else {
        setError(data.error || "Failed to broadcast.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(userRole);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "URGENT":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "SCHEDULE":
        return "bg-[#E5A93C]/20 text-[#E5A93C] border-[#E5A93C]/30";
      case "TASK":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-[#269CF0]/20 text-[#48D5F5] border-[#269CF0]/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={userRole} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                COMMUNICATIONS & UPDATES
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-2">
                <Megaphone className="w-7 h-7 text-[#269CF0]" />
                Branch Announcements & Live Broadcasts
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Official branch announcements, urgent schedule updates, and academy communications.
              </p>
            </div>

            {isStaff && (
              <button
                onClick={() => {
                  setError(null);
                  setShowAddModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Broadcast Announcement
              </button>
            )}
          </div>

          {/* Feedback */}
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Announcements List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[#0D1D32] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center">
              <Bell className="w-12 h-12 text-[#8FA4BD] mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-base text-[#F5F7FB]">No active announcements</h3>
              <p className="text-xs text-[#8FA4BD] mt-1">
                All branch announcements will be published here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-sm hover:border-[#269CF0] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <h3 className="text-lg font-black text-[#F5F7FB]">{item.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#8FA4BD] font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#269CF0]" />
                      <span>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#CBD5E1] font-medium leading-relaxed whitespace-pre-wrap mb-4">
                    {item.content}
                  </p>

                  <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-between text-[11px] text-[#8FA4BD]">
                    <span className="font-bold text-[#48D5F5]">{item.authorName}</span>
                    <span className="text-[10px] uppercase font-bold text-[#8FA4BD]">EELU Aswan Branch</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Broadcast Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#269CF0]" />
              Broadcast New Announcement
            </h3>
            <p className="text-xs text-[#8FA4BD] mb-5">
              This notice will immediately appear on student portals and trigger notifications.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture Hall Change / Final Project Deadline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Target Audience (الجمهور المستهدف) *</label>
                  <select
                    value={targetAudience}
                    onChange={(e: any) => setTargetAudience(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  >
                    <option value="ALL">Everyone (الجميع: طلاب ومسؤولين)</option>
                    <option value="STUDENTS_ONLY">Students Only (للطلبة فقط)</option>
                    <option value="STAFF_ONLY">Track Staff Only (الهيد والفايس والكور فقط)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Target Track (التراك المستهدف) *</label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  >
                    <option value="ALL">All Tracks (عام للفرع كاملاً)</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="SCHEDULE">Lecture & Hall Schedule</option>
                  <option value="TASK">Assignment & Project</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Announcement Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the full broadcast message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
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
                  className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all"
                >
                  {submitting ? "Publishing..." : "Publish Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
