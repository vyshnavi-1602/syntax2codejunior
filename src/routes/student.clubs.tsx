import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { getStudentClubsFn } from "@/server/api/student";

export const Route = createFileRoute("/student/clubs")({
  head: () => ({
    meta: [
      { title: "Clubs · Syntax2Code" },
      {
        name: "description",
        content:
          "Join the AI, Coding, Robotics and Game Dev clubs — activity feeds, mentors and members.",
      },
      { property: "og:title", content: "Clubs · Syntax2Code" },
      {
        property: "og:description",
        content: "School coding and AI clubs with live activity feeds.",
      },
    ],
  }),
  loader: async () => await getStudentClubsFn(),
  component: ClubsPage,
});

function ClubsPage() {
  const clubs = Route.useLoaderData() as any[];
  const [joined, setJoined] = useState<string[]>(
    clubs.filter((c: any) => c.joined).map((c: any) => c.id),
  );
  const [activeId, setActiveId] = useState(clubs[0]!.id);
  const active = clubs.find((c: any) => c.id === activeId)!;

  return (
    <>
      <PageHeader title="Clubs" subtitle="Where the school's builders hang out after class." />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {clubs.map((c) => {
          const isJoined = joined.includes(c.id);
          return (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                activeId === c.id ? "border-indigo-200 ring-2 ring-indigo-100" : "border-slate-200",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-teal-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </span>
                {isJoined && <Pill tone="emerald">Joined</Pill>}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{c.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{c.blurb}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" /> {c.meets} · {c.members} members
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setJoined((j) => (isJoined ? j.filter((x) => x !== c.id) : [...j, c.id]));
                  toast.success(isJoined ? `Left ${c.name}` : `Joined ${c.name}`, {
                    description: isJoined ? "You can rejoin at any time." : `Mentor: ${c.mentor}`,
                  });
                }}
                className={cn(
                  "mt-4 h-9 w-full rounded-lg text-xs font-semibold transition-colors",
                  isJoined
                    ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700",
                )}
              >
                {isJoined ? "Leave club" : "Join club"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={`${active.name} · Activity feed`}
          description={`Mentor: ${active.mentor}`}
        >
          <div className="space-y-3">
            {active.feed.map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">{f.who}</p>
                <p className="mt-0.5 text-sm text-slate-600">{f.what}</p>
                <p className="mt-1 text-[11px] text-slate-400">{f.when}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() =>
              toast.success("Post shared with the club", {
                description: "Your mentor will see it in the feed.",
              })
            }
            className="mt-4 h-10 w-full rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Share an update with {active.name}
          </button>
        </Panel>

        <Panel title="Upcoming club sessions">
          <div className="space-y-2.5">
            {clubs.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.meets}</p>
                </div>
                <button
                  onClick={() => toast("Reminder set", { description: `${c.name} · ${c.meets}` })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Remind me
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
