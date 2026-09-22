import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";

import { getAdminCurriculumFn } from "@/server/api/admin";

export const Route = createFileRoute("/admin/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum CMS · Syntax2Code Platform" },
      {
        name: "description",
        content: "Author and publish learning paths, modules, lessons and practice activities.",
      },
      { property: "og:title", content: "Curriculum CMS · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "The content builder behind every Syntax2Code learning path.",
      },
    ],
  }),
  loader: async () => {
    return await getAdminCurriculumFn();
  },
  component: AdminCurriculum,
});

const tabs = ["Learning paths", "Practice activities"] as const;

type Draft = {
  id: string;
  title: string;
  kind: "Module" | "Lesson";
  parent: string;
  status: string;
};

function AdminCurriculum() {
  const { learningPaths, practiceItems } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Learning paths");
  const [pathId, setPathId] = useState(learningPaths[0]?.id || "");
  const [openModule, setOpenModule] = useState<string | null>(
    learningPaths[0]?.modules?.[0]?.id ?? null,
  );
  const [archived, setArchived] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [modal, setModal] = useState<null | "path" | "module" | "lesson">(null);
  const [title, setTitle] = useState("");

  const path = learningPaths.find((p: { id: string }) => p.id === pathId) || learningPaths[0];
  if (!path) return null;

  const create = () => {
    const t = title || `Untitled ${modal}`;
    if (modal === "path") toast.success(`Learning path "${t}" created as draft`);
    else
      setDrafts((d) => [
        ...d,
        {
          id: `d-${Date.now()}`,
          title: t,
          kind: modal === "module" ? "Module" : "Lesson",
          parent: path.title,
          status: "Draft",
        },
      ]);
    if (modal !== "path")
      toast.success(`${modal === "module" ? "Module" : "Lesson"} "${t}" added to ${path.title}`);
    setModal(null);
    setTitle("");
  };

  return (
    <>
      <PageHeader
        title="Curriculum CMS"
        subtitle="Author, version and publish every piece of Syntax2Code content"
        actions={
          <>
            <button
              onClick={() => setModal("path")}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> New learning path
            </button>
            <button
              onClick={() => toast.success("Curriculum v3.4 published to 148 schools")}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Publish changes
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Learning paths"
          value={learningPaths.length}
          sub="Live across the platform"
          tone="violet"
        />
        <Stat
          label="Modules"
          value={learningPaths.reduce((n, p) => n + p.modules.length, 0)}
          sub="Grade 6 to 10"
          tone="sky"
        />
        <Stat
          label="Lessons"
          value={learningPaths.reduce(
            (n, p) => n + p.modules.reduce((m, x) => m + x.lessons.length, 0),
            0,
          )}
          sub="With interactive checks"
          tone="emerald"
        />
        <Stat label="Drafts pending" value={drafts.length + 1} sub="Awaiting review" tone="amber" />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Learning paths" && (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Panel title="Paths" description="Select to edit">
            <div className="space-y-1.5">
              {learningPaths.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPathId(p.id);
                    setOpenModule(p.modules[0]?.id ?? null);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    pathId === p.id
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span className="truncate">{p.title}</span>
                  {archived.includes(p.id) ? (
                    <Pill tone="slate">Archived</Pill>
                  ) : (
                    <Pill tone="emerald">Live</Pill>
                  )}
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title={path.title}
            description={`${path.tagline} · ${path.level}`}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setModal("module")}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Add module
                </button>
                <button
                  onClick={() => {
                    setArchived((a) =>
                      a.includes(path.id) ? a.filter((x) => x !== path.id) : [...a, path.id],
                    );
                    toast(
                      archived.includes(path.id)
                        ? `${path.title} restored`
                        : `${path.title} archived`,
                    );
                  }}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {archived.includes(path.id) ? "Restore" : "Archive"}
                </button>
              </div>
            }
          >
            <div className="space-y-2.5">
              {path.modules.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setOpenModule(openModule === m.id ? null : m.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                      <p className="text-xs text-slate-500">
                        {m.description} · {m.lessons.length} lessons
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                        openModule === m.id && "rotate-90",
                      )}
                    />
                  </button>
                  {openModule === m.id && (
                    <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/50 p-3">
                      {m.lessons.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-slate-800">{l.title}</p>
                            <p className="text-xs text-slate-500">
                              {l.minutes} min · {l.takeaways.length} takeaways · 1 check
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              onClick={() =>
                                toast.success(`Editing "${l.title}"`, {
                                  description:
                                    "Lesson editor opened with content, takeaways and the check.",
                                })
                              }
                              className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                toast(`"${l.title}" archived`, {
                                  description: "Hidden from new cohorts.",
                                })
                              }
                              className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      ))}
                      {drafts
                        .filter((d) => d.kind === "Lesson" && d.parent === path.title)
                        .map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5"
                          >
                            <p className="text-sm text-slate-800">{d.title}</p>
                            <Pill tone="amber">Draft</Pill>
                          </div>
                        ))}
                      <button
                        onClick={() => setModal("lesson")}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add lesson
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {drafts
                .filter((d) => d.kind === "Module" && d.parent === path.title)
                .map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{d.title}</p>
                    <Pill tone="amber">Draft module</Pill>
                  </div>
                ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "Practice activities" && (
        <Panel
          title="Practice activity library"
          description="Quizzes, coding, debugging and logic challenges"
          action={
            <button
              onClick={() => toast.success("New practice activity created as draft")}
              className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              New activity
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  {["Activity", "Type", "Difficulty", "XP", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {practiceItems.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                    <td className="px-4 py-3">
                      <Pill tone="sky">{p.type}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <Pill
                        tone={
                          p.difficulty === "Hard"
                            ? "rose"
                            : p.difficulty === "Medium"
                              ? "amber"
                              : "emerald"
                        }
                      >
                        {p.difficulty}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.xp} XP</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toast.success(`Editing "${p.title}"`)}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toast(`"${p.title}" archived`)}
                          className="text-xs font-medium text-slate-500 hover:underline"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">
              New {modal === "path" ? "learning path" : modal === "module" ? "module" : "lesson"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {modal === "path" ? "Starts as a draft until published." : `Added to ${path.title}.`}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={create}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
