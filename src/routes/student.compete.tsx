import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Medal, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, Stat, type Tone } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";

import { getStudentAnnouncementsFn } from "@/server/api/student";

export const Route = createFileRoute("/student/compete")({
  head: () => ({
    meta: [
      { title: "Compete · Syntax2Code" },
      {
        name: "description",
        content:
          "Register for tournaments, track rounds and follow the live inter-school leaderboard.",
      },
      { property: "og:title", content: "Compete · Syntax2Code" },
      {
        property: "og:description",
        content: "Tournaments, rounds and live leaderboards for junior coders.",
      },
    ],
  }),
  loader: async () => {
    return await getStudentAnnouncementsFn();
  },
  component: CompetePage,
});

function CompetePage() {
  const { competitions, leaderboard: compLeaderboard } = Route.useLoaderData();
  const [activeId, setActiveId] = useState(competitions[0]?.id || null);
  const [registered, setRegistered] = useState<string[]>(
    competitions.filter((c) => c.registered).map((c) => c.id),
  );
  const active = competitions.find((c) => c.id === activeId) || competitions[0];

  return (
    <>
      <PageHeader
        title="Compete"
        subtitle="School, state and national tournaments — with live standings."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Your best rank"
          value="#3"
          sub="Genesis 2026 · Round 1"
          tone="amber"
          icon={<Medal className="h-4 w-4" />}
        />
        <Stat
          label="Competition points"
          value="2,745"
          sub="+310 last round"
          tone="violet"
          icon={<Trophy className="h-4 w-4" />}
        />
        <Stat
          label="Participants"
          value="4,820"
          sub="148 schools"
          tone="sky"
          icon={<Users className="h-4 w-4" />}
        />
        <Stat label="Next deadline" value="26 Oct" sub="Round 2 submission" tone="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Tournaments"
          description="Select a tournament to see its rounds"
        >
          <div className="space-y-3">
            {competitions.map((c) => {
              const isReg = registered.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 transition-colors",
                    activeId === c.id
                      ? "border-indigo-200 bg-indigo-50/40"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.level} · {c.date} · {c.participants.toLocaleString()} participants
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill
                        tone={
                          (c.status === "Registration open"
                            ? "emerald"
                            : c.status === "Upcoming"
                              ? "sky"
                              : "slate") as Tone
                        }
                      >
                        {c.status}
                      </Pill>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRegistered((r) =>
                            isReg ? r.filter((x) => x !== c.id) : [...r, c.id],
                          );
                          toast.success(
                            isReg ? `Withdrawn from ${c.name}` : `Registered for ${c.name}`,
                            {
                              description: isReg
                                ? "You can re-register any time."
                                : "Check your email for round instructions.",
                            },
                          );
                        }}
                        className={cn(
                          "h-9 rounded-lg px-3 text-xs font-semibold transition-colors",
                          isReg
                            ? "border border-slate-200 text-slate-600 hover:bg-white"
                            : "bg-indigo-600 text-white hover:bg-indigo-700",
                        )}
                      >
                        {isReg ? "Registered" : "Register"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {active?.name} · Rounds
            </p>
            <div className="mt-3 space-y-2">
              {active?.rounds.map((r) => (
                <div
                  key={r.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{r.score}</span>
                    <Pill
                      tone={
                        r.state === "Completed" ? "emerald" : r.state === "Live" ? "amber" : "slate"
                      }
                    >
                      {r.state}
                    </Pill>
                    <button
                      onClick={() =>
                        toast(
                          r.state === "Live"
                            ? "Submission opened"
                            : r.state === "Completed"
                              ? "Results available"
                              : "Not open yet",
                          {
                            description:
                              r.state === "Live"
                                ? "You have 2 attempts remaining for this round."
                                : r.state === "Completed"
                                  ? "You scored 48/50 — ranked 3rd in school."
                                  : "This round opens closer to the date.",
                          },
                        )
                      }
                      className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {r.state === "Live" ? "Submit" : "View"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Live leaderboard" description="Genesis 2026 · updated 2 min ago">
          <div className="space-y-2">
            {compLeaderboard.map((e) => (
              <div
                key={e.rank}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                  e.name === "Aarav Sharma"
                    ? "border-indigo-200 bg-indigo-50/60"
                    : "border-slate-100",
                )}
              >
                <span className="w-6 text-sm font-semibold text-slate-500">#{e.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{e.name}</p>
                  <p className="truncate text-xs text-slate-500">{e.school}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{e.score}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
