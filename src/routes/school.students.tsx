import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import {
  getSchoolStudentsFn,
  createStudentFn,
  bulkImportStudentsFn,
  toggleStudentStatusFn,
  assignStudentClassFn,
} from "@/api/school.server";

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
  loader: async () => {
    return await getSchoolStudentsFn();
  },
  component: SchoolStudents,
});

const tags = ["All", "On track", "Needs support", "Accelerated", "Low activity"] as const;

function SchoolStudents() {
  const router = useRouter();
  const { students, classes, stats } = Route.useLoaderData();

  const [q, setQ] = useState("");
  const [tag, setTag] = useState<(typeof tags)[number]>("All");
  const [cls, setCls] = useState("All classes");
  const [bulk, setBulk] = useState(false);
  const [addModal, setAddModal] = useState(false);

  // New Student form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newClassId, setNewClassId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk paste state
  const [bulkInput, setBulkInput] = useState("");

  const list = students.filter(
    (s) =>
      (tag === "All" || s.tag === tag) &&
      (cls === "All classes" || s.className === cls) &&
      (s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.email.toLowerCase().includes(q.toLowerCase())),
  );

  const handleToggleActive = async (studentId: string, currentActive: boolean) => {
    try {
      await toggleStudentStatusFn({ data: { studentId, active: !currentActive } });
      toast.success(currentActive ? "Student access deactivated" : "Student access activated");
      router.invalidate();
    } catch {
      toast.error("Failed to update student status");
    }
  };

  const handleAssignClass = async (studentId: string, classIdStr: string) => {
    try {
      const classId = classIdStr ? Number(classIdStr) : null;
      await assignStudentClassFn({ data: { studentId, classId } });
      toast.success("Class updated successfully");
      router.invalidate();
    } catch {
      toast.error("Failed to reassign class");
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudentFn({
        data: {
          name: newName.trim(),
          email: newEmail.trim(),
          classId: newClassId ? Number(newClassId) : null,
        },
      });
      toast.success("Student enrolled successfully", {
        description: `${newName} has been added to the school roster.`,
      });
      setAddModal(false);
      setNewName("");
      setNewEmail("");
      setNewClassId("");
      router.invalidate();
    } catch {
      toast.error("Failed to enroll student. Ensure email is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) {
      toast.error("Please enter or paste student roster data.");
      return;
    }

    setIsSubmitting(true);
    try {
      const lines = bulkInput.trim().split("\n");
      const parsedData: Array<{ name: string; email: string; className?: string }> = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          const item: { name: string; email: string; className?: string } = {
            name: parts[0] || "",
            email: parts[1] || "",
          };
          if (parts[2]) {
            item.className = parts[2];
          }
          parsedData.push(item);
        }
      }

      if (parsedData.length === 0) {
        toast.error("No valid student rows found. Expected format: Name, Email, Class (optional)");
        setIsSubmitting(false);
        return;
      }

      const res = await bulkImportStudentsFn({ data: parsedData });
      toast.success(`${res.count} students imported successfully!`);
      setBulk(false);
      setBulkInput("");
      router.invalidate();
    } catch {
      toast.error("Failed to import roster. Please check format.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Class", "S2C Score", "Completion", "Status", "Active"];
    const rows = list.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.className}"`,
      s.score,
      `${s.completion}%`,
      `"${s.tag}"`,
      s.active ? "Yes" : "No",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `school_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Roster exported successfully!");
  };

  return (
    <>
      <PageHeader
        title="Student Management"
        subtitle={`${students.length} students enrolled · 1,500 licensed seats`}
        actions={
          <>
            <button
              onClick={() => setAddModal(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" /> Add student
            </button>
            <button
              onClick={() => setBulk(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" /> Bulk upload
            </button>
            <button
              onClick={exportCsv}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50"
            >
              Export CSV
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active accounts"
          value={students.filter((s) => s.active).length}
          sub="Platform access enabled"
          tone="emerald"
        />
        <Stat label="On track" value={stats.onTrack} sub="Consistent coding progress" tone="sky" />
        <Stat
          label="Accelerated"
          value={stats.accelerated}
          sub="Advanced project builders"
          tone="violet"
        />
        <Stat
          label="Needs support"
          value={stats.needsSupport}
          sub="Flagged for mentor review"
          tone="amber"
        />
      </div>

      <Panel title="Enrolled students" description={`${list.length} results found`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by student name or email…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={cls}
            onChange={(e) => setCls(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300"
          >
            <option>All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <FilterChips options={tags} value={tag} onChange={setTag} />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[50rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
              <tr>
                {[
                  "Student",
                  "Class Allocation",
                  "S2C Score",
                  "Curriculum",
                  "Status",
                  "Activity",
                  "Access",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.classId ? String(s.classId) : ""}
                        onChange={(e) => handleAssignClass(s.id, e.target.value)}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-400"
                      >
                        <option value="">Unassigned</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.score} XP</td>
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
                    <td className="px-4 py-3 text-xs text-slate-500">{s.lastActive}</td>
                    <td className="px-4 py-3">
                      <button
                        title={s.active ? "Deactivate student account" : "Activate student account"}
                        onClick={() => handleToggleActive(s.id, s.active)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out",
                          s.active ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out",
                            s.active ? "translate-x-4" : "translate-x-0",
                          )}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Add Single Student Modal */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Add New Student</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enroll a student into your school and assign them to an active class.
            </p>
            <form onSubmit={handleCreateStudent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Student / Guardian Email
                </label>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. rachel@school.edu"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Class Section</label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Unassigned</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {bulk && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setBulk(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Bulk Upload Students</h3>
            <p className="mt-1 text-xs text-slate-500">
              Paste CSV roster lines in the format:{" "}
              <code className="rounded-sm bg-slate-100 px-1 py-0.5">
                Name, Email, Class Name (optional)
              </code>
            </p>

            <div className="mt-4">
              <textarea
                rows={6}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Lucas Gray, lucas.g@school.edu, Grade 6A - Python Explorers&#10;Sophia Lin, sophia.l@school.edu, Grade 7B - Web Foundations"
                className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>One student per line</span>
              <button
                type="button"
                onClick={() =>
                  setBulkInput(
                    "Lucas Gray, lucas.g@school.edu, Grade 6A - Python Explorers\nSophia Lin, sophia.l@school.edu, Grade 7B - Web Foundations\nDavid Kim, david.k@school.edu, Grade 8A - Algorithms & Logic",
                  )
                }
                className="font-medium text-indigo-600 hover:underline"
              >
                Insert sample roster
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBulk(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBulkImport}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" /> Import Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
