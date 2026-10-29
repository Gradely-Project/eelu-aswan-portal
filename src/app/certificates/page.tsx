"use client";

import { useEffect, useState, useRef } from "react";
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
  const [userRole, setUserRole] = useState("STUDENT");
  const [loading, setLoading] = useState(true);

  // Dynamic Signatories Configuration
  const [signatoriesConfig, setSignatoriesConfig] = useState<SignatoriesConfig | null>(null);
  const [showSignatoriesModal, setShowSignatoriesModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SignatoriesConfig | null>(null);
  const [savingSignatories, setSavingSignatories] = useState(false);

  // Issue Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
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

  const handleDownloadPNG = (cert: CertificateItem) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0A1628";
    ctx.fillRect(0, 0, 1600, 1100);

    // Outer Gold Border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1520, 1020);

    // Inner Thin Gold Border
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 1480, 980);

    // Corner Ornaments
    const corners = [
      [75, 75],
      [1525, 75],
      [75, 1025],
      [1525, 1025],
    ];
    ctx.fillStyle = "#D4AF37";
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Header Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 34px Georgia, serif";
    ctx.fillText("EELU ASWAN BRANCH", 800, 140);

    ctx.fillStyle = "#8FA4BD";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("STUDENT ACADEMY PORTAL", 800, 175);

    // Gold Divider Line
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(300, 210);
    ctx.lineTo(1300, 210);
    ctx.stroke();

    // Certificate Type
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("CERTIFICATE OF ACADEMIC EXCELLENCE & COMPLETION", 800, 260);

    ctx.fillStyle = "#8FA4BD";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText("This official credential is proudly awarded to certify that", 800, 310);

    // Student Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 56px Georgia, serif";
    ctx.fillText(cert.studentName, 800, 410);

    // Underline Student Name
    const nameWidth = ctx.measureText(cert.studentName).width;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(800 - nameWidth / 2 - 20, 435);
    ctx.lineTo(800 + nameWidth / 2 + 20, 435);
    ctx.stroke();

    // Paragraph
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "20px Inter, sans-serif";
    ctx.fillText(
      "has successfully and with high commitment completed all specialized practical lectures,",
      800,
      500
    );
    ctx.fillText("technical assignments, and coursework in the", 800, 535);

    // Track Badge Box
    const trackText = `${cert.trackName} Specialization`;
    ctx.font = "bold 26px Inter, sans-serif";
    const badgeWidth = ctx.measureText(trackText).width + 60;
    ctx.fillStyle = "#07172A";
    ctx.fillRect(800 - badgeWidth / 2, 570, badgeWidth, 54);
    ctx.strokeStyle = "#269CF0";
    ctx.lineWidth = 2;
    ctx.strokeRect(800 - badgeWidth / 2, 570, badgeWidth, 54);
    ctx.fillStyle = "#48D5F5";
    ctx.fillText(trackText, 800, 606);

    // Grade Rating
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(`Graduated with Rating: ${cert.grade}`, 800, 680);

    // Bottom Divider Line
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(150, 750);
    ctx.lineTo(1450, 750);
    ctx.stroke();

    // Serial & Date (Left)
    ctx.textAlign = "left";
    ctx.fillStyle = "#8FA4BD";
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText("OFFICIAL SERIAL", 180, 800);
    ctx.fillStyle = "#48D5F5";
    ctx.font = "bold 18px monospace";
    ctx.fillText(cert.certificateNo, 180, 830);
    ctx.fillStyle = "#8FA4BD";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(`Issued: ${cert.issueDate}`, 180, 855);

    // Center: Verified Branch Seal (if enabled)
    if (signatoriesConfig?.showOfficialSeal) {
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(212, 175, 55, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(800, 825, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText("OFFICIAL", 800, 820);
      ctx.fillText("SEAL", 800, 836);
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillText(signatoriesConfig.sealText || "Verified Branch Seal", 800, 885);
    }

    // Right: Dynamic Signatories
    ctx.textAlign = "right";
    const activeSigs = (signatoriesConfig?.certificateSignatories || [
      { name: cert.supervisorName || "Eng. Abdelrahman Mahmoud", role: "Software Engineer & Branch Supervisor", order: 1, enabled: true },
    ])
      .filter((s: any) => s.enabled)
      .sort((a: any, b: any) => a.order - b.order);

    if (activeSigs.length > 0) {
      const primary = activeSigs[0];
      ctx.fillStyle = "#8FA4BD";
      ctx.font = "bold 15px Inter, sans-serif";
      ctx.fillText("ACADEMIC SUPERVISION", 1420, 800);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText(primary.name, 1420, 830);
      ctx.fillStyle = "#E5A93C";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText(primary.role, 1420, 855);
    }

    // Trigger File Download
    const imageURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = imageURL;
    a.download = `Certificate_${cert.studentName.replace(/\s+/g, "_")}_${cert.certificateNo}.png`;
    a.click();
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedTrackId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const activeSigs = (signatoriesConfig?.certificateSignatories || [
        { name: "Eng. Abdelrahman Mahmoud", role: "Software Engineer & Branch Supervisor", order: 1, enabled: true },
      ]).filter((s) => s.enabled);

      const supervisorName = activeSigs[0]?.name || "Eng. Abdelrahman Mahmoud";
      const chairName = activeSigs[1]?.name || "EELU Aswan Branch Board";

      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          trackId: selectedTrackId,
          grade,
          issueDate,
          supervisorName,
          chairName,
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

  const filteredStudents = students.filter((st) =>
    st.enrollments?.some((en) => en.track.id === selectedTrackId)
  );

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
                ACADEMIC ACCREDITATION
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
                {signatoriesConfig && (
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
                    if (filteredStudents.length > 0) setSelectedStudentId(filteredStudents[0].id);
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
                  : "No certificates generated yet"}
              </h3>
              <p className="text-xs text-[#8FA4BD] mt-1">
                {userRole === "STUDENT"
                  ? "Certificates are published upon successful completion and evaluation of your track."
                  : "Click '+ Issue New Certificate' to award an official graduation certificate."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-[#0D1D32] border border-[#1E3A5F] hover:border-[#269CF0] rounded-3xl p-6 transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-black text-[#48D5F5] bg-[#07172A] px-2.5 py-1 rounded-md border border-[#1E3A5F]">
                        #{cert.certificateNo}
                      </span>
                      <span className="text-[10px] font-black text-[#E5A93C] bg-[#E5A93C]/10 px-2.5 py-1 rounded-full border border-[#E5A93C]/20 uppercase">
                        {cert.grade}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-[#F5F7FB] mb-1">{cert.studentName}</h3>
                    <p className="text-xs text-[#8FA4BD] font-semibold mb-4">
                      Completed track: <strong className="text-[#48D5F5]">{cert.trackName}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8FA4BD] bg-[#07172A] p-3 rounded-2xl border border-[#1E3A5F] mb-4">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-[#8FA4BD]">Issued Date</span>
                        <span className="text-white font-mono">{cert.issueDate}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-[#8FA4BD]">Academic Supervisor</span>
                        <span className="text-[#E5A93C] font-bold">{cert.supervisorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end">
                    <button
                      onClick={() => setPreviewCert(cert)}
                      className="px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View & Print Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Issue Certificate Modal (Admin & Chair) */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1D32] border border-[#1E3A5F] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#F5F7FB] mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#E5A93C]" />
              Issue Accredited Certificate
            </h3>
            <p className="text-xs text-[#8FA4BD] mb-5">
              Certificates are authenticated with official supervisor credentials and unique serial numbers.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

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
                <label className="block font-bold text-[#8FA4BD] mb-1">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">No enrolled approved students in this track</option>
                  ) : (
                    filteredStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email})
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
                  className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all"
                >
                  {submitting ? "Generating..." : "Generate Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Full Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-auto">
            {/* Top Bar with Download, Print & Close */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
              <span className="text-xs font-bold text-[#48D5F5]">Official Certificate Document</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleDownloadPNG(previewCert)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                  title="Download direct high-resolution PNG image with gold borders and navy background preserved"
                >
                  <Download className="w-4 h-4" />
                  <span>Download (PNG Image)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-4 py-2 rounded-xl bg-[#0D1D32] border border-[#1E3A5F] text-[#8FA4BD] hover:text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Template Card */}
            <div
              style={{
                backgroundColor: "#0A1628",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
              className="bg-[#0A1628] border-8 border-[#D4AF37] rounded-3xl p-8 sm:p-12 text-center text-white relative shadow-2xl overflow-hidden print-cert"
            >
              {/* Decorative Corners */}
              <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-[#D4AF37]" />
              <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37]" />
              <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-[#D4AF37]" />
              <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-[#D4AF37]" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6 border-b border-[#D4AF37]/30 pb-4">
                <div className="text-left">
                  <h4 className="font-serif text-lg font-bold text-[#D4AF37]">EELU ASWAN BRANCH</h4>
                  <span className="text-[11px] text-[#8FA4BD] tracking-wider block">STUDENT ACADEMY PORTAL</span>
                </div>
                <div className="w-14 h-14 relative rounded-full overflow-hidden border-2 border-[#D4AF37]">
                  <Image src="/logo.jpeg" alt="EELU Logo" fill className="object-cover" />
                </div>
              </div>

              {/* Title */}
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E5A93C] block mb-2">
                CERTIFICATE OF ACADEMIC EXCELLENCE & COMPLETION
              </span>
              <p className="text-xs text-[#8FA4BD] italic mb-6">
                This official credential is proudly awarded to certify that
              </p>

              {/* Student Name */}
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-white mb-4 border-b border-white/20 pb-2 inline-block px-8 tracking-wide">
                {previewCert.studentName}
              </h2>

              <p className="text-sm text-[#CBD5E1] max-w-xl mx-auto leading-relaxed mb-6">
                has successfully and with high commitment completed all specialized practical lectures, technical assignments, and coursework in the
              </p>

              {/* Track Name */}
              <div className="inline-block bg-[#07172A] border-2 border-[#269CF0] px-6 py-2 rounded-xl mb-4">
                <span className="text-lg font-black text-[#48D5F5]">{previewCert.trackName} Specialization</span>
              </div>

              <p className="text-xs text-[#E5A93C] font-bold tracking-wider uppercase mb-8">
                Graduated with Rating: <strong className="text-white font-black underline decoration-[#D4AF37]">{previewCert.grade}</strong>
              </p>

              {/* Signatures & Serial (Dynamically configured) */}
              <div
                className={`grid gap-6 pt-6 border-t border-[#D4AF37]/30 text-xs items-center ${
                  signatoriesConfig?.showOfficialSeal ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
                <div className="text-left">
                  <span className="block text-[10px] uppercase font-bold text-[#8FA4BD] mb-1">Official Serial</span>
                  <span className="font-mono text-xs font-black text-[#48D5F5]">{previewCert.certificateNo}</span>
                  <span className="block text-[10px] text-[#8FA4BD] mt-0.5">{previewCert.issueDate}</span>
                </div>

                {signatoriesConfig?.showOfficialSeal && (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full border border-[#D4AF37]/50 flex items-center justify-center mb-1">
                      <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <span className="text-[9px] uppercase font-bold text-[#D4AF37]">
                      {signatoriesConfig.sealText || "Verified Branch Seal"}
                    </span>
                  </div>
                )}

                <div className="text-right">
                  {(() => {
                    const activeSigs = (signatoriesConfig?.certificateSignatories || [
                      {
                        name: previewCert.supervisorName || "Eng. Abdelrahman Mahmoud",
                        role: "Software Engineer & Branch Supervisor",
                        order: 1,
                        enabled: true,
                      },
                    ])
                      .filter((s: any) => s.enabled)
                      .sort((a: any, b: any) => a.order - b.order);

                    const signer = activeSigs[0] || {
                      name: previewCert.supervisorName,
                      role: "Academic Supervision",
                    };

                    return (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#8FA4BD] mb-1">
                          {signer.role}
                        </span>
                        <span className="font-bold text-white block text-sm">{signer.name}</span>
                        <span className="text-slate-400 block font-mono text-[10px] mt-2">
                          ...............................
                        </span>
                      </div>
                    );
                  })()}
                </div>
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

              {/* Certificate Signatories List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                    Certificate Signatories ({editingConfig.certificateSignatories.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingConfig({
                        ...editingConfig,
                        certificateSignatories: [
                          ...editingConfig.certificateSignatories,
                          {
                            name: "New Official Name",
                            role: "Title / Position",
                            order: editingConfig.certificateSignatories.length + 1,
                            enabled: true,
                          },
                        ],
                      })
                    }
                    className="text-xs text-[#48D5F5] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Signer
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editingConfig.certificateSignatories.map((sig, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-[#07172A] p-2 rounded-xl border border-[#1E3A5F]"
                    >
                      <input
                        type="number"
                        value={sig.order}
                        onChange={(e) => {
                          const updated = [...editingConfig.certificateSignatories];
                          updated[idx].order = Number(e.target.value);
                          setEditingConfig({ ...editingConfig, certificateSignatories: updated });
                        }}
                        className="w-12 bg-[#0D1D32] border border-[#1E3A5F] rounded-lg px-2 py-1 text-xs text-center font-bold"
                        title="Order"
                      />
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => {
                          const updated = [...editingConfig.certificateSignatories];
                          updated[idx].name = e.target.value;
                          setEditingConfig({ ...editingConfig, certificateSignatories: updated });
                        }}
                        placeholder="Signatory Name"
                        className="flex-1 bg-[#0D1D32] border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={sig.role}
                        onChange={(e) => {
                          const updated = [...editingConfig.certificateSignatories];
                          updated[idx].role = e.target.value;
                          setEditingConfig({ ...editingConfig, certificateSignatories: updated });
                        }}
                        placeholder="Role / Title"
                        className="flex-1 bg-[#0D1D32] border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingConfig.certificateSignatories.filter((_, i) => i !== idx);
                          setEditingConfig({ ...editingConfig, certificateSignatories: updated });
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignatoriesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8FA4BD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSignatories}
                  className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingSignatories ? "Saving..." : "Save Signatures"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
