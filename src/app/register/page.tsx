"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, CheckCircle2, AlertCircle, Clock, GraduationCap, ArrowRight, ArrowLeft } from "lucide-react";

interface Track {
  id: string;
  name: string;
  description: string | null;
}

export default function RegisterPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "", // Personal Email
    universityEmail: "", // University Email
    password: "",
    phone: "",
    college: "Information Technology (IT)", // Faculty: IT or BA
    academicYear: "Year 1 (First Year)", // Academic Year dropdown
    universityId: "", // University Student ID
  });

  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/tracks")
      .then((res) => res.json())
      .then((data) => {
        if (data.tracks) setTracks(data.tracks);
        setLoadingTracks(false);
      })
      .catch(() => setLoadingTracks(false));
  }, []);

  const toggleTrack = (id: string) => {
    if (selectedTrackIds.includes(id)) {
      setSelectedTrackIds(selectedTrackIds.filter((tId) => tId !== id));
    } else {
      setSelectedTrackIds([...selectedTrackIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedTrackIds.length === 0) {
      setError("Please select at least one training track to enroll in.");
      return;
    }

    if (!formData.universityId.trim()) {
      setError("Please enter your University Student ID.");
      return;
    }

    if (!formData.universityEmail.trim()) {
      setError("Official University Email (@eelu.edu.eg) is required for student verification.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          trackIds: selectedTrackIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit admission application.");
        setSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07172A] text-[#F5F7FB] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center font-sans">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center group">
            <div
              className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#1E3A5F] bg-[#0A192F] p-1.5 mb-3 group-hover:scale-105 transition-transform shadow-lg ring-1 ring-cyan-500/20 flex-shrink-0"
              style={{ width: "64px", height: "64px", minWidth: "64px", minHeight: "64px" }}
            >
              <Image
                src="/logo.jpeg"
                alt="EELU Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain rounded-xl"
                priority
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FB] tracking-tight">
              Student Admission Application
            </h1>
            <p className="mt-1 text-xs text-[#8FA4BD] font-medium">
              EELU Aswan Branch — Official Academy Season
            </p>
          </Link>
        </div>

        {isSuccess ? (
          <div className="bg-[#0D1D32] rounded-3xl p-8 sm:p-12 border border-[#1E3A5F] shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#F5F7FB] mb-2">
              Application Submitted Successfully!
            </h2>
            <div className="bg-[#07172A] rounded-2xl p-5 border border-[#1E3A5F] max-w-lg mx-auto mb-6 text-xs text-[#8FA4BD] leading-relaxed">
              <p className="mb-2 font-bold text-[#E5A93C]">
                Status: Pending Administrative Review
              </p>
              <p>
                Your registration has been queued for verification. Per branch governance policy, student portal access remains locked until your account is approved by the Main Administrator.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                Go to Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-[#07172A] hover:bg-[#10243C] text-[#8FA4BD] hover:text-white font-bold text-xs border border-[#1E3A5F] transition-all"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D1D32] rounded-3xl p-6 sm:p-10 border border-[#1E3A5F] shadow-2xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6 text-xs">
              {/* Section 1: Academic & Personal Information */}
              <div>
                <h3 className="text-sm font-black text-[#F5F7FB] mb-4 pb-2 border-b border-[#1E3A5F] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#269CF0]" />
                  1. Academic & Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#8FA4BD] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ahmed Mohamed Aly"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Personal Email *</label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ahmed@gmail.com"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">University Email (@eelu.edu.eg) *</label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      value={formData.universityEmail}
                      onChange={(e) => setFormData({ ...formData, universityEmail: e.target.value })}
                      placeholder="e.g. 21010045@eelu.edu.eg"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="•••••••• (Min 6 chars)"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="01012345678"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Faculty / College *</label>
                    <select
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    >
                      <option value="Information Technology (IT)">Information Technology (IT)</option>
                      <option value="Business Administration (BA)">Business Administration (BA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8FA4BD] mb-1">Academic Year *</label>
                    <select
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    >
                      <option value="Year 1 (First Year)">Year 1 (First Year)</option>
                      <option value="Year 2 (Second Year)">Year 2 (Second Year)</option>
                      <option value="Year 3 (Third Year)">Year 3 (Third Year)</option>
                      <option value="Year 4 (Fourth Year)">Year 4 (Fourth Year)</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#8FA4BD] mb-1">University Student ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.universityId}
                      onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                      placeholder="e.g. 20210045"
                      className="w-full bg-[#07172A] border border-[#1E3A5F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7FB] focus:outline-none focus:border-[#269CF0]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tracks Selection */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E3A5F]">
                  <h3 className="text-sm font-black text-[#F5F7FB]">
                    2. Select Your Preferred Training Tracks *
                  </h3>
                  <span className="text-[10px] font-bold text-[#48D5F5] bg-[#07172A] px-2.5 py-0.5 rounded-full border border-[#1E3A5F]">
                    Selected: {selectedTrackIds.length} Tracks
                  </span>
                </div>

                {loadingTracks ? (
                  <div className="py-6 text-center text-[#8FA4BD]">Loading tracks...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tracks.map((t) => {
                      const isSelected = selectedTrackIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleTrack(t.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                            isSelected
                              ? "bg-[#269CF0]/15 border-[#269CF0] text-[#F5F7FB] shadow-md shadow-[#269CF0]/10"
                              : "bg-[#07172A] border-[#1E3A5F] text-[#8FA4BD] hover:border-[#8FA4BD]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border ${
                              isSelected
                                ? "bg-[#269CF0] border-[#269CF0] text-white"
                                : "border-[#1E3A5F] bg-[#0D1D32]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-[#F5F7FB] leading-snug">
                              {t.name}
                            </span>
                            {t.description && (
                              <span className="text-[10px] text-[#8FA4BD] line-clamp-2 block mt-0.5">
                                {t.description}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8FA4BD] hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-black text-xs shadow-lg shadow-[#269CF0]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? "Submitting Application..." : "Submit Admission Request"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
