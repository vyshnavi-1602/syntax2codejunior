import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown } from "lucide-react";
import { FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { getStudentLeaderboardFn } from "@/server/api/student";

export const Route = createFileRoute("/student/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard · Syntax2Code" },
      {
        name: "description",
        content:
          "Class, grade, school and inter-school leaderboards across weekly, monthly and all-time windows.",
      },
      { property: "og:title", content: "Leaderboard · Syntax2Code" },
      {
        property: "og:description",
        content: "See where you rank in class, grade, school and nationally.",
      },
    ],
  }),
  loader: async () => await getStudentLeaderboardFn(),
  component: LeaderboardPage,
});

const scopes = ["Class", "Grade", "School", "Inter-school"] as const;
const windows = ["Weekly", "Monthly", "All-time"] as const;

function LeaderboardPage() {
  const leaderboards = Route.useLoaderData();
  const [scope, setScope] = useState<(typeof scopes)[number]>("Class");
  const [win, setWin] = useState<(typeof windows)[number]>("Weekly");
  const factor = win === "Weekly" ? 0.18 : win === "Monthly" ? 0.6 : 1;
  const rows = (leaderboards as any)[scope] || [];

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Healthy competition — ranked on XP, consistency and challenge difficulty."
      />

      <Panel
        title={`${scope} leaderboard`}
        description={`${win} standings · updated hourly`}
        action={
          <Pill tone="violet">
            You: #{scope === "Class" ? 1 : scope === "Grade" ? 2 : scope === "School" ? 4 : "—"}
          </Pill>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips options={scopes} value={scope} onChange={setScope} />
          <span className="h-4 w-px bg-slate-200" />
          <FilterChips options={windows} value={win} onChange={setWin} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {rows.slice(0, 3).map((r, i) => (
            <div
              key={r.rank}
              className={cn(
                "rounded-2xl border p-4 text-center",
                i === 0
                  ? "border-amber-200 bg-amber-50/60"
                  : i === 1
                    ? "border-slate-200 bg-slate-50"
                    : "border-teal-100 bg-teal-50/40",
              )}
            >
              <Crown
                className={cn(
                  "mx-auto h-5 w-5",
                  i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-teal-500",
                )}
              />
              <p className="mt-2 text-sm font-semibold text-slate-900">{r.name}</p>
              <p className="text-xs text-slate-500">{r.detail}</p>
              <p className="mt-1 text-sm font-semibold text-indigo-600">
                {Math.round(r.xp * factor).toLocaleString()} XP
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 text-right font-medium">XP ({win})</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.rank}
                  className={cn(
                    "border-t border-slate-100",
                    r.name === "Aarav Sharma" && "bg-indigo-50/50",
                  )}
                >
                  <td className="px-4 py-3 font-semibold text-slate-500">#{r.rank}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.detail}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {Math.round(r.xp * factor).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
