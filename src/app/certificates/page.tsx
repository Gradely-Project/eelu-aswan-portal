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

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [userRole, setUserRole] = useState("STUDENT");
  const [loading, setLoading] = useState(true);

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
      const [meRes, certRes, tracksRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/certificates").then((r) => r.json()),
        fetch("/api/tracks").then((r) => r.json()),
      ]);

      const role = meRes.user?.role || "STUDENT";
      setUserRole(role);
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

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedTrackId) return;

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
          supervisorName: "Eng. Abdelrahman Mahmoud",
          chairName: "EELU Aswan Branch Board",
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
              <button
                onClick={() => {
                  setError(null);
                  if (filteredStudents.length > 0) setSelectedStudentId(filteredStudents[0].id);
                  setShowIssueModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Issue New Certificate
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
            {/* Top Bar with Print & Close */}
            <div className="flex items-center justify-between mb-4 no-print">
              <span className="text-xs font-bold text-[#48D5F5]">Official Certificate Document</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#269CF0] text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
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
            <div className="bg-[#0A1628] border-8 border-[#D4AF37] rounded-3xl p-8 sm:p-12 text-center text-white relative shadow-2xl overflow-hidden print-cert">
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

              {/* Signatures & Serial */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#D4AF37]/30 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#8FA4BD] mb-1">Official Serial</span>
                  <span className="font-mono text-xs font-black text-[#48D5F5]">{previewCert.certificateNo}</span>
                  <span className="block text-[10px] text-[#8FA4BD] mt-0.5">{previewCert.issueDate}</span>
                </div>

                <div>
                  <div className="w-12 h-12 mx-auto rounded-full border border-[#D4AF37]/50 flex items-center justify-center mb-1">
                    <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <span className="text-[9px] uppercase font-bold text-[#D4AF37]">Verified Branch Seal</span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#8FA4BD] mb-1">Academic Supervision</span>
                  <span className="font-bold text-white block">{previewCert.supervisorName}</span>
                  <span className="text-[10px] text-[#E5A93C]">Software Engineer & Branch Supervisor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
