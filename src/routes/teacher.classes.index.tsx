import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";

const classes: any = [];

export const Route = createFileRoute("/teacher/classes/")({
  head: () => ({
    meta: [
      { title: "My Classes · Syntax2Code" },
      {
        name: "description",
        content:
          "Class performance, attendance and curriculum completion for every section you teach.",
      },
      { property: "og:title", content: "My Classes · Syntax2Code" },
      { property: "og:description", content: "Deep-dive into each class's performance." },
    ],
  }),
  component: ClassesPage,
});

const filters = ["My classes", "All classes", "Grade 6-7", "Grade 8-10"] as const;

function ClassesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("My classes");
  const list = classes.filter((c) => {
    if (filter === "My classes") return c.teacher === "Ms. Priya Raman";
    if (filter === "Grade 6-7") return c.grade <= 7;
    if (filter === "Grade 8-10") return c.grade >= 8;
    return true;
  });

  return (
    <>
      <PageHeader
        title="My Classes"
        subtitle="Track curriculum completion, attendance and skill growth per section."
        actions={
          <button
            onClick={() =>
              toast.success("Class report exported", {
                description: "class_performance_september.csv",
              })
            }
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        }
      />
      <FilterChips options={filters} value={filter} onChange={setFilter} />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Link
            key={c.id}
            to="/teacher/classes/$classId"
            params={{ classId: c.id }}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-slate-900">{c.name}</h3>
              <Pill tone={c.completion >= 80 ? "emerald" : c.completion >= 65 ? "sky" : "amber"}>
                {c.completion}%
              </Pill>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {c.teacher} · {c.room}
            </p>
            <div className="mt-4">
              <Bar value={c.completion} tone={c.completion >= 80 ? "emerald" : "indigo"} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Students", c.students],
                ["Avg score", c.avgScore],
                ["Attendance", `${c.attendance}%`],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-slate-50 py-2">
                  <p className="text-sm font-semibold text-slate-900">{v}</p>
                  <p className="text-[11px] text-slate-500">{k}</p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
