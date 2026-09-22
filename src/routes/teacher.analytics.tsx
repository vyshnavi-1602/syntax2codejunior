import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

const classes: any = [];
const skillHeatmap: any = [];
const weeklyActivity: any = [];

export const Route = createFileRoute("/teacher/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Reports · Syntax2Code" },
      {
        name: "description",
        content: "Completion graphs, skill comparisons and downloadable class reports.",
      },
      { property: "og:title", content: "Analytics & Reports · Syntax2Code" },
      {
        property: "og:description",
        content: "Visual analytics and exportable reports for your classes.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const ranges = ["Last 6 weeks", "This term", "This year"] as const;

function AnalyticsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Last 6 weeks");
  const myClasses = classes.filter((c) => c.teacher === "Ms. Priya Raman");

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Evidence you can take into parent meetings and leadership reviews."
        actions={
          <>
            <button
              onClick={() =>
                toast.success("PDF report generated", {
                  description: "teacher_report_priya_raman.pdf · 8 pages",
                })
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FileText className="h-4 w-4" /> Generate PDF
            </button>
            <button
              onClick={() =>
                toast.success("CSV exported", { description: "class_data_export.csv · 97 rows" })
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </>
        }
      />

      <FilterChips options={ranges} value={range} onChange={setRange} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Avg completion" value="72%" sub={`${range}`} tone="emerald" />
        <Stat label="Engagement" value="84%" sub="Weekly active students" tone="sky" />
        <Stat label="Assessment avg" value="79%" sub="Across 6 assessments" tone="violet" />
        <Stat label="Projects approved" value="41" sub="12 showcased" tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Completion & engagement" description={range}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="week"
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
                  dataKey="completion"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="#0d9488"
                  fill="#14b8a6"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Skill comparison across classes">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillHeatmap}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="skill"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <RBar dataKey="Grade 6A" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                <RBar dataKey="Grade 8A" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <RBar dataKey="Grade 8B" fill="#5eead4" radius={[4, 4, 0, 0]} />
                <RBar dataKey="Grade 9A" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Report library" description="Preview before you download or share">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              t: "Class performance report",
              d: "Completion, scores and attendance per student",
              f: "PDF",
            },
            { t: "Parent summary pack", d: "One-page summaries for every student", f: "PDF" },
            { t: "Raw data export", d: "All activity data for your classes", f: "CSV" },
          ].map((r) => (
            <div key={r.t} className="rounded-2xl border border-slate-200 p-4">
              <Pill tone={r.f === "PDF" ? "violet" : "sky"}>{r.f}</Pill>
              <p className="mt-2 text-sm font-semibold text-slate-900">{r.t}</p>
              <p className="mt-1 text-xs text-slate-500">{r.d}</p>
              <button
                onClick={() =>
                  toast.success(`${r.t} ready`, {
                    description: `${r.f} generated for ${myClasses.length} classes.`,
                  })
                }
                className="mt-3 h-9 w-full rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Preview & download
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
