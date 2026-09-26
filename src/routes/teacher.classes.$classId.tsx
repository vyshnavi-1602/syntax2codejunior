import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getTeacherClassesFn,
  getClassRosterFn,
  getTeacherAnalyticsFn,
  createAnnouncementFn,
} from "@/api/teacher.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { Textarea } from "@/client/components/ui/textarea";
import { Label } from "@/client/components/ui/label";

export const Route = createFileRoute("/teacher/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class detail · Syntax2Code" },
      {
        name: "description",
        content: "Student-level progress, attendance, support tags and skill growth for a class.",
      },
      { property: "og:title", content: "Class detail · Syntax2Code" },
      { property: "og:description", content: "A deep-dive into one class's performance." },
    ],
  }),
  loader: async ({ params }) => {
    const classIdNum = parseInt(params.classId, 10);
    const [classes, roster, analytics] = await Promise.all([
      getTeacherClassesFn(),
      getClassRosterFn({ data: classIdNum }),
      getTeacherAnalyticsFn(),
    ]);
    return { classes, roster, analytics, classId: params.classId };
  },
  component: ClassDetail,
});

function ClassDetail() {
  const data = Route.useLoaderData();
  const { classes, roster, analytics, classId } = data;
  const cls = classes.find((c) => c.id.toString() === classId) ?? classes[0]!;

  const [messageOpen, setMessageOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      await createAnnouncementFn({
        data: {
          targetAudience: cls.name,
          title: title.trim(),
          body: body.trim(),
        },
      });
      toast.success(`Announcement sent to ${cls.name}`, {
        description: title,
      });
      setTitle("");
      setBody("");
      setMessageOpen(false);
    } catch {
      toast.error("Failed to send announcement");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title={cls.name}
        subtitle={`${cls.teacher} · ${cls.students} students · ${cls.room}`}
        actions={
          <>
            <Link
              to="/teacher/classes"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> All classes
            </Link>
            <button
              onClick={() => setMessageOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <MessageSquare className="h-4 w-4" /> Message class
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Completion"
          value={`${cls.completion}%`}
          sub="Curriculum progress"
          tone="emerald"
        />
        <Stat label="Avg S2C score" value={cls.avgScore} sub="School avg 781" tone="violet" />
        <Stat label="Attendance" value={`${cls.attendance}%`} sub="This term" tone="sky" />
        <Stat
          label="Needs support"
          value={roster.filter((s) => s.tag === "Needs support").length}
          sub="Flagged students"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Engagement trend"
          description="Weekly completion vs engagement"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyActivity}>
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

        <Panel title="Skill mastery" description="Class averages">
          <div className="space-y-3.5">
            {(analytics.skillHeatmap && analytics.skillHeatmap.length > 0
              ? analytics.skillHeatmap.map((row) => ({
                  skill: row.skill,
                  score:
                    (row as unknown as Record<string, number>)[cls.name] ??
                    row["Grade 8A"] ??
                    row["Grade 6A"] ??
                    75,
                }))
              : [
                  { skill: "Variables & Types", score: 85 },
                  { skill: "Logic & Conditionals", score: 92 },
                  { skill: "Loops & Iteration", score: 78 },
                  { skill: "Functions & Scope", score: 74 },
                  { skill: "Debugging & Syntax", score: 68 },
                ]
            ).map((item) => (
              <div key={item.skill}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>{item.skill}</span>
                  <span className="font-semibold text-slate-900">{item.score}%</span>
                </div>
                <Bar
                  value={item.score}
                  tone={item.score >= 80 ? "emerald" : item.score >= 60 ? "indigo" : "amber"}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Student roster" description="Click a student for the full learning profile">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                {["Student", "Level", "S2C Score", "Completion", "Attendance", "Status", ""].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">Lv {s.level}</td>
                  <td className="px-4 py-3 text-slate-600">{s.score}</td>
                  <td className="w-40 px-4 py-3">
                    <Bar value={s.completion} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.attendance}%</td>
                  <td className="px-4 py-3">
                    <Pill
                      tone={
                        s.tag === "Needs support"
                          ? "rose"
                          : s.tag === "Accelerated"
                            ? "emerald"
                            : s.tag === "Low activity"
                              ? "amber"
                              : "sky"
                      }
                    >
                      {s.tag}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/teacher/students/$studentId"
                      params={{ studentId: s.id }}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message {cls.name}</DialogTitle>
            <DialogDescription>
              Broadcast an announcement to all students enrolled in {cls.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="msg-title">Announcement Title</Label>
              <Input
                id="msg-title"
                placeholder="e.g. Upcoming Assignment Deadline & Quiz Resources"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-body">Message Body</Label>
              <Textarea
                id="msg-body"
                placeholder="Write your announcement message for the class here..."
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setMessageOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send Announcement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
