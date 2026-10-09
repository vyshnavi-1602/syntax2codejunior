import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Flame,
  Star,
  Trophy,
  Zap,
  ArrowRight,
  Target,
  Hammer,
  Terminal,
  Award,
  GraduationCap,
  Mail,
  ClipboardList,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  User,
  Play,
  Eye,
  RotateCw,
  ListFilter,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, Pill, Panel, PageHeader, Stat } from "@/client/components/app/primitives";
import { getStudentDashboard, type StudentAssignmentCard } from "@/api/student.server";
import { useSession } from "@/client/lib/auth-client";
import { cn } from "@/client/lib/utils";
import { loadCourses, saveCourses, type CourseItem } from "@/client/components/app/coursesData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/client/components/ui/dialog";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "My World · Syntax2Code" },
      {
        name: "description",
        content: "Your level, XP, Syntax2Code Score, streak and next challenge in one place.",
      },
    ],
  }),
  loader: async () => {
    try {
      return await getStudentDashboard();
    } catch (e) {
      console.error(e);
      if (e instanceof Error && (e.message === "Unauthorized" || e.message.includes("Forbidden"))) {
        throw redirect({ to: "/login", search: { role: "student" } });
      }
      throw e;
    }
  },
  component: StudentHome,
});

export function StudentHome() {
  const data = Route.useLoaderData();
  const { data: session } = useSession();

  const profile = data.profile;
  const activeClass = data.activeClasses[0];
  const recommendedLesson = data.recommendedLesson;

  const userName = session?.user?.name || "Student";
  const activePath = {
    id: 1,
    title: "Python Basics",
    tagline: "Start your journey",
    progress: 45,
    xp: 1000,
  };

  const quick = [
    { label: "Practice Hub", to: "/student/practice", icon: Target, desc: "New problems" },
    { label: "Coding", to: "/student/lab", icon: Terminal, desc: "Open the IDE" },
    { label: "My Projects", to: "/student/build", icon: Hammer, desc: "Active projects" },
    { label: "Certificates", to: "/student/certificates", icon: Award, desc: "Earned" },
  ];

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  useEffect(() => {
    setCourses(loadCourses("student"));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCourses(loadCourses("student"));
      setIsRefreshing(false);
      toast.success("Courses refreshed");
    }, 400);
  };

  const handleToggleEnrollment = (courseId: string) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const nextState = !c.enrolled;
        toast.success(nextState ? `Enrolled into ${c.title}` : `Unenrolled from ${c.title}`);
        return { ...c, enrolled: nextState };
      }
      return c;
    });
    setCourses(updated);
    saveCourses("student", updated);
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse(updated.find((c) => c.id === courseId) || null);
    }
  };

  const academicsCount = courses.filter((c) => c.category === "Academics").length;
  const filteredCourses =
    courseFilter === "Academics" ? courses.filter((c) => c.category === "Academics") : courses;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${userName} 👋`}
        subtitle={`${activeClass ? `${activeClass.name} · ` : ""}Greenfield International School · ${profile.currentStreak}-day streak going strong`}
        actions={
          <>
            <Link
              to="/student/learn/$pathId"
              params={{ pathId: activePath.id.toString() }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#10b981] hover:bg-[#059669] px-4 text-sm font-semibold text-slate-950 shadow-xs transition-colors"
            >
              Continue learning <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/student/practice"
              onClick={() =>
                toast.success("Daily challenge started", {
                  description: "Loop Sprint · 3 problems · 60 XP",
                })
              }
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Start daily challenge
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Level"
          value={`Level ${profile.level || 1}`}
          sub="Keep going!"
          tone="emerald"
          icon={<Star className="h-4 w-4 text-emerald-500" />}
        />
        <Stat
          label="Total XP"
          value={(profile.xpTotal || 0).toLocaleString()}
          sub="XP Earned"
          tone="emerald"
          icon={<Zap className="h-4 w-4 text-emerald-500" />}
        />
        <Stat
          label="Score & Ranking"
          value={profile.xpTotal || 0}
          sub="Keep practicing to rank up!"
          tone="emerald"
          icon={<Trophy className="h-4 w-4 text-emerald-500" />}
        />
        <Stat
          label="Streak"
          value={`${profile.currentStreak || 0} days`}
          sub="Current active streak"
          tone="emerald"
          icon={<Flame className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCourseFilter("All")}
              className={cn(
                "h-8 px-4 rounded-full text-xs font-bold transition-all cursor-pointer",
                courseFilter === "All"
                  ? "bg-[#10b981] text-slate-950 shadow-xs"
                  : "border border-slate-800 bg-[#16181f] text-slate-400 hover:text-white hover:border-slate-700",
              )}
            >
              All ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter("Academics")}
              className={cn(
                "h-8 px-4 rounded-full text-xs font-bold transition-all cursor-pointer",
                courseFilter === "Academics"
                  ? "bg-[#10b981] text-slate-950 shadow-xs"
                  : "border border-slate-800 bg-[#16181f] text-slate-400 hover:text-white hover:border-slate-700",
              )}
            >
              Academics ({academicsCount})
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Courses"
            className="h-8 w-8 rounded-full border border-slate-800 bg-[#16181f] hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-[#10b981]")} />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isEnrolled = !!course.enrolled;
            return (
              <div
                key={course.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#111318] p-4 transition-all hover:border-slate-700 shadow-sm"
              >
                <div>
                  <div className="relative flex flex-col justify-between rounded-xl bg-[#161922] p-3.5 min-h-[170px] overflow-hidden border border-slate-800/60 select-none">
                    <div className="absolute inset-0 pointer-events-none opacity-5 font-mono text-[11px] leading-relaxed p-2 text-slate-300 flex flex-wrap gap-2 select-none overflow-hidden">
                      <span>
                        &lt;/&gt; &lt;/&gt; &lt;/&gt; &lt;/&gt; &lt;/&gt; &lt;/&gt; &lt;/&gt;
                        &lt;/&gt; &lt;/&gt;
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-lime-500/30 bg-lime-950/40 text-lime-400">
                        {course.level.toUpperCase()}
                      </span>
                      {isEnrolled && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
                          ENROLLED
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center justify-center py-2">
                      {course.visualType === "lock" ? (
                        <span className="text-5xl filter drop-shadow-md">🔐</span>
                      ) : course.visualType === "globe" ? (
                        <span className="text-5xl filter drop-shadow-md">🌐</span>
                      ) : (
                        <span className="text-5xl filter drop-shadow-md">💻</span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-black/70 text-white backdrop-blur-sm border border-slate-700/60">
                        <ListFilter className="h-3 w-3 text-emerald-400" />
                        {course.modules.length} MODULES
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-4 text-base font-black italic tracking-wide text-white uppercase line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 min-h-[34px] leading-relaxed">
                    {course.description || "Course modules and hands-on coding curriculum."}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full border border-slate-700 bg-slate-800/80 flex items-center justify-center text-slate-400">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase leading-none">
                          OPERATIVE
                        </span>
                        <span className="text-xs font-black text-white uppercase mt-0.5 leading-none">
                          {course.instructor}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-slate-400 border border-slate-800 bg-slate-900/60 uppercase">
                      OFFLINE
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  {isEnrolled ? (
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                      className="w-full h-9.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>ENGAGE PROGRAM</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                      className="w-full h-9.5 rounded-xl border border-slate-800 bg-[#16181f] hover:bg-slate-800 text-slate-300 hover:text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>VIEW DETAILS</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 pt-2">
        <Panel
          className="lg:col-span-2"
          title="Active learning path"
          description={`${activePath.title} · ${activePath.tagline}`}
          action={
            <Link
              to="/student/learn"
              className="text-xs font-semibold text-emerald-500 hover:underline"
            >
              All paths
            </Link>
          }
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900 dark:text-white">
              {activePath.progress}% complete
            </span>
            <span className="text-slate-500">{activePath.xp.toLocaleString()} XP max</span>
          </div>
          <div className="mt-2">
            <Bar value={activePath.progress} tone="emerald" />
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-slate-900 to-emerald-950/20 p-4.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Pill tone="emerald">Recommended Lesson</Pill>
            </div>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {recommendedLesson?.title || "No pending lessons"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Earn {recommendedLesson?.xpReward || 0} XP by completing this lesson.
            </p>

            <Link
              to="/student/learn/$pathId"
              params={{ pathId: activePath.id.toString() }}
              className="mt-3.5 inline-flex h-9 items-center gap-2 rounded-xl bg-[#10b981] hover:bg-[#059669] px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors"
            >
              Resume lesson <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {quick.map((q) => (
              <Link
                key={q.label}
                to={q.to}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 transition-all hover:border-emerald-500/50 hover:bg-emerald-950/20 shadow-2xs"
              >
                <q.icon className="h-4 w-4 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {q.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{q.desc}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Next challenge" description="Genesis 2026 · Round 2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              CodeCraft Kidz Hub Genesis
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Round 2 · Code Challenge closes 26 Oct, 6:00 PM
            </p>
            <Link
              to="/student/compete"
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              Go to competition
            </Link>
          </Panel>

          <Panel title="Achievements" description="Recent achievements">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300">
                  <Trophy className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    First Steps
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    Complete your first lesson.
                  </p>
                </div>
                <Pill>Locked</Pill>
              </div>
            </div>
          </Panel>

          {data.assignedTeacher && (
            <Panel title="Class Mentor & Faculty" description="Your assigned academic instructor">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-sm">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {data.assignedTeacher.name}
                    </p>
                    <Pill tone="emerald">Mentor</Pill>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-emerald-400">
                    {data.assignedTeacher.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {data.assignedTeacher.className} · {data.assignedTeacher.room}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={`mailto:${data.assignedTeacher.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                    >
                      <Mail className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                      Contact
                    </a>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {data.assignedTeacher.officeHours}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-500" />
              My Assigned Coursework & Coding Challenges
            </h2>
            <p className="text-xs text-slate-500">
              Complete your weekly labs, challenges, and assessments directly inside the IDE.
            </p>
          </div>
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:underline"
          >
            <span>View All Assignments ({data.classAssignments?.length || 0})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.classAssignments && data.classAssignments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data.classAssignments as unknown as StudentAssignmentCard[]).map(
              (task: StudentAssignmentCard) => {
                const isSolved = task.status === "Submitted" || task.status === "Graded";
                const isCoding =
                  task.isCodingRound ?? (task.type === "Coding task" || task.type === "Assessment");
                const tcCount = task.testCasesCount ?? 3;
                const xpVal = task.xp ?? 50;
                const diff = task.difficulty ?? "Easy";

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md",
                      isSolved
                        ? "border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-b from-white to-emerald-50/15 dark:from-slate-900 dark:to-emerald-950/10"
                        : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <GraduationCap className="h-3 w-3 text-emerald-500" />
                          {task.className}
                        </span>

                        {task.status === "Graded" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                            <Check className="h-3 w-3 stroke-[3]" />
                            Score: {task.score}%
                          </span>
                        ) : task.status === "Submitted" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 dark:text-sky-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            Due {task.dueDate || "Soon"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description ||
                          "Complete this programming challenge and verify test cases."}
                      </p>

                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <Pill
                          tone={diff === "Easy" ? "emerald" : diff === "Medium" ? "amber" : "rose"}
                        >
                          {diff}
                        </Pill>
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-950/40 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-800/40">
                          <Sparkles className="h-3 w-3 text-emerald-400" />+{xpVal} XP
                        </span>
                        {tcCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {tcCount} Test Cases
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {isCoding ? (
                        <Link
                          to="/student/lab"
                          search={{ assignmentId: task.id }}
                          className={cn(
                            "flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all",
                            isSolved
                              ? "border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                              : "bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold",
                          )}
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          {isSolved ? "Review in IDE" : "Solve in IDE ⚡"}
                        </Link>
                      ) : (
                        <Link
                          to="/student/practice"
                          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all"
                        >
                          <span>Start Task</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-xs text-slate-500">No new coursework assignments posted yet.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-[#16181f] border-slate-800 text-white">
          {selectedCourse && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-lime-500/30 bg-lime-950/40 text-lime-400">
                    {selectedCourse.level.toUpperCase()}
                  </span>
                  {selectedCourse.enrolled && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
                      ENROLLED
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 border border-slate-800 bg-slate-900">
                    {selectedCourse.category}
                  </span>
                </div>
                <DialogTitle className="text-lg font-black italic tracking-wide text-white uppercase">
                  {selectedCourse.title}
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-1">{selectedCourse.description}</p>
              </DialogHeader>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141a] border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-400">Instructor:</span>
                  <span className="font-bold text-white">{selectedCourse.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-400">Questions:</span>
                  <span className="font-bold text-white">{selectedCourse.totalQuestions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-400">Modules:</span>
                  <span className="font-bold text-white">{selectedCourse.modules.length} Days</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
                  <span>Day-by-Day Curriculum Modules</span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {selectedCourse.modules.length} Modules
                  </span>
                </h4>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {selectedCourse.modules.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-800 bg-[#12141a] hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-emerald-400">
                          Day {m.day}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.questionsCount} questions
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1">{m.title}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleEnrollment(selectedCourse.id)}
                  className={cn(
                    "h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    selectedCourse.enrolled
                      ? "border border-rose-900/50 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40"
                      : "border border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40",
                  )}
                >
                  {selectedCourse.enrolled ? "Leave Program" : "Enroll Now"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="h-9 px-4 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    to="/student/lab"
                    search={{ assignmentId: undefined }}
                    className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Open Coding IDE</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
