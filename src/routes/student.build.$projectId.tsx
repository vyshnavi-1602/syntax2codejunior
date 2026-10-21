import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Clock, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill, type Tone } from "@/client/components/app/primitives";

const statusTone: Record<string, Tone> = {
  "Not Started": "slate",
  "In Progress": "sky",
  Submitted: "violet",
  "Needs Changes": "amber",
  Approved: "emerald",
  Showcased: "teal",
};
export type ProjectStatus = keyof typeof statusTone;
import { cn } from "@/client/lib/utils";
import { submitProject, getStudentProjectsFn } from "@/api/student.server";

export const Route = createFileRoute("/student/build/$projectId")({
  head: () => ({
    meta: [
      { title: "Project detail · Syntax2Code" },
      {
        name: "description",
        content: "Track project milestones, submit your work and read teacher feedback.",
      },
      { property: "og:title", content: "Project detail · Syntax2Code" },
      {
        property: "og:description",
        content: "Milestones, submission simulator and review status for your project.",
      },
    ],
  }),
  loader: async () => await getStudentProjectsFn(),
  component: ProjectDetail,
});

const flow: ProjectStatus[] = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Needs Changes",
  "Approved",
  "Showcased",
];

function ProjectDetail() {
  const { projectId } = useParams({ from: "/student/build/$projectId" });
  const projects = Route.useLoaderData();
  const defaultProject = {
    id: projectId || "1",
    title: "Custom Project",
    brief: "Custom project brief and requirements defined by student.",
    skills: ["Software Engineering", "Logic", "Sprint Planning"],
    track: "Software Development",
    difficulty: "Beginner",
    xp: 150,
    lessonId: 1,
    milestones: [
      { title: "Sprint 1: Scope, requirements & architecture", done: false },
      { title: "Sprint 2: UI wireframing & initial setup", done: false },
      { title: "Sprint 3: Core functionality & logic implementation", done: false },
      { title: "Sprint 4: Testing & demo walkthrough", done: false },
    ],
    status: "In Progress" as ProjectStatus,
    submittedUrl: "",
    mentorFeedback: null as string | null,
    mentorName: null as string | null,
  };
  const project = projects.find((p) => p.id === projectId) ?? projects[0] ?? defaultProject;
  const [milestones, setMilestones] = useState(project.milestones || []);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(
    (project.status as ProjectStatus) || "In Progress",
  );
  const [note, setNote] = useState((project as { submittedUrl?: string }).submittedUrl || "");

  const done = milestones.filter((m) => m.done).length;
  const pct = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;

  const toggleMilestone = async (idx: number) => {
    const updated = milestones.map((x, i) => (i === idx ? { ...x, done: !x.done } : x));
    setMilestones(updated);
    try {
      await submitProject({
        data: {
          projectId: project.id,
          title: project.title,
          milestones: updated,
        },
      });
      toast.success(
        updated[idx]?.done
          ? `Milestone completed: ${updated[idx]?.title}`
          : `Milestone marked incomplete`,
      );
    } catch {
      // fallback
    }
  };

  const addMilestone = async () => {
    if (!newMilestoneText.trim()) return;
    const updated = [...milestones, { title: newMilestoneText.trim(), done: false }];
    setMilestones(updated);
    setNewMilestoneText("");
    try {
      await submitProject({
        data: {
          projectId: project.id,
          title: project.title,
          milestones: updated,
        },
      });
      toast.success("Added new sprint milestone!");
    } catch {
      toast.error("Failed to save milestone");
    }
  };

  const removeMilestone = async (idx: number) => {
    const updated = milestones.filter((_, i) => i !== idx);
    setMilestones(updated);
    try {
      await submitProject({
        data: {
          projectId: project.id,
          title: project.title,
          milestones: updated,
        },
      });
      toast.info("Sprint milestone removed");
    } catch {
      // fallback
    }
  };

  return (
    <>
      <PageHeader
        title={project.title}
        subtitle={`${project.track} · ${project.difficulty} · ${project.xp} XP`}
        actions={
          <Link
            to="/student/build"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to gallery
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Project brief & goals"
            action={<Pill tone={statusTone[status] as Tone}>{status}</Pill>}
          >
            <p className="text-sm leading-relaxed text-slate-700">{project.brief}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {s}
                </span>
              ))}
            </div>
          </Panel>

          <Panel
            title="Sprint Plan & Milestones"
            description={`${done} of ${milestones.length} milestones complete`}
          >
            <Bar value={pct} tone="emerald" />
            <div className="mt-4 space-y-2">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                    m.done
                      ? "border-emerald-200 bg-emerald-50/50 text-slate-700"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <button
                    onClick={() => toggleMilestone(i)}
                    className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                  >
                    {m.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className={cn(m.done && "line-through text-slate-500")}>{m.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* ADD SPRINT GOAL */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMilestone();
                  }
                }}
                placeholder="+ Add another sprint milestone or deliverable..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addMilestone}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Task
              </button>
            </div>
          </Panel>

          <Panel
            title="Submit sprint work to mentor"
            description="Attach a repo link, deployment URL, or sprint demo notes"
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe what you completed in this sprint, link your GitHub repository or deployment link, and list any questions for your mentor..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    await submitProject({
                      data: {
                        projectId: project.id,
                        title: project.title,
                        submittedUrl: note,
                        status: "submitted",
                      },
                    });
                    setStatus("Submitted");
                    toast.success("Sprint submitted to mentor for review!", {
                      description: "Your teacher/mentor can now review your code and milestones.",
                    });
                  } catch (err) {
                    toast.error("Failed to submit sprint to mentor.");
                  }
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-sm"
              >
                <UploadCloud className="h-4 w-4" /> Submit to Mentor
              </button>
              <button
                onClick={async () => {
                  try {
                    await submitProject({
                      data: {
                        projectId: project.id,
                        title: project.title,
                        submittedUrl: note,
                      },
                    });
                    toast.success("Draft saved", {
                      description: "Your sprint notes have been saved.",
                    });
                  } catch {
                    toast.error("Failed to save draft");
                  }
                }}
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Save draft
              </button>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status tracker">
            <ol className="space-y-3">
              {flow.map((s) => {
                const current = s === status;
                const passed = flow.indexOf(s) < flow.indexOf(status);
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                        current
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold"
                          : passed
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : "border-slate-200 text-slate-400",
                      )}
                    >
                      {passed ? "✓" : flow.indexOf(s) + 1}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        current ? "font-semibold text-slate-900" : "text-slate-500",
                      )}
                    >
                      {s}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title="Mentor feedback" description="Review & sprint evaluation">
            {(project as { mentorFeedback?: string | null }).mentorFeedback ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Mentor Review Feedback
                </p>
                <p className="mt-2 text-slate-800 leading-relaxed font-medium">
                  "{(project as { mentorFeedback?: string }).mentorFeedback}"
                </p>
                {(project as { mentorName?: string | null }).mentorName && (
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">
                    — {(project as { mentorName?: string }).mentorName}
                  </p>
                )}
              </div>
            ) : status === "Submitted" ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-950">
                <p className="font-semibold flex items-center gap-1.5 text-sky-900">
                  <Clock className="h-4 w-4 text-sky-600" /> Awaiting Mentor Review
                </p>
                <p className="mt-1.5 leading-relaxed text-slate-600">
                  Your sprint submission is in your mentor's review queue. Their feedback and
                  assessment will appear here once reviewed.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Sprint in Progress</p>
                <p className="mt-1.5 leading-relaxed text-slate-500">
                  Complete your sprint milestones and submit your project below when you are ready
                  for your mentor to inspect your work.
                </p>
              </div>
            )}
            <button
              onClick={() =>
                toast("AI sprint mentor suggestion", {
                  description:
                    "Break your next milestone into smaller testable deliverables to maintain steady sprint velocity.",
                })
              }
              className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Get AI Sprint Hints
            </button>
          </Panel>
        </div>
      </div>
    </>
  );
}
