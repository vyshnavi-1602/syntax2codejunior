import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface SchoolStudent {
  id: string;
  name: string;
  className: string;
  tag: string;
  score: number;
  completion: number;
  active: boolean;
  lastActive: string;
}
const classes: Array<{ id: string; name: string }> = [];
const students: Array<SchoolStudent> = [];
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/school/students")({
  head: () => ({
    meta: [
      { title: "Student Management · Syntax2Code" },
      {
        name: "description",
        content:
          "Filter students, manage class assignments, toggle activation and bulk upload rosters.",
      },
      { property: "og:title", content: "Student Management · Syntax2Code" },
      { property: "og:description", content: "Manage every enrolled student in one place." },
    ],
  }),
  component: SchoolStudents,
});

const tags = ["All", "On track", "Needs support", "Accelerated", "Low activity"] as const;

function SchoolStudents() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<(typeof tags)[number]>("All");
  const [cls, setCls] = useState("All classes");
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.active])),
  );
  const [bulk, setBulk] = useState(false);

  const list = students.filter(
    (s) =>
      (tag === "All" || s.tag === tag) &&
      (cls === "All classes" || s.className === cls) &&
      s.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Student Management"
        subtitle={`${students.length} students on the platform · 1,500 licensed seats`}
        actions={
          <>
            <button
              onClick={() => setBulk(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4" /> Bulk upload
            </button>
            <button
              onClick={() =>
                toast.success("Student list exported", { description: "students_greenfield.csv" })
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active accounts"
          value={Object.values(active).filter(Boolean).length}
          sub="Platform access enabled"
          tone="emerald"
        />
        <Stat
          label="Needs support"
          value={students.filter((s) => s.tag === "Needs support").length}
          sub="Flagged by teachers"
          tone="amber"
        />
        <Stat
          label="Accelerated"
          value={students.filter((s) => s.tag === "Accelerated").length}
          sub="Above 860 S2C score"
          tone="violet"
        />
        <Stat
          label="Low activity"
          value={students.filter((s) => s.tag === "Low activity").length}
          sub="Under 2 sessions/week"
          tone="rose"
        />
      </div>

      <Panel title="All students" description={`${list.length} results`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search students…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={cls}
            onChange={(e) => setCls(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
          >
            <option>All classes</option>
            {classes.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <FilterChips options={tags} value={tag} onChange={setTag} />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                {[
                  "Student",
                  "Class",
                  "S2C Score",
                  "Completion",
                  "Status",
                  "Last active",
                  "Access",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.className}</td>
                  <td className="px-4 py-3 text-slate-600">{s.score}</td>
                  <td className="px-4 py-3 text-slate-600">{s.completion}%</td>
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
                  <td className="px-4 py-3 text-slate-500">{s.lastActive}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setActive((a) => ({ ...a, [s.id]: !a[s.id] }));
                        toast(`${s.name} ${active[s.id] ? "deactivated" : "activated"}`);
                      }}
                      className={cn(
                        "h-5 w-9 rounded-full p-0.5 transition-colors",
                        active[s.id] ? "bg-emerald-500" : "bg-slate-200",
                      )}
                    >
                      <span
                        className={cn(
                          "block h-4 w-4 rounded-full bg-white transition-transform",
                          active[s.id] && "translate-x-4",
                        )}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {bulk && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setBulk(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Bulk upload students</h3>
            <p className="mt-1 text-xs text-slate-500">
              Upload a CSV with name, grade, section and guardian email.
            </p>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <Upload className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">Drop your CSV here or browse</p>
              <button
                onClick={() =>
                  toast.success("greenfield_grade8_roster.csv attached", {
                    description: "62 rows detected · 0 errors",
                  })
                }
                className="mt-3 h-9 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Choose file
              </button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setBulk(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBulk(false);
                  toast.success("62 students imported", {
                    description: "Accounts created and invites emailed to guardians.",
                  });
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Import students
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
