import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
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
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import {
  getStudentAssignmentsFn,
  submitStudentMcqQuizFn,
  type StudentAssignmentCard,
} from "@/api/student.server";
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

  const router = useRouter();
  const [activeQuizCard, setActiveQuizCard] = useState<StudentAssignmentCard | null>(null);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalCount: number;
    earnedXp: number;
  } | null>(null);

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

  const handleStartMcqQuiz = (card: StudentAssignmentCard) => {
    setActiveQuizCard(card);
    setQuizCurrentIndex(0);
    setStudentAnswers({});
    if (card.score !== null) {
      const qCount = card.mcqQuestions?.length || 4;
      setQuizResult({
        score: card.score,
        passed: card.score >= (card.passingScore || 70),
        correctCount: Math.round((card.score / 100) * qCount),
        totalCount: qCount,
        earnedXp: card.xp,
      });
    } else {
      setQuizResult(null);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizCard) return;
    const questions = activeQuizCard.mcqQuestions || [];
    if (questions.length === 0) {
      toast.error("No questions available in this quiz");
      return;
    }

    let correctCount = 0;
    for (const q of questions) {
      if (studentAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passingThreshold = activeQuizCard.passingScore || 70;
    const passed = score >= passingThreshold;
    const earnedXp = passed ? activeQuizCard.xp || 50 : 10;

    setSubmittingQuiz(true);
    try {
      await submitStudentMcqQuizFn({
        data: {
          assignmentId: activeQuizCard.id,
          score,
          passed,
          answers: studentAnswers,
          totalQuestions: questions.length,
          correctCount,
          earnedXp,
        },
      });

      setQuizResult({
        score,
        passed,
        correctCount,
        totalCount: questions.length,
        earnedXp,
      });
      toast.success(passed ? "🎉 Quiz Passed! Well done!" : "Quiz submitted!", {
        description: `Score: ${score}% (${correctCount}/${questions.length} correct) · +${earnedXp} XP awarded`,
      });
      await router.invalidate();
    } catch (e: unknown) {
      toast.error("Failed to submit quiz", {
        description: (e as Error).message,
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        <GraduationCap className="h-3 w-3 text-indigo-500" />
                        {card.className}
                      </span>
                      {card.isMcqTest && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/70 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                          <HelpCircle className="h-3 w-3" />
                          MCQ Test {card.subject ? `· ${card.subject}` : ""}
                        </span>
                      )}
                    </div>

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
                    {card.isMcqTest ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-300">
                          <HelpCircle className="h-3 w-3 text-purple-500" />
                          {card.mcqQuestions?.length || 4} Questions
                        </span>
                        {card.timeLimitMinutes && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {card.timeLimitMinutes}m
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {card.testCasesCount} Test Cases
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {card.isMcqTest ? (
                    <button
                      type="button"
                      onClick={() => handleStartMcqQuiz(card)}
                      className={cn(
                        "flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all",
                        isSolved
                          ? "border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 hover:bg-purple-100"
                          : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20",
                      )}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {isSolved ? `Review MCQ Quiz (${card.score}%)` : "Take MCQ Quiz 📝"}
                    </button>
                  ) : card.isCodingRound ? (
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

      {/* INTERACTIVE MCQ QUIZ MODAL */}
      {activeQuizCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setActiveQuizCard(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeQuizCard.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeQuizCard.className} · {activeQuizCard.subject || "Subject Quiz"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuizCard(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const questions =
                activeQuizCard.mcqQuestions && activeQuizCard.mcqQuestions.length > 0
                  ? activeQuizCard.mcqQuestions
                  : [
                      {
                        id: "q-fb-1",
                        questionText: "What is the primary function of a loop in programming?",
                        options: [
                          "To terminate the script",
                          "To execute a block of code multiple times",
                          "To store persistent values on disk",
                          "To import external dependencies",
                        ],
                        correctAnswer: "To execute a block of code multiple times",
                        explanation:
                          "Loops (like for and while) automate repeated execution based on conditional criteria.",
                        difficulty: "Easy",
                        xp: 25,
                      },
                      {
                        id: "q-fb-2",
                        questionText:
                          "Which data structure follows the First-In, First-Out (FIFO) principle?",
                        options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
                        correctAnswer: "Queue",
                        explanation: "Queues operate on a First-In First-Out (FIFO) access order.",
                        difficulty: "Easy",
                        xp: 25,
                      },
                    ];

              // If quiz is already finished / submitted and results are displayed
              if (quizResult) {
                return (
                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <div className="text-center rounded-2xl bg-gradient-to-b from-purple-50 to-indigo-50/30 dark:from-purple-950/30 dark:to-slate-900 p-6 border border-purple-100 dark:border-purple-900/40">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-600 text-white font-black text-2xl shadow-lg shadow-purple-600/30 mb-3">
                        {quizResult.score}%
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {quizResult.passed ? "Assessment Passed! 🌟" : "Needs More Practice 📖"}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        You answered {quizResult.correctCount} out of {quizResult.totalCount}{" "}
                        questions correctly.
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />+{quizResult.earnedXp} XP
                        Awarded
                      </div>
                    </div>

                    {/* Question breakdown and explanations */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Detailed Question Review & Explanations
                      </h5>
                      {questions.map((q, idx) => {
                        const chosen = studentAnswers[q.id];
                        const isCorrect = chosen === q.correctAnswer;
                        return (
                          <div
                            key={q.id}
                            className={cn(
                              "p-4 rounded-xl border text-xs space-y-2",
                              isCorrect
                                ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                : "border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/20",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                Q{idx + 1}. {q.questionText}
                              </span>
                              <span
                                className={cn(
                                  "font-bold text-[10px] px-2 py-0.5 rounded shrink-0",
                                  isCorrect
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
                                )}
                              >
                                {isCorrect ? "Correct ✓" : "Incorrect ✗"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = chosen === opt;
                                const isAns = opt === q.correctAnswer;
                                return (
                                  <div
                                    key={optIdx}
                                    className={cn(
                                      "px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-between",
                                      isAns
                                        ? "border-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold"
                                        : isSelected
                                          ? "border-rose-400 bg-rose-100/60 dark:bg-rose-950 text-rose-900 dark:text-rose-200 line-through"
                                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400",
                                    )}
                                  >
                                    <span>
                                      {String.fromCharCode(65 + optIdx)}. {opt}
                                    </span>
                                    {isAns && <Check className="h-3 w-3 text-emerald-700" />}
                                  </div>
                                );
                              })}
                            </div>

                            {q.explanation && (
                              <div className="mt-2 rounded-lg bg-white/80 dark:bg-slate-800/80 p-2 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-purple-600 dark:text-purple-400 mr-1">
                                  Explanation:
                                </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setStudentAnswers({});
                          setQuizCurrentIndex(0);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
                      </button>
                      <button
                        onClick={() => setActiveQuizCard(null)}
                        className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                );
              }

              // Active Test in progress
              const currentQ = questions[quizCurrentIndex] || questions[0]!;
              const selectedOpt = studentAnswers[currentQ.id];
              const answeredCount = Object.keys(studentAnswers).length;

              return (
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>
                        Question {quizCurrentIndex + 1} of {questions.length}
                      </span>
                      <span>
                        {answeredCount}/{questions.length} answered
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${((quizCurrentIndex + 1) / questions.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-full">
                        Question {quizCurrentIndex + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                          +{currentQ.xp || 25} XP
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {currentQ.difficulty || "Medium"}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {currentQ.questionText}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-2 pt-2">
                      {currentQ.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === opt;
                        const label = String.fromCharCode(65 + optIdx);
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              setStudentAnswers((prev) => ({
                                ...prev,
                                [currentQ.id]: opt,
                              }));
                            }}
                            className={cn(
                              "w-full text-left p-3.5 rounded-xl border text-xs font-medium flex items-center gap-3 transition-all cursor-pointer",
                              isChosen
                                ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-100 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-purple-300 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold border transition-colors",
                                isChosen
                                  ? "bg-purple-600 border-purple-600 text-white"
                                  : "border-slate-300 dark:border-slate-700 text-slate-500",
                              )}
                            >
                              {label}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation & Submit footer */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={quizCurrentIndex === 0}
                      onClick={() => setQuizCurrentIndex((prev) => Math.max(0, prev - 1))}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {quizCurrentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setQuizCurrentIndex((prev) => prev + 1)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 shadow-xs"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submittingQuiz}
                          onClick={handleSubmitQuiz}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                          {submittingQuiz ? "Submitting..." : "Submit Quiz"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
