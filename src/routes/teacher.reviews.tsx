import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, type Tone } from "@/client/components/app/primitives";

import { cn } from "@/client/lib/utils";
import { getPendingProjectsFn, gradeProjectFn } from "@/api/teacher.server";

export const Route = createFileRoute("/teacher/reviews")({
  head: () => ({
    meta: [
      { title: "Project Review Hub · Syntax2Code" },
      {
        name: "description",
        content: "Approve projects, request changes, preview AI feedback and feature student work.",
      },
    ],
  }),
  loader: async () => {
    const pendingProjects = await getPendingProjectsFn();
    return { pendingProjects };
  },
  component: ReviewsPage,
});

function ReviewsPage() {
  const { pendingProjects } = Route.useLoaderData();

  const [activeId, setActiveId] = useState(pendingProjects[0]?.project.id ?? null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(pendingProjects.map((p) => [p.project.id, p.project.status])),
  );
  const [featured, setFeatured] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");

  const activeItem = pendingProjects.find((p) => p.project.id === activeId);

  const handleGrade = async (status: "approved" | "needs_changes") => {
    if (!activeItem) return;

    try {
      await gradeProjectFn({
        data: {
          projectId: activeItem.project.id,
          status,
          feedback: feedback || "Reviewed by teacher.",
        },
      });

      setStatuses((m) => ({ ...m, [activeItem.project.id]: status }));
      toast.success(`${activeItem.project.title} → ${status}`, {
        description: `${activeItem.student.name} has been notified.`,
      });
    } catch (e: unknown) {
      toast.error("Failed to submit grade", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  if (!pendingProjects.length) {
    return (
      <>
        <PageHeader
          title="Project Review Hub"
          subtitle="Give fast, specific feedback — and celebrate the best work."
        />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No pending projects to review! 🎉</p>
        </div>
      </>
    );
  }

  const activeProject = activeItem!.project;
  const activeStudent = activeItem!.student;

  return (
    <>
      <PageHeader
        title="Project Review Hub"
        subtitle="Give fast, specific feedback — and celebrate the best work."
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Panel
          title="Review queue"
          description={`${pendingProjects.length} awaiting action`}
          bodyClassName="p-2"
        >
          {pendingProjects.map((p) => {
            const currentStatus = statuses[p.project.id] || p.project.status;
            return (
              <button
                key={p.project.id}
                onClick={() => setActiveId(p.project.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-3 text-left transition-colors",
                  activeId === p.project.id ? "bg-indigo-50" : "hover:bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{p.project.title}</p>
                  <Pill
                    tone={
                      currentStatus === "approved"
                        ? "emerald"
                        : currentStatus === "needs_changes"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {currentStatus}
                  </Pill>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {p.student.name} · Submitted {new Date(p.project.updatedAt).toLocaleDateString()}
                </p>
              </button>
            );
          })}
        </Panel>

        <div className="space-y-6">
          <Panel
            title={activeProject.title}
            description={`${activeStudent.name} · Project`}
            action={
              <Pill
                tone={
                  statuses[activeProject.id] === "approved"
                    ? "emerald"
                    : statuses[activeProject.id] === "needs_changes"
                      ? "amber"
                      : "slate"
                }
              >
                {statuses[activeProject.id] || activeProject.status}
              </Pill>
            }
          >
            <p className="text-sm leading-relaxed text-slate-700">
              {activeProject.submittedUrl ? (
                <a
                  href={activeProject.submittedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View Submitted Work
                </a>
              ) : (
                "No URL provided."
              )}
            </p>

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" /> AI feedback preview
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Code structure looks good! Consider adding more comments explaining the logic.
              </p>
              <button
                onClick={() => {
                  setFeedback(
                    "Great structure! Next: consider adding more comments explaining the logic.",
                  );
                  toast.success("AI feedback inserted into your note");
                }}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Use this as my feedback
              </button>
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Write feedback for the student…"
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleGrade("approved")}
                className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                disabled={statuses[activeProject.id] !== "pending"}
              >
                Approve project
              </button>
              <button
                onClick={() => handleGrade("needs_changes")}
                className="h-10 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                disabled={statuses[activeProject.id] !== "pending"}
              >
                Request changes
              </button>
              <button
                onClick={() => {
                  const on = featured.includes(activeProject.id);
                  setFeatured((f) =>
                    on ? f.filter((x) => x !== activeProject.id) : [...f, activeProject.id],
                  );
                  toast(on ? "Removed from showcase" : "Added to showcase");
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
                  featured.includes(activeProject.id)
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                <Star className="h-4 w-4" />{" "}
                {featured.includes(activeProject.id) ? "Featured" : "Feature project"}
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
