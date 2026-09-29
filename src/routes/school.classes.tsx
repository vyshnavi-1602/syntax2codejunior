import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Edit2, GraduationCap, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Pill } from "@/client/components/app/primitives";
import {
  getSchoolClassesFn,
  createClassFn,
  updateClassFn,
  deleteClassFn,
  promoteClassRosterFn,
} from "@/api/school.server";

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
  loader: async () => {
    return await getSchoolClassesFn();
  },
  component: SchoolClasses,
});

function SchoolClasses() {
  const router = useRouter();
  const { classes, teachers } = Route.useLoaderData();

  const [open, setOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{
    id: string;
    name: string;
    grade: string;
    section: string;
    teacherId: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    grade: "6",
    section: "A",
    teacherId: teachers[0]?.id || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rollover / Promotion modal state
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [rolloverSource, setRolloverSource] = useState<string>(classes[0]?.id ? String(classes[0].id) : "");
  const [rolloverTarget, setRolloverTarget] = useState<string>(classes[1]?.id ? String(classes[1].id) : "");
  const [rolloverMode, setRolloverMode] = useState<"transfer" | "graduate">("transfer");

  const handleRollover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolloverSource) {
      toast.error("Please select a source class.");
      return;
    }
    if (rolloverMode === "transfer" && !rolloverTarget) {
      toast.error("Please select a target destination class.");
      return;
    }
    if (rolloverMode === "transfer" && rolloverSource === rolloverTarget) {
      toast.error("Target class must be different from source class.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await promoteClassRosterFn({
        data: {
          sourceClassId: Number(rolloverSource),
          targetClassId: rolloverMode === "transfer" ? Number(rolloverTarget) : null,
          mode: rolloverMode,
        },
      });
      toast.success(
        rolloverMode === "transfer"
          ? `Successfully promoted ${res.count} students to new class!`
          : `Graduated/Archived ${res.count} students from class!`,
      );
      setRolloverOpen(false);
      router.invalidate();
    } catch {
      toast.error("Failed to complete class rollover.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherId) {
      toast.error("Please select an assigned teacher");
      return;
    }

    setIsSubmitting(true);
    try {
      const className = form.name.trim() || `Grade ${form.grade}${form.section} - Computer Science`;
      await createClassFn({
        data: {
          name: className,
          grade: form.grade,
          section: form.section,
          teacherId: form.teacherId,
        },
      });
      toast.success("Class section created", { description: className });
      setOpen(false);
      setForm({ name: "", grade: "6", section: "A", teacherId: teachers[0]?.id || "" });
      router.invalidate();
    } catch {
      toast.error("Failed to create class section");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setIsSubmitting(true);
    try {
      await updateClassFn({
        data: {
          classId: Number(editingClass.id),
          name: editingClass.name,
          grade: editingClass.grade,
          section: editingClass.section,
          teacherId: editingClass.teacherId,
        },
      });
      toast.success("Class updated successfully");
      setEditingClass(null);
      router.invalidate();
    } catch {
      toast.error("Failed to update class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (classId: string, className: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${className}"? Enrolled students will be unassigned.`,
      )
    ) {
      return;
    }
    try {
      await deleteClassFn({ data: Number(classId) });
      toast.success(`Class ${className} deleted`);
      router.invalidate();
    } catch {
      toast.error("Failed to delete class");
    }
  };

  return (
    <>
      <PageHeader
        title="Class Management"
        subtitle={`${classes.length} active class sections with assigned faculty`}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setRolloverOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Promote & Rollover
            </button>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" /> Add class section
            </button>
          </div>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No classes configured yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Click "Add class section" to create your first class.
            </p>
          </div>
        ) : (
          classes.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Grade {c.grade} · Section {c.section} · {c.room}
                    </p>
                  </div>
                  <Pill
                    tone={c.completion >= 80 ? "emerald" : c.completion >= 65 ? "sky" : "amber"}
                  >
                    {c.completion}%
                  </Pill>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Faculty In-charge:</span>
                    <span className="font-semibold text-slate-800">{c.teacher}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Enrolled Students:</span>
                    <span className="font-semibold text-slate-800">{c.students} students</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                    <span>Curriculum Completion</span>
                    <span className="font-medium text-slate-700">{c.completion}%</span>
                  </div>
                  <Bar value={c.completion} tone={c.completion >= 80 ? "emerald" : "indigo"} />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  to="/school/students"
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" /> View roster
                </Link>
                <button
                  onClick={() =>
                    setEditingClass({
                      id: c.id,
                      name: c.name,
                      grade: String(c.grade),
                      section: c.section,
                      teacherId: c.teacherId,
                    })
                  }
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
                  title="Edit class"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-600 shadow-2xs hover:bg-rose-50"
                  title="Delete class"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Class Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Add Class Section</h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a section and assign a faculty mentor to guide students.
            </p>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Class Name (Optional)
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Grade 6A - Python Explorers"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Grade</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                  >
                    {["5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Section</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                  >
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Assigned Teacher
                </label>
                <select
                  required
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setEditingClass(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Edit Class Section</h3>
            <form onSubmit={handleUpdate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Class Name</label>
                <input
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Grade</label>
                  <select
                    value={editingClass.grade}
                    onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                  >
                    {["5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Section</label>
                  <select
                    value={editingClass.section}
                    onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                  >
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Assigned Teacher
                </label>
                <select
                  required
                  value={editingClass.teacherId}
                  onChange={(e) => setEditingClass({ ...editingClass, teacherId: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Promotion & Semester Rollover Modal */}
      {rolloverOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setRolloverOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Academic Promotion & Rollover
                </h3>
                <p className="text-xs text-slate-500">
                  Advance student rosters to the next grade or semester.
                </p>
              </div>
            </div>

            <form onSubmit={handleRollover} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Promotion Mode
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRolloverMode("transfer")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition",
                      rolloverMode === "transfer"
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> Next Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setRolloverMode("graduate")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition",
                      rolloverMode === "graduate"
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Graduate Cohort
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Current Source Class
                </label>
                <select
                  required
                  value={rolloverSource}
                  onChange={(e) => setRolloverSource(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Select source class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.students} students)
                    </option>
                  ))}
                </select>
              </div>

              {rolloverMode === "transfer" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Destination Class
                  </label>
                  <select
                    required
                    value={rolloverTarget}
                    onChange={(e) => setRolloverTarget(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="">Select destination class</option>
                    {classes
                      .filter((c) => String(c.id) !== rolloverSource)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Students will be moved to the target section while retaining XP and stats.
                  </p>
                </div>
              )}

              {rolloverMode === "graduate" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                  Enrolled students will be marked as alumni/graduated and unassigned from active
                  rosters while preserving their projects, XP, and certificates.
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRolloverOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <GraduationCap className="h-4 w-4" /> Execute Rollover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
