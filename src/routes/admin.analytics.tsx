import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

const benchmarkSchools: any = [];
const retentionCurve: any = [];
const systemAnnouncements: any = [];

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Platform Settings & Analytics · Syntax2Code" },
      {
        name: "description",
        content:
          "Multi-school benchmark analytics, retention curves and the system announcement broadcaster.",
      },
      { property: "og:title", content: "Platform Settings & Analytics · Syntax2Code" },
      {
        property: "og:description",
        content: "Benchmarks, retention and platform-wide configuration.",
      },
    ],
  }),
  component: AdminAnalytics,
});

const tabs = ["Benchmarks", "Retention", "Announcements", "Settings"] as const;

function AdminAnalytics() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Benchmarks");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All schools");
  const [sent, setSent] = useState(systemAnnouncements);
  const [settings, setSettings] = useState({
    aiCompanion: true,
    publicPortfolios: true,
    competitions: true,
    parentDigest: false,
    maintenance: false,
  });

  return (
    <>
      <PageHeader
        title="Platform Settings & Analytics"
        subtitle="Cross-school benchmarks, retention and global configuration"
        actions={
          <button
            onClick={() =>
              toast.success("Analytics export queued", {
                description: "platform_benchmarks_sep2026.csv",
              })
            }
            className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Export analytics
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Median engagement" value="78%" sub="Across 148 schools" tone="emerald" />
        <Stat label="16-week retention" value="79%" sub="Enterprise cohort" tone="violet" />
        <Stat label="Avg S2C score" value="724" sub="Network-wide" tone="sky" />
        <Stat label="Support tickets" value="34" sub="Open this week" tone="amber" />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Benchmarks" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="School benchmark" description="Engagement vs curriculum completion">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkSchools} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RBar
                    dataKey="engagement"
                    name="Engagement"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                  />
                  <RBar
                    dataKey="completion"
                    name="Completion"
                    fill="#14b8a6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Scores and competition index" description="Where each school stands">
            <div className="space-y-2.5">
              {benchmarkSchools.map((s) => (
                <div
                  key={s.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <div className="flex items-center gap-2">
                    <Pill tone={s.score >= 780 ? "emerald" : s.score >= 700 ? "sky" : "amber"}>
                      S2C {s.score}
                    </Pill>
                    <Pill tone="violet">Comp {s.competitions}</Pill>
                    <button
                      onClick={() =>
                        toast.success(`${s.name} deep-dive opened`, {
                          description: `Engagement ${s.engagement}% · completion ${s.completion}%`,
                        })
                      }
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Deep dive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "Retention" && (
        <Panel
          title="Retention curves by licence tier"
          description="Share of students still weekly-active since onboarding"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionCurve}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="enterprise"
                  name="Enterprise"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="growth"
                  name="Growth"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="starter"
                  name="Starter"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Starter schools drop to 32% by week 16. Teacher enablement is the strongest predictor of
            retention — schools with 85%+ teacher readiness retain above 80%.
          </p>
        </Panel>
      )}

      {tab === "Announcements" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Panel
            title="System announcement"
            description="Broadcast to every school on the platform"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
            />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              {["All schools", "All teachers", "All school admins", "Enterprise schools only"].map(
                (a) => (
                  <option key={a}>{a}</option>
                ),
              )}
            </select>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write your message…"
              className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300"
            />
            <button
              onClick={() => {
                setSent((s) => [
                  {
                    id: `sa-${Date.now()}`,
                    title: title || "Untitled",
                    audience,
                    when: "Just now",
                    body,
                  },
                  ...s,
                ]);
                setTitle("");
                setBody("");
                toast.success("Broadcast sent", {
                  description: `${audience} · delivered to 148 schools.`,
                });
              }}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" /> Broadcast
            </button>
          </Panel>
          <Panel title="Recent broadcasts">
            <div className="space-y-3">
              {sent.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 p-3.5">
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Pill tone="sky">{a.audience}</Pill>
                    <span className="text-[11px] text-slate-400">{a.when}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "Settings" && (
        <Panel title="Platform settings" description="Global feature switches across all schools">
          <div className="space-y-3">
            {(
              [
                ["aiCompanion", "S2C AI Companion", "Educational AI tutor available to students"],
                [
                  "publicPortfolios",
                  "Public student portfolios",
                  "First name only, no school contact details",
                ],
                [
                  "competitions",
                  "Competitions module",
                  "Inter-school tournaments and leaderboards",
                ],
                [
                  "parentDigest",
                  "Weekly parent digest email",
                  "Progress summary sent to guardians",
                ],
                [
                  "maintenance",
                  "Maintenance mode",
                  "Shows a scheduled-maintenance notice to all users",
                ],
              ] as const
            ).map(([key, label, desc]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => {
                    setSettings({ ...settings, [key]: e.target.checked });
                    toast(`${label} ${e.target.checked ? "enabled" : "disabled"}`);
                  }}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
              </label>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
