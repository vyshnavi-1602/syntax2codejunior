import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
} from "lucide-react";
import { toast } from "sonner";
import { Bar, Pill, Panel, PageHeader, Stat } from "@/client/components/app/primitives";
import { getStudentDashboard, type StudentAssignmentCard } from "@/api/student.server";
import { useSession } from "@/client/lib/auth-client";
import { cn } from "@/client/lib/utils";

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
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 text-sm font-semibold text-white shadow-xs transition-colors"
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Star className="h-4 w-4" />}
          label="Current level"
          value={`Lvl ${profile.level}`}
          sub={`${profile.xpTotal.toLocaleString()} XP earned`}
          tone="indigo"
        />
        <Stat
          icon={<Zap className="h-4 w-4" />}
          label="Syntax2Code Score"
          value={Math.round(profile.xpTotal * 1.5 + 450)}
          sub="Top 8% in Grade 8"
          tone="sky"
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Daily streak"
          value={`${profile.currentStreak} days`}
          sub="3 days to Freeze shield"
          tone="amber"
        />
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Class standing"
          value="#4"
          sub="Out of 32 students"
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 pt-2">
        <Panel
          className="lg:col-span-2"
          title="Active learning path"
          description={`${activePath.title} · ${activePath.tagline}`}
          action={
            <Link
              to="/student/learn"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
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
            <Bar value={activePath.progress} tone="indigo" />
          </div>

          {/* Clean, light-mode friendly Recommended Lesson Card */}
          <div className="mt-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-violet-50/20 dark:from-slate-800 dark:to-indigo-950/30 p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Pill tone="indigo">Recommended Lesson</Pill>
            </div>
            <p className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">
              {recommendedLesson?.title || "No pending lessons"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Earn {recommendedLesson?.xpReward || 0} XP by completing this lesson.
            </p>

            <Link
              to="/student/learn/$pathId"
              params={{ pathId: activePath.id.toString() }}
              className="mt-3.5 inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              Resume lesson <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {quick.map((q) => (
              <Link
                key={q.label}
                to={q.to}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 transition-all hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 shadow-2xs"
              >
                <q.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
              <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-4 shadow-2xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {data.assignedTeacher.name}
                    </p>
                    <Pill tone="indigo">Mentor</Pill>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
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
              <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              My Assigned Coursework & Coding Challenges
            </h2>
            <p className="text-xs text-slate-500">
              Complete your weekly labs, challenges, and assessments directly inside the IDE.
            </p>
          </div>
          <Link
            to="/student/assignments"
            search={{}}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
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
                        ? "border-indigo-200/80 dark:border-indigo-900/40 bg-white dark:bg-slate-900"
                        : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/40",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <GraduationCap className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          {task.className}
                        </span>

                        {task.status === "Graded" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
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

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />+
                          {xpVal} XP
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
                          to="/student/assignments"
                          search={{ startId: 9001 }}
                          className={cn(
                            "flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all",
                            isSolved
                              ? "border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold",
                          )}
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          {isSolved ? "Review Assessment" : "Execute Assessment IDE ⚡"}
                        </Link>
                      ) : (
                        <Link
                          to="/student/assignments"
                          search={{}}
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
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
            <ClipboardList className="mx-auto h-7 w-7 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              No Coursework Pending
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              You are all caught up on your assigned classwork!
            </p>
          </div>
        )}
      </div>
    </>
  );
}
