"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  Trophy,
  Sparkles,
  CalendarCheck,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Flame,
  Sliders,
  Save,
  Award,
} from "lucide-react";

interface RankedStudent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  academicYear: string | null;
  presentCount: number;
  attendanceRate: number;
  attendanceScore: number;
  submittedTasksCount: number;
  tasksScore: number;
  bonusScore: number;
  totalScore: number;
  rank: number;
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

export default function WeightedLeaderboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Bonus Modal
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusStudentId, setBonusStudentId] = useState("");
  const [bonusPoints, setBonusPoints] = useState(15);
  const [bonusReason, setBonusReason] = useState("");
  const [submittingBonus, setSubmittingBonus] = useState(false);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);
  const [bonusError, setBonusError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/tracks").then((r) => r.json()),
    ])
      .then(([meData, tracksData]) => {
        const u = meData.user;
        setUser(u);
        const tList: Track[] = tracksData.tracks || [];
        if (u?.role === "INSTRUCTOR" && u.assignedTrackId) {
          const myTracks = tList.filter((t) => t.id === u.assignedTrackId);
          setTracks(myTracks.length > 0 ? myTracks : (u.assignedTrack ? [u.assignedTrack] : []));
          setSelectedTrackId(u.assignedTrackId);
        } else if (u?.role === "STUDENT") {
          // Strictly show only the tracks the student is enrolled in!
          const enrolledTrackIds = u.enrollments?.map((e: any) => e.trackId) || [];
          const studentTracks = tList.filter((t) => enrolledTrackIds.includes(t.id));
          setTracks(studentTracks);
          if (studentTracks.length > 0) {
            setSelectedTrackId(studentTracks[0].id);
          } else {
            setSelectedTrackId("");
          }
        } else {
          setTracks(tList);
          if (tList.length > 0) setSelectedTrackId(tList[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchLeaderboard = async (trackId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?trackId=${trackId}`);
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrackId) fetchLeaderboard(selectedTrackId);
  }, [selectedTrackId]);

  const isLeadership = user?.role === "ADMIN" || user?.role === "CHAIR_PERSON" || user?.role === "VICE_CHAIR";

  const canAddBonus =
    isLeadership ||
    (user?.role === "INSTRUCTOR" && user?.assignedTrackId === selectedTrackId);

  const handleAwardBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackId || !bonusStudentId) return;
    setBonusError(null);
    setBonusSuccess(null);
    setSubmittingBonus(true);

    try {
      const res = await fetch("/api/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrackId,
          studentId: bonusStudentId,
          points: bonusPoints,
          reason: bonusReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBonusError(data.error || "Failed to award bonus.");
        setSubmittingBonus(false);
        return;
      }

      setBonusSuccess(data.message);
      setShowBonusModal(false);
      setBonusReason("");
      setBonusPoints(15);
      await fetchLeaderboard(selectedTrackId);
    } catch {
      setBonusError("Network error.");
    } finally {
      setSubmittingBonus(false);
    }
  };

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav selectedTrackId={selectedTrackId} onTrackChange={(id) => setSelectedTrackId(id)} />

      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                HALL OF FAME & ACADEMIC RANKINGS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-2">
                <Trophy className="w-7 h-7 text-[#E5A93C]" />
                Weighted Leaderboard & Rankings
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5 max-w-2xl">
                Automatically calculated per track based on verified session attendance, assignment scores, and competition bonuses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {canAddBonus && (
                <button
                  onClick={() => {
                    setBonusError(null);
                    setBonusSuccess(null);
                    if (leaderboard.length > 0) setBonusStudentId(leaderboard[0].id);
                    setShowBonusModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#C9912F] text-[#07172A] font-black text-xs shadow-md shadow-[#E5A93C]/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Award Bonus Points
                </button>
              )}
            </div>
          </div>

          {bonusSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{bonusSuccess}</span>
            </div>
          )}

          {/* Track Switcher Tabs */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] p-2.5 rounded-2xl overflow-x-auto shadow-md">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[11px] font-black text-[#8FA4BD] uppercase px-2">
                Active Track:
              </span>
              {tracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    t.id === selectedTrackId
                      ? "bg-[#269CF0] text-white shadow-md font-black"
                      : "text-[#8FA4BD] hover:text-[#F5F7FB] hover:bg-[#10243C]"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Podium Top 3 */}
          {!loading && leaderboard.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto py-6">
              {/* Silver #2 */}
              {top2 ? (
                <div className="bg-[#0D1D32] border-2 border-slate-400/40 rounded-3xl p-6 text-center shadow-lg order-2 md:order-1">
                  <span className="text-3xl block mb-2">🥈</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Rank #2
                  </span>
                  <h3 className="text-lg font-black text-[#F5F7FB] mt-1">{top2.name}</h3>
                  <span className="text-xs text-[#8FA4BD] block mb-3">{top2.college || "Academy Scholar"}</span>
                  <div className="bg-[#07172A] border border-[#1E3A5F] py-2 px-4 rounded-xl inline-block">
                    <span className="text-2xl font-black text-[#F5F7FB]">{top2.totalScore}</span>
                    <span className="text-[10px] text-[#8FA4BD] ml-1">PTS</span>
                  </div>
                </div>
              ) : (
                <div className="order-2 md:order-1 h-32 hidden md:block" />
              )}

              {/* Gold #1 */}
              {top1 && (
                <div className="bg-gradient-to-b from-[#10243C] to-[#0D1D32] border-2 border-[#E5A93C] rounded-3xl p-8 text-center shadow-2xl glow-gold order-1 md:order-2 transform -translate-y-2">
                  <span className="text-4xl block mb-2">🥇</span>
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 text-[#E5A93C] text-[10px] font-black uppercase mb-1">
                    <Flame className="w-3 h-3" />
                    Grand Champion
                  </div>
                  <h3 className="text-xl font-black text-[#F5F7FB] mt-1">{top1.name}</h3>
                  <span className="text-xs text-[#8FA4BD] block mb-4">{top1.college || "Track Leader"}</span>
                  <div className="bg-[#07172A] border border-[#E5A93C]/50 py-3 px-6 rounded-2xl inline-block">
                    <span className="text-3xl font-black text-[#E5A93C]">{top1.totalScore}</span>
                    <span className="text-xs font-bold text-[#8FA4BD] ml-1.5">TOTAL PTS</span>
                  </div>
                </div>
              )}

              {/* Bronze #3 */}
              {top3 ? (
                <div className="bg-[#0D1D32] border-2 border-amber-600/30 rounded-3xl p-6 text-center shadow-lg order-3">
                  <span className="text-3xl block mb-2">🥉</span>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
                    Rank #3
                  </span>
                  <h3 className="text-lg font-black text-[#F5F7FB] mt-1">{top3.name}</h3>
                  <span className="text-xs text-[#8FA4BD] block mb-3">{top3.college || "Academy Scholar"}</span>
                  <div className="bg-[#07172A] border border-[#1E3A5F] py-2 px-4 rounded-xl inline-block">
                    <span className="text-2xl font-black text-[#F5F7FB]">{top3.totalScore}</span>
                    <span className="text-[10px] text-[#8FA4BD] ml-1">PTS</span>
                  </div>
                </div>
              ) : (
                <div className="order-3 h-32 hidden md:block" />
              )}
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 bg-[#10243C] border-b border-[#1E3A5F] flex items-center justify-between">
              <span className="text-xs font-black text-[#F5F7FB] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#E5A93C]" />
                Track Student Roster Rankings ({leaderboard.length} Students)
              </span>
              <span className="text-[10px] text-[#8FA4BD] font-mono">
                Formula: Verified Session Attendance + Graded Task Scores + Competition Bonuses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07172A] text-[#8FA4BD] font-black border-b border-[#1E3A5F]">
                  <tr>
                    <th className="py-3 px-4 text-center">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Faculty & Year</th>
                    <th className="py-3 px-4 text-center">Attendance Pts</th>
                    <th className="py-3 px-4 text-center">Tasks Pts</th>
                    <th className="py-3 px-4 text-center">Bonus Pts</th>
                    <th className="py-3 px-4 text-center">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#8FA4BD]">
                        Calculating track leaderboard...
                      </td>
                    </tr>
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#8FA4BD]">
                        No graded records available for this track yet.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((st) => (
                      <tr key={st.id} className="hover:bg-[#10243C]/50 transition-colors">
                        <td className="py-3 px-4 text-center font-black">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                              st.rank === 1
                                ? "bg-[#E5A93C] text-[#07172A]"
                                : st.rank === 2
                                ? "bg-slate-300 text-[#07172A]"
                                : st.rank === 3
                                ? "bg-amber-600 text-white"
                                : "bg-[#07172A] text-[#8FA4BD] border border-[#1E3A5F]"
                            }`}
                          >
                            {st.rank === 1 ? "🥇" : st.rank === 2 ? "🥈" : st.rank === 3 ? "🥉" : `#${st.rank}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#F5F7FB] block">{st.name}</span>
                          <span className="text-[10px] text-[#8FA4BD] font-mono">{st.email}</span>
                        </td>
                        <td className="py-3 px-4 text-[#8FA4BD]">
                          {st.college || "-"} {st.academicYear && `(${st.academicYear})`}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#48D5F5]">
                          {st.attendanceScore}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {st.tasksScore}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#E5A93C]">
                          +{st.bonusScore}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-sm text-[#F5F7FB]">
                          <span className="bg-[#07172A] border border-[#1E3A5F] px-3 py-1 rounded-lg">
                            {st.totalScore}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Award Bonus */}
          {showBonusModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E5A93C]" />
                  Award Competition / Activity Bonus
                </h3>
                <p className="text-xs text-[#8FA4BD] mb-4">
                  Points awarded here will be instantly added to the student&apos;s weighted total score.
                </p>

                {bonusError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    {bonusError}
                  </div>
                )}

                <form onSubmit={handleAwardBonus} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Select Student *</label>
                    <select
                      value={bonusStudentId}
                      onChange={(e) => setBonusStudentId(e.target.value)}
                      required
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    >
                      {leaderboard.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.college || "Student"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Bonus Points *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(Number(e.target.value))}
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Reason / Tournament Title *</label>
                    <input
                      type="text"
                      required
                      value={bonusReason}
                      onChange={(e) => setBonusReason(e.target.value)}
                      placeholder="e.g. 1st Place in Algorithm Speed Challenge #2"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#1E3A5F] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBonusModal(false)}
                      className="px-4 py-2 rounded-xl text-[#8FA4BD] hover:text-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBonus}
                      className="px-5 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#C9912F] text-[#07172A] font-black"
                    >
                      {submittingBonus ? "Granting..." : "Confirm & Award Points"}
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
