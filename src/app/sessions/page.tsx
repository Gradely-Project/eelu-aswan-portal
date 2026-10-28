"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
  Users,
  Trash2,
  AlertCircle,
  FolderOpen,
  QrCode,
  KeyRound,
  CheckCircle2,
  Star,
  FileText,
  Video,
  Code,
  Database,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Download,
  Share2,
  X,
  MessageSquare,
  UploadCloud,
  File,
} from "lucide-react";

interface MaterialItem {
  title: string;
  url: string;
  type?: "slides" | "video" | "code" | "dataset" | "other";
}

interface InstructorMember {
  id: string;
  name: string;
  trackTeamRole: string | null;
}

interface Session {
  id: string;
  trackId: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  materials: string | null;
  checkInCode: string | null;
  track?: {
    id: string;
    name: string;
    instructors?: InstructorMember[];
  };
  _count: {
    attendance: number;
  };
}

interface Track {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  trackTeamRole?: string | null;
  assignedTrackId?: string | null;
  assignedTrack?: { id: string; name: string } | null;
  enrollments?: Array<{ track: { id: string; name: string } }>;
}

export default function SessionsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"materials" | "notes" | "evaluations">("materials");

  // Add Session Modal (Create Session from Scratch)
  const [showAddModal, setShowAddModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [targetTrackId, setTargetTrackId] = useState("");
  const [materialList, setMaterialList] = useState<MaterialItem[]>([
    { title: "Session Slides / Presentation", url: "", type: "slides" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Single Material Modal (On existing session)
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialSourceMode, setMaterialSourceMode] = useState<"FILE" | "LINK">("FILE");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialType, setNewMaterialType] = useState<"slides" | "video" | "code" | "dataset" | "other">("slides");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setMaterialError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMaterialError(data.error || "Failed to upload file.");
        setUploadingFile(false);
        return;
      }

      setNewMaterialUrl(data.url);
      setUploadedFileName(data.fileName);
      setUploadedFileSize(data.fileSize);
      if (!newMaterialTitle.trim()) {
        const nameWithoutExt = data.fileName.replace(/\.[^/.]+$/, "");
        setNewMaterialTitle(nameWithoutExt);
      }
      if (data.detectedType) {
        setNewMaterialType(data.detectedType);
      }
    } catch {
      setMaterialError("Network error while uploading file.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Student Evaluation Modal
  const [evalSession, setEvalSession] = useState<Session | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<{ name: string; role: string } | null>(null);
  const [clarityRating, setClarityRating] = useState(5);
  const [materialRating, setMaterialRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingEval, setSavingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState<string | null>(null);

  // Admin Instructor Evaluations Audit Report
  const [instructorReports, setInstructorReports] = useState<any[]>([]);
  const [sessionsReports, setSessionsReports] = useState<any[]>([]);
  const [overallAverage, setOverallAverage] = useState<number>(0);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditSubTab, setAuditSubTab] = useState<"instructors" | "sessions">("instructors");
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        const u = data.user;
        setUser(u);

        fetch("/api/tracks")
          .then((tRes) => tRes.json())
          .then((tData) => {
            const list = tData.tracks || [];
            setTracks(list);
            if (u?.assignedTrackId) {
              setSelectedTrackId(u.assignedTrackId);
              setTargetTrackId(u.assignedTrackId);
            } else if (list.length > 0) {
              setTargetTrackId(list[0].id);
            }
          });
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchSessions = async (trkId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions?trackId=${trkId}`);
      const data = await res.json();
      const loadedSessions: Session[] = data.sessions || [];
      setSessions(loadedSessions);
      if (loadedSessions.length > 0) {
        setSelectedSessionId(loadedSessions[0].id);
      } else {
        setSelectedSessionId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/instructor-evaluations");
      const data = await res.json();
      if (res.ok) {
        setInstructorReports(data.instructorsReport || []);
        setSessionsReports(data.sessionsReport || []);
        setOverallAverage(data.overallAverage || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchSessions(selectedTrackId);
  }, [selectedTrackId]);

  useEffect(() => {
    if (activeTab === "evaluations" && user?.role === "ADMIN") {
      fetchInstructorReports();
    }
  }, [activeTab, user]);

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "CHAIR_PERSON" ||
    (user?.role === "INSTRUCTOR" && (selectedTrackId === "ALL" || user?.assignedTrackId === selectedTrackId));

  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "ADMIN";

  const handleAddMaterialRow = () => {
    setMaterialList([...materialList, { title: "", url: "", type: "slides" }]);
  };

  const handleRemoveMaterialRow = (idx: number) => {
    setMaterialList(materialList.filter((_, i) => i !== idx));
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTrackId = user?.assignedTrackId || targetTrackId;
    if (!finalTrackId) return;

    setError(null);
    setSubmitting(true);

    try {
      const filteredMaterials = materialList.filter((m) => m.url.trim() !== "");

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: finalTrackId,
          title: sessionTitle,
          description: sessionDesc,
          date: sessionDate,
          time: sessionTime,
          location: sessionLocation,
          materials: filteredMaterials,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create session.");
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setSessionTitle("");
      setSessionDesc("");
      setSessionDate("");
      setSessionTime("");
      setSessionLocation("");
      setMaterialList([{ title: "Session Slides / Presentation", url: "", type: "slides" }]);

      await fetchSessions(selectedTrackId);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Material to Existing Selected Session
  const handleAddSingleMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    if (!newMaterialTitle.trim() || !newMaterialUrl.trim()) return;

    setAddingMaterial(true);
    setMaterialError(null);

    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_MATERIAL",
          material: {
            title: newMaterialTitle.trim(),
            url: newMaterialUrl.trim(),
            type: newMaterialType,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMaterialError(data.error || "Failed to add material.");
        setAddingMaterial(false);
        return;
      }

      // Update session in state
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, materials: JSON.stringify(data.materials) }
            : s
        )
      );

      setShowAddMaterialModal(false);
      setNewMaterialTitle("");
      setNewMaterialUrl("");
      setNewMaterialType("slides");
    } catch {
      setMaterialError("Network error.");
    } finally {
      setAddingMaterial(false);
    }
  };

  // Delete Material from Existing Selected Session
  const handleDeleteMaterial = async (index: number, title: string) => {
    if (!selectedSession) return;
    if (!confirm(`Are you sure you want to remove "${title}" from this session?`)) return;

    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_MATERIAL",
          materialIndex: index,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSession.id
              ? { ...s, materials: JSON.stringify(data.materials) }
              : s
          )
        );
      } else {
        alert(data.error || "Failed to remove material.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session and its attendance logs?")) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setSessions(remaining);
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
      } else {
        alert("Failed to delete session.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const openEvaluationModal = (sess: Session) => {
    setEvalSession(sess);
    const instructors = sess.track?.instructors || [];
    if (instructors.length > 0) {
      setSelectedInstructor({
        name: instructors[0].name,
        role: getRoleTitle(instructors[0].trackTeamRole),
      });
    } else {
      setSelectedInstructor({ name: "Assigned Track Instructor", role: "Instructor" });
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalSession) return;

    setSavingEval(true);
    try {
      const res = await fetch("/api/sessions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: evalSession.id,
          instructorName: selectedInstructor?.name,
          instructorRole: selectedInstructor?.role,
          clarityRating,
          materialRating,
          overallRating,
          feedbackText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvalSuccess("Evaluation saved successfully. Thank you for your feedback!");
        setTimeout(() => {
          setEvalSession(null);
          setEvalSuccess(null);
        }, 1500);
      } else {
        alert(data.error || "Failed to submit evaluation.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSavingEval(false);
    }
  };

  const getRoleTitle = (teamRole?: string | null) => {
    if (teamRole === "HEAD") return "Lead Instructor (Head)";
    if (teamRole === "VICE_HEAD") return "Vice Lead";
    return "Core Instructor";
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  let currentMaterials: MaterialItem[] = [];
  try {
    if (selectedSession?.materials) {
      currentMaterials = JSON.parse(selectedSession.materials);
    }
  } catch {}

  const filteredMaterials = currentMaterials.filter((m) => {
    if (materialFilter === "ALL") return true;
    if (materialFilter === "SLIDES") return m.type === "slides" || m.title.toLowerCase().includes("slide");
    if (materialFilter === "VIDEO") return m.type === "video" || m.title.toLowerCase().includes("video") || m.title.toLowerCase().includes("recording");
    if (materialFilter === "CODE") return m.type === "code" || m.title.toLowerCase().includes("code") || m.title.toLowerCase().includes("github");
    if (materialFilter === "DATASET") return m.type === "dataset" || m.title.toLowerCase().includes("data");
    return true;
  });

  const getMaterialIcon = (item: MaterialItem) => {
    const t = (item.type || "").toLowerCase();
    const title = item.title.toLowerCase();
    if (t === "video" || title.includes("recording") || title.includes("video")) return Video;
    if (t === "code" || title.includes("github") || title.includes("code")) return Code;
    if (t === "dataset" || title.includes("data")) return Database;
    return FileText;
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav selectedTrackId={selectedTrackId} onTrackChange={(id) => setSelectedTrackId(id)} />

      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                ACADEMIC WORKSTATION
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#F5F7FB] flex items-center gap-2.5">
                <Calendar className="w-7 h-7 text-[#269CF0]" />
                Session Hubs & Educational Materials
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Lecture agendas, Google Drive material bundles, recordings, and live classroom check-in.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAuditModal(true);
                    fetchInstructorReports();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#E5A93C]/20 hover:bg-[#E5A93C]/30 text-[#E5A93C] border border-[#E5A93C]/40 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  title="View evaluations breakdown for instructors and lectures"
                >
                  <Star className="w-4 h-4 fill-current text-[#E5A93C]" />
                  <span>Instructor Ratings Audit</span>
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => {
                    setError(null);
                    setShowAddModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Session
                </button>
              )}
            </div>
          </div>

          {/* 2-Panel Workstation Layout */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-[#0D1D32] rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="lg:col-span-7 h-96 bg-[#0D1D32] rounded-3xl animate-pulse" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center">
              <Calendar className="w-12 h-12 text-[#8FA4BD] mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-base text-[#F5F7FB]">No sessions scheduled for this track yet</h3>
              <p className="text-xs text-[#8FA4BD] mt-1 mb-4">
                {canEdit ? "Create the first lecture and attach Drive materials." : "Check back soon for upcoming lectures."}
              </p>
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#269CF0] text-white font-bold text-xs"
                >
                  Create Session Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT PANEL: Sessions Drawer List (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-3">
                {/* Search Bar */}
                <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl p-2.5 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#8FA4BD] ml-1" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter sessions by title or keyword..."
                    className="w-full bg-transparent text-xs text-[#F5F7FB] placeholder-[#8FA4BD] focus:outline-none"
                  />
                </div>

                {/* Session Cards List */}
                <div className="space-y-2.5 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
                  {filteredSessions.map((session, idx) => {
                    const isSelected = session.id === selectedSession?.id;
                    let mCount = 0;
                    try {
                      if (session.materials) mCount = JSON.parse(session.materials).length;
                    } catch {}

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-[#10243C] border-[#269CF0] shadow-lg glow-blue"
                            : "bg-[#0D1D32] border-[#1E3A5F] hover:border-[#269CF0]/50 hover:bg-[#0E2036]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#48D5F5] bg-[#269CF0]/10 px-2 py-0.5 rounded-md border border-[#269CF0]/20">
                            Lecture #{sessions.length - idx}
                          </span>
                          <span className="text-[10px] text-[#8FA4BD] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#E5A93C]" />
                            {session.date}
                          </span>
                        </div>

                        <h4 className="font-black text-sm text-[#F5F7FB] line-clamp-1 group-hover:text-[#269CF0] transition-colors">
                          {session.title}
                        </h4>

                        <div className="mt-2.5 pt-2 border-t border-[#1E3A5F]/70 flex items-center justify-between text-[11px] text-[#8FA4BD]">
                          <span className="truncate max-w-[140px] text-[10px] font-bold text-[#E5A93C]">
                            {session.track?.name || "Track"}
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            <span>{mCount} Files</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{session._count.attendance} Attended</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANEL: Selected Session Workbench (lg:col-span-7) */}
              {selectedSession && (
                <div className="lg:col-span-7 bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-5 sm:p-7 shadow-xl">
                  {/* Session Workbench Header */}
                  <div className="pb-5 mb-5 border-b border-[#1E3A5F]">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E5A93C] bg-[#E5A93C]/10 px-2.5 py-1 rounded-full border border-[#E5A93C]/20">
                        {selectedSession.track?.name || "OFFICIAL TRACK"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Attendance Link for Staff */}
                        <Link
                          href={`/attendance/${selectedSession.id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#07172A] hover:bg-[#10243C] border border-[#1E3A5F] hover:border-[#269CF0] text-[11px] font-bold text-[#48D5F5] transition-all flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#269CF0]" />
                          <span>Attendance & QR</span>
                        </Link>

                        {/* Rate Lecture Button for Student */}
                        {isStudent && (
                          <button
                            onClick={() => openEvaluationModal(selectedSession)}
                            className="px-3 py-1.5 rounded-xl bg-[#E5A93C] hover:bg-[#d4962c] text-[#07172A] text-[11px] font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>Rate Lecture</span>
                          </button>
                        )}

                        {/* Delete Session for Admin */}
                        {user?.role === "ADMIN" && (
                          <button
                            onClick={() => handleDeleteSession(selectedSession.id)}
                            className="p-1.5 rounded-xl bg-[#07172A] hover:bg-rose-500/20 text-[#8FA4BD] hover:text-rose-400 border border-[#1E3A5F] transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#F5F7FB] mb-3">
                      {selectedSession.title}
                    </h2>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8FA4BD]">
                      <span className="flex items-center gap-1.5 bg-[#07172A] px-2.5 py-1 rounded-lg border border-[#1E3A5F]">
                        <Calendar className="w-3.5 h-3.5 text-[#269CF0]" />
                        {selectedSession.date}
                      </span>
                      {selectedSession.time && (
                        <span className="flex items-center gap-1.5 bg-[#07172A] px-2.5 py-1 rounded-lg border border-[#1E3A5F]">
                          <Clock className="w-3.5 h-3.5 text-[#E5A93C]" />
                          {selectedSession.time}
                        </span>
                      )}
                      {selectedSession.location && (
                        <span className="flex items-center gap-1.5 bg-[#07172A] px-2.5 py-1 rounded-lg border border-[#1E3A5F]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {selectedSession.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Workbench Navigation Tabs */}
                  <div className="flex items-center gap-2 sm:gap-3 border-b border-[#1E3A5F] pb-3 mb-5 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab("materials")}
                      className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "materials"
                          ? "bg-[#269CF0] text-white shadow-md glow-blue"
                          : "text-[#8FA4BD] hover:text-white hover:bg-[#07172A]"
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      Materials & Recordings ({currentMaterials.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === "notes"
                          ? "bg-[#269CF0] text-white shadow-md glow-blue"
                          : "text-[#8FA4BD] hover:text-white hover:bg-[#07172A]"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Instructor Team & Agenda
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setActiveTab("evaluations")}
                        className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                          activeTab === "evaluations"
                            ? "bg-[#E5A93C] text-[#07172A] shadow-md font-black"
                            : "text-[#8FA4BD] hover:text-white hover:bg-[#07172A]"
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        Instructor Evaluations Audit
                      </button>
                    )}
                  </div>

                  {/* TAB 1: Materials & Video Recordings */}
                  {activeTab === "materials" && (
                    <div className="space-y-4">
                      {/* Material Sub-Filters & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {["ALL", "SLIDES", "VIDEO", "CODE", "DATASET"].map((filt) => (
                            <button
                              key={filt}
                              onClick={() => setMaterialFilter(filt)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                materialFilter === filt
                                  ? "bg-[#10243C] text-[#48D5F5] border border-[#269CF0]"
                                  : "text-[#8FA4BD] hover:text-white bg-[#07172A] border border-[#1E3A5F]"
                              }`}
                            >
                              {filt}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Add Material Button for Instructors / Admin */}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setMaterialError(null);
                                setShowAddMaterialModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Material</span>
                            </button>
                          )}

                          {currentMaterials.length > 0 && currentMaterials[0]?.url && (
                            <a
                              href={currentMaterials[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#269CF0]/10 border border-[#269CF0]/30 hover:border-[#269CF0] text-[#48D5F5] hover:text-white text-xs font-bold transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Drive Folder</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Materials List */}
                      {filteredMaterials.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-[#07172A] border border-[#1E3A5F] text-center">
                          <FolderOpen className="w-10 h-10 text-[#8FA4BD] mx-auto mb-2 opacity-50" />
                          <p className="text-xs text-[#8FA4BD] font-medium">No materials attached under this category.</p>
                          {canEdit && (
                            <button
                              onClick={() => setShowAddMaterialModal(true)}
                              className="mt-3 px-4 py-2 rounded-xl bg-[#269CF0] text-white text-xs font-bold cursor-pointer"
                            >
                              + Add First Material
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredMaterials.map((mat, mIdx) => {
                            const MatIcon = getMaterialIcon(mat);
                            return (
                              <div
                                key={mIdx}
                                className="p-3.5 rounded-2xl bg-[#07172A] border border-[#1E3A5F] hover:border-[#269CF0]/50 transition-all flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-[#10243C] border border-[#1E3A5F] flex items-center justify-center text-[#269CF0] flex-shrink-0">
                                    <MatIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-xs text-[#F5F7FB] truncate group-hover:text-[#48D5F5] transition-colors">
                                      {mat.title}
                                    </h5>
                                    <span className="text-[10px] text-[#8FA4BD] font-mono truncate block">
                                      {mat.url}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <a
                                    href={mat.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-[#10243C] hover:bg-[#269CF0] text-[#48D5F5] hover:text-white text-[11px] font-black border border-[#1E3A5F] transition-all flex items-center gap-1.5"
                                  >
                                    <span>Open Resource</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>

                                  {/* Delete Material Button for authorized staff */}
                                  {canEdit && (
                                    <button
                                      onClick={() => handleDeleteMaterial(mIdx, mat.title)}
                                      className="p-1.5 rounded-xl bg-[#10243C] hover:bg-rose-500/20 text-[#8FA4BD] hover:text-rose-400 border border-[#1E3A5F] transition-colors cursor-pointer"
                                      title="Delete Material"
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
                    </div>
                  )}

                  {/* TAB 2: Instructor Team & Notes */}
                  {activeTab === "notes" && (
                    <div className="space-y-5">
                      {/* Description & Agenda */}
                      <div className="bg-[#07172A] p-4 rounded-2xl border border-[#1E3A5F]">
                        <h4 className="text-xs font-black uppercase text-[#E5A93C] mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Lecture Outline & Agenda
                        </h4>
                        <p className="text-xs text-[#CBD5E1] leading-relaxed font-medium">
                          {selectedSession.description || "No specific written agenda provided for this session."}
                        </p>
                      </div>

                      {/* Instructor Team of the Track */}
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#48D5F5] mb-2 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Track Instructor Team
                        </h4>
                        {selectedSession.track?.instructors && selectedSession.track.instructors.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {selectedSession.track.instructors.map((inst) => (
                              <div
                                key={inst.id}
                                className="p-3 rounded-xl bg-[#07172A] border border-[#1E3A5F] flex items-center gap-2.5"
                              >
                                <div className="w-7 h-7 rounded-lg bg-[#E5A93C]/20 text-[#E5A93C] font-black text-xs flex items-center justify-center uppercase">
                                  {inst.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <h6 className="font-bold text-xs text-white truncate">{inst.name}</h6>
                                  <span className="text-[10px] text-[#E5A93C] font-semibold block">
                                    {getRoleTitle(inst.trackTeamRole)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-xs text-[#8FA4BD]">
                            Track instructors assigned via Admin Team Management.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Admin Instructor Evaluations Audit */}
                  {activeTab === "evaluations" && isAdmin && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#1E3A5F]">
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Star className="w-4 h-4 text-[#E5A93C] fill-current" />
                            Instructor Academic Performance & Evaluations Audit
                          </h4>
                          <span className="text-[11px] text-[#8FA4BD]">
                            Student feedback scores aggregated by instructor across all sessions.
                          </span>
                        </div>
                        <button
                          onClick={fetchInstructorReports}
                          className="px-3 py-1 rounded-lg bg-[#07172A] hover:bg-[#10243C] text-[10px] font-bold text-[#48D5F5] border border-[#1E3A5F]"
                        >
                          Refresh Scores
                        </button>
                      </div>

                      {loadingReports ? (
                        <div className="p-8 text-center text-xs text-[#8FA4BD]">Loading audit reports...</div>
                      ) : instructorReports.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#8FA4BD] bg-[#07172A] rounded-2xl border border-[#1E3A5F]">
                          No student evaluations submitted yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {instructorReports.map((inst, idx) => (
                            <div
                              key={idx}
                              className="bg-[#07172A] border border-[#1E3A5F] rounded-2xl p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-sm text-white flex items-center gap-2">
                                    <span>{inst.instructorName}</span>
                                    <span className="text-[10px] font-black uppercase text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded border border-[#E5A93C]/20">
                                      {inst.instructorRole}
                                    </span>
                                  </h5>
                                  <span className="text-[10px] text-[#8FA4BD]">{inst.trackName}</span>
                                </div>

                                <div className="flex items-center gap-3 font-mono text-xs">
                                  <span className="bg-[#10243C] px-2.5 py-1 rounded-lg border border-[#1E3A5F]">
                                    Clarity: <strong className="text-[#E5A93C]">★ {inst.avgClarity}</strong>
                                  </span>
                                  <span className="bg-[#10243C] px-2.5 py-1 rounded-lg border border-[#1E3A5F]">
                                    Materials: <strong className="text-[#269CF0]">★ {inst.avgMaterial}</strong>
                                  </span>
                                  <span className="bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 font-bold">
                                    Overall: ★ {inst.avgOverall} ({inst.totalReviews} reviews)
                                  </span>
                                </div>
                              </div>

                              {inst.feedbacks && inst.feedbacks.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-[#1E3A5F]/50">
                                  <span className="text-[10px] font-bold text-[#8FA4BD] uppercase block">
                                    Student Comments ({inst.feedbacks.length})
                                  </span>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {inst.feedbacks.map((fb: any, fIdx: number) => (
                                      <div
                                        key={fIdx}
                                        className="p-2 rounded-lg bg-[#0D1D32] border border-[#1E3A5F]/60 text-[11px] text-[#CBD5E1]"
                                      >
                                        <p>"{fb.comment}"</p>
                                        <span className="text-[9px] text-[#8FA4BD] mt-0.5 block">
                                          {fb.studentName || "Student"} • {fb.sessionTitle} • {fb.date}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Single Material Modal (On Existing Session) */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#269CF0]/20 border border-[#269CF0]/30 flex items-center justify-center text-[#269CF0]">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Add Session Material</h3>
                  <span className="text-[10px] text-[#8FA4BD]">{selectedSession?.title}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {materialError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{materialError}</span>
              </div>
            )}

            {/* Choose Source Mode */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#07172A] rounded-2xl border border-[#1E3A5F] mb-4">
              <button
                type="button"
                onClick={() => setMaterialSourceMode("FILE")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  materialSourceMode === "FILE"
                    ? "bg-[#269CF0] text-white shadow-sm"
                    : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload File (PDF/Doc/Img)
              </button>
              <button
                type="button"
                onClick={() => setMaterialSourceMode("LINK")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  materialSourceMode === "LINK"
                    ? "bg-[#269CF0] text-white shadow-sm"
                    : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Web URL / Drive Link
              </button>
            </div>

            <form onSubmit={handleAddSingleMaterial} className="space-y-3.5 text-xs">
              {materialSourceMode === "FILE" ? (
                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">
                    Select File (PDF, Word, PowerPoint, Image, etc.) *
                  </label>
                  <label className="border-2 border-dashed border-[#1E3A5F] hover:border-[#269CF0] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-[#07172A]/60 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.svg,.zip,.rar,.txt"
                      onChange={handleFileUpload}
                    />
                    {uploadingFile ? (
                      <div className="flex items-center gap-2 text-xs text-[#269CF0] font-bold py-2">
                        <div className="w-4 h-4 border-2 border-[#269CF0] border-t-transparent rounded-full animate-spin" />
                        Uploading file to server...
                      </div>
                    ) : uploadedFileName ? (
                      <div className="flex flex-col items-center gap-1 text-emerald-400 text-xs font-bold py-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[260px]">{uploadedFileName}</span>
                        </div>
                        {uploadedFileSize && (
                          <span className="text-[10px] text-[#8FA4BD]">
                            {(uploadedFileSize / (1024 * 1024)).toFixed(2)} MB • Ready to add
                          </span>
                        )}
                        <span className="text-[10px] text-[#48D5F5] underline mt-1">Click to change file</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-7 h-7 text-[#48D5F5] mb-1.5" />
                        <span className="text-xs font-bold text-[#F5F7FB]">Choose document, presentation or image</span>
                        <span className="text-[10px] text-[#8FA4BD] mt-0.5">Supports PDF, Word (.docx), PowerPoint, PNG/JPG, ZIP</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-[#8FA4BD] font-bold mb-1">Resource URL (Drive, GitHub, Video) *</label>
                  <input
                    type="url"
                    required={materialSourceMode === "LINK"}
                    placeholder="https://drive.google.com/... or https://youtu.be/..."
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Session Presentation Slides / Recording Link"
                  value={newMaterialTitle}
                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block text-[#8FA4BD] font-bold mb-1">Category / Resource Type *</label>
                <select
                  value={newMaterialType}
                  onChange={(e) => setNewMaterialType(e.target.value as any)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                >
                  <option value="slides">Slides / Presentation (PDF/PPT)</option>
                  <option value="video">Video Recording / Tutorial</option>
                  <option value="code">Code Repository / GitHub / ZIP</option>
                  <option value="dataset">Document / Notes / Image</option>
                  <option value="other">Other Academic Material</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMaterial || (materialSourceMode === "FILE" && !newMaterialUrl)}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {addingMaterial ? "Saving..." : "Add to Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Session Modal (Full) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-[#F5F7FB] mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#269CF0]" />
              Schedule New Lecture Session
            </h3>
            <p className="text-xs text-[#8FA4BD] mb-4">
              Create an academic session and link Google Drive materials for students.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Target Track *</label>
                <select
                  disabled={user?.role === "INSTRUCTOR"}
                  value={user?.assignedTrackId || targetTrackId}
                  onChange={(e) => setTargetTrackId(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Session Title / Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Session 3: React State Management & Hooks"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 06:00 PM - 08:30 PM"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Location / Classroom</label>
                <input
                  type="text"
                  placeholder="e.g. Lab 4 (Aswan Campus) or Google Meet"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Session Description & Agenda</label>
                <textarea
                  rows={3}
                  placeholder="Summary of concepts covered and required preparation..."
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0] resize-none"
                />
              </div>

              {/* Materials List Inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#8FA4BD]">Drive Materials & Resources</label>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="text-[10px] font-bold text-[#269CF0] hover:underline"
                  >
                    + Add Link
                  </button>
                </div>

                <div className="space-y-2">
                  {materialList.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={m.type || "slides"}
                        onChange={(e) => {
                          const copy = [...materialList];
                          copy[idx].type = e.target.value as any;
                          setMaterialList(copy);
                        }}
                        className="w-24 bg-[#07172A] border border-[#1E3A5F] rounded-xl px-2 py-1.5 text-[11px] text-[#48D5F5] focus:outline-none"
                      >
                        <option value="slides">Slides</option>
                        <option value="video">Video</option>
                        <option value="code">Code</option>
                        <option value="dataset">Dataset</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Title (e.g. Slide Deck)"
                        value={m.title}
                        onChange={(e) => {
                          const copy = [...materialList];
                          copy[idx].title = e.target.value;
                          setMaterialList(copy);
                        }}
                        className="w-1/3 bg-[#07172A] border border-[#1E3A5F] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />

                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={m.url}
                        onChange={(e) => {
                          const copy = [...materialList];
                          copy[idx].url = e.target.value;
                          setMaterialList(copy);
                        }}
                        className="flex-1 bg-[#07172A] border border-[#1E3A5F] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />

                      {materialList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialRow(idx)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Lecture Rating Modal */}
      {evalSession && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#E5A93C] fill-current" />
              Rate Lecture & Specific Instructor
            </h3>
            <p className="text-xs text-[#8FA4BD] mb-4">
              Lecture: <strong className="text-[#48D5F5]">{evalSession.title}</strong>
            </p>

            {evalSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{evalSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Select Instructor / Team Member to Rate *
                  </label>
                  {evalSession.track?.instructors && evalSession.track.instructors.length > 0 ? (
                    <div className="space-y-1.5">
                      {evalSession.track.instructors.map((inst) => {
                        const roleTitle = getRoleTitle(inst.trackTeamRole);
                        const isChosen = selectedInstructor?.name === inst.name;
                        return (
                          <div
                            key={inst.id}
                            onClick={() => setSelectedInstructor({ name: inst.name, role: roleTitle })}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isChosen
                                ? "bg-[#10243C] border-[#E5A93C] text-white"
                                : "bg-[#07172A] border-[#1E3A5F] text-[#8FA4BD] hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isChosen ? "bg-[#E5A93C]" : "bg-slate-600"}`} />
                              <span className="font-bold text-xs text-white">{inst.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-[#E5A93C] uppercase">
                              {roleTitle}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={selectedInstructor?.name || "Assigned Track Instructor"}
                      disabled
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Explanation Quality & Clarity (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setClarityRating(star)}
                        className={`p-2 rounded-xl border text-xs font-black transition-all ${
                          clarityRating >= star
                            ? "bg-[#E5A93C] text-[#07172A] border-[#E5A93C]"
                            : "bg-[#07172A] text-[#8FA4BD] border-[#1E3A5F]"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Lecture Materials & Resources (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setMaterialRating(star)}
                        className={`p-2 rounded-xl border text-xs font-black transition-all ${
                          materialRating >= star
                            ? "bg-[#269CF0] text-white border-[#269CF0]"
                            : "bg-[#07172A] text-[#8FA4BD] border-[#1E3A5F]"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Overall Experience
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setOverallRating(star)}
                        className={`p-2 rounded-xl border text-xs font-black transition-all ${
                          overallRating >= star
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-[#07172A] text-[#8FA4BD] border-[#1E3A5F]"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">
                    Constructive Feedback & Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide constructive feedback for the selected instructor..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E3A5F]">
                  <button
                    type="button"
                    onClick={() => setEvalSession(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEval}
                    className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingEval ? "Submitting..." : "Submit Rating"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Overall Evaluations Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#E5A93C]/40 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30">
                  <Star className="w-5 h-5 fill-current" />
                </span>
                <div>
                  <h3 className="text-xl font-black text-white">Student Evaluations & Teaching Quality Audit</h3>
                  <p className="text-xs text-[#E5A93C] font-semibold">
                    لوحة حصرية للإدارة لمتابعة تقييمات الطلاب لكل محاضرة ومدرب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-4 bg-[#07172A] border border-[#1E3A5F] rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8FA4BD] block">Overall Academy Average</span>
                <span className="text-2xl font-black text-[#E5A93C] mt-1 block">★ {overallAverage} / 5.0</span>
              </div>
              <div className="p-4 bg-[#07172A] border border-[#1E3A5F] rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8FA4BD] block">Total Evaluations Submitted</span>
                <span className="text-2xl font-black text-[#48D5F5] mt-1 block">
                  {instructorReports.reduce((s, i) => s + i.totalReviews, 0)} Feedback Records
                </span>
              </div>
              <div className="p-4 bg-[#07172A] border border-[#1E3A5F] rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8FA4BD] block">Evaluated Staff Members</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  {instructorReports.length} Instructors
                </span>
              </div>
            </div>

            {/* Sub-tab selection */}
            <div className="flex items-center gap-2 mb-4 border-b border-[#1E3A5F] pb-3">
              <button
                onClick={() => setAuditSubTab("instructors")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  auditSubTab === "instructors"
                    ? "bg-[#269CF0] text-white shadow-md"
                    : "bg-[#07172A] text-[#8FA4BD] hover:text-white border border-[#1E3A5F]"
                }`}
              >
                👤 Instructor Performance (تقييم الهيد والفايس والكور)
              </button>
              <button
                onClick={() => setAuditSubTab("sessions")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  auditSubTab === "sessions"
                    ? "bg-[#269CF0] text-white shadow-md"
                    : "bg-[#07172A] text-[#8FA4BD] hover:text-white border border-[#1E3A5F]"
                }`}
              >
                📚 Per-Lecture Breakdown (تقييم كل محاضرة)
              </button>
            </div>

            {loadingReports ? (
              <div className="p-12 text-center text-xs text-[#8FA4BD]">Loading evaluation statistics...</div>
            ) : auditSubTab === "instructors" ? (
              <div className="space-y-4">
                {instructorReports.length === 0 ? (
                  <p className="p-8 text-center text-xs text-[#8FA4BD] bg-[#07172A] rounded-2xl border border-[#1E3A5F]">
                    No instructor evaluations submitted by students yet.
                  </p>
                ) : (
                  instructorReports.map((inst, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#07172A] border border-[#1E3A5F] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{inst.instructorName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30 uppercase">
                              {inst.instructorRole}
                            </span>
                          </h4>
                          <span className="text-[11px] text-[#8FA4BD]">{inst.trackName}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="bg-[#10243C] px-3 py-1 rounded-lg border border-[#1E3A5F]">
                            Clarity: <strong className="text-[#E5A93C]">★ {inst.avgClarity}</strong>
                          </span>
                          <span className="bg-[#10243C] px-3 py-1 rounded-lg border border-[#1E3A5F]">
                            Materials: <strong className="text-[#269CF0]">★ {inst.avgMaterial}</strong>
                          </span>
                          <span className="bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 font-black">
                            Overall: ★ {inst.avgOverall} ({inst.totalReviews} reviews)
                          </span>
                        </div>
                      </div>

                      {inst.feedbacks && inst.feedbacks.length > 0 && (
                        <div className="pt-2 border-t border-[#1E3A5F]/60 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#8FA4BD] uppercase block">
                            Student Written Comments:
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {inst.feedbacks.map((f: any, fIdx: number) => (
                              <div key={fIdx} className="p-2 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[11px]">
                                <div className="flex justify-between text-[10px] text-[#8FA4BD] mb-0.5">
                                  <span>{f.sessionTitle} • {f.studentName || "Student"}</span>
                                  <span className="text-[#E5A93C] font-black">★ {f.overall}</span>
                                </div>
                                <p className="text-slate-200 italic">&ldquo;{f.comment}&rdquo;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sessionsReports.length === 0 ? (
                  <p className="p-8 text-center text-xs text-[#8FA4BD] bg-[#07172A] rounded-2xl border border-[#1E3A5F]">
                    No per-lecture evaluations submitted yet.
                  </p>
                ) : (
                  sessionsReports.map((sess, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#07172A] border border-[#1E3A5F] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-bold text-white text-sm">{sess.sessionTitle}</h4>
                        <span className="text-[11px] text-[#8FA4BD]">{sess.trackName} • {sess.date}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="bg-[#10243C] px-2.5 py-1 rounded-lg border border-[#1E3A5F] text-[11px]">
                          Clarity: <strong className="text-[#E5A93C]">★ {sess.avgClarity}</strong>
                        </span>
                        <span className="bg-[#10243C] px-2.5 py-1 rounded-lg border border-[#1E3A5F] text-[11px]">
                          Material: <strong className="text-[#269CF0]">★ {sess.avgMaterial}</strong>
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-black text-xs">
                          Overall: ★ {sess.avgOverall} ({sess.totalReviews})
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="pt-4 border-t border-[#1E3A5F] flex justify-end mt-6">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2 rounded-xl bg-[#269CF0] text-white font-bold text-xs"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
