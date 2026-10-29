"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  CalendarDays,
  Plus,
  Send,
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  trackId: string;
  dayOfWeek: string;
  time: string;
  location: string;
  topic: string;
  emailSent: boolean;
  createdAt: string;
  track: {
    id: string;
    name: string;
  };
}

interface Track {
  id: string;
  name: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eelu_user_role") || "STUDENT";
    }
    return "STUDENT";
  });
  const [assignedTrackId, setAssignedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [trackId, setTrackId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [time, setTime] = useState("06:00 PM");
  const [location, setLocation] = useState("Campus Computer Lab 204 & Google Meet");
  const [topic, setTopic] = useState("");
  const [sendEmailImmediately, setSendEmailImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async (trkId: string = selectedTrackId || "ALL") => {
    try {
      const res = await fetch(`/api/admin/schedule?trackId=${trkId}`);
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/tracks").then((r) => r.json()),
    ]).then(([meData, trkData]) => {
      const me = meData.user;
      if (me?.role !== "ADMIN") {
        // Non-admins do not have access to global schedules/broadcast suite per user specification
        window.location.href = "/dashboard";
        return;
      }
      setUserRole(me?.role || "STUDENT");
      setAssignedTrackId(me?.assignedTrackId || null);
      setTracks(trkData.tracks || []);
      if (trkData.tracks?.length > 0) setTrackId(trkData.tracks[0].id);
      fetchSchedules("ALL");
    });
  }, []);

  useEffect(() => {
    if (userRole !== "INSTRUCTOR") {
      fetchSchedules(selectedTrackId);
    }
  }, [selectedTrackId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId,
          dayOfWeek,
          time,
          location,
          topic,
          sendEmail: sendEmailImmediately,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback(data.message);
        setShowAddModal(false);
        setTopic("");
        await fetchSchedules();
      } else {
        setError(data.error || "Failed to create schedule.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcast = async (scheduleId: string) => {
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "BROADCAST", scheduleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message);
        await fetchSchedules();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Network error.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={userRole} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                ACADEMIC CALENDAR & DISPATCH
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB]">
                Weekly Track Schedules & Broadcasts
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Schedule upcoming weekly lectures per track and dispatch automated email notifications to all enrolled students.
              </p>
            </div>

            <button
              onClick={() => {
                setError(null);
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Schedule Next Week Session
            </button>
          </div>

          {feedback && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Schedules List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[#0D1D32] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center">
              <CalendarDays className="w-12 h-12 text-[#8FA4BD] mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-base text-[#F5F7FB]">No weekly schedules announced yet</h3>
              <p className="text-xs text-[#8FA4BD] mt-1 mb-4">Click below to announce the lecture schedule for this week.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-[#269CF0] text-white font-bold text-xs"
              >
                Schedule Session Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#269CF0] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#269CF0]/20 text-[#48D5F5] border border-[#269CF0]/30 uppercase">
                        {sc.track.name}
                      </span>
                      {sc.emailSent ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          In-App Notification Sent to Students
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30">
                          Draft (Not Broadcasted Yet)
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-base text-[#F5F7FB]">{sc.topic}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#8FA4BD]">
                      <span className="flex items-center gap-1 text-[#F5F7FB] font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#269CF0]" />
                        {sc.dayOfWeek} at {sc.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {sc.location}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleBroadcast(sc.id)}
                      className="px-4 py-2 rounded-xl bg-[#10243C] hover:bg-[#1E3A5F] text-[#48D5F5] hover:text-white font-bold text-xs border border-[#1E3A5F] transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sc.emailSent ? "Re-broadcast Notification" : "Broadcast to Students' Accounts"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
                <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#269CF0]" />
                  Schedule Weekly Track Session
                </h3>
                <p className="text-xs text-[#8FA4BD] mb-4">
                  Set the lecture time and topic. Students enrolled in this track will receive an email notification.
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Select Track *</label>
                    <select
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      disabled={userRole === "INSTRUCTOR"}
                      required
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#8FA4BD] mb-1">Day of the Week *</label>
                      <input
                        type="text"
                        required
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        placeholder="e.g. Every Monday"
                        className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#8FA4BD] mb-1">Time *</label>
                      <input
                        type="text"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="e.g. 05:00 PM"
                        className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Topic / Lecture Agenda *</label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Full-Stack State Management & Auth Tokens"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Location or Online Meeting Link</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Lab 204 or Google Meet"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="notify"
                      checked={sendEmailImmediately}
                      onChange={(e) => setSendEmailImmediately(e.target.checked)}
                      className="w-4 h-4 rounded text-[#269CF0] focus:ring-0"
                    />
                    <label htmlFor="notify" className="font-bold text-[#F5F7FB]">
                      Broadcast in-app notification & announcement to all enrolled students immediately
                    </label>
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
                      {submitting ? "Saving..." : "Publish & Broadcast"}
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
