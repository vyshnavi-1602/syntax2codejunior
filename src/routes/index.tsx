import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSession } from "@/client/lib/session";
import {
  ChevronRight,
  GraduationCap,
  Users,
  School,
  LayoutDashboard,
  Sparkles,
  Trophy,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Play,
  Flame,
  BarChart3,
  Award,
  Bot,
  Code2,
  Star,
  BookOpen,
  Laptop,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/client/components/ThemeToggle";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syntax2Code Junior — Little Steps. Big Ideas. Real Skills." },
      {
        name: "description",
        content:
          "Syntax2Code Junior helps school students learn coding, build cool projects, and explore the world of AI through fun, hands-on learning.",
      },
    ],
  }),
  component: LandingPage,
});

const rolePortals = [
  {
    id: "student",
    title: "Student Hub",
    badge: "Grades 1 – 12",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
    desc: "Dive into in-browser coding labs, build games like Space Invaders, ace proctored MCQs, and earn verified certificates.",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    features: [
      "In-browser Python & Web Monaco Labs",
      "Interactive Game Builder & Projects",
      "Proctored MCQs with Anti-cheat Checks",
      "XP, Badges & Global Leaderboard",
    ],
  },
  {
    id: "teacher",
    title: "Teacher Command",
    badge: "Educator Portal",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
    desc: "Automate assignment evaluations, supervise student labs with real-time guardrails, and track mastery analytics.",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    features: [
      "Assignment Dispatch & Auto-grading",
      "Classroom Guardrails & Activity Logs",
      "Custom Question Bank Management",
      "Student Mastery & Performance Insights",
    ],
  },
  {
    id: "school",
    title: "School Leadership",
    badge: "Institutional Hub",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
    desc: "Evaluate your school's digital readiness, schedule computer science dispatches, and oversee batch progress.",
    icon: School,
    gradient: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    features: [
      "School AI & Coding Readiness Index",
      "Batch & Teacher Dispatch Timetables",
      "Cross-Grade Progress Reports",
      "Curriculum Coverage Diagnostics",
    ],
  },
  {
    id: "admin",
    title: "Platform Admin",
    badge: "S2C Operations",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
    desc: "Oversee platform tenants, curriculum rollouts, certification standards, and system security parameters.",
    icon: LayoutDashboard,
    gradient: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    features: [
      "Tenant & School Provisioning",
      "Global Gamification & XP Configuration",
      "System Audit & Anti-cheat Oversight",
      "Master Curriculum Catalog Management",
    ],
  },
];

const coreFeatures = [
  {
    icon: Terminal,
    title: "Zero-Setup Cloud Labs",
    desc: "Run Python, JavaScript, and HTML/CSS directly in the browser with full Monaco editor capabilities and real-time execution.",
    color:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40",
  },
  {
    icon: Bot,
    title: "Pedagogical AI Tutor",
    desc: "A safe, context-aware AI assistant designed specifically for young learners to guide conceptual problem solving without giving away code.",
    color:
      "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40",
  },
  {
    icon: ShieldCheck,
    title: "Proctored MCQs & Quizzes",
    desc: "Automated tab-switching detection, copy-paste prevention, and timed assessments ensure authentic learning evaluation.",
    color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40",
  },
  {
    icon: Trophy,
    title: "Gamification & Competitions",
    desc: "Earn XP, unlock badges, keep coding streaks alive, and represent your school in live coding challenges and hackathons.",
    color:
      "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40",
  },
  {
    icon: BarChart3,
    title: "School Readiness Score",
    desc: "Actionable institutional analytics evaluating hardware readiness, curriculum completion, and student programming proficiency.",
    color:
      "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40",
  },
  {
    icon: Award,
    title: "Verified Digital Credentials",
    desc: "Tamper-proof verifiable certificates issued automatically upon completing skill tracks, projects, and milestone assessments.",
    color:
      "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40",
  },
];

const curriculumTracks = [
  {
    title: "Foundation & Logic",
    level: "Grades 1 – 4",
    highlight: "Block coding & Computational Thinking",
    skills: [
      "Algorithmic Sequences",
      "Conditionals & Loops",
      "Visual Problem Solving",
      "Digital Safety",
    ],
  },
  {
    title: "Python & Game Dev",
    level: "Grades 5 – 8",
    highlight: "Text Coding & Interactive Systems",
    skills: [
      "Python Syntax & Functions",
      "Space Invaders & 2D Physics",
      "Data Structures",
      "Event Listeners",
    ],
  },
  {
    title: "Full-Stack Web & AI",
    level: "Grades 9 – 12",
    highlight: "Industry-Ready Modern Software",
    skills: [
      "HTML5, CSS & JavaScript",
      "API Consumption",
      "Machine Learning Concepts",
      "Prompt Engineering",
    ],
  },
];

