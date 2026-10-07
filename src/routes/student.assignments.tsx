import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Terminal,
  Award,
  BookOpen,
  ArrowRight,
  Flame,
  Check,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getStudentAssignmentsFn, type StudentAssignmentCard } from "@/api/student.server";
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({
    meta: [
      { title: "My Assignments · Syntax2Code" },
      {
        name: "description",
        content: "View all your assigned coursework, coding challenges, and submissions as cards.",
      },
    ],
  }),
  loader: async () => {
    try {
      return await getStudentAssignmentsFn();
    } catch (e) {
      console.error(e);
      throw redirect({ to: "/login", search: { role: "student" } });
    }
  },
  component: StudentAssignmentsPage,
});

function StudentAssignmentsPage() {
  const assignments = Route.useLoaderData() as StudentAssignmentCard[];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Submitted" | "Graded">(
    "All",
  );
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">(
    "All",
  );

  const filtered = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    const matchesDifficulty = difficultyFilter === "All" || a.difficulty === difficultyFilter;
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter(
    (a) => a.status === "Submitted" || a.status === "Graded",
  ).length;
  const pendingCount = assignments.filter((a) => a.status === "Pending").length;
  const gradedList = assignments.filter((a) => a.score !== null);
  const avgScore =
    gradedList.length > 0
      ? Math.round(gradedList.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / gradedList.length)
      : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Assignments & Coding Challenges"
        subtitle="Browse all your classroom tasks, coding challenges, and project milestones."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/student/lab"
              search={{ assignmentId: undefined }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5" />
              Open Coding IDE
            </Link>
          </div>
        }
      />

      {/* Summary KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total Assigned"
          value={totalAssigned}
          sub="Curriculum coursework"
          tone="violet"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <Stat
          label="Completed"
          value={completedCount}
          sub={`${Math.round((completedCount / (totalAssigned || 1)) * 100)}% completion rate`}
          tone="emerald"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Stat
          label="Pending Tasks"
          value={pendingCount}
          sub="Awaiting your submission"
          tone="amber"
          icon={<Clock className="h-4 w-4" />}
        />
        <Stat
          label="Average Score"
          value={`${avgScore}%`}
          sub="From graded evaluations"
          tone="violet"
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title, topic, or class..."
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {(["All", "Pending", "Submitted", "Graded"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                statusFilter === s
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Difficulty Filters */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                difficultyFilter === d
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            No assignments match your criteria
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Try resetting your search query or filters to view all assignments.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => {
            const isSolved = card.status === "Submitted" || card.status === "Graded";

            return (
              <div
                key={card.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md",
                  isSolved
                    ? "border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-b from-white to-emerald-50/15 dark:from-slate-900 dark:to-emerald-950/10"
                    : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800",
                )}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      <GraduationCap className="h-3 w-3 text-indigo-500" />
                      {card.className}
                    </span>

                    {card.status === "Graded" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <Check className="h-3 w-3 stroke-[3]" />
                        Score: {card.score}%
                      </span>
                    ) : card.status === "Submitted" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950/80 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 dark:text-sky-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Submitted
                      </span>
                    ) : card.daysRemaining !== null && card.daysRemaining <= 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                        Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        <Clock className="h-3 w-3" />
                        Due {card.dueDate ? card.dueDate : "Soon"}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Pill
                      tone={
                        card.difficulty === "Easy"
                          ? "emerald"
                          : card.difficulty === "Medium"
                            ? "amber"
                            : "rose"
                      }
                    >
                      {card.difficulty}
                    </Pill>
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="h-3 w-3" />+{card.xp} XP
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {card.testCasesCount} Test Cases
                    </span>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {card.isCodingRound ? (
                    <Link
                      to="/student/lab"
                      search={{ assignmentId: card.id }}
                      className={cn(
                        "flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all",
                        isSolved
                          ? "border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20",
                      )}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      {isSolved ? "Review in IDE" : "Solve in IDE ⚡"}
                    </Link>
                  ) : (
                    <Link
                      to="/student/practice"
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all"
                    >
                      <span>View Task</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
