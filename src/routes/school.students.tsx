import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Edit2,
  Eye,
  FileText,
  Flame,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import {
  getSchoolStudentsFn,
  createStudentFn,
  bulkImportStudentsFn,
  toggleStudentStatusFn,
  assignStudentClassFn,
  updateStudentFn,
  deleteStudentFn,
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

  // Student Profile Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<(typeof students)[0] | null>(null);

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<{
    id: string;
    name: string;
    email: string;
    classId: string;
  } | null>(null);

  // New Student form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newClassId, setNewClassId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk upload state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkMode, setBulkMode] = useState<"file" | "paste">("file");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<
    Array<{ name: string; email: string; className?: string }>
  >([]);

  const processCsvFile = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      setBulkInput(text);
      const lines = text.trim().split("\n");
      const preview: Array<{ name: string; email: string; className?: string }> = [];
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (
          parts.length >= 2 &&
          parts[0] &&
          parts[1] &&
          !parts[1].toLowerCase().includes("email")
        ) {
          const item: { name: string; email: string; className?: string } = {
            name: parts[0],
            email: parts[1],
          };
          if (parts[2]) {
            item.className = parts[2];
          }
          preview.push(item);
        }
      }
      setParsedPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCsvFile(file);
  };

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

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${studentName}" from the school roster? This will permanently delete their account and achievements.`,
      )
    ) {
      return;
    }

    try {
      await deleteStudentFn({ data: studentId });
      toast.success(`${studentName} removed from school`);
      if (selectedStudent?.id === studentId) setSelectedStudent(null);
      router.invalidate();
    } catch (err) {
      console.error("Failed to remove student:", err);
      toast.error("Failed to remove student");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.name.trim() || !editingStudent.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStudentFn({
        data: {
          studentId: editingStudent.id,
          name: editingStudent.name.trim(),
          email: editingStudent.email.trim(),
          classId: editingStudent.classId ? Number(editingStudent.classId) : null,
        },
      });
      toast.success("Student profile updated");
      setEditingStudent(null);
      router.invalidate();
    } catch {
      toast.error("Failed to update student profile");
    } finally {
      setIsSubmitting(false);
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
    const headers = [
      "Name",
      "Email",
      "Class",
      "S2C Score",
      "Level",
      "Streak",
      "Completion",
      "Status",
      "Active",
      "Enrolled Date",
    ];
    const rows = list.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.className}"`,
      s.score,
      s.level,
      `${s.streak} days`,
      `${s.completion}%`,
      `"${s.tag}"`,
      s.active ? "Yes" : "No",
      `"${s.enrolledDate}"`,
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
                  "Actions",
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
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="text-left font-medium text-slate-900 hover:text-indigo-600 transition"
                      >
                        {s.name}
                      </button>
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
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div>{s.score} XP</div>
                      <div className="text-[11px] text-slate-400">Level {s.level}</div>
                    </td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          title="View student profile"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setEditingStudent({
                              id: s.id,
                              name: s.name,
                              email: s.email,
                              classId: s.classId ? String(s.classId) : "",
                            })
                          }
                          title="Edit student"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          title="Remove student"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Bulk Upload Students</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Import class rosters rapidly via CSV spreadsheet or manual paste.
                </p>
              </div>
            </div>

            {/* Mode switch */}
            <div className="mt-4 flex gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setBulkMode("file")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  bulkMode === "file"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Drag & Drop CSV
              </button>
              <button
                type="button"
                onClick={() => setBulkMode("paste")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  bulkMode === "paste"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Edit2 className="h-3.5 w-3.5" /> Paste Text
              </button>
            </div>

            {bulkMode === "file" ? (
              <div className="mt-4">
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) processCsvFile(file);
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer"
                >
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-800">
                    Click to browse or drop your CSV file here
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Supports .csv with columns: Name, Email, Class (optional)
                  </p>
                </label>

                {uploadedFile && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-900">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            {parsedPreview.length} student records recognized
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setParsedPreview([]);
                          setBulkInput("");
                        }}
                        className="text-[11px] font-medium text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    {parsedPreview.length > 0 && (
                      <div className="mt-2.5 max-h-32 overflow-y-auto rounded-lg border border-emerald-100 bg-white p-2">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400">
                              <th className="pb-1 font-semibold">Name</th>
                              <th className="pb-1 font-semibold">Email</th>
                              <th className="pb-1 font-semibold">Class</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-600">
                            {parsedPreview.slice(0, 4).map((p, idx) => (
                              <tr key={idx}>
                                <td className="py-1 font-medium text-slate-800">{p.name}</td>
                                <td className="py-1">{p.email}</td>
                                <td className="py-1 text-slate-500">{p.className || "Default"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedPreview.length > 4 && (
                          <p className="mt-1 text-center text-[10px] text-slate-400">
                            + {parsedPreview.length - 4} more students...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <textarea
                  rows={5}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Lucas Gray, lucas.g@school.edu, Grade 6A - Python Explorers&#10;Sophia Lin, sophia.l@school.edu, Grade 7B - Web Foundations"
                  className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-indigo-400"
                />
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
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setBulk(false);
                  setUploadedFile(null);
                  setParsedPreview([]);
                }}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !bulkInput.trim()}
                onClick={handleBulkImport}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" /> Import{" "}
                {parsedPreview.length > 0 ? `${parsedPreview.length} Students` : "Roster"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
              </div>
              <Pill
                tone={
                  selectedStudent.tag === "Needs support"
                    ? "rose"
                    : selectedStudent.tag === "Accelerated"
                      ? "emerald"
                      : selectedStudent.tag === "Low activity"
                        ? "amber"
                        : "sky"
                }
              >
                {selectedStudent.tag}
              </Pill>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase">XP Score</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedStudent.score} XP</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase">Level</p>
                <p className="mt-1 text-lg font-bold text-indigo-600">
                  Level {selectedStudent.level}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase">Coding Streak</p>
                <p className="mt-1 text-lg font-bold text-amber-600">
                  {selectedStudent.streak} days
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase">Completion</p>
                <p className="mt-1 text-lg font-bold text-emerald-600">
                  {selectedStudent.completion}%
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Assigned Class</span>
                <span className="font-semibold text-slate-800">{selectedStudent.className}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Account Access</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.active ? "Enabled" : "Deactivated"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Enrolled Date</span>
                <span className="font-semibold text-slate-800">{selectedStudent.enrolledDate}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => handleDeleteStudent(selectedStudent.id, selectedStudent.name)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove Student
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent({
                      id: selectedStudent.id,
                      name: selectedStudent.name,
                      email: selectedStudent.email,
                      classId: selectedStudent.classId ? String(selectedStudent.classId) : "",
                    });
                    setSelectedStudent(null);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setEditingStudent(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Edit Student Record</h3>
            <p className="mt-1 text-xs text-slate-500">
              Update student roster information and classroom section.
            </p>
            <form onSubmit={handleUpdateStudent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  required
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Class Section</label>
                <select
                  value={editingStudent.classId}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, classId: e.target.value })
                  }
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
                  onClick={() => setEditingStudent(null)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
