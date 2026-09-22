import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, UploadCloud } from "lucide-react";
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
import { submitProject, getStudentProjectsFn } from "@/server/api/student";

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
  const project = (projects as any[]).find((p: any) => p.id === projectId) ?? (projects[0] as any);
  const [milestones, setMilestones] = useState(
    project?.milestones || [
      { title: "Understand requirements", done: true },
      { title: "Draft logic", done: false },
      { title: "Write code", done: false },
    ],
  );
  const [status, setStatus] = useState<ProjectStatus>(project?.status || "In Progress");
  const [note, setNote] = useState("");

  const done = milestones.filter((m) => m.done).length;
  const pct = Math.round((done / milestones.length) * 100);

  return (
    <>
      <PageHeader
        title={project.title}
        subtitle={`${project.track} · ${project.difficulty} · ${project.xp} XP`}
        actions={
          <Link
            to="/student/build"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to gallery
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Project brief"
            action={<Pill tone={statusTone[status] as Tone}>{status}</Pill>}
          >
            <p className="text-sm leading-relaxed text-slate-700">{project.brief}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                >
                  {s}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Milestones" description={`${done} of ${milestones.length} complete`}>
            <Bar value={pct} tone={pct === 100 ? "emerald" : "indigo"} />
            <div className="mt-4 space-y-2">
              {milestones.map((m, i) => (
                <button
                  key={m.title}
                  onClick={() => {
                    setMilestones((ms) =>
                      ms.map((x, xi) => (xi === i ? { ...x, done: !x.done } : x)),
                    );
                    if (!m.done) toast.success(`Milestone complete: ${m.title}`);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    m.done
                      ? "border-emerald-200 bg-emerald-50/50 text-slate-700"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  {m.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300" />
                  )}
                  {m.title}
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title="Submit your work"
            description="Attach a repo link, file or screenshot walkthrough"
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe what you built, what you learned and anything you need help with (or paste a link)..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    await submitProject({
                      data: {
                        lessonId: 1,
                        title: project.title,
                        submittedUrl: note,
                      },
                    });
                    setStatus("Submitted");
                    toast.success("Project submitted for review", {
                      description: "Your teacher will review it soon.",
                    });
                  } catch (err) {
                    toast.error("Failed to submit project.");
                  }
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <UploadCloud className="h-4 w-4" /> Submit for review
              </button>
              <button
                onClick={() =>
                  toast("Draft saved", { description: "You can continue editing any time." })
                }
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Save draft
              </button>
              <button
                onClick={() =>
                  toast("Files attached", { description: "attendance_bot.py, demo_screens.pdf" })
                }
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Attach files
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
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
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

          <Panel title="Teacher feedback" description="Latest review notes">
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs leading-relaxed text-slate-700">
              "Strong data model, Aarav. Add error handling when the class list file is missing, and
              include a short demo video with your final submission." — Ms. Priya Raman
            </div>
            <button
              onClick={() =>
                toast("AI feedback preview", {
                  description:
                    "Your report logic can be simplified with a dictionary lookup instead of nested ifs.",
                })
              }
              className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Get AI improvement hints
            </button>
          </Panel>
        </div>
      </div>
    </>
  );
}
