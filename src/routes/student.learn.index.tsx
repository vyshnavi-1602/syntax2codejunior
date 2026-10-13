import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  BookOpen,
  Terminal,
  Code2,
  ListFilter,
  User,
  CheckCircle2,
  Play,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { getLearningPathsFn } from "@/api/student.server";
import { loadCourses, saveCourses, type CourseItem } from "@/client/components/app/coursesData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/client/components/ui/dialog";
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/student/learn/")({
  head: () => ({
    meta: [
      { title: "Learn · Syntax2Code" },
      {
        name: "description",
        content: "Structured learning paths in Python, AI, web, and intensive coding bootcamps.",
      },
      { property: "og:title", content: "Learn · Syntax2Code" },
      {
        property: "og:description",
        content: "Follow guided learning paths with lessons, checks and key takeaways.",
      },
    ],
  }),
  loader: async () => await getLearningPathsFn(),
  component: LearnPage,
});

const filters = ["All paths", "In progress", "Not started", "AI", "Coding"] as const;

function LearnPage() {
  const learningPaths = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All paths");

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCourses(loadCourses("student"));
    const handleSync = () => {
      setCourses(loadCourses("student"));
    };
    window.addEventListener("s2c-courses-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("s2c-courses-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const handleRefreshCourses = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCourses(loadCourses("student"));
      setIsRefreshing(false);
      toast.success("Courses refreshed");
    }, 400);
  };

  const handleToggleEnrollment = (courseId: string) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const nextState = !c.enrolled;
        toast.success(nextState ? `Enrolled into ${c.title}` : `Unenrolled from ${c.title}`);
        return { ...c, enrolled: nextState };
      }
      return c;
    });
    setCourses(updated);
    saveCourses("student", updated);
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse(updated.find((c) => c.id === courseId) || null);
    }
  };

  const list = learningPaths.filter((p) => {
    if (filter === "In progress") return p.progress > 0;
    if (filter === "Not started") return p.progress === 0;
    if (filter === "AI") return p.title.toLowerCase().includes("ai");
    if (filter === "Coding") return !p.title.toLowerCase().includes("ai");
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Learn"
          subtitle="Structured paths and multi-day intensive bootcamps that take you from first line of code to real AI projects."
        />
        <FilterChips options={filters} value={filter} onChange={setFilter} />

        <div className="grid gap-5 md:grid-cols-2">
          {list.map((p) => {
            const I =
              (
                Icons as unknown as Record<
                  string,
                  React.ComponentType<{ className?: string | undefined }>
                >
              )[p.icon] ?? Icons.BookOpen;
            const lessons = p.modules.reduce((n, m) => n + m.lessons.length, 0);
            const done = p.modules.reduce(
              (n, m) => n + m.lessons.filter((l) => l.status === "completed").length,
              0,
            );
            return (
              <Link
                key={p.id}
                to="/student/learn/$pathId"
                params={{ pathId: p.id.toString() }}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-slate-800 dark:to-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <I className="h-5 w-5" />
                    </span>
                    <Pill tone={p.progress > 60 ? "emerald" : p.progress > 0 ? "sky" : "slate"}>
                      {p.progress > 0 ? `${p.progress}% done` : "Not started"}
                    </Pill>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.tagline}</p>
                  <div className="mt-4">
                    <Bar value={p.progress} tone={p.progress > 60 ? "emerald" : "indigo"} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {done}/{lessons} lessons · {p.modules.length} modules
                  </span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                    {p.level}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {courses.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Featured Courses & Training Programs
              </h2>
              <p className="text-xs text-slate-500">
                Multi-day intensive coding bootcamps and module-based syllabi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshCourses}
              title="Refresh Courses"
              className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-indigo-600")}
              />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = !!course.enrolled;
              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-400/60 dark:hover:border-indigo-600/40 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-slate-800 dark:to-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        {course.visualType === "lock" ? (
                          <Terminal className="h-5 w-5" />
                        ) : course.visualType === "globe" ? (
                          <Code2 className="h-5 w-5" />
                        ) : (
                          <BookOpen className="h-5 w-5" />
                        )}
                      </span>
                      <Pill tone={isEnrolled ? "indigo" : "slate"}>
                        {isEnrolled ? "Enrolled" : "Not started"}
                      </Pill>
                    </div>
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {course.description ||
                        "Master core programming principles with guided lessons."}
                    </p>
                    <div className="mt-4">
                      <Bar value={isEnrolled ? 45 : 0} tone="indigo" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {isEnrolled ? "1" : "0"}/{course.modules.length} lessons ·{" "}
                      {course.modules.length} modules
                    </span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      {course.level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Panel
        title="Recommended next"
        description="Based on your recent activity and class curriculum"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              t: "Nested loops deep-dive",
              d: "Your assessment showed 51% on nested loops.",
              tone: "amber" as const,
            },
            {
              t: "AI bias case studies",
              d: "Prepares you for Genesis Round 3 pitching.",
              tone: "violet" as const,
            },
            {
              t: "CSS layout basics",
              d: "Unlocks the Web Creator project track.",
              tone: "sky" as const,
            },
          ].map((r, i) => (
            <Link
              key={r.t}
              to="/student/learn/$pathId"
              params={{ pathId: String(i + 1) }}
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <Pill tone={r.tone}>Recommended</Pill>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{r.t}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.d}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-2xl">
          {selectedCourse && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Pill
                    tone={
                      selectedCourse.level === "Advanced"
                        ? "rose"
                        : selectedCourse.level === "Intermediate"
                          ? "amber"
                          : "emerald"
                    }
                  >
                    {selectedCourse.level}
                  </Pill>
                  {selectedCourse.enrolled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Enrolled
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                    {selectedCourse.category}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedCourse.title}
                </DialogTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {selectedCourse.description}
                </p>
              </DialogHeader>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-500">Instructor:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedCourse.instructor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-500">Questions:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedCourse.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-500">Modules:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedCourse.modules.length} Days
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
                  <span>Day-by-Day Curriculum Modules</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {selectedCourse.modules.length} Modules
                  </span>
                </h4>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {selectedCourse.modules.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Day {m.day}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {m.questionsCount} questions
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                        {m.title}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleEnrollment(selectedCourse.id)}
                  className={cn(
                    "h-9 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    selectedCourse.enrolled
                      ? "border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                      : "border border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100",
                  )}
                >
                  {selectedCourse.enrolled ? "Leave Program" : "Enroll Now"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedCourse.pathId && (
                    <Link
                      to="/student/learn/$pathId"
                      params={{ pathId: String(selectedCourse.pathId) }}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Start Learning</span>
                    </Link>
                  )}
                  <Link
                    to="/student/lab"
                    search={{ assignmentId: undefined }}
                    className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Open Coding IDE</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
