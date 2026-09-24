import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Bar, FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/client/lib/utils";
import {
  getTeacherAssignmentsFn,
  getTeacherClassesFn,
  createAssignmentFn,
} from "@/api/teacher.server";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments & Assessments · Syntax2Code" },
      {
        name: "description",
        content: "Create assignments, build assessments and review question-level analytics.",
      },
      { property: "og:title", content: "Assignments & Assessments · Syntax2Code" },
      {
        property: "og:description",
        content: "Assignment creator, assessment builder and grading analytics.",
      },
    ],
  }),
  loader: async () => {
    const [assignments, classes] = await Promise.all([
      getTeacherAssignmentsFn(),
      getTeacherClassesFn(),
    ]);
    return {
      assignments,
      classes,
      questionAnalytics: [
        { q: "Q1. Variables", correct: 85 },
        { q: "Q2. Loops", correct: 45 },
        { q: "Q3. Functions", correct: 70 },
        { q: "Q4. Events", correct: 90 },
      ],
    };
  },
  component: AssignmentsPage,
});

const tabs = ["Assignments", "Assessment builder", "Question analytics"] as const;

function AssignmentsPage() {
  const data = Route.useLoaderData();
  const assignments = data?.assignments || [];
  const classes = data?.classes || [];
  const questionAnalytics = data?.questionAnalytics || [];
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Assignments");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    className: "Grade 8A",
    due: "2026-10-02",
    type: "Practice set",
    instructions: "",
  });
  const [questions, setQuestions] = useState([
    { q: "What does range(5) produce?", type: "MCQ", marks: 2 },
    { q: "Write a loop printing 1 to 10", type: "Code", marks: 5 },
  ]);

  return (
    <>
      <PageHeader
        title="Assignments & Assessments"
        subtitle="Create, publish and grade — with analytics down to the question."
        actions={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New assignment
          </button>
        }
      />

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Assignments" && (
        <Panel title="All assignments" description="Across Grade 6A, 8A, 8B and 9A">
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {a.className} · due {a.due}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill
                      tone={
                        a.status === "Graded" ? "emerald" : a.status === "Active" ? "sky" : "slate"
                      }
                    >
                      {a.status}
                    </Pill>
                    <button
                      onClick={() =>
                        toast.success(`Grading opened · ${a.title}`, {
                          description: `${a.submitted} of ${a.total} submissions ready.`,
                        })
                      }
                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Grade
                    </button>
                    <button
                      onClick={() =>
                        toast("Reminder sent", {
                          description: `${a.total - a.submitted} students notified.`,
                        })
                      }
                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Remind
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <Bar
                      value={(a.submitted / a.total) * 100}
                      tone={a.submitted === a.total ? "emerald" : "indigo"}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {a.submitted}/{a.total} submitted · avg {a.avg || "—"}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Assessment builder" && (
        <Panel
          title="Assessment builder"
          description="Loops & Conditions · Grade 8A"
          action={<Pill tone="amber">Draft</Pill>}
        >
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-slate-800">
                    Q{i + 1}. {q.q}
                  </p>
                  <p className="text-xs text-slate-500">
                    {q.type} · {q.marks} marks
                  </p>
                </div>
                <button
                  onClick={() => setQuestions((qs) => qs.filter((_, xi) => xi !== i))}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-rose-600 hover:bg-rose-50/60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setQuestions((qs) => [
                  ...qs,
                  { q: "Predict the output of a nested loop", type: "MCQ", marks: 3 },
                ]);
                toast.success("Question added from the S2C question bank");
              }}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add from question bank
            </button>
            <button
              onClick={() =>
                toast.success("Assessment published to Grade 8A", {
                  description: `${questions.length} questions · auto-graded`,
                })
              }
              className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Publish assessment
            </button>
          </div>
        </Panel>
      )}

      {tab === "Question analytics" && (
        <Panel
          title="Question-level analytics"
          description="Loops assessment · Grade 8A · 34 responses"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionAnalytics}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="q"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <RBar dataKey="correct" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {questionAnalytics.map((q) => (
              <div
                key={q.q}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 text-sm"
              >
                <span className="text-slate-700">{q.q}</span>
                <span
                  className={cn(
                    "font-semibold",
                    q.correct < 60 ? "text-amber-600" : "text-emerald-600",
                  )}
                >
                  {q.correct}% correct
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() =>
              toast.success("Re-teach plan created", {
                description: "Nested loops mini-lesson scheduled for Thursday.",
              })
            }
            className="mt-4 h-10 w-full rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Create re-teach plan for weak questions
          </button>
        </Panel>
      )}

      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setCreating(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Create assignment</h3>
              <p className="text-xs text-slate-500">Published instantly to the selected class</p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Assignment title"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
                >
                  {classes.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.due}
                  onChange={(e) => setForm({ ...form, due: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
                />
              </div>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
              >
                {["Practice set", "Coding task", "Project milestone", "Assessment"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                rows={3}
                placeholder="Instructions for students…"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                onClick={() => setCreating(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await createAssignmentFn({ data: form });
                    toast.success("Assignment published", {
                      description: `${form.title || "Untitled"} · ${form.className} · due ${form.due}`,
                    });
                    setCreating(false);
                    router.invalidate();
                  } catch (e: unknown) {
                    toast.error("Failed to publish assignment", {
                      description: (e as Error).message,
                    });
                  }
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
