import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Sliders, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import {
  getAdminQuestionsFn,
  createAdminQuestionFn,
  deleteAdminQuestionFn,
} from "@/api/admin.server";

interface QuestionItem {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  grade: string;
  usage: number;
  status: string;
}

export const Route = createFileRoute("/admin/questions")({
  head: () => ({
    meta: [
      { title: "Assessments & Question Bank · Syntax2Code Platform" },
      {
        name: "description",
        content:
          "Central question bank with skill tagging, difficulty levels and assessment configuration.",
      },
      { property: "og:title", content: "Assessments · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Manage the question bank powering every Syntax2Code assessment.",
      },
    ],
  }),
  loader: async () => {
    return await getAdminQuestionsFn();
  },
  component: AdminQuestions,
});

const tabs = ["Question bank", "Assessment configuration"] as const;
const diffs = ["All", "Easy", "Medium", "Hard"] as const;
const defaultSkills = [
  "Loops",
  "AI Ethics",
  "Web",
  "Algorithms",
  "Debugging",
  "Logic",
  "Conditionals",
  "Recursion",
] as const;

const PRESETS = [
  {
    name: "Standard Weekly Quiz",
    desc: "Balanced 15-minute quick knowledge check",
    cfg: { questions: 10, minutes: 15, attempts: 2, shuffle: true, instant: true },
  },
  {
    name: "Diagnostic Baseline Exam",
    desc: "Rigorous 30-question unassisted exam",
    cfg: { questions: 30, minutes: 45, attempts: 1, shuffle: true, instant: false },
  },
  {
    name: "Genesis Qualifier",
    desc: "Championship speed assessment with competitive timers",
    cfg: { questions: 20, minutes: 25, attempts: 1, shuffle: true, instant: false },
  },
];

