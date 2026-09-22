import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, GraduationCap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { getTeacherClassesFn, getPendingProjectsFn } from "@/server/api/teacher";
import { useSession } from "@/client/lib/auth-client";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard · Syntax2Code" },
      {
        name: "description",
        content:
          "Class overview, review queue, support alerts and skill heatmaps for your classes.",
      },
    ],
  }),
  loader: async () => {
    const classes = await getTeacherClassesFn();
    const pendingProjects = await getPendingProjectsFn();
    return { classes, pendingProjects };
  },
  component: TeacherHome,
});

function heat(v: number) {
  if (v >= 80) return "bg-emerald-100 text-emerald-800";
  if (v >= 65) return "bg-sky-100 text-sky-800";
  if (v >= 50) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function TeacherHome() {
  const { classes, pendingProjects } = Route.useLoaderData();
  const { data: session } = useSession();
  const teacherName = session?.user?.name || "Teacher";

  const needSupport = [
    {
      id: 1,
      name: "Alex Chen",
      className: "Grade 8A",
      tag: "Needs support",
      lastActive: "3 days ago",
    },
  ];

  const skillHeatmap = [
    {
      skill: "Variables & Data Types",
      "Grade 6A": 90,
      "Grade 8A": 92,
      "Grade 8B": 85,
      "Grade 9A": 96,
    },
    { skill: "Control Flow", "Grade 6A": 75, "Grade 8A": 88, "Grade 8B": 82, "Grade 9A": 94 },
  ];

  return (
    <>
      <PageHeader
        title={`Good morning, ${teacherName}`}
        subtitle={`${classes.length} classes · ${pendingProjects.length} submissions waiting for review`}
        actions={
          <>
            <Link
              to="/teacher/reviews"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <ClipboardCheck className="h-4 w-4" /> Review queue
            </Link>
            <Link
              to="/teacher/assignments"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Create assignment
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total Classes"
          value={classes.length}
          sub="Active this semester"
          tone="sky"
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <Stat
          label="Avg. completion"
          value="72%"
          sub="+6% vs last month"
          tone="emerald"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Stat
          label="Pending reviews"
          value={pendingProjects.length}
          sub="Oldest waiting 2 days"
          tone="amber"
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <Stat
          label="Needs support"
          value={needSupport.length}
          sub="Flagged this week"
          tone="rose"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="My classes"
          description="Completion and engagement at a glance"
          action={
            <Link
              to="/teacher/classes"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                to="/teacher/classes/$classId"
                params={{ classId: c.id.toString() }}
                className="block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.grade && c.section
                        ? `${c.grade} - Section ${c.section}`
                        : "Class overview"}
                    </p>
                  </div>
                  <Pill tone="sky">Active</Pill>
                </div>
              </Link>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-slate-500">No classes assigned yet.</p>
            )}
          </div>
        </Panel>

        <Panel
          title="Students needing support"
          description="Auto-flagged by activity and performance"
        >
          <div className="space-y-2.5">
            {needSupport.map((s) => (
              <Link
                key={s.id}
                to="/teacher/students/$studentId"
                params={{ studentId: s.id.toString() }}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {s.className} · last active {s.lastActive}
                  </p>
                </div>
                <Pill tone={s.tag === "Needs support" ? "rose" : "amber"}>{s.tag}</Pill>
              </Link>
            ))}
          </div>
          <button
            onClick={() =>
              toast.success("Support plan drafted", {
                description: "Remedial practice set assigned.",
              })
            }
            className="mt-4 h-10 w-full rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Assign remedial practice
          </button>
        </Panel>
      </div>

      <Panel title="Skill heatmap" description="Average mastery per skill across your grades">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="px-3 py-2 font-medium">Skill</th>
                {["Grade 6A", "Grade 8A", "Grade 8B", "Grade 9A"].map((g) => (
                  <th key={g} className="px-3 py-2 font-medium">
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skillHeatmap.map((row) => (
                <tr key={row.skill} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{row.skill}</td>
                  {(["Grade 6A", "Grade 8A", "Grade 8B", "Grade 9A"] as const).map((g) => (
                    <td key={g} className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-block rounded-lg px-2.5 py-1 text-xs font-semibold",
                          heat(row[g]),
                        )}
                      >
                        {row[g]}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Submission review queue"
        description="Approve, request changes or leave feedback"
      >
        <div className="space-y-2">
          {pendingProjects.map((s) => (
            <div
              key={s.project.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{s.project.title}</p>
                <p className="text-xs text-slate-500">
                  Project Submission by {s.student.name} · waiting for review
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="violet">Project</Pill>
                <Link
                  to="/teacher/reviews"
                  className="h-9 rounded-lg bg-indigo-600 px-3.5 text-xs leading-9 font-semibold text-white hover:bg-indigo-700"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
          {pendingProjects.length === 0 && (
            <p className="text-sm text-slate-500">No pending projects to review.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
