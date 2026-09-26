import { createFileRoute, Link, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Lock, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { CompanionPanel } from "@/client/components/app/AiCompanion";
import { getPathContent, submitQuizAnswer, getLessonContent } from "@/api/student.server";
import Markdown from "react-markdown";

export const Route = createFileRoute("/student/learn/$pathId")({
  head: () => ({
    meta: [
      { title: "Learning path · Syntax2Code" },
      {
        name: "description",
        content: "Work through modules and lessons with interactive checks and key takeaways.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const id = parseInt(params.pathId);
    if (isNaN(id)) return null;
    return await getPathContent({ data: id });
  },
  component: PathPage,
});

function PathPage() {
  const data = Route.useLoaderData();
  const router = useRouter();

  const { path, lessons: allLessons } = data || { path: null, lessons: [] };

  const startIndex = Math.max(
    0,
    allLessons.findIndex((l) => l.status === "current"),
  );

  const [index, setIndex] = useState(startIndex);
  const [picked, setPicked] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<{ id: number; questionText: string; options: string[] }[]>(
    [],
  );
  const [markdown, setMarkdown] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);

  const lesson = allLessons[index];

  useEffect(() => {
    if (lesson) {
      getLessonContent({ data: lesson.id }).then((content) => {
        setMarkdown(content.lesson?.contentMarkdown || "");
        setQuizzes(content.quizzes || []);
        setPicked(null);
      });
    }
  }, [lesson]);

  const select = (i: number) => {
    setIndex(i);
  };

  const handleComplete = async () => {
    if (quizzes.length > 0 && picked === null) {
      toast.error("Please answer the quiz before continuing.");
      return;
    }

    setIsCompleting(true);

    const answers: Record<number, string> = {};
    if (quizzes.length > 0 && picked !== null) {
      const quiz = quizzes[0]!;
      answers[quiz.id] = quiz.options[picked]!;
    }

    try {
      if (lesson) {
        const res = await submitQuizAnswer({ data: { lessonId: lesson.id, answers } });
        if (res.success) {
          toast.success("Lesson marked complete", {
            description: `+${res.xpEarned} XP added to profile.`,
          });
          if (index < allLessons.length - 1) {
            select(index + 1);
          }
          router.invalidate();
        } else {
          toast.error("Incorrect answer!", { description: "Try again!" });
          setPicked(null);
        }
      }
    } catch (e) {
      toast.error("Failed to complete lesson");
    } finally {
      setIsCompleting(false);
    }
  };

  if (!data || !path) return <div>Path not found in database. Make sure you seeded the DB!</div>;
  if (!lesson) return <div>No lessons found for this path.</div>;

  const completedCount = allLessons.filter(
    (l: { status?: string }) => l.status === "completed",
  ).length;
  const progress =
    allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title={path.title}
        subtitle={`${path.description} · ${path.difficulty}`}
        actions={
          <Link
            to="/student/learn"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> All paths
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-4">
          <Panel title="Path progress">
            <Bar value={progress} tone="emerald" />
            <p className="mt-2 text-xs text-slate-500">{progress}% complete. Keep going!</p>
          </Panel>
          <Panel title="Lessons" bodyClassName="p-2">
            {allLessons.map((l, i) => {
              const active = i === index;
              return (
                <button
                  key={l.id}
                  onClick={() => select(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {l.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : l.status === "locked" ? (
                    <Lock className="h-4 w-4 shrink-0 text-slate-300" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-indigo-500" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="text-[11px] text-slate-400">{l.xpReward} XP</span>
                </button>
              );
            })}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title={lesson.title}
            description={`Lesson ${index + 1} of ${allLessons.length}`}
            action={
              <Pill tone={lesson.status === "completed" ? "emerald" : "violet"}>
                {lesson.status}
              </Pill>
            }
          >
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700">
              <Markdown>{markdown}</Markdown>
            </div>

            {quizzes.length > 0 && quizzes[0] && (
              <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-indigo-600" />
                  <p className="text-sm font-semibold text-slate-900">Knowledge Check</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{quizzes[0].questionText}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quizzes[0].options.map((o: string, i: number) => {
                    const state = picked === i ? "picked" : "idle";
                    return (
                      <button
                        key={i}
                        onClick={() => setPicked(i)}
                        className={cn(
                          "rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                          state === "picked" && "border-indigo-300 bg-indigo-50 text-indigo-800",
                          state === "idle" &&
                            "border-slate-200 bg-white text-slate-700 hover:border-indigo-200",
                        )}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                disabled={index === 0}
                onClick={() => select(index - 1)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={isCompleting}
                onClick={handleComplete}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCompleting ? "Submitting..." : "Complete & continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Panel>

          <Panel
            title="Stuck? Ask your S2C Companion"
            description="Explanations tuned to your grade level"
            bodyClassName="p-0"
          >
            <CompanionPanel compact />
          </Panel>
        </div>
      </div>
    </>
  );
}
