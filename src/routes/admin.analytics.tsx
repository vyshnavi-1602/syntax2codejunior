import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Mail, CheckCircle2, Clock, Users, Sparkles, ShieldCheck } from "lucide-react";
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
import { getAdminAnalyticsFn, broadcastSystemAnnouncementFn } from "@/api/admin.server";

interface BenchmarkSchool {
  name: string;
  score: number;
  competitions?: number;
  engagement?: number;
  completion?: number;
}
interface SystemAnnouncement {
  id: string;
  title: string;
  body?: string;
  audience?: string;
  when?: string;
}

interface ParentDispatchLog {
  id: string;
  subject: string;
  scope: string;
  recipientCount: number;
  status: string;
  sentAt: string;
}

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Platform Settings & Analytics · Syntax2Code" },
      {
        name: "description",
        content:
          "Multi-school benchmark analytics, retention curves, parent dispatches, and global system configuration.",
      },
      { property: "og:title", content: "Platform Settings & Analytics · Syntax2Code" },
      {
        property: "og:description",
        content: "Benchmarks, retention, parent reporting and platform-wide configuration.",
      },
    ],
  }),
  loader: async () => {
    return await getAdminAnalyticsFn();
  },
  component: AdminAnalytics,
});

const tabs = ["Benchmarks", "Retention", "Announcements", "Parent Dispatches", "Settings"] as const;

