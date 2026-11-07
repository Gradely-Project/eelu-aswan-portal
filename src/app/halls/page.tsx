"use client";

import { useEffect, useState, useMemo } from "react";
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
  Sparkles,
  RotateCcw,
  Copy,
  Layers,
  Filter,
  History,
  TrendingUp,
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

  // View Tabs: UPCOMING vs PAST
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");

  // Filter States
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedHall, setSelectedHall] = useState("ALL");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState("ALL");
  const [timeHorizon, setTimeHorizon] = useState<"ALL" | "THIS_WEEK" | "NEXT_WEEK" | "CUSTOM">("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Add / Duplicate Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [hallName, setHallName] = useState("Campus Computer Lab 204");
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 12:00 PM");
  const [capacity, setCapacity] = useState("50");
  const [notes, setNotes] = useState("Projector, high-speed WiFi & AC available");
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Booking Modal State
  const [bookingSlot, setBookingSlot] = useState<HallSlot | null>(null);
  const [broadcastAnnouncement, setBroadcastAnnouncement] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleDateChange = (val: string) => {
    setDate(val);
    if (val) {
      const parts = val.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const computed = dayNames[d.getDay()];
        if (computed) setDayOfWeek(computed);
      }
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/halls?day=ALL&status=ALL`);
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
    fetchSlots();
  }, []);

  // Helper: Estimate hours from a timeSlot string
  const parseHours = (slotStr: string): number => {
    try {
      const parts = slotStr.split("-");
      if (parts.length === 2) {
        const parseTime = (tStr: string) => {
          const match = tStr.trim().match(/(\d+):?(\d*)\s*(AM|PM)?/i);
          if (!match) return 0;
          let hour = parseInt(match[1], 10);
          const mins = match[2] ? parseInt(match[2], 10) : 0;
          const ampm = (match[3] || "").toUpperCase();
          if (ampm === "PM" && hour < 12) hour += 12;
          if (ampm === "AM" && hour === 12) hour = 0;
          return hour + mins / 60;
        };
        const start = parseTime(parts[0]);
        const end = parseTime(parts[1]);
        const diff = end - start;
        if (diff > 0 && diff <= 8) return Math.round(diff * 10) / 10;
      }
    } catch {}
    return 2.0; // fallback standard 2 hours per lecture
  };

  // Track Booking Statistics
  const stats = useMemo(() => {
    const booked = slots.filter((s) => s.status === "BOOKED");
    const totalBookings = booked.length;
    let totalHours = 0;
    const byTrack: Record<string, { count: number; hours: number }> = {};

    booked.forEach((s) => {
      const hrs = parseHours(s.timeSlot);
      totalHours += hrs;
      const tName = s.bookedTrackName || "General Track";
      if (!byTrack[tName]) byTrack[tName] = { count: 0, hours: 0 };
      byTrack[tName].count += 1;
      byTrack[tName].hours += hrs;
    });

    return { totalBookings, totalHours: Math.round(totalHours * 10) / 10, byTrack };
  }, [slots]);

  // Unique Halls List for Filter
  const uniqueHalls = useMemo(() => {
    const set = new Set<string>();
    slots.forEach((s) => {
      if (s.hallName) set.add(s.hallName);
    });
    return Array.from(set);
  }, [slots]);

  // Unique Tracks List for Filter
  const uniqueTracks = useMemo(() => {
    const set = new Set<string>();
    slots.forEach((s) => {
      if (s.bookedTrackName) set.add(s.bookedTrackName);
    });
    return Array.from(set);
  }, [slots]);

  // Filtered Slots
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filteredSlots = useMemo(() => {
    // Current week boundary calculations
    const now = new Date();
    const dayOfWeekIdx = now.getDay();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - dayOfWeekIdx); // Sunday
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Saturday
    currentWeekEnd.setHours(23, 59, 59, 999);

    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(currentWeekEnd);
    nextWeekEnd.setDate(currentWeekEnd.getDate() + 7);

    return slots.filter((slot) => {
      const slotDateStr = slot.date || "";

      // 1. Tab Check: UPCOMING vs PAST
      if (activeTab === "PAST") {
        if (!slotDateStr || slotDateStr >= todayStr) return false;
      } else {
        if (slotDateStr && slotDateStr < todayStr) return false;
      }

      // 2. Day of Week Filter
      if (selectedDay !== "ALL" && slot.dayOfWeek !== selectedDay) return false;

      // 3. Status Filter
      if (selectedStatus !== "ALL" && slot.status !== selectedStatus) return false;

      // 4. Hall Filter
      if (selectedHall !== "ALL" && slot.hallName !== selectedHall) return false;

      // 5. Track Filter
      if (selectedTrackFilter !== "ALL" && slot.bookedTrackName !== selectedTrackFilter) return false;

      // 6. Time Horizon
      if (timeHorizon === "THIS_WEEK" && slotDateStr) {
        const d = new Date(slotDateStr);
        if (d < currentWeekStart || d > currentWeekEnd) return false;
      } else if (timeHorizon === "NEXT_WEEK" && slotDateStr) {
        const d = new Date(slotDateStr);
        if (d < nextWeekStart || d > nextWeekEnd) return false;
      } else if (timeHorizon === "CUSTOM") {
        if (filterStartDate && slotDateStr < filterStartDate) return false;
        if (filterEndDate && slotDateStr > filterEndDate) return false;
      }

      return true;
    });
  }, [
    slots,
    activeTab,
    todayStr,
    selectedDay,
    selectedStatus,
    selectedHall,
    selectedTrackFilter,
    timeHorizon,
    filterStartDate,
    filterEndDate,
  ]);

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
          repeatWeeks: Number(repeatWeeks) || 1,
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
      setRepeatWeeks(1);
      fetchSlots();
    } catch {
      setError("Network error while creating hall slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicateSlot = (slot: HallSlot) => {
    setHallName(slot.hallName);
    setTimeSlot(slot.timeSlot);
    setCapacity(slot.capacity?.toString() || "50");
    setNotes(slot.notes || "");
    if (slot.date) {
      const parts = slot.date.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + 7);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setDate(`${yyyy}-${mm}-${dd}`);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        setDayOfWeek(dayNames[d.getDay()]);
      }
    } else {
      setDate("");
      setDayOfWeek(slot.dayOfWeek);
    }
    setRepeatWeeks(1);
    setShowAddModal(true);
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
                Official Venue Allocation & Timetable Hub
              </div>
              <h1 className="text-2xl font-black text-[#F5F7FB]">
                Campus Timetables & Room Booking System
              </h1>
              <p className="text-xs text-[#8FA4BD] mt-1 max-w-2xl">
                Browse available campus lecture halls, computer labs, and smart rooms. Reserve slots, repeat schedules across weeks, and track each bootcamp specialization&apos;s allocated hours throughout the semester.
              </p>
            </div>

            {canManageSlots && (
              <button
                onClick={() => {
                  setRepeatWeeks(1);
                  setShowAddModal(true);
                }}
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

          {/* Track Utilization Metrics Bar */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E3A5F] gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#E5A93C]" />
                <h3 className="text-xs font-black uppercase text-[#F5F7FB] tracking-wider">
                  Semester Track Booking Statistics & Lab Utilization (إحصائيات استهلاك القاعات لكل تراك)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-[#8FA4BD]">
                  Total Reservations: <strong className="text-[#48D5F5]">{stats.totalBookings} Slots</strong>
                </span>
                <span className="text-[#8FA4BD]">
                  Total Lab Hours: <strong className="text-[#E5A93C]">{stats.totalHours} Hours</strong>
                </span>
              </div>
            </div>

            {Object.keys(stats.byTrack).length === 0 ? (
              <p className="text-xs text-[#8FA4BD] py-2">No bookings recorded yet this semester.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(stats.byTrack).map(([tName, data]) => (
                  <div
                    key={tName}
                    className="p-3 rounded-2xl bg-[#07172A] border border-[#1E3A5F] flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-[#F5F7FB] truncate block mb-1" title={tName}>
                      {tName}
                    </span>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1 border-t border-[#1E3A5F]/60">
                      <span className="text-[#48D5F5] font-black">{data.count} Bookings</span>
                      <span className="text-[#E5A93C] font-black">{data.hours} hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Tabs: Upcoming vs Past Archive */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-[#0D1D32] p-1.5 rounded-2xl border border-[#1E3A5F]">
              <button
                onClick={() => setActiveTab("UPCOMING")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "UPCOMING"
                    ? "bg-[#269CF0] text-white shadow-md shadow-[#269CF0]/25"
                    : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Active & Upcoming Slots (المواعيد القادمة والنشطة)
              </button>
              <button
                onClick={() => setActiveTab("PAST")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "PAST"
                    ? "bg-[#E5A93C] text-[#07172A] shadow-md shadow-[#E5A93C]/25"
                    : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                <History className="w-4 h-4" />
                Past Archive & History (أرشيف وسجل المواعيد السابقة)
              </button>
            </div>

            {/* Quick Horizon Filter */}
            <div className="flex items-center gap-1.5 bg-[#0D1D32] p-1.5 rounded-2xl border border-[#1E3A5F] text-xs">
              <span className="text-[10px] font-bold text-[#8FA4BD] px-2 uppercase">Horizon:</span>
              <button
                onClick={() => setTimeHorizon("ALL")}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  timeHorizon === "ALL" ? "bg-[#1E3A5F] text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                All Dates
              </button>
              <button
                onClick={() => setTimeHorizon("THIS_WEEK")}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  timeHorizon === "THIS_WEEK" ? "bg-[#1E3A5F] text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeHorizon("NEXT_WEEK")}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  timeHorizon === "NEXT_WEEK" ? "bg-[#1E3A5F] text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Next Week
              </button>
              <button
                onClick={() => setTimeHorizon("CUSTOM")}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  timeHorizon === "CUSTOM" ? "bg-[#1E3A5F] text-white" : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Sub Filters Row (Days, Status, Hall, Track, Date Range) */}
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Day Filter Chips */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setSelectedDay("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedDay === "ALL" ? "bg-[#269CF0] text-white" : "bg-[#07172A] text-[#8FA4BD] hover:text-white"
                }`}
              >
                All Days
              </button>
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedDay === day ? "bg-[#269CF0] text-white" : "bg-[#07172A] text-[#8FA4BD] hover:text-white"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#07172A] border border-[#1E3A5F] rounded-xl px-2.5 py-1 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="BOOKED">Booked Only</option>
              </select>

              {/* Hall Filter */}
              {uniqueHalls.length > 0 && (
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="bg-[#07172A] border border-[#1E3A5F] rounded-xl px-2.5 py-1 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                >
                  <option value="ALL">All Halls / Labs</option>
                  {uniqueHalls.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              )}

              {/* Track Filter */}
              {uniqueTracks.length > 0 && (
                <select
                  value={selectedTrackFilter}
                  onChange={(e) => setSelectedTrackFilter(e.target.value)}
                  className="bg-[#07172A] border border-[#1E3A5F] rounded-xl px-2.5 py-1 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                >
                  <option value="ALL">All Tracks</option>
                  {uniqueTracks.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              )}

              {/* Custom Date Range Picker */}
              {timeHorizon === "CUSTOM" && (
                <div className="flex items-center gap-1.5 bg-[#07172A] p-1 rounded-xl border border-[#1E3A5F]">
                  <span className="text-[10px] text-[#8FA4BD]">From:</span>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="bg-transparent text-white font-mono text-[11px] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#8FA4BD]">To:</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="bg-transparent text-white font-mono text-[11px] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Slots Grid */}
          {loading ? (
            <div className="py-20 text-center text-xs text-[#8FA4BD]">
              Loading weekly venue schedules...
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center text-xs text-[#8FA4BD]">
              <Building2 className="w-10 h-10 text-[#8FA4BD] mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm text-[#F5F7FB] mb-1">
                No slots found matching this criteria ({activeTab === "PAST" ? "Past Archive" : "Active & Upcoming"}).
              </p>
              <p>Branch administration can add or duplicate venue schedules for upcoming academic weeks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSlots.map((slot) => {
                const isBooked = slot.status === "BOOKED";
                const isMyTrack =
                  user?.role === "INSTRUCTOR" && slot.bookedTrackId === user?.assignedTrackId;
                const isPast = slot.date && slot.date < todayStr;

                return (
                  <div
                    key={slot.id}
                    className={`rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-lg relative ${
                      isPast
                        ? "bg-[#08121f] border-[#1E3A5F]/40 opacity-80"
                        : isBooked
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

                        <div className="flex items-center gap-1.5">
                          {isPast && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              PAST
                            </span>
                          )}
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
                      </div>

                      {/* Hall Name */}
                      <h3 className="text-base font-black text-[#F5F7FB] mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#E5A93C] flex-shrink-0" />
                        {slot.hallName}
                      </h3>

                      {/* Time Slot & Hours */}
                      <div className="flex items-center gap-1.5 text-xs text-[#8FA4BD] font-bold mb-3 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-[#48D5F5]" />
                        <span>{slot.timeSlot}</span>
                        <span className="text-[10px] text-[#E5A93C] bg-[#07172A] px-2 py-0.5 rounded-md border border-[#1E3A5F]">
                          {parseHours(slot.timeSlot)} hrs
                        </span>
                        {slot.capacity && (
                          <span className="text-[10px] text-[#8FA4BD] bg-[#07172A] px-2 py-0.5 rounded-md border border-[#1E3A5F]">
                            Cap: {slot.capacity}
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
                    <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-1">
                        {!isBooked && canBook ? (
                          <button
                            onClick={() => setBookingSlot(slot)}
                            className="flex-1 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Reserve Hall
                          </button>
                        ) : isBooked && (isMyTrack || canManageSlots) ? (
                          <button
                            onClick={() => handleRelease(slot.id)}
                            className="flex-1 py-2 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Release Slot
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8FA4BD] italic">
                            {isBooked ? "Reserved for track session" : "Open for booking"}
                          </span>
                        )}

                        {/* Duplicate Slot for Admin / Chair */}
                        {canManageSlots && (
                          <button
                            onClick={() => handleDuplicateSlot(slot)}
                            title="تكرار الميعاد للأسبوع القادم (+1 Week)"
                            className="p-2 rounded-xl bg-[#07172A] hover:bg-[#10243C] text-[#48D5F5] border border-[#1E3A5F] hover:border-[#48D5F5]/40 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>
                        )}
                      </div>

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
                {bookingSlot.date && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#8FA4BD]">Specific Date:</span>
                    <span className="font-bold text-[#E5A93C] font-mono">{bookingSlot.date}</span>
                  </div>
                )}
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
                    Automatically posts an announcement to enrolled track students so they see the lecture hall in their portal and notification bell.
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

      {/* Add / Recurring Slot Modal (Admin & Chair) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#F5F7FB]">Add Available Hall / Timetable Slot</h3>
                  <span className="text-[10px] text-[#8FA4BD]">
                    Register campus rooms with optional weekly recurrence
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
                  <label className="block text-[#8FA4BD] font-bold mb-1">Specific Start Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
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

              {/* Recurring Option */}
              <div className="p-3 bg-[#07172A] rounded-xl border border-[#1E3A5F]">
                <label className="block text-[#E5A93C] font-black uppercase text-[10px] mb-1">
                  تكرار الميعاد أسبوعياً (Repeat Weekly Recurrence)
                </label>
                <select
                  value={repeatWeeks}
                  onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                  className="w-full bg-[#0D1D32] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                >
                  <option value={1}>مرة واحدة فقط (Single Week)</option>
                  <option value={2}>لمدة أسبوعين متتاليين (Repeat 2 Weeks)</option>
                  <option value={4}>لمدة شهر كامل (Repeat 4 Weeks)</option>
                  <option value={8}>لمدة الترم كامل (Repeat 8 Weeks / Full Semester)</option>
                </select>
                <span className="text-[10px] text-[#8FA4BD] mt-1 block">
                  سيتم إنشاء المواعيد للأيام والأسابيع التالية تلقائياً وبنفس التوقيت.
                </span>
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
                  {submitting
                    ? "Saving..."
                    : repeatWeeks > 1
                    ? `Create ${repeatWeeks} Recurring Slots`
                    : "Add Hall Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
