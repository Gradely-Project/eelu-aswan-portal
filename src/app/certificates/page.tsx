"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import {
  GraduationCap,
  Plus,
  Printer,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Download,
  Eye,
  FileCheck,
  Settings,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";

interface CertificateItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  trackId: string;
  trackName: string;
  certificateNo: string;
  issueDate: string;
  grade: string;
  supervisorName: string;
  chairName: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  role?: string;
  trackTeamRole?: string | null;
  assignedTrackId?: string | null;
  enrollments: Array<{ track: { id: string; name: string } }>;
}

interface Signatory {
  name: string;
  role: string;
  order: number;
  enabled: boolean;
}

interface SignatoriesConfig {
  showOfficialSeal: boolean;
  sealText: string;
  reportSignatories: Signatory[];
  certificateSignatories: Signatory[];
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eelu_user_role") || "STUDENT";
    }
    return "STUDENT";
  });
  const [loading, setLoading] = useState(true);
  const [filterTrackId, setFilterTrackId] = useState<string>("ALL");

  // Dynamic Signatories Configuration
  const [signatoriesConfig, setSignatoriesConfig] = useState<SignatoriesConfig | null>(null);
  const [showSignatoriesModal, setShowSignatoriesModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SignatoriesConfig | null>(null);
  const [savingSignatories, setSavingSignatories] = useState(false);

  // Issue Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [recipientCategory, setRecipientCategory] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [grade, setGrade] = useState("Distinction");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Certificate Print / Fullscreen Preview Modal
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  const fetchCertificatesData = async () => {
    try {
      const [meRes, certRes, tracksRes, sigRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/certificates").then((r) => r.json()),
        fetch("/api/tracks").then((r) => r.json()),
        fetch("/api/admin/signatories").then((r) => r.json()),
      ]);

      const role = meRes.user?.role || "STUDENT";
      setUserRole(role);
      if (sigRes.config) setSignatoriesConfig(sigRes.config);
      if (certRes.certificates) setCertificates(certRes.certificates);
      if (certRes.students) setStudents(certRes.students);
      if (tracksRes.tracks) {
        setTracks(tracksRes.tracks);
        if (tracksRes.tracks.length > 0) setSelectedTrackId(tracksRes.tracks[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificatesData();
  }, []);

  const handleOpenSignatoriesModal = () => {
    if (signatoriesConfig) {
      setEditingConfig(JSON.parse(JSON.stringify(signatoriesConfig)));
      setShowSignatoriesModal(true);
    }
  };

  const handleSaveSignatories = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    setSavingSignatories(true);
    try {
      const res = await fetch("/api/admin/signatories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingConfig),
      });
      const data = await res.json();
      if (data.config) {
        setSignatoriesConfig(data.config);
        setShowSignatoriesModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSignatories(false);
    }
  };

  // High-Resolution 1600x1100 Canvas Download matching Image 1
  const handleDownloadPNG = (cert: CertificateItem) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Pure White Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1600, 1100);

    // 2. Outer Luxury Gold Border
    ctx.strokeStyle = "#C88A1A";
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 1540, 1040);

    // Thin Inner Gold Border
    ctx.strokeStyle = "rgba(200, 138, 26, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 1504, 1004);

    // 3. Left Dark Navy Arched Pillar
    ctx.fillStyle = "#07172A";
    ctx.beginPath();
    ctx.moveTo(35, 35);
    ctx.lineTo(340, 35);
    ctx.bezierCurveTo(380, 400, 380, 700, 340, 1065);
    ctx.lineTo(35, 1065);
    ctx.closePath();
    ctx.fill();

    // Left Pillar Gold Border Accent
    ctx.strokeStyle = "#C88A1A";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Left Column Content: Header & Track
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText("EELU ASWAN", 190, 130);
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText("STUDENT BRANCH", 190, 160);

    // Left Center Track Icon (Decorative)
    ctx.strokeStyle = "#E5A93C";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(190, 480, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 32px Inter, sans-serif";
    const trackCode = cert.trackName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "ENG";
    ctx.fillText(trackCode, 190, 492);

    // Left Bottom Track Name
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 22px Georgia, serif";
    ctx.fillText(cert.trackName, 190, 880);
    ctx.fillStyle = "#8FA4BD";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText("SPECIALIZATION TRACK", 190, 910);

    // 4. Right Dark Navy Decorative Pillar
    ctx.fillStyle = "#07172A";
    ctx.beginPath();
    ctx.moveTo(1565, 35);
    ctx.lineTo(1420, 35);
    ctx.bezierCurveTo(1380, 400, 1380, 700, 1420, 1065);
    ctx.lineTo(1565, 1065);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#C88A1A";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Right Pillar Badge
    ctx.fillStyle = "#0B1A2D";
    ctx.fillRect(1440, 460, 80, 80);
    ctx.strokeStyle = "#E5A93C";
    ctx.lineWidth = 2;
    ctx.strokeRect(1440, 460, 80, 80);
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText(trackCode, 1480, 510);

    // 5. Center Content
    // Top Academic Year
    ctx.textAlign = "right";
    ctx.fillStyle = "#C88A1A";
    ctx.font = "bold 20px monospace";
    ctx.fillText("2025 - 2026", 1370, 110);

    // Header Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#07172A";
    ctx.font = "900 68px Georgia, serif";
    ctx.fillText("CERTIFICATE", 880, 200);

    // Subtitle
    ctx.fillStyle = "#C88A1A";
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText("O F   A P P R E C I A T I O N", 880, 255);

    // Gold Divider Line
    ctx.strokeStyle = "#C88A1A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(600, 280);
    ctx.lineTo(1160, 280);
    ctx.stroke();

    // Introductory text
    ctx.fillStyle = "#475569";
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText("This certificate is Presented to", 880, 350);

    // Recipient Name in Large Golden Serif
    ctx.fillStyle = "#C88A1A";
    ctx.font = "bold 64px Georgia, serif";
    ctx.fillText(cert.studentName, 880, 460);

    // Underline Student Name
    const nameWidth = ctx.measureText(cert.studentName).width;
    ctx.strokeStyle = "rgba(200, 138, 26, 0.5)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(880 - nameWidth / 2 - 30, 490);
    ctx.lineTo(880 + nameWidth / 2 + 30, 490);
    ctx.stroke();

    // Paragraph Text
    ctx.fillStyle = "#334155";
    ctx.font = "21px Inter, sans-serif";
    ctx.fillText(
      `In recognition of successfully attending and completing all sessions of the`,
      880,
      570
    );
    ctx.fillText(
      `${cert.trackName} Track organized by EELU Aswan Student Branch.`,
      880,
      610
    );
    ctx.fillText(
      `Thank you for your commitment, curiosity, and active participation.`,
      880,
      655
    );

    // Bottom Divider
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(430, 770);
    ctx.lineTo(1330, 770);
    ctx.stroke();

    // 4 Signatures matching Image 1
    const sigs = [
      { name: "Mayar Ramadan", role: "Branch Chairwoman", x: 530 },
      { name: "Mohamed Mahmoud", role: "Vice Supervisor Branch", x: 760 },
      { name: "Eng. Abdelrahman Mahmoud", role: "Supervisor Branch", x: 1000 },
      { name: "Prof. Mohamed Nagdy", role: "Center Manager", x: 1230 },
    ];

    sigs.forEach((s) => {
      ctx.textAlign = "center";
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold italic 21px Georgia, serif";
      ctx.fillText(s.name, s.x, 830);

      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 70, 845);
      ctx.lineTo(s.x + 70, 845);
      ctx.stroke();

      ctx.fillStyle = "#64748B";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText(s.role, s.x, 875);
    });

    // Serial & Issue Date at very bottom
    ctx.textAlign = "left";
    ctx.fillStyle = "#94A3B8";
    ctx.font = "13px monospace";
    ctx.fillText(`Certificate No: ${cert.certificateNo}`, 430, 970);

    ctx.textAlign = "right";
    ctx.fillText(`Date: ${cert.issueDate}`, 1330, 970);

    // Download to client
    const link = document.createElement("a");
    link.download = `Certificate_${cert.studentName.replace(/\s+/g, "_")}_${cert.certificateNo}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke and delete the certificate for ${name}?`)) return;

    try {
      const res = await fetch(`/api/certificates?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        await fetchCertificatesData();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to revoke certificate.");
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedTrackId) {
      setError("Please select both a student and a track.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          trackId: selectedTrackId,
          grade,
          issueDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Certificate issued successfully.");
        setShowIssueModal(false);
        await fetchCertificatesData();
      } else {
        setError(data.error || "Failed to issue certificate.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const isExec = ["ADMIN", "CHAIR_PERSON"].includes(userRole);

  const filteredRecipients = students.filter((st) => {
    const isInst = st.role === "INSTRUCTOR";
    if (recipientCategory === "INSTRUCTOR" && !isInst) return false;
    if (recipientCategory === "STUDENT" && isInst) return false;

    if (isInst) {
      return st.assignedTrackId === selectedTrackId;
    }
    return st.enrollments?.some((en) => en.track.id === selectedTrackId);
  });

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] flex flex-col font-sans">
      <TopNav />

      <div className="flex flex-1">
        <Sidebar userRole={userRole} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-[#E5A93C] uppercase tracking-wider block mb-1">
                ACADEMIC ACCREDITATION & HONORS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] flex items-center gap-2">
                <GraduationCap className="w-7 h-7 text-[#48D5F5]" />
                {userRole === "STUDENT" ? "My Official Certificates" : "Accredited Certificates Registry"}
              </h1>
              <p className="text-xs text-[#8FA4BD] font-medium mt-0.5">
                Official verified completion credentials certified by EELU Aswan Student Branch & Academic Supervision.
              </p>
            </div>

            {isExec && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {userRole === "ADMIN" && signatoriesConfig && (
                  <button
                    onClick={handleOpenSignatoriesModal}
                    className="px-4 py-2.5 rounded-xl bg-[#0D1D32] hover:bg-[#1E3A5F] border border-[#E5A93C]/40 text-[#E5A93C] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Customize Certificate Signatures and Seal"
                  >
                    <Settings className="w-4 h-4 text-[#E5A93C]" />
                    <span className="hidden sm:inline">Signatures & Seal</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setError(null);
                    setRecipientCategory("STUDENT");
                    if (filteredRecipients.length > 0) setSelectedStudentId(filteredRecipients[0].id);
                    setShowIssueModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Issue New Certificate
                </button>
              </div>
            )}
          </div>

          {/* Feedback */}
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Multi-track Filter Chips (For Execs) */}
          {userRole !== "INSTRUCTOR" && certificates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-[11px] font-black text-[#8FA4BD] uppercase px-1">
                Filter Track:
              </span>
              <button
                onClick={() => setFilterTrackId("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterTrackId === "ALL"
                    ? "bg-[#269CF0] text-white shadow-sm font-black"
                    : "bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-white"
                }`}
              >
                All Tracks ({certificates.length})
              </button>
              {tracks.map((t) => {
                const count = certificates.filter((c) => c.trackId === t.id || c.trackName === t.name).length;
                if (count === 0 && userRole === "STUDENT") return null;
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilterTrackId(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterTrackId === t.id
                        ? "bg-[#269CF0] text-white shadow-sm font-black"
                        : "bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-white"
                    }`}
                  >
                    {t.name} {count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>
          )}

          {/* Certificates Grid */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-[#0D1D32] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-12 text-center">
              <GraduationCap className="w-12 h-12 text-[#8FA4BD] mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-base text-[#F5F7FB]">
                {userRole === "STUDENT"
                  ? "No completion certificates issued yet"
                  : userRole === "INSTRUCTOR"
                  ? "No certificates issued for your track yet"
                  : "No certificates generated yet"}
              </h3>
              <p className="text-xs text-[#8FA4BD] mt-1">
                {userRole === "STUDENT"
                  ? "Certificates are published upon successful completion and evaluation of your track."
                  : userRole === "INSTRUCTOR"
                  ? "Certificates for students in your track will appear here once officially issued by Branch Administration."
                  : "Click '+ Issue New Certificate' to award an official graduation or honor certificate."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {certificates
                .filter((c) => filterTrackId === "ALL" || c.trackId === filterTrackId || c.trackName === filterTrackId)
                .map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 shadow-xl hover:border-[#269CF0]/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#269CF0]/15 text-[#48D5F5] border border-[#269CF0]/30">
                          {cert.trackName}
                        </span>
                        <span className="text-[10px] text-[#8FA4BD] font-mono">
                          {cert.certificateNo}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-[#F5F7FB] mb-1 group-hover:text-[#269CF0] transition-colors">
                        {cert.studentName}
                      </h3>
                      <p className="text-xs text-[#8FA4BD] mb-4">
                        Specialized Bootcamp Graduation Certificate • Rating: <strong className="text-[#E5A93C]">{cert.grade}</strong>
                      </p>

                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#1E3A5F] text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-[#8FA4BD] block">Issue Date</span>
                          <span className="font-mono text-white text-[11px]">{cert.issueDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#8FA4BD] block">Certification Authority</span>
                          <span className="text-[#48D5F5] font-bold text-[11px]">EELU Aswan Branch</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="px-4 py-2 rounded-xl bg-[#07172A] hover:bg-[#1E3A5F] text-[#F5F7FB] border border-[#1E3A5F] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#269CF0]" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleDownloadPNG(cert)}
                          className="px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PNG
                        </button>
                      </div>

                      {isExec && (
                        <button
                          onClick={() => handleRevoke(cert.id, cert.studentName)}
                          className="p-2 rounded-xl text-[#8FA4BD] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Revoke Certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Issue Certificate */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#E5A93C]" />
              Issue Accredited Certificate
            </h3>
            <p className="text-xs text-[#8FA4BD] mb-4">
              Certificates are authenticated with official supervisor credentials and unique serial numbers.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Recipient Category Selector */}
            <div className="flex items-center gap-2 p-1 bg-[#07172A] rounded-2xl border border-[#1E3A5F] mb-4">
              <button
                type="button"
                onClick={() => {
                  setRecipientCategory("STUDENT");
                  setSelectedStudentId("");
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  recipientCategory === "STUDENT"
                    ? "bg-[#269CF0] text-white shadow-sm font-black"
                    : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                🎓 طالب متدرب (Student)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecipientCategory("INSTRUCTOR");
                  setSelectedStudentId("");
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  recipientCategory === "INSTRUCTOR"
                    ? "bg-[#E5A93C] text-[#07172A] shadow-sm font-black"
                    : "text-[#8FA4BD] hover:text-white"
                }`}
              >
                ⭐ مدرب / رئيس تراك (Staff / Lead)
              </button>
            </div>

            <form onSubmit={handleIssue} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#8FA4BD] mb-1">Select Track *</label>
                <select
                  value={selectedTrackId}
                  onChange={(e) => setSelectedTrackId(e.target.value)}
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
                <label className="block font-bold text-[#8FA4BD] mb-1">
                  Select {recipientCategory === "INSTRUCTOR" ? "Instructor / Head" : "Student"} *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                >
                  {filteredRecipients.length === 0 ? (
                    <option value="">
                      No {recipientCategory === "INSTRUCTOR" ? "instructors" : "enrolled students"} found in this track
                    </option>
                  ) : (
                    filteredRecipients.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.role === "INSTRUCTOR" ? `★ [${st.trackTeamRole || "STAFF"}]` : ""} ({st.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Grade / Distinction *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  >
                    <option value="Distinction">Distinction (امتياز)</option>
                    <option value="Honors">With Honors (مرتبة الشرف)</option>
                    <option value="Leadership Award">Leadership & Excellence Award (تقدير قيادي)</option>
                    <option value="Excellent">Excellent (ممتاز)</option>
                    <option value="Completed">Successfully Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#8FA4BD] mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedStudentId}
                  className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Generating..." : "Generate Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Full Preview Modal - Exact Match with Image 1 */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-5xl w-full my-auto space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-[#0D1D32] p-4 rounded-2xl border border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#E5A93C]" />
                <span className="font-bold text-sm text-white">Official Certificate Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPNG(previewCert)}
                  className="px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save as PNG
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#07172A] border border-[#1E3A5F] text-[#F5F7FB] hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#E5A93C]" />
                  Print
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-4 py-2 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Template Card Matching Reference Image 1 */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
              className="bg-white border-[6px] border-[#C88A1A] rounded-3xl text-slate-800 relative shadow-2xl overflow-hidden print-cert max-w-5xl w-full flex flex-col md:flex-row min-h-[560px]"
            >
              {/* Left Column: Dark Navy Arch Pillar */}
              <div className="w-full md:w-64 bg-[#07172A] rounded-b-[2.5rem] md:rounded-b-none md:rounded-r-[3.5rem] p-6 flex flex-col items-center justify-between text-center border-b-4 md:border-b-0 md:border-r-4 border-[#C88A1A] text-white relative shadow-inner">
                {/* Top Logo & Title */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#E5A93C] p-1 bg-[#0B1A2D] shadow-md mb-2">
                    <Image src="/logo.jpeg" alt="EELU Logo" width={64} height={64} className="object-contain w-full h-full rounded-xl" />
                  </div>
                  <span className="font-serif font-black text-sm text-[#F5F7FB] leading-tight">EELU Aswan</span>
                  <span className="text-[10px] text-[#E5A93C] font-bold tracking-wider uppercase">Student Branch</span>
                </div>

                {/* Center Track Icon */}
                <div className="my-6 p-4 rounded-2xl bg-[#0D1D32] border border-[#E5A93C]/40 text-[#E5A93C] shadow-lg">
                  <Sparkles className="w-12 h-12" />
                </div>

                {/* Bottom Track Name */}
                <div className="mt-auto">
                  <span className="font-serif font-bold text-sm text-[#E5A93C] block leading-tight">
                    {previewCert.trackName}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Specialization Track</span>
                </div>
              </div>

              {/* Center Content: Pure Ivory & Luxury Typography */}
              <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between text-center relative bg-gradient-to-b from-white via-[#FCFAF5] to-white">
                {/* Academic Year */}
                <div className="flex justify-end text-[11px] font-black text-[#C88A1A] tracking-[0.25em] uppercase font-mono">
                  2025 - 2026
                </div>

                {/* Main Heading */}
                <div className="my-2">
                  <h2 className="font-serif font-black text-3xl sm:text-5xl text-[#07172A] tracking-[0.18em] uppercase">
                    CERTIFICATE
                  </h2>
                  <div className="flex items-center justify-center gap-3 my-2">
                    <span className="h-[2px] w-12 bg-[#C88A1A]" />
                    <span className="text-xs sm:text-sm font-serif font-bold text-[#C88A1A] tracking-[0.3em] uppercase">
                      OF APPRECIATION
                    </span>
                    <span className="h-[2px] w-12 bg-[#C88A1A]" />
                  </div>
                </div>

                {/* Recipient */}
                <div className="my-3">
                  <p className="text-xs sm:text-sm font-serif italic text-slate-600 mb-2">
                    This certificate is Presented to
                  </p>
                  <h3 className="text-3xl sm:text-5xl font-serif font-black text-[#C88A1A] inline-block border-b-2 border-[#C88A1A]/50 pb-1 px-6 tracking-wide drop-shadow-sm">
                    {previewCert.studentName}
                  </h3>
                </div>

                {/* Appreciation Paragraph */}
                <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed my-3 font-medium">
                  In recognition of successfully attending and completing all sessions of the{" "}
                  <strong className="text-[#07172A] font-bold">{previewCert.trackName} Track</strong> organized by{" "}
                  <strong className="text-[#07172A] font-bold">EELU Aswan Student Branch</strong>.<br />
                  Thank you for your commitment, curiosity, and active participation.
                </p>

                {/* 4 Official Signatures matching Reference 1 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200 mt-6 text-xs">
                  <div className="text-center">
                    <span className="font-serif italic font-bold text-slate-800 text-sm block mb-1 font-mono underline decoration-slate-300">
                      Mayar Ramadan
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Branch Chairwoman</span>
                  </div>

                  <div className="text-center">
                    <span className="font-serif italic font-bold text-slate-800 text-sm block mb-1 font-mono underline decoration-slate-300">
                      Mohamed Mahmoud
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Vice Supervisor Branch</span>
                  </div>

                  <div className="text-center">
                    <span className="font-serif italic font-bold text-slate-800 text-sm block mb-1 font-mono underline decoration-slate-300">
                      Eng. Abdelrahman Mahmoud
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Supervisor Branch</span>
                  </div>

                  <div className="text-center">
                    <span className="font-serif italic font-bold text-slate-800 text-sm block mb-1 font-mono underline decoration-slate-300">
                      Prof. Mohamed Nagdy
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Center Manager</span>
                  </div>
                </div>

                {/* Serial Footer */}
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Serial: {previewCert.certificateNo}</span>
                  <span>Date: {previewCert.issueDate}</span>
                </div>
              </div>

              {/* Right Column: Dark Navy Tech Pillar with Badge */}
              <div className="w-28 bg-[#07172A] rounded-l-[3.5rem] p-4 hidden lg:flex flex-col items-center justify-center border-l-4 border-[#C88A1A] text-[#E5A93C] relative shadow-inner">
                <div className="w-14 h-14 rounded-2xl border-2 border-[#E5A93C] bg-[#0B1A2D] flex items-center justify-center font-black font-mono text-sm shadow-lg">
                  {previewCert.trackName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "ACC"}
                </div>
                <span className="text-[9px] text-[#8FA4BD] font-mono uppercase mt-2">Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Signatories Customization Modal */}
      {showSignatoriesModal && editingConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#E5A93C]" />
                <h3 className="font-black text-base text-[#F5F7FB]">
                  Certificate Signatures & Seal Control
                </h3>
              </div>
              <button
                onClick={() => setShowSignatoriesModal(false)}
                className="p-1 rounded-lg text-[#8FA4BD] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSignatories} className="space-y-4">
              {/* Seal Toggle */}
              <div className="p-3 bg-[#07172A] rounded-xl border border-[#1E3A5F] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs block text-[#F5F7FB]">
                    Official Branch Seal
                  </span>
                  <span className="text-[11px] text-[#8FA4BD]">
                    Display gold verified badge and seal on certificate documents
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingConfig.showOfficialSeal}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        showOfficialSeal: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#269CF0]"></div>
                </label>
              </div>

              {/* Seal Text */}
              {editingConfig.showOfficialSeal && (
                <div>
                  <label className="text-xs font-bold text-[#8FA4BD] block mb-1">
                    Seal Inscription Text
                  </label>
                  <input
                    type="text"
                    value={editingConfig.sealText}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        sealText: e.target.value,
                      })
                    }
                    className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#269CF0]"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#1E3A5F] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignatoriesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSignatories}
                  className="px-5 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingSignatories ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
