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
} from "lucide-react";
import { toast } from "sonner";
import { Bar, Pill, Panel, PageHeader, Stat } from "@/client/components/app/primitives";
import { getStudentDashboard } from "@/api/student.server";
import { useSession } from "@/client/lib/auth-client";

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
  loader: async ({ location }) => {
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

function StudentHome() {
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
    { label: "Coding Lab", to: "/student/lab", icon: Terminal, desc: "Open the IDE" },
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
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
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
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
          tone="violet"
          icon={<Star className="h-4 w-4" />}
        />
        <Stat
          label="Total XP"
          value={(profile.xpTotal || 0).toLocaleString()}
          sub="XP Earned"
          tone="sky"
          icon={<Zap className="h-4 w-4" />}
        />
        <Stat
          label="Syntax2Code Score"
          value={profile.score || 0}
          sub="Keep practicing to rank up!"
          tone="emerald"
          icon={<Trophy className="h-4 w-4" />}
        />
        <Stat
          label="Streak"
          value={`${profile.currentStreak || 0} days`}
          sub="Current active streak"
          tone="amber"
          icon={<Flame className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Active learning path"
          description={`${activePath.title} · ${activePath.tagline}`}
          action={
            <Link
              to="/student/learn"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              All paths
            </Link>
          }
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">{activePath.progress}% complete</span>
            <span className="text-slate-500">{activePath.xp.toLocaleString()} XP max</span>
          </div>
          <div className="mt-2">
            <Bar value={activePath.progress} tone="emerald" />
          </div>
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2">
              <Pill tone="violet">Recommended Lesson</Pill>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {recommendedLesson?.title || "No pending lessons"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Earn {recommendedLesson?.xpReward || 0} XP by completing this lesson.
            </p>

            <Link
              to="/student/learn/$pathId"
              params={{ pathId: activePath.id.toString() }}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Resume lesson <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {quick.map((q) => (
              <Link
                key={q.label}
                to={q.to}
                className="rounded-xl border border-slate-200 p-3.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <q.icon className="h-4 w-4 text-indigo-600" />
                <p className="mt-2 text-sm font-medium text-slate-900">{q.label}</p>
                <p className="text-xs text-slate-500">{q.desc}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Next challenge" description="Genesis 2026 · Round 2">
            <p className="text-sm font-semibold text-slate-900">CodeCraft Kidz Hub Genesis</p>
            <p className="mt-1 text-xs text-slate-500">
              Round 2 · Code Challenge closes 26 Oct, 6:00 PM
            </p>
            <Link
              to="/student/compete"
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go to competition
            </Link>
          </Panel>

          <Panel title="Achievements" description="Recent achievements">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <Trophy className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">First Steps</p>
                  <p className="truncate text-xs text-slate-500">Complete your first lesson.</p>
                </div>
                <Pill>Locked</Pill>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
