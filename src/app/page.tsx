"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogIn,
  AlertCircle,
  Clock,
  Code,
  Shield,
  Cpu,
  Palette,
  Briefcase,
  TrendingUp,
  Megaphone,
  ArrowRight,
  Sparkles,
  Layers,
  Crown,
  Award,
  ShieldCheck,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface Leader {
  id: string;
  name: string;
  roleTitle: string;
  affiliation?: string | null;
  displayOrder: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic leadership list & active tracks list
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [dynamicTracks, setDynamicTracks] = useState<any[]>([]);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  const [leadersLoaded, setLeadersLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/leadership", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.leaders)) {
          setLeaders(data.leaders);
        }
      })
      .catch(() => {})
      .finally(() => setLeadersLoaded(true));

    fetch("/api/tracks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tracks)) {
          setDynamicTracks(data.tracks);
        }
      })
      .catch(() => {})
      .finally(() => setTracksLoaded(true));
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to sign in.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("eelu_user_role", data.user.role);
        localStorage.setItem("eelu_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again later.");
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const tracks = [
    {
      name: "Artificial Intelligence",
      icon: Cpu,
      tag: "LIMITED SEATS",
      tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      description: "Machine Learning, Deep Learning, computer vision, and hands-on AI model deployment.",
      duration: "10 Weeks",
      level: "Intermediate to Advanced",
    },
    {
      name: "Programming",
      icon: Code,
      tag: "CORE TRACK",
      tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      description: "Data Structures, Algorithms, problem solving, OOP, and software engineering principles.",
      duration: "8 Weeks",
      level: "All Levels",
    },
    {
      name: "Cyber Security",
      icon: Shield,
      tag: "OPEN NOW",
      tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      description: "Network security, ethical hacking fundamentals, vulnerability scanning, and defense.",
      duration: "8 Weeks",
      level: "Beginner to Intermediate",
    },
    {
      name: "Web Development",
      icon: Code,
      tag: "ACTIVE",
      tagColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      description: "Full-stack architecture, modern React frameworks, REST APIs, and database engineering.",
      duration: "10 Weeks",
      level: "Intermediate to Advanced",
    },
    {
      name: "Career Support",
      icon: Briefcase,
      tag: "ENROLLING",
      tagColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      description: "Technical CV writing, LinkedIn optimization, mock interviews, and industry freelancing.",
      duration: "6 Weeks",
      level: "All Levels",
    },
    {
      name: "Financial Analysis",
      icon: TrendingUp,
      tag: "OPEN NOW",
      tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      description: "Financial modeling, data valuation, corporate metrics, and decision analytics.",
      duration: "8 Weeks",
      level: "Intermediate",
    },
    {
      name: "Graphic Design",
      icon: Palette,
      tag: "LIMITED SEATS",
      tagColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      description: "Visual branding, UI/UX prototyping with Figma, Adobe Suite, and modern creative workflows.",
      duration: "8 Weeks",
      level: "Beginner to Intermediate",
    },
    {
      name: "Business Hub",
      icon: Briefcase,
      tag: "OPEN NOW",
      tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      description: "Product management, agile project execution, startup fundamentals, and pitch decks.",
      duration: "8 Weeks",
      level: "Beginner to Intermediate",
    },
    {
      name: "Digital Marketing",
      icon: Megaphone,
      tag: "OPEN NOW",
      tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      description: "Growth marketing, SEO, paid media campaigns, content strategy, and data-driven ad analytics.",
      duration: "8 Weeks",
      level: "All Levels",
    },
  ];

  const getTrackGradientTheme = (index: number) => {
    const themes = [
      {
        cardBorder: "border-amber-500/30 hover:border-amber-400/80 shadow-amber-500/5",
        iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        titleGradient: "from-amber-300 via-amber-200 to-yellow-400",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        tag: "FEATURED",
      },
      {
        cardBorder: "border-cyan-500/30 hover:border-cyan-400/80 shadow-cyan-500/5",
        iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        titleGradient: "from-cyan-300 via-sky-200 to-blue-400",
        badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
        tag: "POPULAR",
      },
      {
        cardBorder: "border-emerald-500/30 hover:border-emerald-400/80 shadow-emerald-500/5",
        iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        titleGradient: "from-emerald-300 via-teal-200 to-green-400",
        badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        tag: "OPEN NOW",
      },
      {
        cardBorder: "border-rose-500/30 hover:border-rose-400/80 shadow-rose-500/5",
        iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        titleGradient: "from-rose-300 via-pink-200 to-rose-400",
        badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        tag: "CREATIVE",
      },
      {
        cardBorder: "border-indigo-500/30 hover:border-indigo-400/80 shadow-indigo-500/5",
        iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
        titleGradient: "from-indigo-300 via-violet-200 to-purple-400",
        badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        tag: "EXECUTIVE",
      },
      {
        cardBorder: "border-sky-500/30 hover:border-sky-400/80 shadow-sky-500/5",
        iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
        titleGradient: "from-sky-300 via-blue-200 to-indigo-400",
        badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        tag: "ACTIVE",
      },
    ];
    return themes[index % themes.length];
  };

  const getTrackMeta = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("ai") || n.includes("intelligence") || n.includes("machine")) {
      return { icon: Cpu, tag: "LIMITED SEATS", tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", duration: "10 Weeks", level: "Intermediate to Advanced" };
    }
    if (n.includes("cyber") || n.includes("security")) {
      return { icon: Shield, tag: "OPEN NOW", tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", duration: "8 Weeks", level: "Beginner to Intermediate" };
    }
    if (n.includes("web") || n.includes("front") || n.includes("back") || n.includes("full")) {
      return { icon: Code, tag: "ACTIVE", tagColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", duration: "10 Weeks", level: "Intermediate to Advanced" };
    }
    if (n.includes("design") || n.includes("graphic") || n.includes("ui") || n.includes("ux")) {
      return { icon: Palette, tag: "LIMITED SEATS", tagColor: "bg-rose-500/20 text-rose-400 border-rose-500/30", duration: "8 Weeks", level: "Beginner to Intermediate" };
    }
    if (n.includes("financial") || n.includes("analysis") || n.includes("finance")) {
      return { icon: TrendingUp, tag: "OPEN NOW", tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", duration: "8 Weeks", level: "Intermediate" };
    }
    if (n.includes("career") || n.includes("hr")) {
      return { icon: Briefcase, tag: "ENROLLING", tagColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", duration: "6 Weeks", level: "All Levels" };
    }
    if (n.includes("marketing") || n.includes("digital") || n.includes("seo")) {
      return { icon: Megaphone, tag: "OPEN NOW", tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", duration: "8 Weeks", level: "All Levels" };
    }
    if (n.includes("business") || n.includes("management") || n.includes("hub")) {
      return { icon: Briefcase, tag: "OPEN NOW", tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", duration: "8 Weeks", level: "Beginner to Intermediate" };
    }
    return { icon: Code, tag: "ACTIVE", tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", duration: "8 Weeks", level: "All Levels" };
  };

  const defaultLeaders: Leader[] = [
    {
      id: "1",
      name: "Prof. Dr. Ahmed El-Sayed",
      roleTitle: "Academic Branch Supervisor",
      displayOrder: 1,
    },
    {
      id: "2",
      name: "Eng. Mostafa Hassan",
      roleTitle: "Branch Chairperson",
      displayOrder: 2,
    },
    {
      id: "3",
      name: "Eng. Nourhan Ahmed",
      roleTitle: "Vice Chairperson",
      displayOrder: 3,
    },
    {
      id: "4",
      name: "Eng. Abdelrahman Mahmoud",
      roleTitle: "Software & Technology Director",
      displayOrder: 4,
    },
  ];

  const activeLeaders = leadersLoaded ? leaders : defaultLeaders;

  const getLeaderIcon = (roleTitle: string, index: number) => {
    const t = roleTitle.toLowerCase();
    if (t.includes("supervisor")) return ShieldCheck;
    if (t.includes("chairperson") && !t.includes("vice")) return Crown;
    if (t.includes("vice")) return Award;
    if (t.includes("software") || t.includes("tech") || t.includes("director")) return Code;
    if (index === 0) return Crown;
    if (index === 1) return Award;
    return UserCheck;
  };

  return (
    <div className="min-h-screen bg-[#061220] text-[#F5F7FB] flex flex-col font-sans selection:bg-[#269CF0] selection:text-white relative overflow-hidden">
      {/* Subtle Background Mesh & Glow Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a5f15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a5f15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute top-[-8rem] left-1/2 -translate-x-1/2 w-[48rem] h-[24rem] bg-gradient-to-tr from-[#269CF0]/20 via-[#48D5F5]/10 to-[#E5A93C]/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-[#269CF0]/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-24 w-80 h-80 bg-[#E5A93C]/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Top Header Navbar */}
      <header className="h-20 bg-[#061220]/80 backdrop-blur-xl border-b border-[#1E3A5F]/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          {/* Glowing Animated Ambient Ring around Logo */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-tr from-[#269CF0] via-[#E5A93C] to-[#48D5F5] shadow-lg shadow-[#269CF0]/20 group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-300 to-blue-500 opacity-60 blur-[3px] group-hover:opacity-100 transition-opacity" />
            <div
              className="relative w-11 h-11 rounded-2xl overflow-hidden bg-[#07172A] p-1 flex-shrink-0 flex items-center justify-center"
              style={{ width: "44px", height: "44px", minWidth: "44px", minHeight: "44px" }}
            >
              <Image
                src="/logo.jpeg"
                alt="EELU Branch Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain rounded-xl"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg text-[#F5F7FB] tracking-tight leading-none">
                EELU Aswan student branch
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#E5A93C] tracking-wider uppercase mt-1">
              STUDENT ACADEMY PORTAL
            </span>
          </div>
        </div>

        {/* Clean Nav Links & Primary Action */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => scrollToSection("tracks-section")}
            className="hidden md:inline-block text-xs font-bold text-[#8FA4BD] hover:text-[#48D5F5] transition-colors cursor-pointer"
          >
            Tracks
          </button>
          <button
            onClick={() => scrollToSection("governance-section")}
            className="hidden md:inline-block text-xs font-bold text-[#8FA4BD] hover:text-[#E5A93C] transition-colors cursor-pointer"
          >
            Governance
          </button>
          <button
            onClick={() => scrollToSection("signin")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#269CF0] to-[#1E82CB] hover:from-[#35A5F5] hover:to-[#269CF0] text-white text-xs font-black shadow-lg shadow-[#269CF0]/25 transition-all hover:scale-105 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In to Portal
          </button>
        </div>
      </header>

      {/* Main Hero Section: 2 Columns (Left: 7 cols, Right: 5 cols) */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-10 lg:py-16 max-w-7xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Slogans & Mission (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1D32]/90 border border-[#269CF0]/30 text-[#48D5F5] text-xs font-bold mb-6 w-fit shadow-lg shadow-[#269CF0]/5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Official Academic Season 2026</span>
              <span className="text-[#1E3A5F]">•</span>
              <span className="text-[#8FA4BD]">9 Training Tracks</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-5">
              Learn.<br />
              <span className="bg-gradient-to-r from-white via-[#E8F0FA] to-[#9AB3D1] bg-clip-text text-transparent">Build.</span><br />
              <span className="bg-gradient-to-r from-[#269CF0] via-[#48D5F5] to-[#269CF0] bg-clip-text text-transparent">Compete.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#8FA4BD] leading-relaxed font-medium mb-8 max-w-xl">
              Build high-impact engineering skills through intensive bootcamps, hands-on projects, and practical training designed for industry readiness.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={() => scrollToSection("tracks-section")}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#269CF0] to-[#1E82CB] hover:from-[#35A5F5] hover:to-[#269CF0] text-xs font-black text-white shadow-xl shadow-[#269CF0]/25 transition-all flex items-center gap-2.5 cursor-pointer hover:scale-105"
              >
                <Layers className="w-4 h-4" />
                Explore Tracks
              </button>
              <button
                onClick={() => scrollToSection("governance-section")}
                className="px-6 py-3.5 rounded-xl bg-[#0D1D32]/80 hover:bg-[#10243C] border border-[#1E3A5F] hover:border-[#E5A93C] text-xs font-black text-[#E5A93C] transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <Crown className="w-4 h-4" />
                Branch Governance
              </button>
            </div>

            {/* Quick Stats / Highlights Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#1E3A5F]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#269CF0]/10 border border-[#269CF0]/30 flex items-center justify-center text-[#269CF0]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">9 Tracks</div>
                  <div className="text-[10px] text-[#8FA4BD]">Hands-on Labs</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Live Ranks</div>
                  <div className="text-[10px] text-[#8FA4BD]">Leaderboard</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">QR Check-in</div>
                  <div className="text-[10px] text-[#8FA4BD]">Attendance</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Certificates</div>
                  <div className="text-[10px] text-[#8FA4BD]">Verified Skills</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Welcome Back Sign In Card (lg:col-span-5) */}
          <div id="signin" className="lg:col-span-5 relative">
            {/* Ambient card aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#269CF0]/20 via-[#48D5F5]/10 to-[#E5A93C]/20 rounded-3xl blur-xl opacity-75 pointer-events-none -z-10" />

            <div className="w-full bg-[#0B1728]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-[#1E3A5F]/80 shadow-2xl relative overflow-hidden">
              {/* Card top edge highlight line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#269CF0] to-transparent opacity-80" />

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-[#F5F7FB]">Welcome Back</h2>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#269CF0]/15 text-[#48D5F5] border border-[#269CF0]/30 shadow-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Secure Access
                </span>
              </div>
              <p className="text-xs text-[#8FA4BD] mb-5 font-medium">
                Sign in to access your track dashboard, sessions, and tasks.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-[#8FA4BD] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8FA4BD] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@eelu.edu.eg"
                      className="w-full bg-[#050d18] border border-[#1E3A5F] rounded-xl pl-10 pr-4 py-3 text-xs text-[#F5F7FB] placeholder-[#8FA4BD]/50 focus:outline-none focus:border-[#269CF0] focus:ring-1 focus:ring-[#269CF0]/40 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8FA4BD] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8FA4BD] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#050d18] border border-[#1E3A5F] rounded-xl pl-10 pr-10 py-3 text-xs text-[#F5F7FB] placeholder-[#8FA4BD]/50 focus:outline-none focus:border-[#269CF0] focus:ring-1 focus:ring-[#269CF0]/40 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8FA4BD] hover:text-[#48D5F5] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#269CF0] via-[#1E82CB] to-[#269CF0] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#269CF0]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? "Signing in..." : "Sign In to Portal →"}
                </button>
              </form>

              <div className="mt-4 pt-3 text-center text-xs text-[#8FA4BD] border-t border-[#1E3A5F]/50">
                New student without an account?{" "}
                <Link
                  href="/register"
                  className="text-[#269CF0] hover:text-[#48D5F5] font-black underline ml-1"
                >
                  Apply for admission
                </Link>
              </div>

              {/* Fast 1-Click Fast Demo Login */}
              <div className="mt-5 pt-4 border-t border-[#1E3A5F]/60">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-black text-[#8FA4BD] uppercase tracking-wider">
                    ⚡ 1-Click Fast Demo Login
                  </span>
                  <span className="text-[10px] text-[#48D5F5] font-mono">Instant Fill</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("admin@branch.org", "admin123")}
                    className="p-2.5 rounded-xl bg-[#050d18] border border-[#1E3A5F] hover:border-rose-500/60 text-[11px] font-bold text-[#8FA4BD] hover:text-white hover:bg-rose-500/5 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 group-hover:animate-ping" />
                    <span>👑 Main Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("chair@branch.org", "chair123")}
                    className="p-2.5 rounded-xl bg-[#050d18] border border-[#1E3A5F] hover:border-amber-500/60 text-[11px] font-bold text-[#8FA4BD] hover:text-white hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:animate-ping" />
                    <span>🎖️ Chairperson</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("web.head@branch.org", "head123")}
                    className="p-2.5 rounded-xl bg-[#050d18] border border-[#1E3A5F] hover:border-cyan-500/60 text-[11px] font-bold text-[#8FA4BD] hover:text-white hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-500 group-hover:animate-ping" />
                    <span>💻 Web Head</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials("ahmed@student.com", "student123")}
                    className="p-2.5 rounded-xl bg-[#050d18] border border-[#1E3A5F] hover:border-emerald-500/60 text-[11px] font-bold text-[#8FA4BD] hover:text-white hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:animate-ping" />
                    <span>🎓 Student (Ahmed)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bootcamps & Track Overview Section */}
      <section id="tracks-section" className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-[#1E3A5F]/40 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-[#269CF0] uppercase tracking-wider block mb-1">
              OUR BOOTCAMPS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5F7FB]">
              Choose Your Technical Path
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA4BD] mt-1 max-w-xl">
              Each track is led by an official four-student instruction team (Head, Vice Head, and two Core Instructors) with hands-on workshops and real evaluations.
            </p>
          </div>
          <Link
            href="/register"
            className="px-6 py-3 rounded-xl bg-[#269CF0] hover:bg-[#1E82CB] text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto flex items-center gap-2"
          >
            Register for a Track
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tracksLoaded && dynamicTracks.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#8FA4BD] bg-[#0D1D32] border border-[#1E3A5F] rounded-2xl">
              No active training tracks currently available.
            </div>
          ) : (
            (tracksLoaded ? dynamicTracks : tracks).map((trk: any, index: number) => {
            const theme = getTrackGradientTheme(index);
            const meta = getTrackMeta(trk.name);
            const Icon = trk.icon || meta.icon;
            const tag = trk.tag || theme.tag || meta.tag;
            const duration = trk.duration || meta.duration;
            const level = trk.level || meta.level;
            const description = trk.description || "Comprehensive hands-on training bootcamp with live practical projects.";

            return (
              <div
                key={trk.id || trk.name}
                className={`bg-[#0D1D32] rounded-3xl p-6 border ${theme.cardBorder} transition-all group flex flex-col justify-between hover:-translate-y-1.5 shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-2xl ${theme.iconBg} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${theme.badge}`}
                    >
                      {tag}
                    </span>
                  </div>

                  <h3 className={`text-xl font-black bg-gradient-to-r ${theme.titleGradient} bg-clip-text text-transparent mb-1 transition-all`}>
                    {trk.name}
                  </h3>
                  <span className="text-[10px] font-bold text-[#8FA4BD] tracking-wider uppercase block mb-3">
                    BOOTCAMP TRACK
                  </span>
                  <p className="text-xs text-[#8FA4BD] font-medium leading-relaxed mb-6">
                    {description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1E3A5F]/70 flex items-center justify-between text-xs text-[#8FA4BD]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[#269CF0]" />
                      {duration}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] truncate max-w-[120px]">{level}</span>
                  </div>
                  <Link
                    href="/register"
                    className="p-1.5 rounded-lg bg-[#07172A] text-[#48D5F5] group-hover:bg-[#269CF0] group-hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          }))}
        </div>
      </section>

      {/* Dedicated Branch Governance Board Section */}
      <section id="governance-section" className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full border-t border-[#1E3A5F]/40 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-[#E5A93C] text-[11px] font-black uppercase mb-2">
              <Crown className="w-3.5 h-3.5" />
              CAMPUS GOVERNANCE & ACADEMIC SUPERVISION
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5F7FB]">
              Branch Leadership Board
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA4BD] mt-1 max-w-xl">
              Official faculty and executive leadership overseeing track quality, academic standards, and transparent assessment.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OFFICIALLY ACCREDITED
          </span>
        </div>

        {/* Executive Board Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {activeLeaders.map((leader, index) => {
            const LeaderIcon = getLeaderIcon(leader.roleTitle, index);
            return (
              <div
                key={leader.id || index}
                className="bg-[#0D1D32] rounded-3xl p-6 border border-[#1E3A5F] hover:border-[#E5A93C]/50 transition-all group flex flex-col justify-between hover:-translate-y-1 shadow-xl"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#07172A] border border-[#1E3A5F] group-hover:border-[#E5A93C]/50 flex items-center justify-center text-[#E5A93C] mb-4 transition-colors">
                    <LeaderIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-[#F5F7FB] mb-1 group-hover:text-[#E5A93C] transition-colors">
                    {leader.name}
                  </h3>
                  <div className="text-xs font-black text-[#E5A93C] uppercase tracking-wide leading-snug mb-2">
                    {leader.roleTitle}
                  </div>
                  {leader.affiliation && (
                    <p className="text-[11px] text-[#8FA4BD] font-medium leading-relaxed">
                      {leader.affiliation}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#1E3A5F]/70 flex items-center justify-between text-[10px] text-[#8FA4BD]">
                  <span className="font-mono uppercase">EELU ASWAN</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer with exact Abdelrahman Mahmoud LinkedIn credit */}
      <footer className="mt-auto py-8 text-center text-xs text-[#8FA4BD] border-t border-[#1E3A5F]/50 px-4">
        <p className="font-semibold text-[#F5F7FB]">
          © {new Date().getFullYear()} EELU Aswan Student Branch Portal. All rights reserved.
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="text-[#8FA4BD]">Developed by</span>
          <a
            href="https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1D32] border border-[#1E3A5F] hover:border-[#269CF0] text-[#F5F7FB] hover:text-[#48D5F5] font-bold transition-all shadow-sm group"
          >
            <svg
              className="w-3.5 h-3.5 fill-[#269CF0] group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span>Abdelrahman Mahmoud</span>
            <span className="text-[10px] text-[#8FA4BD] font-normal">• Software Engineer</span>
          </a>
        </div>
      </footer>
    </div>
  );
}