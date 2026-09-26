import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { Bar, FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { getLearningPathsFn } from "@/api/student.server";

export const Route = createFileRoute("/student/learn/")({
  head: () => ({
    meta: [
      { title: "Learn · Syntax2Code" },
      {
        name: "description",
        content: "Structured learning paths in Python, AI, web and game logic for Grades 6-10.",
      },
      { property: "og:title", content: "Learn · Syntax2Code" },
      {
        property: "og:description",
        content: "Follow guided learning paths with lessons, checks and key takeaways.",
      },
    ],
  }),
  loader: async () => await getLearningPathsFn(),
  component: LearnPage,
});

const filters = ["All paths", "In progress", "Not started", "AI", "Coding"] as const;

function LearnPage() {
  const learningPaths = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All paths");

  const list = learningPaths.filter((p) => {
    if (filter === "In progress") return p.progress > 0;
    if (filter === "Not started") return p.progress === 0;
    if (filter === "AI") return p.title.toLowerCase().includes("ai");
    if (filter === "Coding") return !p.title.toLowerCase().includes("ai");
    return true;
  });

  return (
    <>
      <PageHeader
        title="Learn"
        subtitle="Structured paths that take you from first line of code to real AI projects."
      />
      <FilterChips options={filters} value={filter} onChange={setFilter} />

      <div className="grid gap-5 md:grid-cols-2">
        {list.map((p) => {
          const I =
            (
              Icons as unknown as Record<
                string,
                React.ComponentType<{ className?: string | undefined }>
              >
            )[p.icon] ?? Icons.BookOpen;
          const lessons = p.modules.reduce((n, m) => n + m.lessons.length, 0);
          const done = p.modules.reduce(
            (n, m) => n + m.lessons.filter((l) => l.status === "completed").length,
            0,
          );
          return (
            <Link
              key={p.id}
              to="/student/learn/$pathId"
              params={{ pathId: p.id.toString() }}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-teal-50 text-indigo-600">
                  <I className="h-5 w-5" />
                </span>
                <Pill tone={p.progress > 60 ? "emerald" : p.progress > 0 ? "sky" : "slate"}>
                  {p.progress > 0 ? `${p.progress}% done` : "Not started"}
                </Pill>
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>
              <div className="mt-4">
                <Bar value={p.progress} tone={p.progress > 60 ? "emerald" : "indigo"} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {done}/{lessons} lessons · {p.modules.length} modules
                </span>
                <span className="font-medium text-indigo-600 group-hover:underline">{p.level}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <Panel
        title="Recommended next"
        description="Based on your recent activity and class curriculum"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              t: "Nested loops deep-dive",
              d: "Your assessment showed 51% on nested loops.",
              tone: "amber" as const,
            },
            {
              t: "AI bias case studies",
              d: "Prepares you for Genesis Round 3 pitching.",
              tone: "violet" as const,
            },
            {
              t: "CSS layout basics",
              d: "Unlocks the Web Creator project track.",
              tone: "sky" as const,
            },
          ].map((r, i) => (
            <Link
              key={r.t}
              to="/student/learn/$pathId"
              params={{ pathId: String(i + 1) }}
              className="block rounded-xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <Pill tone={r.tone}>Recommended</Pill>
              <p className="mt-2 text-sm font-medium text-slate-900">{r.t}</p>
              <p className="mt-1 text-xs text-slate-500">{r.d}</p>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
