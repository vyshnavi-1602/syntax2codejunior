import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Hammer, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  FilterChips,
  PageHeader,
  Panel,
  Pill,
  Stat,
  type Tone,
} from "@/client/components/app/primitives";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/client/components/ui/dialog";

import { getStudentProjectsFn, submitProject } from "@/api/student.server";

export const Route = createFileRoute("/student/build/")({
  head: () => ({
    meta: [
      { title: "Build · Projects · Syntax2Code" },
      {
        name: "description",
        content:
          "Browse project briefs, track milestones and submit your builds for teacher review.",
      },
      { property: "og:title", content: "Build · Projects · Syntax2Code" },
      {
        property: "og:description",
        content: "Project gallery with milestones and submission tracking.",
      },
    ],
  }),
  loader: async () => {
    return await getStudentProjectsFn();
  },
  component: BuildPage,
});

const statuses = [
  "All",
  "Not Started",
  "In Progress",
  "Submitted",
  "Needs Changes",
  "Approved",
  "Showcased",
] as const;

function BuildPage() {
  const router = useRouter();
  const projects = Route.useLoaderData();
  type ProjectStatus = (typeof projects)[0]["status"];

  const statusTone: Record<string, Tone> = {
    "Not Started": "slate",
    "In Progress": "amber",
    Submitted: "sky",
    "Needs Changes": "rose",
    Approved: "emerald",
    Showcased: "violet",
  };

  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("Python Text Adventure");

  const list = projects.filter((p) => status === "All" || p.status === status);

  return (
    <>
      <PageHeader
        title="Build"
        subtitle="Real briefs, real milestones, real teacher feedback. Ship something you're proud of."
        actions={
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
                <Hammer className="h-4 w-4" /> Start new project
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a new project</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Project Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. My Awesome Game"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Select a Brief</label>
                  <select
                    value={newBrief}
                    onChange={(e) => setNewBrief(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Python Text Adventure">Python Text Adventure</option>
                    <option value="HTML/CSS Portfolio">HTML/CSS Portfolio</option>
                    <option value="JavaScript Calculator">JavaScript Calculator</option>
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!newTitle.trim()) {
                      toast.error("Please enter a title");
                      return;
                    }

                    try {
                      await submitProject({
                        data: { title: newTitle, submittedUrl: "" },
                      });
                      toast.success("Project created!", {
                        description: `You can now start working on '${newTitle}'.`,
                      });
                      setIsNewProjectOpen(false);
                      setNewTitle("");
                      router.invalidate();
                    } catch (error) {
                      toast.error("Failed to create project");
                    }
                  }}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create Project
                </button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active projects" value="2" sub="1 awaiting review" tone="sky" />
        <Stat label="Approved" value="1" sub="Math Quiz Arcade" tone="emerald" />
        <Stat label="Showcased" value="1" sub="School gallery" tone="teal" />
        <Stat label="Project XP" value="430" sub="of 1,610 available" tone="violet" />
      </div>

      <div id="project-gallery">
        <Panel
          title="Project gallery"
          description="Filter by status to find what needs your attention"
        >
          <FilterChips options={statuses} value={status} onChange={setStatus} />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <Link
                key={p.id}
                to="/student/build/$projectId"
                params={{ projectId: p.id }}
                className="rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <Pill tone={statusTone[p.status as ProjectStatus] as Tone}>{p.status}</Pill>
                  <span className="text-xs text-slate-400">{p.xp} XP</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {p.brief}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  {p.track} · {p.difficulty} · updated {p.updated}
                </p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Showcase spotlight"
        description="Projects featured by Greenfield International School"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {projects
            .filter((p) => p.featured)
            .map((p) => (
              <div key={p.id} className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <p className="mt-2 text-sm font-semibold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500">
                  {p.student} · {p.className}
                </p>
              </div>
            ))}
        </div>
      </Panel>
    </>
  );
}
