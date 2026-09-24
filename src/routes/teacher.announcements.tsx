import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { getTeacherAnnouncementsFn, getTeacherClassesFn } from "@/api/teacher.server";

export const Route = createFileRoute("/teacher/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements · Syntax2Code" },
      {
        name: "description",
        content: "Broadcast messages to a class, a grade or the whole school.",
      },
      { property: "og:title", content: "Announcements · Syntax2Code" },
      { property: "og:description", content: "Class and grade-level broadcasting." },
    ],
  }),
  loader: async () => {
    const [announcements, classes] = await Promise.all([
      getTeacherAnnouncementsFn(),
      getTeacherClassesFn(),
    ]);
    return { announcements, classes };
  },
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const data = Route.useLoaderData();
  const classes = data?.classes || [];

  const [audience, setAudience] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<
    {
      id: string | number;
      title: string;
      targetAudience: string;
      body: string;
      createdAt: string | Date;
      authorId?: string;
    }[]
  >(data?.announcements || []);

  const toggle = (name: string) =>
    setAudience((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Keep classes and grades in the loop — instantly."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel title="New announcement" description="Delivered in-app and by email to guardians">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Write your message…"
            className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Audience
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => toggle(c.name)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  audience.includes(c.name)
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setAudience(classes.map((c) => c.name))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Whole school
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setSent(
                  (
                    s: {
                      id: string | number;
                      title: string;
                      targetAudience: string;
                      body: string;
                      createdAt: string | Date;
                      authorId?: string;
                    }[],
                  ) => [
                    {
                      id: `an-${Date.now()}`,
                      title: title || "Untitled announcement",
                      targetAudience: audience.join(", ") || "No audience",
                      authorId: "Ms. Priya Raman", // we mock the author for the preview
                      createdAt: new Date().toISOString(),
                      body,
                    },
                    ...s,
                  ],
                );
                setTitle("");
                setBody("");
                toast.success("Announcement sent", {
                  description: `${audience.length} audience group(s) notified.`,
                });
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" /> Send now
            </button>
            <button
              onClick={() => toast("Scheduled for tomorrow 8:00 AM")}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Schedule
            </button>
          </div>
        </Panel>

        <Panel title="Sent announcements">
          <div className="space-y-3">
            {sent.map(
              (a: {
                id: string | number;
                title: string;
                targetAudience: string;
                body: string;
                createdAt: string | Date;
                authorId?: string;
              }) => (
                <div key={a.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5 text-indigo-600" />
                    <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{a.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Pill tone="sky">{a.targetAudience}</Pill>
                    <span className="text-[11px] text-slate-400">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
