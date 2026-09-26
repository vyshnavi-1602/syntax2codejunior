import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface QuestionItem {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  grade: string;
  usage: number;
  status: string;
}
const questionBank: Array<QuestionItem> = [];

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
  component: AdminQuestions,
});

const tabs = ["Question bank", "Assessment configuration"] as const;
const diffs = ["All", "Easy", "Medium", "Hard"] as const;
const skills = ["Loops", "AI Ethics", "Web", "Algorithms", "Debugging", "Logic"] as const;

function AdminQuestions() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Question bank");
  const [diff, setDiff] = useState<(typeof diffs)[number]>("All");
  const [q, setQ] = useState("");
  const [bank, setBank] = useState(questionBank);
  const [open, setOpen] = useState(false);
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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
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
              placeholder="Search questions…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="mt-4 space-y-2.5">
            {rows.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
              >
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-medium text-slate-900">{b.text}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
                    <Pill tone="slate">Grade {b.grade}</Pill>
                    <Pill tone="violet">{b.usage.toLocaleString()} uses</Pill>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill
                    tone={
                      b.status === "Published"
                        ? "emerald"
                        : b.status === "Review"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {b.status}
                  </Pill>
                  <button
                    onClick={() => toast.success(`Editing question ${b.id}`)}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setBank((l) =>
                        l.map((x) =>
                          x.id === b.id
                            ? { ...x, status: x.status === "Published" ? "Draft" : "Published" }
                            : x,
                        ),
                      );
                      toast(
                        b.status === "Published" ? "Question unpublished" : "Question published",
                      );
                    }}
                    className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    {b.status === "Published" ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Assessment configuration" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Default assessment rules"
            description="Applied to new assessments across all schools"
          >
            <div className="space-y-4">
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
                  ["shuffle", "Shuffle question order"],
                  ["instant", "Show instant feedback"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
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
                onClick={() =>
                  toast.success("Assessment defaults saved", {
                    description: `${cfg.questions} questions · ${cfg.minutes} min · ${cfg.attempts} attempts`,
                  })
                }
                className="h-10 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
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
                    toast(`${s} tag`, {
                      description: `${Math.round(300 + Math.random() * 700)} questions tagged.`,
                    })
                  }
                >
                  <Pill tone="sky">{s}</Pill>
                </button>
              ))}
            </div>
            <button
              onClick={() => toast.success("New skill tag created")}
              className="mt-4 h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Add skill tag
            </button>
          </Panel>
        </div>
      )}

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
                onClick={() => {
                  setBank((l) => [
                    {
                      id: `qb-${Date.now()}`,
                      text: form.text || "Untitled question",
                      topic: form.topic,
                      difficulty: form.difficulty,
                      grade: form.grade,
                      usage: 0,
                      status: "Draft",
                    },
                    ...l,
                  ]);
                  setOpen(false);
                  setForm({ ...form, text: "" });
                  toast.success("Question added to the bank", {
                    description: `${form.topic} · ${form.difficulty}`,
                  });
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save question
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
