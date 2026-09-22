import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { CompanionPanel } from "@/client/components/app/AiCompanion";
import { cn } from "@/client/lib/utils";
import { getStudentProfileFn } from "@/server/api/student";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · Syntax2Code" },
      {
        name: "description",
        content: "Manage your learning goals, preferences, notifications and safety settings.",
      },
      { property: "og:description", content: "Learner profile, goals and account preferences." },
    ],
  }),
  loader: async () => await getStudentProfileFn(),
  component: ProfilePage,
});

function ProfilePage() {
  const { currentStudent: s, achievements, preferences } = Route.useLoaderData();
  const [goal, setGoal] = useState(5);
  const [prefs, setPrefs] = useState(preferences);

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your learning identity, goals and preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Learner details">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar initials={s.name.substring(0, 2).toUpperCase()} size="lg" />
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">{s.name}</p>
              <p className="text-sm text-slate-500">{s.email}</p>
              <div className="mt-2 flex gap-1.5">
                <Pill tone="sky">Grade 8A</Pill>
                <Pill tone="violet">Level {s.level}</Pill>
                <Pill tone="emerald">{s.tag}</Pill>
              </div>
            </div>
            <button
              onClick={() => toast.success("Profile updated")}
              className="ml-auto h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit details
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat label="S2C Score" value={s.score} sub="Top 4% in school" tone="emerald" />
            <Stat label="Attendance" value={`${s.attendance}%`} sub="This term" tone="sky" />
            <Stat
              label="Badges"
              value={s.badges}
              sub={`${achievements.filter((a) => a.earned).length} achievements`}
              tone="amber"
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Weekly learning goal
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {goal} sessions per week · currently 4 of {goal} done
            </p>
            <input
              type="range"
              min={3}
              max={10}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              onMouseUp={() => toast.success(`Weekly goal set to ${goal} sessions`)}
              className="mt-3 w-full accent-indigo-600"
            />
            <div className="mt-3">
              <Bar value={(4 / goal) * 100} tone="emerald" />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Preferences & safety
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {(
                [
                  ["reminders", "Daily streak reminders"],
                  ["weeklyReport", "Weekly progress email to parents"],
                  ["companion", "AI Companion assistance"],
                  ["publicProfile", "Public portfolio visibility"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setPrefs((p) => ({ ...p, [key]: !p[key] }));
                    toast(`${label} ${prefs[key] ? "turned off" : "turned on"}`);
                  }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {label}
                  <span
                    className={cn(
                      "h-5 w-9 rounded-full p-0.5 transition-colors",
                      prefs[key] ? "bg-indigo-600" : "bg-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-4 w-4 rounded-full bg-white transition-transform",
                        prefs[key] && "translate-x-4",
                      )}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="S2C AI Companion"
          description="Your personal tutor, always on"
          bodyClassName="p-0"
        >
          <CompanionPanel />
        </Panel>
      </div>
    </>
  );
}
