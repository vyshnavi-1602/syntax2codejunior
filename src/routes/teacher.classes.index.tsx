import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Bar, FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { getTeacherClassesFn, createClassFn } from "@/api/teacher.server";

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
  loader: async () => {
    return await getTeacherClassesFn();
  },
  component: ClassesPage,
});

const filters = ["My classes", "All classes", "Grade 6-7", "Grade 8-10"] as const;

function ClassesPage() {
  const router = useRouter();
  const classes = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("My classes");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    grade: "6",
    section: "A",
    room: "Lab 1",
  });

  const list = classes.filter((c) => {
    if (filter === "Grade 6-7" && c.grade) {
      const match = c.grade.match(/\d+/);
      return match ? parseInt(match[0]) <= 7 : true;
    }
    if (filter === "Grade 8-10" && c.grade) {
      const match = c.grade.match(/\d+/);
      return match ? parseInt(match[0]) >= 8 : true;
    }
    return true;
  });

  const handleCreateClass = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    setIsSubmitting(true);
    try {
      await createClassFn({
        data: {
          name: form.name,
          grade: form.grade,
          section: form.section,
          room: form.room,
        },
      });
      toast.success(`${form.name} created successfully!`);
      setOpen(false);
      setForm({ name: "", grade: "6", section: "A", room: "Lab 1" });
      router.invalidate();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Failed to create class", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My Classes"
        subtitle="Track curriculum completion, attendance and skill growth per section."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Class
            </button>
            <button
              onClick={() => {
                const headers = [
                  "Class Name",
                  "Grade",
                  "Section",
                  "Students",
                  "Completion %",
                  "Avg Score",
                  "Attendance %",
                ];
                const rows = list.map((c) => [
                  `"${c.name}"`,
                  `"${c.grade || ""}"`,
                  `"${c.section || ""}"`,
                  c.students,
                  c.completion,
                  c.avgScore,
                  c.attendance,
                ]);
                const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "class_performance.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success("Class report exported", {
                  description: "class_performance.csv",
                });
              }}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        }
      />
      <FilterChips options={filters} value={filter} onChange={setFilter} />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Link
            key={c.id}
            to="/teacher/classes/$classId"
            params={{ classId: c.id.toString() }}
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Create a New Class</h3>
            <p className="mt-1 text-xs text-slate-500">
              Set up a grade, section, and lab room for your students.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. Intro to Python - Section A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Grade</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {["5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Section</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {["A", "B", "C", "D"].map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Room / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Lab 1"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleCreateClass}
                className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
