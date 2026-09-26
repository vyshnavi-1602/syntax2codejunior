import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface ModerationItem {
  id: string;
  type: string;
  severity: string;
  content: string;
  school: string;
  when: string;
}
const moderationQueue: Array<ModerationItem> = [];

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation Center · Syntax2Code Platform" },
      {
        name: "description",
        content:
          "Minor-first safety queue for reported projects, showcase review and flag resolution.",
      },
      { property: "og:title", content: "Moderation Center · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Child-safety moderation across every partner school.",
      },
    ],
  }),
  component: AdminModeration,
});

const tabs = ["Open queue", "Showcase review", "Resolved"] as const;
const sev = ["All", "High", "Medium", "Low"] as const;

const showcase = [
  {
    id: "s1",
    title: "AI Plant Doctor",
    student: "Diya Nair",
    school: "Greenfield International",
    note: "Nominated by teacher for national showcase",
  },
  {
    id: "s2",
    title: "Smart Attendance Bot",
    student: "Aarav Sharma",
    school: "Greenfield International",
    note: "Face-detection feature needs privacy check",
  },
  {
    id: "s3",
    title: "Recycle Quest",
    student: "Manav Rao",
    school: "Bluewood Academy",
    note: "Contains external asset credits to verify",
  },
];

function AdminModeration() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Open queue");
  const [filter, setFilter] = useState<(typeof sev)[number]>("All");
  const [queue, setQueue] = useState(moderationQueue);
  const [resolved, setResolved] = useState<
    { id: string; type: string; content: string; action: string }[]
  >([
    {
      id: "r0",
      type: "Club post",
      content: "Off-topic meme in Coding Club feed",
      action: "Removed · student coached",
    },
  ]);

  const rows = queue.filter((m) => filter === "All" || m.severity === filter);

  const act = (m: (typeof moderationQueue)[number], action: string) => {
    setQueue((q) => q.filter((x) => x.id !== m.id));
    setResolved((r) => [{ id: m.id, type: m.type, content: m.content, action }, ...r]);
    toast.success(`Flag resolved · ${action}`, { description: m.school });
  };

  return (
    <>
      <PageHeader
        title="Moderation Center"
        subtitle="Minor-first safety review · all actions are audit-logged"
        actions={
          <button
            onClick={() =>
              toast.success("Safety policy pushed to all schools", {
                description: "Version 4.2 · effective immediately.",
              })
            }
            className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Publish policy update
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Open flags"
          value={queue.length}
          sub="SLA: 24 hours"
          tone="amber"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <Stat
          label="High severity"
          value={queue.filter((m) => m.severity === "High").length}
          sub="Escalate to safety lead"
          tone="rose"
        />
        <Stat
          label="Resolved today"
          value={resolved.length}
          sub="Audit trail retained"
          tone="emerald"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <Stat label="Auto-filtered" value="1,284" sub="Blocked before publish" tone="teal" />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Open queue" && (
        <Panel
          title="Flagged items"
          description="Every item involves a minor — apply the strictest reasonable action"
          action={<FilterChips options={sev} value={filter} onChange={setFilter} />}
        >
          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">Queue is clear. Nice work.</p>
            )}
            {rows.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{m.type}</p>
                      <Pill
                        tone={
                          m.severity === "High"
                            ? "rose"
                            : m.severity === "Medium"
                              ? "amber"
                              : "slate"
                        }
                      >
                        {m.severity}
                      </Pill>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{m.content}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {m.school} · {m.when}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => act(m, "Dismissed as safe")}
                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => act(m, "Content removed")}
                      className="h-9 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Remove content
                    </button>
                    <button
                      onClick={() => act(m, "Escalated to school admin")}
                      className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Showcase review" && (
        <Panel
          title="Showcase nominations"
          description="Approve student work for public showcase — privacy checked first"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {showcase.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.student} · {s.school}
                </p>
                <p className="mt-2 text-xs text-slate-600">{s.note}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      toast.success(`${s.title} approved for showcase`, {
                        description: "Published with first name only.",
                      })
                    }
                    className="h-9 flex-1 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      toast("Changes requested", {
                        description: `${s.title} · sent back to the school.`,
                      })
                    }
                    className="h-9 flex-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Request changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Resolved" && (
        <Panel title="Resolution log" description="Immutable audit trail">
          <div className="space-y-2.5">
            {resolved.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.type}</p>
                  <p className="text-xs text-slate-500">{r.content}</p>
                </div>
                <Pill tone="emerald">{r.action}</Pill>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
