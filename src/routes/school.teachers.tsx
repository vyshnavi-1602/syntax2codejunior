import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Award, BookOpen, Edit2, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import {
  getSchoolTeachersFn,
  createTeacherFn,
  toggleTeacherStatusFn,
  updateTeacherFn,
  deleteTeacherFn,
  assignTeacherTrainingFn,
} from "@/api/school.server";

export const Route = createFileRoute("/school/teachers")({
  head: () => ({
    meta: [
      { title: "Teacher Management · Syntax2Code" },
      {
        name: "description",
        content: "Manage faculty, class allocations, readiness scores and platform access.",
      },
      { property: "og:title", content: "Teacher Management · Syntax2Code" },
      { property: "og:description", content: "Faculty readiness and class allocation management." },
    ],
  }),
  loader: async () => {
    return await getSchoolTeachersFn();
  },
  component: SchoolTeachers,
});

const TRAINING_TRACKS = [
  {
    id: "python",
    name: "Python & AI Foundations",
    desc: "Object-oriented programming and basic neural nets for middle schoolers",
  },
  {
    id: "web",
    name: "Modern Web Development",
    desc: "Full-stack web fundamentals, responsive CSS, and browser APIs",
  },
  {
    id: "sandbox",
    name: "Sandbox Rubrics & Code Review",
    desc: "Grading automation, live terminal feedback, and project assessment",
  },
  {
    id: "ethics",
    name: "AI Ethics & Prompt Engineering",
    desc: "Responsible AI usage, student safety, and classroom moderation",
  },
];

function SchoolTeachers() {
  const router = useRouter();
  const { teachers, stats } = Route.useLoaderData();

  const [invite, setInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Computer Science & AI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Teacher modal state
  const [editingTeacher, setEditingTeacher] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  // Assign Training modal state
  const [trainingTeacher, setTrainingTeacher] = useState<(typeof teachers)[0] | null>(null);

  const handleToggleActive = async (teacherId: string, currentActive: boolean) => {
    try {
      await toggleTeacherStatusFn({ data: { teacherId, active: !currentActive } });
      toast.success(currentActive ? "Teacher deactivated" : "Teacher activated");
      router.invalidate();
    } catch {
      toast.error("Failed to update teacher status");
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${teacherName}"? Their assigned classes will be reallocated.`,
      )
    ) {
      return;
    }

    try {
      await deleteTeacherFn({ data: teacherId });
      toast.success(`${teacherName} removed from faculty`);
      router.invalidate();
    } catch {
      toast.error("Failed to remove teacher");
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editingTeacher.name.trim() || !editingTeacher.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTeacherFn({
        data: {
          teacherId: editingTeacher.id,
          name: editingTeacher.name.trim(),
          email: editingTeacher.email.trim(),
        },
      });
      toast.success("Teacher profile updated");
      setEditingTeacher(null);
      router.invalidate();
    } catch {
      toast.error("Failed to update teacher profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTraining = async (trackId: string, trackName: string) => {
    if (!trainingTeacher) return;
    try {
      await assignTeacherTrainingFn({
        data: {
          teacherId: trainingTeacher.id,
          trackId,
          trackName,
        },
      });
      toast.success(`Training assigned to ${trainingTeacher.name}`, {
        description: `Enrolled in "${trackName}" curriculum enablement track.`,
      });
      setTrainingTeacher(null);
      router.invalidate();
    } catch {
      toast.error("Failed to assign training track");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeacherFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
        },
      });
      toast.success("Teacher invited successfully", {
        description: `Account created for ${name} (${email}).`,
      });
      setInvite(false);
      setName("");
      setEmail("");
      router.invalidate();
    } catch {
      toast.error("Failed to invite teacher. Make sure email is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Teacher Management"
        subtitle={`${teachers.length} faculty members onboarded · ${stats.classesCovered} classes covered`}
        actions={
          <button
            onClick={() => setInvite(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" /> Invite teacher
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Faculty on platform"
          value={stats.total}
          sub={`${stats.active} active this week`}
          tone="sky"
        />
        <Stat
          label="Avg readiness"
          value={`${stats.avgReadiness}%`}
          sub="Target: 85%"
          tone="emerald"
        />
        <Stat
          label="Classes covered"
          value={stats.classesCovered}
          sub="Active curriculum sections"
          tone="violet"
        />
        <Stat
          label="Active faculty"
          value={stats.active}
          sub={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 100}% platform engagement`}
          tone="amber"
        />
      </div>

      <Panel
        title="Faculty Roster"
        description="Readiness is calculated based on training tracks, class activity, and project reviews"
      >
        <div className="space-y-3.5">
          {teachers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No teachers found.</p>
          ) : (
            teachers.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      {!t.active && <Pill tone="rose">Inactive</Pill>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {t.subject} · {t.students} students · {t.email}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {t.classes.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">
                          No classes assigned yet
                        </span>
                      ) : (
                        t.classes.map((c) => (
                          <Pill key={c} tone="sky">
                            {c}
                          </Pill>
                        ))
                      )}
                    </div>

                    {t.trainings && t.trainings.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">Enablement:</span>
                        {t.trainings.map((tr) => (
                          <span
                            key={tr.id}
                            className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50/70 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            {tr.trackName} ({tr.progressPercent}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-32 hidden sm:block">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                        <span>Readiness</span>
                        <span className="font-semibold text-slate-700">{t.readiness}%</span>
                      </div>
                      <Bar
                        value={t.readiness}
                        tone={
                          t.readiness >= 85 ? "emerald" : t.readiness >= 70 ? "indigo" : "amber"
                        }
                      />
                    </div>
                    <button
                      onClick={() => setTrainingTeacher(t)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                    >
                      Assign training
                    </button>
                    <button
                      onClick={() =>
                        setEditingTeacher({
                          id: t.id,
                          name: t.name,
                          email: t.email,
                        })
                      }
                      title="Edit teacher"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(t.id, t.name)}
                      title="Remove teacher"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      title={t.active ? "Deactivate teacher" : "Activate teacher"}
                      onClick={() => handleToggleActive(t.id, t.active)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out",
                        t.active ? "bg-emerald-500" : "bg-slate-300",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out",
                          t.active ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Invite Teacher Modal */}
      {invite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setInvite(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Invite Faculty Member</h3>
            <p className="mt-1 text-xs text-slate-500">
              They will receive platform access and can be assigned to classes.
            </p>
            <form onSubmit={handleInvite} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alistair Miller"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. miller@school.edu"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subject / Department
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Science & AI"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInvite(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setEditingTeacher(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Edit Faculty Member</h3>
            <p className="mt-1 text-xs text-slate-500">Update name or email address.</p>
            <form onSubmit={handleUpdateTeacher} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  required
                  type="email"
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
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

      {/* Assign Training Track Modal */}
      {trainingTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setTrainingTeacher(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Assign Curriculum Enablement</h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a specialized training track for {trainingTeacher.name} to boost readiness.
            </p>

            <div className="mt-4 space-y-2.5">
              {TRAINING_TRACKS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleAssignTraining(track.id, track.name)}
                  className="group flex cursor-pointer items-start justify-between rounded-xl border border-slate-200 p-3 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                      {track.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{track.desc}</p>
                  </div>
                  <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2 mt-0.5" />
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setTrainingTeacher(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