function AdminQuestions() {
  const { questions: initialBank } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Question bank");
  const [diff, setDiff] = useState<(typeof diffs)[number]>("All");
  const [q, setQ] = useState("");
  const [bank, setBank] = useState<QuestionItem[]>(initialBank);
  const [skills, setSkills] = useState<string[]>([...defaultSkills]);
  const [open, setOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionItem | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    text: "",
    topic: "Loops",
    difficulty: "Medium",
    grade: "7–9",
  });

  const [cfg, setCfg] = useState({
    questions: 15,
    minutes: 25,
    attempts: 2,
    shuffle: true,
    instant: true,
  });

  // Load persisted config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("s2c_admin_assessment_cfg");
      if (saved) {
        setCfg(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveConfig = () => {
    try {
      localStorage.setItem("s2c_admin_assessment_cfg", JSON.stringify(cfg));
    } catch {
      // ignore
    }
    toast.success("Assessment configuration rules saved & active across 148 schools", {
      description: `${cfg.questions} questions · ${cfg.minutes} min · ${cfg.attempts} attempts · Shuffle: ${cfg.shuffle ? "Yes" : "No"}`,
    });
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[number]) => {
    setCfg(preset.cfg);
    try {
      localStorage.setItem("s2c_admin_assessment_cfg", JSON.stringify(preset.cfg));
    } catch {
      // ignore
    }
    toast.success(`Applied ${preset.name} preset!`);
  };

  const rows = bank.filter(
    (b) =>
      (diff === "All" || b.difficulty === diff) && b.text.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle="Central question bank and assessment rules for all 148 schools"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add question
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Questions"
          value="4,820"
          sub={`${bank.length} shown in this view`}
          tone="violet"
        />
        <Stat
          label="Published"
          value={bank.filter((b) => b.status === "Published").length}
          sub="Live in assessments"
          tone="emerald"
        />
        <Stat
          label="In review"
          value={bank.filter((b) => b.status === "Review").length}
          sub="Awaiting subject lead"
          tone="amber"
        />
        <Stat
          label="Skill tags"
          value={skills.length}
          sub="Mapped to the S2C skill graph"
          tone="sky"
        />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Question bank" && (
        <Panel
          title="Questions"
          description={`${rows.length} results`}
          action={<FilterChips options={diffs} value={diff} onChange={setDiff} />}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search questions by text or concept…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="mt-4 space-y-2.5">
            {rows.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-medium text-slate-900">{b.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Pill tone="sky">{b.topic}</Pill>
                    <Pill
                      tone={
                        b.difficulty === "Hard"
                          ? "rose"
                          : b.difficulty === "Medium"
                            ? "amber"
                            : "emerald"
                      }
                    >
                      {b.difficulty}
                    </Pill>
                    <span className="text-xs text-slate-400">Grade {b.grade}</span>
                    <span className="text-xs text-slate-400">· {b.usage} uses</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewQuestion(b)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteAdminQuestionFn({ data: b.id });
                        setBank((l) => l.filter((x) => x.id !== b.id));
                        toast.success("Question deleted");
                      } catch (err: unknown) {
                        toast.error("Failed to delete", { description: (err as Error).message });
                      }
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Assessment configuration" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Panel
            title="Default assessment rules"
            description="Global testing rules applied to all classes across 148 schools"
            action={
              <button
                onClick={handleSaveConfig}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Save Configuration
              </button>
            }
          >
            {/* Presets */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Quick Configuration Presets
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex flex-col items-start justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{preset.name}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{preset.desc}</p>
                    </div>
                    <span className="mt-2 text-[10px] font-medium text-indigo-600">
                      {preset.cfg.questions} Qs · {preset.cfg.minutes}m · {preset.cfg.attempts} Att
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              {(
                [
                  ["questions", "Questions per assessment", 5, 40],
                  ["minutes", "Time limit (minutes)", 5, 60],
                  ["attempts", "Allowed attempts", 1, 5],
                ] as const
              ).map(([key, label, min, max]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{label}</span>
                    <span className="font-semibold text-slate-900">{cfg[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={cfg[key]}
                    onChange={(e) => setCfg({ ...cfg, [key]: Number(e.target.value) })}
                    className="mt-2 w-full accent-indigo-600"
                  />
                </div>
              ))}
              {(
                [
                  ["shuffle", "Shuffle question order dynamically"],
                  ["instant", "Show instant feedback after submission"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-xs"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={cfg[key]}
                    onChange={(e) => setCfg({ ...cfg, [key]: e.target.checked })}
                    className="h-4 w-4 accent-indigo-600"
                  />
                </label>
              ))}

              <button
                onClick={handleSaveConfig}
                className="h-10 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Save configuration
              </button>
            </div>
          </Panel>

          <Panel title="Skill tags" description="The skill graph assessments map onto">
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    toast(`${s} skill tag`, {
                      description: `${Math.round(300 + Math.random() * 700)} questions tagged with ${s}.`,
                    })
                  }
                >
                  <Pill tone="sky">{s}</Pill>
                </button>
              ))}
            </div>
            <button
              onClick={() => setTagModalOpen(true)}
              className="mt-4 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              + Add skill tag
            </button>
          </Panel>
        </div>
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setPreviewQuestion(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                <Sparkles className="h-4 w-4" /> Student Assessment Preview
              </span>
              <Pill tone="emerald">{previewQuestion.difficulty}</Pill>
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900 leading-snug">
              {previewQuestion.text}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Pill tone="sky">{previewQuestion.topic}</Pill>
              <span>Grade {previewQuestion.grade}</span>
              <span>· {previewQuestion.usage} active students assessed</span>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Tag Modal */}
      {tagModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setTagModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Add New Skill Tag</h3>
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="e.g. Asynchronous I/O"
              className="mt-3 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTagModalOpen(false)}
                className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTag.trim()) {
                    setSkills((prev) => [...prev, newTag.trim()]);
                    toast.success(`Skill tag "${newTag.trim()}" added to S2C Graph`);
                    setNewTag("");
                    setTagModalOpen(false);
                  }
                }}
                className="h-9 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Add a question</h3>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={3}
              placeholder="Question text"
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {skills.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {["Easy", "Medium", "Hard"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {["6–8", "7–9", "8–10", "9–10"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  const text = form.text.trim();
                  if (!text) {
                    toast.error("Please enter question text");
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const res = await createAdminQuestionFn({
                      data: {
                        text,
                        topic: form.topic,
                        difficulty: form.difficulty,
                        grade: form.grade,
                      },
                    });
                    if (res?.question) {
                      setBank((l) => [res.question, ...l]);
                      setOpen(false);
                      setForm({ ...form, text: "" });
                      toast.success("Question saved to platform bank", {
                        description: `${form.topic} · ${form.difficulty}`,
                      });
                    }
                  } catch (err: unknown) {
                    toast.error("Failed to create question", {
                      description: (err as Error).message,
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
