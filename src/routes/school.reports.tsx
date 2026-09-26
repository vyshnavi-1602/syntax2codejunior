import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  when: string;
}
const announcements: Array<AnnouncementItem> = [];

export const Route = createFileRoute("/school/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Announcements · Syntax2Code" },
      {
        name: "description",
        content: "Institutional reports for leadership plus school-wide announcements.",
      },
      { property: "og:title", content: "Reports & Announcements · Syntax2Code" },
      { property: "og:description", content: "Leadership reporting and school-wide broadcasts." },
    ],
  }),
  component: ReportsPage,
});

const tabs = ["Reports", "Announcements"] as const;

const reports = [
  {
    t: "Monthly institutional report",
    d: "Engagement, completion, scores and competition results",
    f: "PDF",
    when: "September 2026",
  },
  {
    t: "Board presentation pack",
    d: "Executive slides for the management committee",
    f: "PDF",
    when: "Q3 2026",
  },
  {
    t: "Grade-wise performance",
    d: "Section-level breakdown across all grades",
    f: "PDF",
    when: "September 2026",
  },
  { t: "Full data export", d: "All student and class activity data", f: "CSV", when: "Live" },
  {
    t: "Teacher readiness audit",
    d: "Faculty training and platform usage",
    f: "PDF",
    when: "September 2026",
  },
  {
    t: "Parent communication pack",
    d: "Per-student summaries for guardians",
    f: "PDF",
    when: "September 2026",
  },
];

function ReportsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Reports");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(announcements);

  return (
    <>
      <PageHeader
        title="Reports & Announcements"
        subtitle="Institutional reporting and school-wide communication."
      />
      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Reports" && (
        <Panel title="Report library" description="Generated nightly from live platform data">
          <div className="grid gap-4 md:grid-cols-3">
            {reports.map((r) => (
              <div key={r.t} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <Pill tone={r.f === "PDF" ? "violet" : "sky"}>{r.f}</Pill>
                </div>
                <p className="mt-2.5 text-sm font-semibold text-slate-900">{r.t}</p>
                <p className="mt-1 text-xs text-slate-500">{r.d}</p>
                <p className="mt-2 text-[11px] text-slate-400">{r.when}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      toast.success(`${r.t} ready`, { description: `${r.f} generated · ${r.when}` })
                    }
                    className="h-9 flex-1 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() =>
                      toast("Shared with leadership team", {
                        description: "4 recipients notified.",
                      })
                    }
                    className="h-9 flex-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Announcements" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Panel
            title="School-wide announcement"
            description="Sent to students, teachers and guardians"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
            />
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
                    id: `a-${Date.now()}`,
                    title: title || "Untitled",
                    audience: "Whole school",
                    by: "Dr. V. Menon",
                    when: "Just now",
                    body,
                  },
                  ...s,
                ]);
                setTitle("");
                setBody("");
                toast.success("Announcement broadcast to the whole school");
              }}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" /> Broadcast
            </button>
          </Panel>
          <Panel title="Recent announcements">
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
    </>
  );
}