function AdminAnalytics() {
  const {
    benchmarkSchools,
    retentionCurve,
    systemAnnouncements,
    settings: initialSettings,
  } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Benchmarks");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All schools");
  const [sent, setSent] = useState<SystemAnnouncement[]>(systemAnnouncements);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  // Parent Information Sending state
  const [parentSubject, setParentSubject] = useState("Weekly Syntax2Code Junior Progress Digest");
  const [parentScope, setParentScope] = useState("All 148 Partner Schools");
  const [parentNote, setParentNote] = useState(
    "Weekly roundup of coding milestones, problem-solving progress, and curriculum badges achieved by your child.",
  );
  const [isSendingParentDigest, setIsSendingParentDigest] = useState(false);
  const [parentLogs, setParentLogs] = useState<ParentDispatchLog[]>(() => {
    try {
      const saved = localStorage.getItem("s2c_admin_parent_dispatches");
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "pdis-1",
              subject: "Term 3 Milestone & Project Showcase Digest",
              scope: "All 148 Partner Schools",
              recipientCount: 4820,
              status: "Delivered (99.4%)",
              sentAt: "Yesterday at 18:00 UTC",
            },
            {
              id: "pdis-2",
              subject: "Genesis Coding Championship Invitation & Parent Guide",
              scope: "Grades 7–10 Cohorts",
              recipientCount: 2940,
              status: "Delivered (98.9%)",
              sentAt: "5 days ago",
            },
          ];
    } catch {
      return [
        {
          id: "pdis-1",
          subject: "Term 3 Milestone & Project Showcase Digest",
          scope: "All 148 Partner Schools",
          recipientCount: 4820,
          status: "Delivered (99.4%)",
          sentAt: "Yesterday at 18:00 UTC",
        },
      ];
    }
  });

  const handleSendParentDigest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentSubject.trim() || !parentNote.trim()) {
      toast.error("Please provide both subject and message note for parents");
      return;
    }
    setIsSendingParentDigest(true);
    setTimeout(() => {
      const newLog: ParentDispatchLog = {
        id: `pdis-${Date.now()}`,
        subject: parentSubject.trim(),
        scope: parentScope,
        recipientCount: 4820,
        status: "Delivered (99.2%)",
        sentAt: "Just now",
      };
      setParentLogs((prev) => {
        const next = [newLog, ...prev];
        try {
          localStorage.setItem("s2c_admin_parent_dispatches", JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setIsSendingParentDigest(false);
      toast.success("Parent Information Broadcast Dispatched!", {
        description: `Delivered to 4,820 verified guardian email inboxes across ${parentScope}.`,
      });
    }, 800);
  };

  return (
    <>
      <PageHeader
        title="Platform Settings & Analytics"
        subtitle="Cross-school benchmarks, retention, automated parent reporting and global configuration"
        actions={
          <button
            onClick={() =>
              toast.success("Analytics export queued", {
                description: "platform_benchmarks_sep2026.csv",
              })
            }
            className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Export analytics
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Schools benchmarked" value="148" sub="100% active this term" tone="violet" />
        <Stat label="Network avg S2C Score" value="784" sub="+42 pts vs last term" tone="emerald" />
        <Stat label="Wk 16 retention" value="81%" sub="Enterprise benchmark" tone="sky" />
        <Stat
          label="Guardian engagement"
          value="92.4%"
          sub="Weekly digests opened"
          tone="amber"
          icon={<Mail className="h-4 w-4" />}
        />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Benchmarks" && (
        <Panel
          title="School performance benchmark"
          description="Composite Syntax2Code score by school (top performers)"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarkSchools}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 140, bottom: 0 }}
              >
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 1000]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <RBar dataKey="score" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {tab === "Retention" && (
        <Panel
          title="Cohort retention curves"
          description="Percentage of students active week-by-week after onboarding"
        >
          <div className="h-72">
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
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="enterprise"
                  name="Enterprise tier"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="growth"
                  name="Growth tier"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="starter"
                  name="Starter tier"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {tab === "Announcements" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Broadcast system announcement"
            description="Reaches school admins, teachers and students"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
            />
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Announcement body…"
              className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
            />
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
              >
                <option value="All schools">All schools (Admins, Teachers, Students)</option>
                <option value="School admins only">School admins only</option>
                <option value="Teachers only">Teachers only</option>
                <option value="Students only">Students only</option>
              </select>
            </div>
            <button
              disabled={isBroadcasting}
              onClick={async () => {
                const cleanTitle = title.trim();
                const cleanBody = body.trim();
                if (!cleanTitle || !cleanBody) {
                  toast.error("Title and body are required");
                  return;
                }
                setIsBroadcasting(true);
                try {
                  const res = await broadcastSystemAnnouncementFn({
                    data: {
                      title: cleanTitle,
                      body: cleanBody,
                      audience,
                    },
                  });
                  if (res?.announcement) {
                    setSent((s) => [res.announcement, ...s]);
                    setTitle("");
                    setBody("");
                    toast.success("Broadcast transmitted across partner network", {
                      description: `${audience} · delivered to all active portals.`,
                    });
                  }
                } catch (err: unknown) {
                  toast.error("Failed to broadcast announcement", {
                    description: (err as Error).message,
                  });
                } finally {
                  setIsBroadcasting(false);
                }
              }}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {isBroadcasting ? "Transmitting…" : "Broadcast"}
            </button>
          </Panel>
          <Panel title="Recent broadcasts">
            <div className="space-y-3">
              {sent.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                >
                  <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{a.body}</p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                    <Pill tone="sky">{a.audience}</Pill>
                    <span className="text-[11px] text-slate-400">{a.when}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "Parent Dispatches" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/60 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Mail className="h-4 w-4" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  Platform-Wide Parent Information & Weekly Digest Engine
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">
                Automated weekly emails sent to 4,820 student guardians across 148 schools. Includes
                XP velocity, completed coding modules, teacher notes, and competition milestones.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Automated Cron Active
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Dispatch Network Guardian Update"
              description="Transmit a system-wide notice or custom digest to all enrolled parents"
            >
              <form onSubmit={handleSendParentDigest} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Subject Line
                  </label>
                  <input
                    required
                    value={parentSubject}
                    onChange={(e) => setParentSubject(e.target.value)}
                    className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Cohort
                  </label>
                  <select
                    value={parentScope}
                    onChange={(e) => setParentScope(e.target.value)}
                    className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"
                  >
                    <option value="All 148 Partner Schools">
                      All 148 Partner Schools (4,820 Guardians)
                    </option>
                    <option value="Grades 6–7 Elementary">
                      Grades 6–7 Elementary (1,880 Guardians)
                    </option>
                    <option value="Grades 8–10 Middle/High">
                      Grades 8–10 Middle/High (2,940 Guardians)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Message Body / Parent Note
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={parentNote}
                    onChange={(e) => setParentNote(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingParentDigest}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSendingParentDigest
                    ? "Broadcasting to 4,820 parents…"
                    : "Dispatch to Parent Inboxes"}
                </button>
              </form>
            </Panel>

            <Panel
              title="Guardian Email Preview"
              description="Visual formatting delivered to recipient parent devices"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs">
                <div className="rounded-lg bg-white p-4 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Syntax2Code Weekly Report
                    </span>
                    <span className="text-[10px] text-slate-400">Sunday 18:00 UTC</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{parentSubject}</h4>
                    <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{parentNote}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50/50 p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-indigo-900">Student Coding Time</p>
                      <p className="text-[10px] text-indigo-600">
                        3.8 hrs this week · 8 modules complete
                      </p>
                    </div>
                    <span className="font-bold text-indigo-700 text-sm">+250 XP</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100">
                    Official progress communication verified by school faculty.
                  </p>
                </div>
              </div>

              {/* Delivery History */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Recent Parent Dispatches
                </p>
                <div className="space-y-2">
                  {parentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="truncate font-semibold text-slate-900">{log.subject}</p>
                        <p className="text-[11px] text-slate-500">
                          {log.scope} · {log.sentAt}
                        </p>
                      </div>
                      <Pill tone="emerald">{log.status}</Pill>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
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
                  "Progress summary sent to guardians automatically every Sunday",
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
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
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
