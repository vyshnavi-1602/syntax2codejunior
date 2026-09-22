import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill } from "@/client/components/app/primitives";

const seedClasses: any = [];
const teachers: any = [];

export const Route = createFileRoute("/school/classes")({
  head: () => ({
    meta: [
      { title: "Class Management · Syntax2Code" },
      {
        name: "description",
        content: "Configure grades and sections, assign faculty and track section-level progress.",
      },
      { property: "og:title", content: "Class Management · Syntax2Code" },
      { property: "og:description", content: "Grade and section configuration for your school." },
    ],
  }),
  component: SchoolClasses,
});

function SchoolClasses() {
  const [list, setList] = useState(seedClasses);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    grade: "6",
    section: "B",
    teacher: teachers[0]!.name,
    room: "Lab 2",
  });

  return (
    <>
      <PageHeader
        title="Class Management"
        subtitle="Grade and section configuration with faculty allocation"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add class
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-slate-900">{c.name}</h3>
              <Pill tone={c.completion >= 80 ? "emerald" : c.completion >= 65 ? "sky" : "amber"}>
                {c.completion}%
              </Pill>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {c.teacher} · {c.room} · {c.students} students
            </p>
            <div className="mt-4">
              <Bar value={c.completion} tone={c.completion >= 80 ? "emerald" : "indigo"} />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toast.success(`Faculty reassignment opened for ${c.name}`)}
                className="h-9 flex-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reassign teacher
              </button>
              <button
                onClick={() =>
                  toast(`${c.name} roster`, {
                    description: `${c.students} students · attendance ${c.attendance}%`,
                  })
                }
                className="h-9 flex-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View roster
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Add a class</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {["6", "7", "8", "9", "10", "11"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {["A", "B", "C", "D"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2"
              >
                {teachers.map((t) => (
                  <option key={t.id}>{t.name}</option>
                ))}
              </select>
              <input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="Room"
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = `Grade ${form.grade}${form.section}`;
                  setList((l) => [
                    ...l,
                    {
                      id: name.toLowerCase().replace(/\s/g, "-"),
                      name,
                      grade: Number(form.grade),
                      section: form.section,
                      teacher: form.teacher,
                      students: 0,
                      completion: 0,
                      avgScore: 0,
                      attendance: 0,
                      room: form.room,
                    },
                  ]);
                  setOpen(false);
                  toast.success(`${name} created`, {
                    description: `${form.teacher} · ${form.room}`,
                  });
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create class
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
