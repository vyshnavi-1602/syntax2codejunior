import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Filter, Sparkles, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";

import { getPracticeItemsFn } from "@/api/student.server";
import { CodeEditor } from "@/client/components/app/CodeEditor";
import { runJavaScript, type ExecutionResult, type TestCase } from "@/client/lib/sandbox";
export const Route = createFileRoute("/student/practice")({
  head: () => ({
    meta: [
      { title: "Practice Hub · Syntax2Code" },
      {
        name: "description",
        content:
          "Quizzes, coding problems, debugging and logic challenges with instant feedback and XP.",
      },
      { property: "og:title", content: "Practice Hub · Syntax2Code" },
      {
        property: "og:description",
        content: "Sharpen skills with instant-feedback practice sets.",
      },
    ],
  }),
  loader: async () => {
    return await getPracticeItemsFn();
  },
  component: PracticePage,
});

const types = ["All", "Quiz", "Coding", "Debugging", "Logic"] as const;
const levels = ["Any level", "Easy", "Medium", "Hard"] as const;

function PracticePage() {
  type PracticeItem = {
    id: string;
    title: string;
    type: string;
    difficulty: string;
    topic: string;
    minutes: number;
    xp: number;
    solved?: boolean;
    prompt?: string;
    starterCode?: string;
    testCases?: TestCase[];
    options?: string[];
    answer?: number;
    explain?: string;
  };
  const data = Route.useLoaderData();
  const practiceItems = (data.items || []) as PracticeItem[];
  const stats = data.stats || { xpTotal: 1240, accuracy: "86%", avgTime: "4m 12s", weeklyXP: 180 };

  const [type, setType] = useState<(typeof types)[number]>("All");
  const [level, setLevel] = useState<(typeof levels)[number]>("Any level");
  const [open, setOpen] = useState<PracticeItem | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>(
    practiceItems.filter((p) => p.solved).map((p) => p.id),
  );

  const list = practiceItems.filter(
    (p) => (type === "All" || p.type === type) && (level === "Any level" || p.difficulty === level),
  );

  const submit = (item: PracticeItem, i: number) => {
    setPicked(i);
    if (i === item.answer) {
      setSolvedIds((s) => (s.includes(item.id) ? s : [...s, item.id]));
      toast.success(`Correct! +${item.xp} XP 🎉`, { description: item.explain });
    } else {
      toast.error("Incorrect. Review the hint below!");
    }
  };

  const [codeContent, setCodeContent] = useState("");
  const [execResult, setExecResult] = useState<ExecutionResult[] | null>(null);
  const [execLogs, setExecLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const openModal = (item: PracticeItem) => {
    setOpen(item);
    setPicked(null);
    if (item.type === "Coding") {
      setCodeContent(item.starterCode || "");
      setExecResult(null);
      setExecLogs([]);
    }
  };

  const submitCode = async (item: PracticeItem) => {
    setIsExecuting(true);
    setExecResult(null);
    setExecLogs([]);
    try {
      const { success, results, logs } = await runJavaScript(codeContent, item.testCases || []);
      setExecResult(results);
      setExecLogs(logs);
      if (success) {
        setSolvedIds((s) => (s.includes(item.id) ? s : [...s, item.id]));
        toast.success(`All tests passed! +${item.xp} XP 🎉`);
      } else {
        toast.error("Some tests failed. Check the output.");
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Practice Hub"
        subtitle="Short, focused challenges with instant feedback. Every solve earns XP."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Solved this week"
          value={solvedIds.length}
          sub="Goal: 12"
          tone="emerald"
          icon={<Check className="h-4 w-4" />}
        />
        <Stat
          label="XP from practice"
          value={stats.xpTotal.toLocaleString()}
          sub={`+${stats.weeklyXP} this week`}
          tone="sky"
          icon={<Zap className="h-4 w-4" />}
        />
        <Stat
          label="Accuracy"
          value={stats.accuracy}
          sub="Across all attempts"
          tone="violet"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <Stat
          label="Avg. time"
          value={stats.avgTime}
          sub="Faster than class average"
          tone="amber"
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <Panel
        title="Challenge library"
        description={`${list.length} challenges match your filters`}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Filters
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips options={types} value={type} onChange={setType} />
          <span className="h-4 w-px bg-slate-200" />
          <FilterChips options={levels} value={level} onChange={setLevel} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const solved = solvedIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => openModal(p)}
                className="rounded-2xl border border-slate-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill
                      tone={
                        p.type === "Coding"
                          ? "sky"
                          : p.type === "Debugging"
                            ? "amber"
                            : p.type === "Logic"
                              ? "violet"
                              : "teal"
                      }
                    >
                      {p.type}
                    </Pill>
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
                  </div>
                  {solved && <Pill tone="emerald">Solved</Pill>}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{p.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.topic} · {p.minutes} min · {p.xp} XP
                </p>
              </button>
            );
          })}
        </div>
      </Panel>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{open.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {open.type} · {open.difficulty} · {open.xp} XP
                </p>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-700">{open.prompt}</p>
              {open.type === "Coding" ? (
                <div className="mt-4 space-y-4">
                  <CodeEditor
                    value={codeContent}
                    onChange={(v) => setCodeContent(v || "")}
                    height="400px"
                  />
                  <button
                    onClick={() => submitCode(open)}
                    disabled={isExecuting}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isExecuting ? "Running..." : "Run & Submit"}
                  </button>

                  {execLogs && execLogs.length > 0 && (
                    <div className="space-y-1 rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100 max-h-48 overflow-y-auto">
                      <div className="mb-2 border-b border-slate-700 pb-2 font-semibold text-slate-400">
                        Console Output
                      </div>
                      {execLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  )}

                  {execResult && (
                    <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-xs font-semibold text-slate-700">Test Results</h4>
                      {execResult.map((res, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {res.passed ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <span className="text-rose-500">❌</span>
                          )}
                          <span className="text-slate-600">
                            Test {idx + 1}:{" "}
                            {res.passed ? "Passed" : `Failed (Got: ${res.actual || res.error})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {open.options?.map((o: string, i: number) => {
                    const state =
                      picked === null
                        ? "idle"
                        : i === open.answer
                          ? "right"
                          : picked === i
                            ? "wrong"
                            : "idle";
                    return (
                      <button
                        key={o}
                        onClick={() => submit(open, i)}
                        className={cn(
                          "w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                          state === "right" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                          state === "wrong" && "border-amber-300 bg-amber-50 text-amber-800",
                          state === "idle" &&
                            "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40",
                        )}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              )}
              {picked !== null && open.type !== "Coding" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  {open.explain}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
