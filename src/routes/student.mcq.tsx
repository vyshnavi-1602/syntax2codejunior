import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Terminal,
  Trophy,
  BookOpen,
  Check,
  Sparkles,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/client/components/app/primitives";
import {
  getStudentAssignmentsFn,
  submitStudentMcqQuizFn,
  type StudentAssignmentCard,
} from "@/api/student.server";
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/student/mcq")({
  head: () => ({
    meta: [
      { title: "MCQ Assessment · Syntax2Code" },
      {
        name: "description",
        content: "Multiple-choice diagnostic tests, quiz assessments, and conceptual evaluations.",
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
  component: StudentMcqPage,
});

const DEFAULT_MCQ_ASSESSMENTS: StudentAssignmentCard[] = [
  {
    id: 9101,
    title: "Python Syntax & Fundamentals MCQ",
    type: "mcq",
    description: "Core diagnostic on variables, loops, conditionals, and data types.",
    className: "Grade 8A - Algorithms & Logic",
    teacherName: "Faculty Assessment Team",
    dueDate: "Operational",
    status: "Pending",
    difficulty: "Easy",
    xp: 80,
    topic: "Variables & Control Flow",
    testCasesCount: 0,
    hiddenTestCasesCount: 0,
    isCodingRound: false,
    isMcqTest: true,
    subject: "Python Basics",
    timeLimitMinutes: 30,
    score: null,
    submittedAt: null,
    daysRemaining: 1,
    mcqQuestions: [
      {
        id: "q-1",
        questionText: "What will be the output of `print(type(5 / 2))` in Python 3?",
        options: ["<class 'int'>", "<class 'float'>", "<class 'number'>", "<class 'double'>"],
        correctAnswer: "<class 'float'>",
        explanation: "In Python 3, standard division `/` always returns a float.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "q-2",
        questionText: "Which of the following data types is immutable in Python?",
        options: ["List", "Dictionary", "Tuple", "Set"],
        correctAnswer: "Tuple",
        explanation: "Tuples cannot be altered once instantiated in Python.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "q-3",
        questionText:
          "Which loop construct is best suited when the number of iterations is known in advance?",
        options: ["while loop", "for loop", "do-while loop", "repeat loop"],
        correctAnswer: "for loop",
        explanation: "A for loop iterates over an iterable sequence of predetermined length.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "q-4",
        questionText: "What does the `break` statement do inside a loop?",
        options: [
          "Skips to the next iteration",
          "Exits the loop immediately",
          "Restarts the loop from index 0",
          "Pauses execution for 1 second",
        ],
        correctAnswer: "Exits the loop immediately",
        explanation: "`break` halts execution of the innermost loop construct immediately.",
        difficulty: "Easy",
        xp: 20,
      },
    ],
  },
  {
    id: 9102,
    title: "Algorithms & Logic Diagnostic",
    type: "mcq",
    description: "Conceptual evaluation on Big-O analysis, sorting algorithms, and binary search.",
    className: "Grade 9 - Advanced Computing",
    teacherName: "Faculty Assessment Team",
    dueDate: "Operational",
    status: "Pending",
    difficulty: "Medium",
    xp: 100,
    topic: "Search & Sort Logic",
    testCasesCount: 0,
    hiddenTestCasesCount: 0,
    isCodingRound: false,
    isMcqTest: true,
    subject: "Data Structures",
    timeLimitMinutes: 45,
    score: null,
    submittedAt: null,
    daysRemaining: 2,
    mcqQuestions: [
      {
        id: "q-5",
        questionText: "What is the worst-case time complexity of Binary Search?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
        correctAnswer: "O(log n)",
        explanation: "Binary search cuts the search space in half with every iteration.",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "q-6",
        questionText: "Which data structure follows the First-In, First-Out (FIFO) principle?",
        options: ["Stack", "Queue", "Binary Tree", "Heap"],
        correctAnswer: "Queue",
        explanation: "Queues operate on First-In First-Out order.",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "q-7",
        questionText: "Which sorting algorithm has the best average-case performance?",
        options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
        correctAnswer: "Merge Sort",
        explanation: "Merge Sort has a consistent O(n log n) time complexity across all cases.",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "q-8",
        questionText: "Which data structure is primarily used to implement recursion?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correctAnswer: "Stack",
        explanation: "Call stacks track recursive function execution contexts in memory.",
        difficulty: "Medium",
        xp: 25,
      },
    ],
  },
  {
    id: 9103,
    title: "Web Architecture & HTML/CSS Quiz",
    type: "mcq",
    description: "Assessment on DOM, CSS box model, semantic HTML tags, and HTTP methods.",
    className: "Grade 6B - Creative Coding",
    teacherName: "Faculty Assessment Team",
    dueDate: "Operational",
    status: "Pending",
    difficulty: "Easy",
    xp: 60,
    topic: "Web Basics",
    testCasesCount: 0,
    hiddenTestCasesCount: 0,
    isCodingRound: false,
    isMcqTest: true,
    subject: "Web Development",
    timeLimitMinutes: 25,
    score: null,
    submittedAt: null,
    daysRemaining: 3,
    mcqQuestions: [
      {
        id: "q-9",
        questionText: "Which HTML5 element represents the primary navigation links of a page?",
        options: ["<navigation>", "<nav>", "<menu>", "<links>"],
        correctAnswer: "<nav>",
        explanation: "The <nav> element defines navigation links in semantic HTML5.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "q-10",
        questionText:
          "In the CSS box model, which property creates space outside the element's border?",
        options: ["Padding", "Margin", "Outline", "Spacing"],
        correctAnswer: "Margin",
        explanation: "Margin defines the transparent space outside of the border.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "q-11",
        questionText: "Which HTTP status code signifies a successful request?",
        options: ["200 OK", "404 Not Found", "500 Server Error", "301 Redirect"],
        correctAnswer: "200 OK",
        explanation: "200 OK indicates a successful HTTP request response.",
        difficulty: "Easy",
        xp: 20,
      },
    ],
  },
];

function StudentMcqPage() {
  const allAssignments = Route.useLoaderData() as StudentAssignmentCard[];
  const userMcqs = (allAssignments || []).filter((a) => a.isMcqTest || a.type === "mcq");
  const baseAssignments = userMcqs.length > 0 ? userMcqs : DEFAULT_MCQ_ASSESSMENTS;

  const router = useRouter();
  const [localSubmissions, setLocalSubmissions] = useState<
    Record<number, { score: number; status: "Submitted" }>
  >({});

  const assignments = baseAssignments.map((a) => {
    const local = localSubmissions[a.id];
    if (local) {
      return {
        ...a,
        status: local.status as "Submitted",
        score: local.score,
      };
    }
    return a;
  });

  const [activeQuizCard, setActiveQuizCard] = useState<StudentAssignmentCard | null>(null);
  const [selectedStandingCard, setSelectedStandingCard] = useState<StudentAssignmentCard | null>(
    null,
  );
  const [selectedBriefCard, setSelectedBriefCard] = useState<StudentAssignmentCard | null>(null);

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

  const filtered = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter(
    (a) => a.status === "Submitted" || a.status === "Graded",
  ).length;
  const pendingCount = assignments.filter((a) => a.status === "Pending").length;

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

      setLocalSubmissions((prev) => ({
        ...prev,
        [activeQuizCard.id]: { score, status: "Submitted" },
      }));

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
      {/* Header */}
      <PageHeader
        title="MCQ Assessment"
        subtitle="Multiple-choice diagnostic tests, quiz assessments, and conceptual evaluations."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/student/assignments"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              All Assignments
            </Link>
            <Link
              to="/student/lab"
              search={{ assignmentId: undefined }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              <Terminal className="h-3.5 w-3.5" />
              Open Coding IDE
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161d] p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <HelpCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalAssigned * 10 || 30}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              INTELLIGENCE UNITS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161d] p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Play className="h-5 w-5 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {pendingCount || 3}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              TACTICAL OPENINGS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161d] p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              1
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              ACTIVE SYNCS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161d] p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <CheckCircle2 className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {completedCount}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              SECURED DATA
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11161d] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MCQ tests by topic, concept, or subject..."
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/50 dark:border-slate-800">
          {(["All", "Pending", "Submitted", "Graded"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                statusFilter === s
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-500/30 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* MCQ Assessment Cards Grid */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((card) => {
          const isSolved = card.status === "Submitted" || card.status === "Graded";
          const durationText = card.timeLimitMinutes ? `${card.timeLimitMinutes}m` : "30m";
          const attemptsText = card.status === "Pending" ? "0/1" : "1/1";
          const questionsCount = card.mcqQuestions?.length || 4;

          return (
            <div
              key={card.id}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#11161d] p-6 shadow-sm transition-all hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:shadow-indigo-500/5"
            >
              <div>
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase border",
                      isSolved
                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
                    )}
                  >
                    {isSolved
                      ? card.status === "Graded"
                        ? `GRADED (${card.score}%)`
                        : "SUBMITTED"
                      : "AVAILABLE"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedBriefCard(card)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Assessment Briefing"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {card.description || card.className}
                </p>

                {/* Operational Window & Attempt Sync */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      OPERATIONAL WINDOW
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{durationText}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      ATTEMPT SYNC
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <Play className="h-3.5 w-3.5 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
                      <span>{attemptsText}</span>
                    </div>
                  </div>
                </div>

                {/* Pill Bar: Questions & Credits */}
                <div className="mt-5 flex items-center justify-around rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-950/50 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{questionsCount} QUESTIONS</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span>{card.xp || 80} CREDITS</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["MCQ", "SINGLE-CHOICE", "TIMED", "PROCTORED"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStandingCard(card)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  SCORE & RANKING
                </button>

                <button
                  type="button"
                  onClick={() => handleStartMcqQuiz(card)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer hover:scale-[1.01]"
                >
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                  {isSolved ? "REVIEW ASSIGNMENT" : "START ASSIGNMENT"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCORE & RANKING MODAL */}
      {selectedStandingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedStandingCard(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#11161d] p-6 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Score & Ranking</h3>
                  <p className="text-xs text-slate-400">{selectedStandingCard.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStandingCard(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    GLOBAL RANK
                  </div>
                  <div className="mt-1 text-lg font-black text-sky-400">#4</div>
                  <div className="text-[10px] text-slate-500">of 1,420 cadets</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    PERCENTILE
                  </div>
                  <div className="mt-1 text-lg font-black text-amber-400">96.8%</div>
                  <div className="text-[10px] text-slate-500">Top Tier Apex</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    INTEGRITY
                  </div>
                  <div className="mt-1 text-lg font-black text-emerald-400">100%</div>
                  <div className="text-[10px] text-slate-500">Proctor Verified</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStandingCard(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSESSMENT BRIEFING MODAL */}
      {selectedBriefCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedBriefCard(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#11161d] p-6 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assessment Briefing</h3>
                  <p className="text-xs text-slate-400">{selectedBriefCard.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBriefCard(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="font-bold text-white">Overview & Instructions</div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedBriefCard.description ||
                    "Answer each multiple-choice question carefully. Points and XP are earned for accuracy."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBriefCard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setSelectedBriefCard(null);
                  handleStartMcqQuiz(selectedBriefCard);
                }}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Start Assignment
              </button>
            </div>
          </div>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
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
                    <div className="text-center rounded-2xl bg-gradient-to-b from-sky-50 to-indigo-50/30 dark:from-sky-950/30 dark:to-slate-900 p-6 border border-sky-100 dark:border-sky-900/40">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sky-500 text-slate-950 font-black text-2xl shadow-lg shadow-sky-500/30 mb-3">
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
                                <span className="font-bold text-sky-600 dark:text-sky-400 mr-1">
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
                      </button>
                      <button
                        onClick={() => setActiveQuizCard(null)}
                        className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
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
                        className="h-full bg-sky-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${((quizCurrentIndex + 1) / questions.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-full">
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
                                ? "border-sky-500 bg-sky-500/15 text-sky-900 dark:text-sky-100 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-sky-300 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold border transition-colors",
                                isChosen
                                  ? "bg-sky-500 border-sky-500 text-slate-950 font-bold"
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {quizCurrentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setQuizCurrentIndex((prev) => prev + 1)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submittingQuiz}
                          onClick={handleSubmitQuiz}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
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