const faqs = [
  {
    q: "Do students need to install Python or any software on school computers?",
    a: "No! Syntax2Code runs 100% in modern web browsers (Chrome, Edge, Firefox, Safari). Students and labs need zero installations or administrative privileges.",
  },
  {
    q: "How does the AI Companion keep young students safe?",
    a: "The AI companion is trained exclusively with educational guardrails. It never reveals answers directly, prevents inappropriate prompts, and scaffolds hints to stimulate critical thinking.",
  },
  {
    q: "How does Google Sign-In work with our school accounts?",
    a: "Students, teachers, and staff can seamlessly click 'Sign in with Google' using their personal or school-provided Google Workspace accounts for instantaneous, secure access.",
  },
  {
    q: "Can teachers customize exams and create unique coding assignments?",
    a: "Yes! Teachers have a full assignment builder with custom test cases, automated code evaluation, and editable MCQ question banks tailored to their syllabus.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const { user, role } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-[#07130e] text-slate-800 dark:text-slate-100 font-lora antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-[#091812]/95 border-b border-slate-100 dark:border-emerald-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-base shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              S2
            </span>
            <div className="flex items-center">
              <span className="font-display font-extrabold italic text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Syntax2Code
                <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 not-italic">
                  Junior
                </span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#portals"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Portals
            </a>
            <a
              href="#curriculum"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Curriculum
            </a>
            <a
              href="#features"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#faq"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {/* Sign In Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full px-3.5 h-10 transition-colors cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900"
                >
                  <span>Sign In</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 rounded-2xl shadow-xl border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-900 z-50"
              >
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Sign in as
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "student", mode: "signin" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                >
                  <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Student</p>
                    <p className="text-[10px] text-slate-500">Access labs & quizzes</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "teacher", mode: "signin" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-sky-50 dark:hover:bg-sky-950/60"
                >
                  <Users className="h-4 w-4 text-sky-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Teacher</p>
                    <p className="text-[10px] text-slate-500">Manage classes & grading</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "school", mode: "signin" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-amber-50 dark:hover:bg-amber-950/60"
                >
                  <School className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">School Admin</p>
                    <p className="text-[10px] text-slate-500">Readiness & scheduling</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "admin", mode: "signin" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-rose-50 dark:hover:bg-rose-950/60"
                >
                  <LayoutDashboard className="h-4 w-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Platform Admin
                    </p>
                    <p className="text-[10px] text-slate-500">Master configuration</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Up Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-full px-4 sm:px-5 h-10 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <span>Sign Up</span>
                  <ChevronDown className="h-3.5 w-3.5 text-emerald-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 rounded-2xl shadow-xl border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-900 z-50"
              >
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Sign up as
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "student", mode: "signup" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                >
                  <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">New Student</p>
                    <p className="text-[10px] text-slate-500">Create learner account</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "teacher", mode: "signup" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-sky-50 dark:hover:bg-sky-950/60"
                >
                  <Users className="h-4 w-4 text-sky-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">New Teacher</p>
                    <p className="text-[10px] text-slate-500">Join teacher community</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "school", mode: "signup" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-amber-50 dark:hover:bg-amber-950/60"
                >
                  <School className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Register School
                    </p>
                    <p className="text-[10px] text-slate-500">Onboard institution</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem
                  onClick={() =>
                    navigate({ to: "/login", search: { role: "admin", mode: "signup" } })
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer font-medium hover:bg-rose-50 dark:hover:bg-rose-950/60"
                >
                  <LayoutDashboard className="h-4 w-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Admin Account
                    </p>
                    <p className="text-[10px] text-slate-500">Platform administrator</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 text-left">
              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold italic tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Little Steps.
                <br />
                <span className="text-emerald-600 dark:text-emerald-400">Big Ideas.</span>
                <br />
                <span className="text-teal-700 dark:text-teal-400">Real Skills.</span>
              </h1>

              {/* Sub-headline */}
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xl">
                Syntax2Code Junior helps school students learn coding, build cool projects, and
                explore the world of AI through fun, hands-on learning.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate({ to: "/login", search: { role: "student" } })}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById("curriculum");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-bold px-6 py-3.5 shadow-sm cursor-pointer transition-colors"
                >
                  Explore Learning Paths
                </button>
              </div>

              {/* Feature Badges Row */}
              <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6 pt-6 border-t border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <span>Beginner friendly</span>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                    <Star className="h-4 w-4 fill-teal-500" />
                  </div>
                  <span>Project based learning</span>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span>Safe & positive for school</span>
                </div>
              </div>
            </div>

            {/* Right Illustration Column */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* 3D Hero image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-700/15 border-4 border-white dark:border-emerald-950 bg-emerald-100/40">
                  <img
                    src="/kids-coding-hero.jpg"
                    alt="Three kids learning to code together on an S2 laptop"
                    className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                {/* Floating XP pill */}
                <div className="absolute -bottom-4 left-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 p-3 shadow-xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                    <Flame className="h-5 w-5 fill-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Active Coding Streaks
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      +1,200 XP earned this week
                    </div>
                  </div>
                </div>

                {/* Floating Game builder badge */}
                <div className="absolute -top-4 right-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 p-3 shadow-xl hidden sm:flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Live Python Labs
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Zero install needed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURATED SECTION DIVIDER */}
      <div className="relative z-10 py-4 text-center">
        <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          <span className="h-px w-12 bg-emerald-300 dark:bg-emerald-800" />
          Curated for Grades 1 – 12
          <span className="h-px w-12 bg-emerald-300 dark:bg-emerald-800" />
        </div>
      </div>

      {/* ROLE PORTALS SELECTION (CORE SECTION) */}
      <section
        id="portals"
        className="relative z-10 py-16 bg-white dark:bg-[#07130e] border-y border-emerald-100 dark:border-emerald-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-black italic tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Select Your Role to Get Started
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 font-medium">
              Tailored workspaces for students, teachers, school leadership, and platform
              administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rolePortals.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.id}
                  className={`group relative flex flex-col justify-between rounded-3xl border ${r.borderColor} bg-white dark:bg-slate-900/90 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-600/10 shadow-sm`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${r.gradient} text-white shadow-md`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${r.badgeColor}`}
                      >
                        {r.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold italic text-slate-900 dark:text-white mb-2">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5 font-medium">
                      {r.desc}
                    </p>

                    {/* Features */}
                    <div className="space-y-2.5 mb-6">
                      {r.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Non-redirecting unified emerald button */}
                  <Button
                    type="button"
                    className="w-full font-bold text-xs h-11 rounded-full bg-emerald-600 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20 cursor-default"
                  >
                    Enter {r.title}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CURRICULUM ROADMAP */}
      <section
        id="curriculum"
        className="relative z-10 py-20 bg-slate-50/50 dark:bg-[#06120d] border-t border-slate-100 dark:border-emerald-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Progressive Learning Pathways
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black italic text-slate-900 dark:text-white mt-2">
              Structured K-12 Curriculum
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 font-medium">
              Scaffolded modules that transition young students smoothly from algorithmic intuition
              to building real games and AI apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {curriculumTracks.map((track, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-emerald-100 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      {track.level}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-800 dark:text-emerald-300">
                      Track {idx + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold italic text-slate-900 dark:text-white mb-1">
                    {track.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-5">
                    {track.highlight}
                  </p>

                  <div className="space-y-2.5 mb-6">
                    {track.skills.map((skill, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs font-bold rounded-full border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 cursor-default"
                >
                  Explore Modules
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section
        id="features"
        className="relative z-10 py-20 bg-white dark:bg-[#07130e] border-t border-emerald-100 dark:border-emerald-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Built For Schools
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black italic text-slate-900 dark:text-white mt-2">
              Everything Needed to Master Coding & AI
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 font-medium">
              A unified platform with safe AI guidance, proctored MCQs, and in-depth analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex p-3 rounded-2xl mb-4 ${feat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold italic text-slate-900 dark:text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section
        id="faq"
        className="relative z-10 py-20 bg-slate-50/50 dark:bg-[#06120d] border-t border-slate-100 dark:border-emerald-950"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Common Inquiries
            </span>
            <h2 className="font-display text-3xl font-black italic text-slate-900 dark:text-white mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-5 transition-all cursor-pointer shadow-sm hover:shadow"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`h-4 w-4 text-emerald-600 transition-transform ${
                      openFaq === idx ? "rotate-90 text-emerald-600" : ""
                    }`}
                  />
                </div>
                {openFaq === idx && (
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-emerald-100 dark:border-emerald-950 bg-white dark:bg-[#040e09] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100 dark:border-emerald-950/60">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-3 group inline-flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-base shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  S2
                </span>
                <div className="flex items-center">
                  <span className="font-display font-extrabold italic text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    Syntax2Code
                    <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 not-italic">
                      Junior
                    </span>
                  </span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                Empowering school students with computational thinking, modern programming
                languages, game design, and safe AI skills.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cloud IDE & Platform Operational
                </span>
              </div>
            </div>

            {/* Platform Column */}
            <div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                Platform
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li>
                  <a
                    href="#curriculum"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Course Catalog
                  </a>
                </li>
                <li>
                  <Link
                    to="/student/practice"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Problems
                  </Link>
                </li>
                <li>
                  <Link
                    to="/student/compete"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Hackathons & Events
                  </Link>
                </li>
                <li>
                  <Link
                    to="/student/leaderboard"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Global Standings
                  </Link>
                </li>
                <li>
                  <Link
                    to="/student/portfolio"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Placement Prep
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                Company
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li>
                  <a
                    href="#features"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@syntax2code.com"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#curriculum"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Courses & Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Portals Column */}
            <div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                Portals
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li>
                  <button
                    onClick={() => navigate({ to: "/login", search: { role: "student" } })}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                  >
                    Student Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ to: "/login", search: { role: "teacher" } })}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                  >
                    Teacher Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ to: "/login", search: { role: "school" } })}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                  >
                    School Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate({ to: "/login", search: { role: "admin" } })}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                  >
                    Admin Portal
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} Syntax2Code Junior. All rights reserved.</p>
            <p className="flex items-center gap-1.5 font-medium">
              Made with <span className="text-emerald-600">♥</span> for the next generation of
              builders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
