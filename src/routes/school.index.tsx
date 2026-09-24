import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, GraduationCap, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getSchoolAnalyticsFn } from "@/api/admin.server";

export const Route = createFileRoute("/school/")({
  head: () => ({
    meta: [
      { title: "Executive Overview · Syntax2Code for Schools" },
      {
        name: "description",
        content:
          "Enrollment, engagement, curriculum completion and average S2C score for your school.",
      },
      { property: "og:title", content: "Executive Overview · Syntax2Code" },
      {
        property: "og:description",
        content: "Institution-wide view for principals and management.",
      },
    ],
  }),
  loader: async () => {
    return await getSchoolAnalyticsFn({ data: 1 });
  },
  component: SchoolHome,
});

function SchoolHome() {
  const { schoolKpis, gradeDistribution, readinessIndex, classes, teachers } =
    Route.useLoaderData();
  return (
    <>
      <PageHeader
        title="Executive Overview"
        subtitle="Greenfield International School · September 2026"
        actions={
          <>
            <button
              onClick={() =>
                toast.success("Board report generated", {
                  description: "greenfield_september_board_report.pdf",
                })
              }
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Generate board report
            </button>
            <Link
              to="/school/readiness"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View readiness index
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Students enrolled"
          value={schoolKpis.enrolled.toLocaleString()}
          sub="1,500 licensed seats"
          tone="sky"
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <Stat
          label="Active weekly"
          value={schoolKpis.activeWeekly.toLocaleString()}
          sub="81% of enrolled"
          tone="emerald"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Stat
          label="Curriculum completion"
          value={`${schoolKpis.curriculum}%`}
          sub="+9% this term"
          tone="violet"
          icon={<Users className="h-4 w-4" />}
        />
        <Stat
          label="Avg S2C score"
          value={schoolKpis.avgScore}
          sub="National avg 724"
          tone="amber"
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Completion by grade"
          description="Curriculum progress across the school"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="grade"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <RBar dataKey="completion" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Readiness snapshot" description="School AI & Coding Readiness Index">
          <p className="font-display text-3xl font-semibold text-slate-900">
            77<span className="text-base text-slate-400">/100</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Above the 68 national benchmark</p>
          <div className="mt-4 space-y-3">
            {readinessIndex.map((r) => (
              <div key={r.dimension}>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{r.dimension}</span>
                  <span>{r.value}</span>
                </div>
                <Bar
                  value={r.value}
                  tone={r.value >= 80 ? "emerald" : r.value >= 70 ? "indigo" : "amber"}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Class performance"
          description="Top and bottom performing sections"
          action={
            <Link
              to="/school/classes"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Manage classes
            </Link>
          }
        >
          <div className="space-y-2.5">
            {classes.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div className="w-24 text-sm font-medium text-slate-900">{c.name}</div>
                <div className="flex-1">
                  <Bar
                    value={c.completion}
                    tone={c.completion >= 80 ? "emerald" : c.completion >= 65 ? "indigo" : "amber"}
                  />
                </div>
                <span className="w-10 text-right text-xs text-slate-500">{c.completion}%</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Teacher readiness"
          description="Enablement status across faculty"
          action={
            <Link
              to="/school/teachers"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Manage teachers
            </Link>
          }
        >
          <div className="space-y-2.5">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={t.readiness >= 85 ? "emerald" : t.readiness >= 70 ? "sky" : "amber"}>
                    {t.readiness}% ready
                  </Pill>
                  {!t.active && <Pill tone="rose">Inactive</Pill>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
