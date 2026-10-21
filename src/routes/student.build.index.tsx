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
  const [newTrack, setNewTrack] = useState("Fullstack Web");
  const [newDifficulty, setNewDifficulty] = useState("Intermediate");
  const [newBrief, setNewBrief] = useState("");
  const [newSkills, setNewSkills] = useState("React, JavaScript, CSS");
  const [milestones, setMilestones] = useState<string[]>([
    "Sprint 1: Scope, requirements & system architecture",
    "Sprint 2: Wireframing & database / API setup",
    "Sprint 3: Core feature development & business logic",
    "Sprint 4: Testing, edge case validation & demo walkthrough",
  ]);
  const [newMilestoneInput, setNewMilestoneInput] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const addMilestone = () => {
    if (!newMilestoneInput.trim()) return;
    setMilestones((prev) => [...prev, newMilestoneInput.trim()]);
    setNewMilestoneInput("");
  };

  const removeMilestone = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const list = projects.filter((p) => status === "All" || p.status === status);

  return (
    <>
      <PageHeader
        title="Build"
        subtitle="Real briefs, real milestones, real teacher feedback. Ship something you're proud of."
        actions={
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-sm">
                <Hammer className="h-4 w-4" /> Start new project
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Create New Project & Sprint Plan
                </DialogTitle>
              </DialogHeader>
              <div className="mt-3 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Project Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. AI Attendance System, Smart Eco Tracker, Personal Portfolio"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Category / Track</label>
                    <select
                      value={newTrack}
                      onChange={(e) => setNewTrack(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Fullstack Web">Fullstack Web</option>
                      <option value="Python Backend">Python Backend</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="Mobile App Dev">Mobile App Dev</option>
                      <option value="Game Development">Game Development</option>
                      <option value="Algorithms & Logic">Algorithms & Logic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Difficulty Scope</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Beginner">Beginner (100 XP)</option>
                      <option value="Intermediate">Intermediate (150 XP)</option>
                      <option value="Advanced">Advanced (200 XP)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Project Description & Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={newBrief}
                    onChange={(e) => setNewBrief(e.target.value)}
                    placeholder="Describe what your project aims to accomplish, its primary features, and the problem it solves..."
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Skills & Tech Stack
                  </label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="e.g. React, Node.js, Python, PostgreSQL, REST API"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Separate technologies with commas
                  </p>
                </div>

                {/* SPRINT PLANNER */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Sprint Plan & Milestones ({milestones.length})
                    </label>
                    <span className="text-[11px] text-emerald-600 font-medium">Customizable</span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs"
                      >
                        <span className="font-medium truncate">{m}</span>
                        <button
                          type="button"
                          onClick={() => removeMilestone(idx)}
                          className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                          title="Remove milestone"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      value={newMilestoneInput}
                      onChange={(e) => setNewMilestoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMilestone();
                        }
                      }}
                      placeholder="e.g. Sprint 5: Deploy to cloud & user testing"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <button
                  disabled={creatingProject}
                  onClick={async () => {
                    if (!newTitle.trim()) {
                      toast.error("Please enter a project title");
                      return;
                    }

                    setCreatingProject(true);
                    try {
                      const xpValue =
                        newDifficulty === "Advanced"
                          ? 200
                          : newDifficulty === "Intermediate"
                            ? 150
                            : 100;
                      const skillsArray = newSkills
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);

                      await submitProject({
                        data: {
                          title: newTitle.trim(),
                          brief:
                            newBrief.trim() ||
                            "Custom project created by student. Review milestones and project specifications in the sprint plan.",
                          track: newTrack,
                          difficulty: newDifficulty,
                          xp: xpValue,
                          skills:
                            skillsArray.length > 0 ? skillsArray : ["Architecture", "Development"],
                          milestones: milestones.map((title) => ({ title, done: false })),
                          submittedUrl: "",
                        },
                      });
                      toast.success("Project & Sprint Plan created!", {
                        description: `You can now start tracking '${newTitle}'.`,
                      });
                      setIsNewProjectOpen(false);
                      setNewTitle("");
                      setNewBrief("");
                      router.invalidate();
                    } catch (error) {
                      toast.error("Failed to create project");
                    } finally {
                      setCreatingProject(false);
                    }
                  }}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {creatingProject ? "Saving Sprint Plan..." : "Create Project & Sprint Plan"}
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
                className="rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
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
