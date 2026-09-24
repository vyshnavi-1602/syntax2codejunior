import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

import { getGlobalOverviewFn } from "@/api/admin.server";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Global Overview · Syntax2Code Platform" },
      {
        name: "description",
        content:
          "Cross-school executive dashboard: schools, students, engagement and growth trajectory.",
      },
      { property: "og:title", content: "Global Overview · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Platform operator dashboard across every partner school.",
      },
    ],
  }),
  loader: async () => {
    return await getGlobalOverviewFn();
  },
  component: AdminHome,
});

function AdminHome() {
  const { platformKpis, platformGrowth, schoolsGlobal, benchmarkSchools, moderationQueue } =
    Route.useLoaderData();
  return (
    <>
      <PageHeader
        title="Global Overview"
        subtitle="148 partner schools · September 2026"
        actions={
          <>
            <button
              onClick={() =>
                toast.success("Investor snapshot generated", {
                  description: "s2c_platform_september_2026.pdf",
                })
              }
              className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Export snapshot
            </button>
            <Link
              to="/admin/schools"
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium leading-10 text-slate-700 hover:bg-slate-50"
            >
              Manage schools
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Partner schools"
          value={platformKpis.schools}
          sub="+14 this month"
          tone="sky"
          icon={<Building2 className="h-4 w-4" />}
        />
        <Stat
          label="Students"
          value={platformKpis.students.toLocaleString()}
          sub={`${platformKpis.activeToday.toLocaleString()} active today`}
          tone="violet"
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <Stat
          label="Lessons served"
          value="1.84M"
          sub="All time"
          tone="emerald"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <Stat
          label="Platform uptime"
          value={platformKpis.uptime}
          sub="Rolling 30 days"
          tone="teal"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Growth trajectory"
          description="Students and weekly actives across the network"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformGrowth}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="students"
                  name="Students"
                  stroke="#6366f1"
                  fill="url(#gs)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  name="Weekly active"
                  stroke="#14b8a6"
                  fill="url(#ga)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Needs attention"
          description="Accounts and safety"
          action={
            <Link
              to="/admin/moderation"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Moderation
            </Link>
          }
        >
          <div className="space-y-3">
            {schoolsGlobal
              .filter((s) => s.status !== "Active")
              .map((s) => (
                <div key={s.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {s.status} · created {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            {moderationQueue
              .filter((m) => m.severity === "High")
              .map((m) => (
                <div key={m.id} className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{m.type}</p>
                    <Pill tone="rose">High</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{m.school}</p>
                </div>
              ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="School engagement leaders" description="Weekly active share by school">
          <div className="space-y-2.5">
            {benchmarkSchools.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-44 truncate text-sm text-slate-700">{s.name}</span>
                <div className="flex-1">
                  <Bar
                    value={s.engagement}
                    tone={s.engagement >= 80 ? "emerald" : s.engagement >= 60 ? "indigo" : "amber"}
                  />
                </div>
                <span className="w-9 text-right text-xs text-slate-500">{s.engagement}%</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="School onboarding" description="New partner schools per month">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformGrowth}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="schools"
                  name="Schools"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
