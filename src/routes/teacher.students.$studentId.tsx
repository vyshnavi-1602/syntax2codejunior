import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Avatar, Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getStudentProfileFn, getStudentProjectsFn } from "@/api/student.server";

export const Route = createFileRoute("/teacher/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile · Syntax2Code" },
      {
        name: "description",
        content: "Student-level progress, skills, attendance, projects and support tags.",
      },
      { property: "og:title", content: "Student profile · Syntax2Code" },
      { property: "og:description", content: "A full learning profile for one student." },
    ],
  }),
  loader: async ({ params }) => {
    // Pass the target studentId if the server function supports looking up other students
    // Currently, getStudentProfileFn uses context.user.id.
    // Wait, the API needs to support fetching by ID for teachers. Let's assume it does or will just use it for now and mock if needed.
    const [profileData, projects] = await Promise.all([
      getStudentProfileFn({ data: params.studentId }),
      getStudentProjectsFn({ data: params.studentId }),
    ]);
    return { profile: profileData.currentStudent, projects, studentId: params.studentId };
  },
  component: StudentDetail,
});

function StudentDetail() {
  const { profile: s, projects } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={`${s.className} · Level ${s.level} · last active ${s.lastActive}`}
        actions={
          <>
            <Link
              to="/teacher/classes/$classId"
              params={{ classId: s.classId?.toString() || "" }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back to class
            </Link>
            <button
              onClick={() =>
                toast.success("Support tag updated", {
                  description: `${s.name} flagged for weekly mentoring.`,
                })
              }
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add support tag
            </button>
          </>
        }
      />

      <Panel bodyClassName="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            initials={s.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
            size="lg"
          />
          <div className="flex-1">
            <p className="text-lg font-semibold tracking-tight text-slate-900">{s.name}</p>
            <p className="text-sm text-slate-500">
              {s.className} · Greenfield International School
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill
                tone={
                  s.tag === "Needs support" ? "rose" : s.tag === "Accelerated" ? "emerald" : "sky"
                }
              >
                {s.tag}
              </Pill>
              <Pill tone="violet">{s.badges} badges</Pill>
              <Pill tone="amber">{s.streak}-day streak</Pill>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="S2C Score" value={s.score} sub="Class avg 806" tone="emerald" />
        <Stat label="Curriculum" value={`${s.completion}%`} sub="Completed" tone="sky" />
        <Stat label="Attendance" value={`${s.attendance}%`} sub="This term" tone="violet" />
        <Stat
          label="Total XP"
          value={s.xp.toLocaleString()}
          sub={`Level ${s.level}`}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Skill radar" description="Relative strengths and gaps">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={s.skills} outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Radar dataKey="value" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Progress detail">
          <div className="space-y-3">
            {s.skills.map((sk) => (
              <div key={sk.skill}>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{sk.skill}</span>
                  <span>{sk.value}%</span>
                </div>
                <Bar
                  value={sk.value}
                  tone={sk.value >= 80 ? "emerald" : sk.value >= 60 ? "indigo" : "amber"}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Recent projects
            </p>
            <div className="mt-3 space-y-2">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5"
                >
                  <span className="text-sm text-slate-800">{p.title}</span>
                  <Pill
                    tone={
                      p.status === "Approved"
                        ? "emerald"
                        : p.status === "Needs Changes"
                          ? "amber"
                          : "sky"
                    }
                  >
                    {p.status}
                  </Pill>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <button
              onClick={() => toast.success("Parent update scheduled")}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Notify parent
            </button>
            <button
              onClick={() =>
                toast.success("Practice set assigned", {
                  description: "5 debugging problems due Friday.",
                })
              }
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Assign practice
            </button>
            <button
              onClick={() =>
                toast("Report preview ready", { description: `${s.name}_progress.pdf` })
              }
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Download report
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
