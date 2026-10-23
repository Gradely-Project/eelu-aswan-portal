"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Trash2,
  Check,
  X,
  Megaphone,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface HallSlot {
  id: string;
  hallName: string;
  dayOfWeek: string;
  date?: string | null;
  timeSlot: string;
  capacity?: number | null;
  notes?: string | null;
  status: "AVAILABLE" | "BOOKED";
  bookedTrackId?: string | null;
  bookedTrackName?: string | null;
  bookedById?: string | null;
  bookedByName?: string | null;
  bookedAt?: string | null;
}

export default function HallsPage() {
  const [slots, setSlots] = useState<HallSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Add Slot Modal (Admin & Chair)
  const [showAddModal, setShowAddModal] = useState(false);
  const [hallName, setHallName] = useState("Campus Computer Lab 204");
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 12:00 PM");
  const [capacity, setCapacity] = useState("50");
  const [notes, setNotes] = useState("Projector, high-speed WiFi & AC available");
  const [submitting, setSubmitting] = useState(false);

  // Booking Modal
  const [bookingSlot, setBookingSlot] = useState<HallSlot | null>(null);
  const [broadcastAnnouncement, setBroadcastAnnouncement] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/halls?day=${selectedDay}&status=${selectedStatus}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setError("Failed to load hall schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [selectedDay, selectedStatus]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/halls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hallName,
          dayOfWeek,
          date,
          timeSlot,
          capacity: parseInt(capacity, 10) || 50,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add hall slot.");
        setSubmitting(false);
        return;
      }

      setFeedback(data.message || "Hall slot created successfully!");
      setShowAddModal(false);
      fetchSlots();
    } catch {
      setError("Network error while creating hall slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBook = async () => {
    if (!bookingSlot) return;
    setBookingLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/halls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: bookingSlot.id,
          action: "BOOK",
          broadcastAnnouncement,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to book hall slot.");
        setBookingLoading(false);
        return;
      }

      setFeedback(data.message || "Hall slot successfully booked!");
      setBookingSlot(null);
      fetchSlots();
    } catch {
      setError("Network error while booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRelease = async (slotId: string) => {
    if (!confirm("Are you sure you want to cancel / release this hall reservation?")) return;
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/halls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          action: "RELEASE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to release hall slot.");
        return;
      }

      setFeedback(data.message || "Reservation released.");
      fetchSlots();
    } catch {
      setError("Network error.");
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Delete this hall slot permanently?")) return;
    try {
      const res = await fetch(`/api/halls?id=${slotId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setFeedback("Hall slot deleted.");
        fetchSlots();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to delete slot.");
    }
  };

  const canManageSlots = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user?.role);
  const canBook = ["INSTRUCTOR", "ADMIN", "CHAIR_PERSON"].includes(user?.role);

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10243C] border border-[#1E3A5F] text-[#E5A93C] text-[11px] font-black uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-[#E5A93C]" />
                Official Venue Allocation System
              </div>
              <h1 className="text-2xl font-black text-[#F5F7FB]">
                Weekly Hall & Lab Booking Hub
              </h1>
              <p className="text-xs text-[#8FA4BD] mt-1 max-w-2xl">
                Browse available campus lecture halls, computer labs, and smart rooms for the upcoming week. Track Heads can reserve slots directly and instantly broadcast the location to enrolled students.
              </p>
            </div>

            {canManageSlots && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Available Hall / Slot
              </button>
            )}
          </div>

          {/* Feedback & Error Banners */}
          {feedback && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Day Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
            <div className="flex flex-wrap items-center gap-1.5 bg-[#0D1D32] p-1.5 rounded-2xl border border-[#1E3A5F]">
              <button
                onClick={() => setSelectedDay("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === "ALL"
                    ? "bg-[#269CF0] text-white shadow-sm"
                    : "text-[#8FA4BD] hover:text-[#F5F7FB]"
                }`}
              >
                All Days
              </button>
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDay === day
                      ? "bg-[#269CF0] text-white shadow-sm"
                      : "text-[#8FA4BD] hover:text-[#F5F7FB]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8FA4BD] font-bold">Filter Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#0D1D32] border border-[#1E3A5F] rounded-xl px-3 py-1.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
              >
                <option value="ALL">All Slots</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="BOOKED">Booked Only</option>
              </select>
            </div>
          </div>

          {/* Slots Grid */}
          {loading ? (
            <div className="py-20 text-center text-xs text-[#8FA4BD]">
              Loading weekly venue schedules...
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center text-xs text-[#8FA4BD]">
              <Building2 className="w-10 h-10 text-[#8FA4BD] mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm text-[#F5F7FB] mb-1">No hall slots registered for this selection.</p>
              <p>Branch administration can add venue schedules for the upcoming academic week.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {slots.map((slot) => {
                const isBooked = slot.status === "BOOKED";
                const isMyTrack =
                  user?.role === "INSTRUCTOR" && slot.bookedTrackId === user?.assignedTrackId;

                return (
                  <div
                    key={slot.id}
                    className={`rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-lg relative ${
                      isBooked
                        ? "bg-[#0b1728] border-purple-500/30"
                        : "bg-[#0D1D32] border-[#1E3A5F] hover:border-[#269CF0]/50 hover:-translate-y-0.5"
                    }`}
                  >
                    <div>
                      {/* Top Status & Day */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-[#269CF0] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {slot.dayOfWeek}
                          {slot.date && <span className="text-[10px] text-[#8FA4BD]">({slot.date})</span>}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            isBooked
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {isBooked ? "BOOKED" : "AVAILABLE"}
                        </span>
                      </div>

                      {/* Hall Name */}
                      <h3 className="text-base font-black text-[#F5F7FB] mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#E5A93C] flex-shrink-0" />
                        {slot.hallName}
                      </h3>

                      {/* Time Slot */}
                      <div className="flex items-center gap-1.5 text-xs text-[#8FA4BD] font-bold mb-3">
                        <Clock className="w-3.5 h-3.5 text-[#48D5F5]" />
                        <span>{slot.timeSlot}</span>
                        {slot.capacity && (
                          <span className="text-[10px] ml-2 text-[#8FA4BD] bg-[#07172A] px-2 py-0.5 rounded-md border border-[#1E3A5F]">
                            Capacity: {slot.capacity}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {slot.notes && (
                        <p className="text-[11px] text-[#8FA4BD] bg-[#07172A]/60 p-2.5 rounded-xl border border-[#1E3A5F]/60 mb-4">
                          {slot.notes}
                        </p>
                      )}

                      {/* Reservation Info if Booked */}
                      {isBooked && (
                        <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs mb-4">
                          <div className="flex items-center gap-1.5 text-purple-300 font-black mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
                            <span>Reserved by: {slot.bookedTrackName || "Track"}</span>
                          </div>
                          <span className="text-[10px] text-purple-300/70 block">
                            Instructor: {slot.bookedByName || "Track Lead"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between gap-2">
                      {!isBooked && canBook ? (
                        <button
                          onClick={() => setBookingSlot(slot)}
                          className="w-full py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Reserve This Hall
                        </button>
                      ) : isBooked && (isMyTrack || canManageSlots) ? (
                        <button
                          onClick={() => handleRelease(slot.id)}
                          className="w-full py-2 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Cancel / Release Booking
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#8FA4BD] italic">
                          {isBooked ? "Reserved for track session" : "Open for booking"}
                        </span>
                      )}

                      {canManageSlots && (
                        <button
                          onClick={() => handleDelete(slot.id)}
                          title="Delete slot"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Booking Confirmation Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#269CF0]/20 text-[#269CF0] border border-[#269CF0]/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#F5F7FB]">Confirm Venue Reservation</h3>
                  <span className="text-[10px] text-[#8FA4BD]">{bookingSlot.hallName}</span>
                </div>
              </div>
              <button
                onClick={() => setBookingSlot(null)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="bg-[#07172A] p-3 rounded-2xl border border-[#1E3A5F] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8FA4BD]">Day & Time:</span>
                  <span className="font-bold text-[#F5F7FB]">
                    {bookingSlot.dayOfWeek} • {bookingSlot.timeSlot}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8FA4BD]">Allocated Track:</span>
                  <span className="font-black text-[#269CF0]">
                    {user?.assignedTrack?.name || "Your Assigned Track"}
                  </span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#07172A] border border-[#1E3A5F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastAnnouncement}
                  onChange={(e) => setBroadcastAnnouncement(e.target.checked)}
                  className="mt-0.5 rounded border-[#1E3A5F] text-[#269CF0] focus:ring-0"
                />
                <div>
                  <span className="font-bold text-[#F5F7FB] block">
                    Broadcast venue notification to students
                  </span>
                  <span className="text-[10px] text-[#8FA4BD]">
                    Automatically posts an announcement to enrolled track students so they see the lecture hall in their portal and top notification bell.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setBookingSlot(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleBook}
                className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {bookingLoading ? "Reserving..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal (Admin & Chair) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#F5F7FB]">Add Available Hall / Slot</h3>
                  <span className="text-[10px] text-[#8FA4BD]">
                    Register campus rooms for upcoming track sessions
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Hall / Lab Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Computer Lab 204 or Main Auditorium"
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">Day of Week *</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">Specific Date (Optional)</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>

                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Venue Notes & Equipment</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Smart screen, Projector, High-speed LAN available"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add Hall Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
