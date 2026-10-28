"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  Users,
  Calendar,
  Clock,
  ArrowRight,
  QrCode,
  CheckCircle2,
  Plus,
  Layers,
  MapPin,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";

interface SessionItem {
  id: string;
  trackId: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  checkInCode: string | null;
  track: {
    id: string;
    name: string;
  };
  _count: {
    attendance: number;
  };
}

interface Track {
  id: string;
  name: string;
  _count?: {
    enrollments: number;
    sessions: number;
  };
}

export default function AttendanceHubPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eelu_user_role") || "STUDENT";
    }
    return "STUDENT";
  });

  // New Session Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrackId, setNewTrackId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("05:00 PM");
  const [newLocation, setNewLocation] = useState("Hall 101 / EELU Campus");
  const [addingSession, setAddingSession] = useState(false);

  const fetchData = async () => {
    try {
      const [meRes, tracksRes, sessionsRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/tracks").then((r) => r.json()),
        fetch("/api/sessions?trackId=ALL").then((r) => r.json()),
      ]);

      const me = meRes.user;
      setUserRole(me?.role || "STUDENT");

      if (me?.role === "INSTRUCTOR" && me?.assignedTrackId) {
        const myTrack = tracksRes.tracks?.filter((t: Track) => t.id === me.assignedTrackId) || [];
        setTracks(myTrack);
        setSelectedTrackId(me.assignedTrackId);
        setNewTrackId(me.assignedTrackId);
      } else if (me?.role === "STUDENT") {
        // Only enrolled tracks for students!
        const enrolledTrackIds = me.enrollments?.map((e: any) => e.trackId) || [];
        const studentTracks = tracksRes.tracks?.filter((t: Track) => enrolledTrackIds.includes(t.id)) || [];
        setTracks(studentTracks);
        if (studentTracks.length > 0) {
          setSelectedTrackId(studentTracks[0].id);
        } else {
          setSelectedTrackId("NONE");
        }
      } else {
        if (tracksRes.tracks) {
          setTracks(tracksRes.tracks);
          if (tracksRes.tracks.length > 0 && !newTrackId) {
            setNewTrackId(tracksRes.tracks[0].id);
          }
        }
      }
      if (sessionsRes.sessions) {
        setSessions(sessionsRes.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackId || !newTitle || !newDate) return;

    setAddingSession(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: newTrackId,
          title: newTitle,
          date: newDate,
          time: newTime,
          location: newLocation,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewTitle("");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add session.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setAddingSession(false);
    }
  };

  const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(userRole);

  const filteredSessions = sessions.filter((s) => {
    if (userRole === "STUDENT") {
      const allowedTrackIds = tracks.map((t) => t.id);
      if (!allowedTrackIds.includes(s.trackId)) return false;
    }
    if (selectedTrackId === "ALL") return true;
    return s.trackId === selectedTrackId;
  });

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav
        selectedTrackId={selectedTrackId}
        onTrackChange={(tId) => setSelectedTrackId(tId)}
      />

      <div className="flex flex-1">
        <Sidebar userRole={userRole} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                CAMPUS & CLASSROOM GOVERNANCE
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB]">
                Classroom Attendance Management
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Launch interactive attendance sheets, project dynamic 6-digit lecture check-in QR codes, and review student presence logs.
              </p>
            </div>

            {isStaff && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md shadow-[#269CF0]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Add New Session
                </button>
              </div>
            )}
          </div>

          {/* Track Filter Pills Bar */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-black text-[#8FA4BD] uppercase tracking-wider pl-2 flex-shrink-0">
              Select Track:
            </span>
            {userRole !== "INSTRUCTOR" && (
              <button
                onClick={() => setSelectedTrackId("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                  selectedTrackId === "ALL"
                    ? "bg-[#269CF0] text-white shadow-md shadow-[#269CF0]/25"
                    : "bg-[#07172A] text-[#8FA4BD] hover:text-white border border-[#1E3A5F]"
                }`}
              >
                All Tracks ({sessions.length})
              </button>
            )}
            {tracks.map((t) => {
              const count = sessions.filter((s) => s.trackId === t.id).length;
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

          {/* Sessions Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-[#0D1D32] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center">
              <Users className="w-12 h-12 text-[#8FA4BD] mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-base text-[#F5F7FB]">No sessions found for this track</h3>
              <p className="text-xs text-[#8FA4BD] mt-1">
                {isStaff
                  ? "Click '+ Add New Session' above to schedule a lecture and take attendance."
                  : "No attendance sessions have been scheduled yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-[#0D1D32] border border-[#1E3A5F] hover:border-[#269CF0]/60 rounded-3xl p-6 transition-all shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-[#48D5F5] bg-[#07172A] px-2.5 py-1 rounded-full border border-[#1E3A5F]">
                        {sess.track?.name || "Track Workshop"}
                      </span>
                      {isStaff && sess.checkInCode ? (
                        <span className="text-[10px] font-mono font-black text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded-md border border-[#E5A93C]/20 flex items-center gap-1">
                          <QrCode className="w-3 h-3" />
                          Code: {sess.checkInCode.split(",")[0]}
                        </span>
                      ) : isStaff ? (
                        <span className="text-[10px] font-bold text-[#8FA4BD]">
                          Code: Inactive
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-black text-base text-[#F5F7FB] group-hover:text-[#269CF0] transition-colors mb-2 line-clamp-2">
                      {sess.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-[#8FA4BD] mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#269CF0]" />
                        <span>{sess.date}</span>
                        {sess.time && (
                          <>
                            <span>•</span>
                            <Clock className="w-3.5 h-3.5 text-[#E5A93C]" />
                            <span>{sess.time}</span>
                          </>
                        )}
                      </div>
                      {sess.location && (
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{sess.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8FA4BD]">
                      <strong className="text-white font-mono">{sess._count?.attendance || 0}</strong> Marked
                    </span>

                    <Link
                      href={`/attendance/${sess.id}`}
                      className="px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md shadow-[#269CF0]/20 transition-all flex items-center gap-1.5 group-hover:scale-105"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {isStaff ? "Take Attendance / QR" : "Self Check-in"}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Add Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black text-[#F5F7FB] mb-4 pb-2 border-b border-[#1E3A5F]">
              Add New Classroom Session
            </h3>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Track *</label>
                <select
                  required
                  value={newTrackId}
                  onChange={(e) => setNewTrackId(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Session 3: Data Cleaning & Preprocessing"
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Location / Classroom</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Hall 101 / EELU Campus or Google Meet"
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSession}
                  className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {addingSession ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
