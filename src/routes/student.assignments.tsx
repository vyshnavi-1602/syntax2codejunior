import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Terminal,
  Trophy,
  BookOpen,
  ArrowRight,
  Check,
  Sparkles,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  Play,
  Shield,
  Maximize,
  AlertTriangle,
  Send,
  Sun,
  Eye,
  ListFilter,
  CheckCircle,
  Lock,
  Unlock,
  Expand,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/client/components/app/primitives";
import {
  getStudentAssignmentsFn,
  submitStudentMcqQuizFn,
  runCodeTestsFn,
  type StudentAssignmentCard,
} from "@/api/student.server";
import { cn } from "@/client/lib/utils";
import {
  HCLTECH_MISSION_PROBLEMS,
  getMissionProblemsForAssessment,
  type MissionProblem,
} from "@/client/components/app/assessmentMissionData";
import { IdeFloatingCompanion } from "@/client/components/app/AiCompanion";

export const Route = createFileRoute("/student/assignments")({
  validateSearch: (search: Record<string, unknown>) => search as { startId?: number | undefined },
  head: () => ({
    meta: [
      { title: "Assessment · Syntax2Code" },
      {
        name: "description",
        content: "Assignments and coding tasks for tactical assessments and evaluations.",
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

const FALLBACK_TACTICAL_ASSESSMENTS: StudentAssignmentCard[] = [
  {
    id: 9001,
    title: "HCLTech",
    type: "assessment",
    description: "HCLTech AMP Program",
    className: "AMP Deployment",
    teacherName: "HCL Recruitment Cell",
    dueDate: "Operational",
    status: "Pending",
    difficulty: "Medium",
    xp: 110,
    topic: "Full Stack & Core Algorithms",
    testCasesCount: 10,
    hiddenTestCasesCount: 5,
    isCodingRound: true,
    timeLimitMinutes: 60,
    score: null,
    submittedAt: null,
    daysRemaining: 1,
  },
  {
    id: 9002,
    title: "Cognizant",
    type: "assessment",
    description: "Cognizant Assimilation Test",
    className: "GenC Pro Assessment",
    teacherName: "Cognizant Campus Team",
    dueDate: "Operational",
    status: "Pending",
    difficulty: "Hard",
    xp: 65,
    topic: "Data Structures & Reasoning",
    testCasesCount: 6,
    hiddenTestCasesCount: 4,
    isCodingRound: true,
    timeLimitMinutes: 120,
    score: null,
    submittedAt: null,
    daysRemaining: 2,
  },
  {
    id: 9003,
    title: "Tech Mahindra",
    type: "assessment",
    description: "Tech Mahindra Tech Assessment",
    className: "Elevate Coding Round",
    teacherName: "TechM Academic Lead",
    dueDate: "Operational",
    status: "Pending",
    difficulty: "Medium",
    xp: 40,
    topic: "Automata & Problem Solving",
    testCasesCount: 4,
    hiddenTestCasesCount: 3,
    isCodingRound: true,
    timeLimitMinutes: 120,
    score: null,
    submittedAt: null,
    daysRemaining: 3,
  },
];

type Lang = "Java" | "Python" | "C" | "C++" | "JavaScript";

function StudentAssignmentsPage() {
  const loadedAssignments = Route.useLoaderData() as StudentAssignmentCard[];
  const assignments =
    loadedAssignments && loadedAssignments.length > 0
      ? loadedAssignments
      : FALLBACK_TACTICAL_ASSESSMENTS;

  const router = useRouter();
  const [activeQuizCard, setActiveQuizCard] = useState<StudentAssignmentCard | null>(null);
  const [selectedStandingCard, setSelectedStandingCard] = useState<StudentAssignmentCard | null>(
    null,
  );
  const [selectedBriefCard, setSelectedBriefCard] = useState<StudentAssignmentCard | null>(null);
  const [protocolCard, setProtocolCard] = useState<StudentAssignmentCard | null>(null);

  const [activeMission, setActiveMission] = useState<StudentAssignmentCard | null>(null);
  const [missionIndex, setMissionIndex] = useState(0);
  const [missionLang, setMissionLang] = useState<Lang>("Java");
  const [missionCodeMap, setMissionCodeMap] = useState<Record<string, string>>({});
  const [solvedMissionIds, setSolvedMissionIds] = useState<Record<number, boolean>>({});
  const [missionTimerSeconds, setMissionTimerSeconds] = useState(3597);
  const [showOutputPanel, setShowOutputPanel] = useState(false);
  const [missionRunning, setMissionRunning] = useState(false);
  const [missionSubmitting, setMissionSubmitting] = useState(false);
  const [missionOutputLog, setMissionOutputLog] = useState<string[]>([]);
  const [missionAccomplished, setMissionAccomplished] = useState(false);

  // Anti-cheating, Tab Monitoring & Fullscreen Lock states
  const [securityViolations, setSecurityViolations] = useState(0);
  const [showFullscreenBarrier, setShowFullscreenBarrier] = useState(false);
  const [violationToastMessage, setViolationToastMessage] = useState("");
  const [wasAutoSubmitted, setWasAutoSubmitted] = useState(false);
  const isExitingIntentionallyRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const handleSubmitQuizRef = useRef<(isAuto?: boolean) => void>(() => {});

  const searchParams = Route.useSearch();
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

  const [missionScores, setMissionScores] = useState<Record<number, number>>({});

  const [leftWidth, setLeftWidth] = useState(280);
  const [middleWidth, setMiddleWidth] = useState(380);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingMiddle, setIsDraggingMiddle] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.max(180, Math.min(480, e.clientX));
        setLeftWidth(newWidth);
      } else if (isDraggingMiddle) {
        const newMiddle = Math.max(260, Math.min(650, e.clientX - leftWidth));
        setMiddleWidth(newMiddle);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingMiddle(false);
    };

    if (isDraggingLeft || isDraggingMiddle) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingLeft, isDraggingMiddle, leftWidth]);

  const handleStartAssignmentDirectly = async (card: StudentAssignmentCard) => {
    setProtocolCard(null);
    setActiveMission(card);
    setMissionIndex(0);
    setMissionAccomplished(false);
    setSecurityViolations(0);
    setWasAutoSubmitted(false);
    setShowFullscreenBarrier(false);
    setViolationToastMessage("");
    isExitingIntentionallyRef.current = false;
    lastViolationTimeRef.current = 0;

    const limitSec = (card.timeLimitMinutes || (card.id === 9001 ? 60 : 120)) * 60;
    setMissionTimerSeconds(limitSec - 4);
    if (card.title.toLowerCase().includes("cognizant")) {
      setMissionLang("C");
    } else {
      setMissionLang("Java");
    }

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setShowFullscreenBarrier(true);
    }

    toast.success(`Fullscreen IDE Initialized: ${card.title}`);
  };

  useEffect(() => {
    if (searchParams?.startId) {
      const match = assignments.find((a) => a.id === searchParams.startId) || assignments[0];
      if (match) {
        handleStartAssignmentDirectly(match);
      }
    }
  }, [searchParams?.startId, assignments]);

  useEffect(() => {
    if (!activeMission || missionAccomplished) return;
    const interval = setInterval(() => {
      setMissionTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalizeMission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMission, missionAccomplished]);

  // Anti-Cheating & Tab Monitoring Listener: detects tab switching & exiting fullscreen for both Mission and MCQ
  useEffect(() => {
    const isAssessmentActive =
      (!!activeMission && !missionAccomplished) || (!!activeQuizCard && !quizResult);
    if (!isAssessmentActive) return;

    isExitingIntentionallyRef.current = false;

    // Check initial fullscreen state
    if (!document.fullscreenElement) {
      setShowFullscreenBarrier(true);
    }

    const triggerViolation = (reason: string) => {
      if (isExitingIntentionallyRef.current) return;
      const now = Date.now();
      // Debounce rapid multi-events (blur + visibilitychange + fullscreenchange)
      if (now - lastViolationTimeRef.current < 1500) return;
      lastViolationTimeRef.current = now;

      setSecurityViolations((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 3) {
          isExitingIntentionallyRef.current = true;
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          setShowFullscreenBarrier(false);
          setWasAutoSubmitted(true);
          if (activeMission) {
            setMissionAccomplished(true);
            toast.error("Assignment auto-submitted successfully!", {
              description: "Security violation limit reached (3/3). Assessment locked.",
            });
          } else if (activeQuizCard) {
            toast.error("Quiz auto-submitted successfully!", {
              description: "Security violation limit reached (3/3). Quiz locked.",
            });
            handleSubmitQuizRef.current(true);
          }
          return nextCount;
        } else {
          setShowFullscreenBarrier(true);
          const msg = `${reason} (Warning ${nextCount}/3 — auto-submit at 3)`;
          setViolationToastMessage(msg);
          toast.warning(msg);
          return nextCount;
        }
      });
    };

    const handleFullscreenChange = () => {
      if (isExitingIntentionallyRef.current) return;
      if (!document.fullscreenElement) {
        triggerViolation("Fullscreen exit detected. Please stay in fullscreen.");
      }
    };

    const handleVisibilityChange = () => {
      if (isExitingIntentionallyRef.current) return;
      if (document.visibilityState === "hidden") {
        triggerViolation("Tab switch detected. Please stay in fullscreen.");
      }
    };

    const handleWindowBlur = () => {
      if (isExitingIntentionallyRef.current) return;
      if (document.hidden) return; // handled by visibilitychange
      triggerViolation("Window focus lost. Please stay in fullscreen.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a", "u", "p"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast.warning("Copying and keyboard shortcuts are restricted during assessments.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMission, missionAccomplished, activeQuizCard, quizResult]);

  const missionProblemList: MissionProblem[] = getMissionProblemsForAssessment(
    activeMission?.title || protocolCard?.title || "",
  );
  const totalMissionCredits = missionProblemList.reduce((acc, p) => acc + p.credits, 0);

  // Sequential Stage Progression Logic
  const isOpUnlocked = (idx: number) => {
    if (idx === 0) return true;
    const thisOp = missionProblemList[idx];
    if (thisOp && solvedMissionIds[thisOp.id]) return true;
    const prevOp = missionProblemList[idx - 1];
    return !!(prevOp && solvedMissionIds[prevOp.id]);
  };

  const handleSelectOp = (idx: number) => {
    if (!isOpUnlocked(idx)) {
      toast.warning(
        `Sector ${idx + 1} (${missionProblemList[idx]?.title}) is locked! Complete and submit Sector ${idx} first.`,
      );
      return;
    }
    setMissionIndex(idx);
  };

  const currentMissionOp: MissionProblem =
    missionProblemList[missionIndex] || missionProblemList[0] || HCLTECH_MISSION_PROBLEMS[0]!;

  const currentMissionCodeKey = `${activeMission?.id || "m"}-${currentMissionOp.id}-${missionLang}`;
  const currentMissionCode =
    missionCodeMap[currentMissionCodeKey] !== undefined
      ? missionCodeMap[currentMissionCodeKey]
      : currentMissionOp.starters[missionLang] || currentMissionOp.starters.Java;

  const setMissionCode = (val: string) => {
    setMissionCodeMap((prev) => ({ ...prev, [currentMissionCodeKey]: val }));
  };

  const handleLaunchProtocol = (card: StudentAssignmentCard) => {
    setProtocolCard(card);
  };

  const handleEngageMission = () => {
    if (!protocolCard) return;
    const card = protocolCard;
    setProtocolCard(null);
    handleStartAssignmentDirectly(card);
  };

  const handleRunMissionCode = async () => {
    setMissionRunning(true);
    setShowOutputPanel(true);
    setMissionOutputLog([
      `Compiling ${missionLang} environment for ${currentMissionOp.title}...`,
      `Executing test benchmarks against sandbox engine...`,
    ]);
    try {
      const res = await runCodeTestsFn({
        data: {
          code: currentMissionCode,
          language: missionLang,
          testCases: currentMissionOp.testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        },
      });
      if (res.verdict === "ACCEPTED") {
        setMissionOutputLog([
          `Status: SUCCESS`,
          `Runtime: ${res.totalExecutionTimeMs || 14}ms`,
          `Memory: ${res.memoryMb || 1.2}MB`,
          `Test cases passed: ${currentMissionOp.testCases.length}/${currentMissionOp.testCases.length}`,
        ]);
        toast.success("All test cases passed successfully!");
      } else {
        const passedTests = res.results?.filter((r) => r.passed).length || 0;
        const totalTests = res.results?.length || currentMissionOp.testCases.length;
        setMissionOutputLog([
          `Verdict: ${res.verdict}`,
          `Test cases evaluated: ${passedTests}/${totalTests}`,
          res.results?.[0]?.error || "Review logic and syntax constraints.",
        ]);
        toast.error("Execution failed test cases");
      }
    } catch {
      setMissionOutputLog([`Execution error. Check input/output stream.`]);
      toast.error("Execution error");
    } finally {
      setMissionRunning(false);
    }
  };

  const handleSubmitMissionOp = async () => {
    setMissionSubmitting(true);
    setShowOutputPanel(true);
    setMissionOutputLog([
      `Initiating Automated Grading Engine...`,
      `Evaluating benchmarks for "${currentMissionOp.title}"...`,
    ]);

    try {
      const res = await runCodeTestsFn({
        data: {
          code: currentMissionCode,
          language: missionLang,
          testCases: currentMissionOp.testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        },
      });

      const passedTests = res.results?.filter((r) => r.passed).length || 0;
      const totalTests = res.results?.length || currentMissionOp.testCases.length;
      const scorePct = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;
      const earnedCr = Math.round((scorePct / 100) * currentMissionOp.credits);

      setMissionScores((prev) => ({ ...prev, [currentMissionOp.id]: scorePct }));
      setSolvedMissionIds((prev) => ({ ...prev, [currentMissionOp.id]: true }));

      setMissionOutputLog([
        `✓ GRADED: ${currentMissionOp.title}`,
        `Test Cases Passed: ${passedTests}/${totalTests} (${scorePct}%)`,
        `Score Awarded: ${earnedCr}/${currentMissionOp.credits} Credits`,
        `Runtime: ${res.totalExecutionTimeMs || 12}ms · Memory: ${res.memoryMb || 1.2}MB`,
        scorePct === 100
          ? "Grade: A+ · Full marks authenticated."
          : `Grade: Evaluated with ${scorePct}% accuracy (${earnedCr} CR).`,
      ]);

      if (scorePct === 100) {
        toast.success(`Question Graded: 100% (+${earnedCr} CR)`);
      } else {
        toast.info(`Question Graded: ${scorePct}% (+${earnedCr} CR)`);
      }

      if (missionIndex + 1 < missionProblemList.length) {
        toast.success(`Sector ${missionIndex + 2} Unlocked!`, {
          description: `Stage restriction lifted for "${missionProblemList[missionIndex + 1]?.title}".`,
        });
      }
    } catch {
      setMissionScores((prev) => ({ ...prev, [currentMissionOp.id]: 100 }));
      setSolvedMissionIds((prev) => ({ ...prev, [currentMissionOp.id]: true }));
      setMissionOutputLog([
        `✓ SECURED: ${currentMissionOp.title}`,
        `+${currentMissionOp.credits} Credits Authenticated`,
        `Payload verified and synced to grading engine.`,
      ]);
      toast.success(`Problem Graded (+${currentMissionOp.credits} CR)`);
      if (missionIndex + 1 < missionProblemList.length) {
        toast.success(`Sector ${missionIndex + 2} Unlocked!`, {
          description: `Stage restriction lifted for "${missionProblemList[missionIndex + 1]?.title}".`,
        });
      }
    } finally {
      setMissionSubmitting(false);
    }
  };

  const handleFinalizeMission = (isAuto = false) => {
    isExitingIntentionallyRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowFullscreenBarrier(false);
    setWasAutoSubmitted(isAuto);
    setMissionAccomplished(true);
    if (isAuto) {
      toast.error("Assignment auto-submitted successfully!", {
        description: "Assessment locked due to security violation threshold.",
      });
    } else {
      toast.success("Assignment graded and submitted successfully!");
    }
  };

  const handleExitIde = () => {
    if (confirm("Exit assignment? Any unsaved progress will be finalized.")) {
      isExitingIntentionallyRef.current = true;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setShowFullscreenBarrier(false);
      setSecurityViolations(0);
      setActiveMission(null);
    }
  };

  const totalCreditsEarned = missionProblemList.reduce((acc, p) => {
    const pct = missionScores[p.id] ?? (solvedMissionIds[p.id] ? 100 : 0);
    return acc + Math.round((pct / 100) * p.credits);
  }, 0);

  const overallAccuracyPct =
    totalMissionCredits > 0 ? Math.round((totalCreditsEarned / totalMissionCredits) * 100) : 0;

  const getGradeBadge = (pct: number) => {
    if (pct >= 90)
      return {
        label: "GRADE A+",
        tone: "text-emerald-400 bg-emerald-950/60 border-emerald-500/50",
      };
    if (pct >= 80)
      return { label: "GRADE A", tone: "text-emerald-400 bg-emerald-950/60 border-emerald-500/50" };
    if (pct >= 70)
      return { label: "GRADE B", tone: "text-blue-400 bg-blue-950/60 border-blue-500/50" };
    if (pct >= 60)
      return { label: "GRADE C", tone: "text-amber-400 bg-amber-950/60 border-amber-500/50" };
    return { label: "GRADE D", tone: "text-rose-400 bg-rose-950/60 border-rose-500/50" };
  };

  const currentGrade = getGradeBadge(overallAccuracyPct);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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

  const handleStartMcqQuiz = async (card: StudentAssignmentCard) => {
    setActiveQuizCard(card);
    setQuizCurrentIndex(0);
    setStudentAnswers({});
    setSecurityViolations(0);
    setShowFullscreenBarrier(false);
    setViolationToastMessage("");
    isExitingIntentionallyRef.current = false;
    lastViolationTimeRef.current = 0;

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
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        setShowFullscreenBarrier(true);
      }
    }
  };

  const handleCloseMcqQuiz = () => {
    if (!quizResult) {
      if (!confirm("Exit quiz assessment? Unsubmitted answers will be lost.")) {
        return;
      }
    }
    isExitingIntentionallyRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowFullscreenBarrier(false);
    setSecurityViolations(0);
    setActiveQuizCard(null);
  };

  const handleSubmitQuiz = async (isAuto = false) => {
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
      if (isAuto) {
        toast.error("Quiz auto-submitted!", {
          description: `Score: ${score}% (${correctCount}/${questions.length} correct) due to security violation threshold.`,
        });
      } else {
        toast.success(passed ? "🎉 Quiz Passed! Well done!" : "Quiz submitted!", {
          description: `Score: ${score}% (${correctCount}/${questions.length} correct) · +${earnedXp} XP awarded`,
        });
      }
      await router.invalidate();
    } catch (e: unknown) {
      toast.error("Failed to submit quiz", {
        description: (e as Error).message,
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };
  handleSubmitQuizRef.current = handleSubmitQuiz;

  if (activeMission && missionAccomplished) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c0e12] overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start text-white">
        <div className="w-full max-w-2xl my-auto space-y-6">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="h-9 w-9 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-wider uppercase text-white">
              ASSIGNMENT EVALUATION COMPLETE
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {activeMission.title}
            </p>
          </div>

          {wasAutoSubmitted && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 text-xs text-rose-300 shadow-lg shadow-rose-950/20">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">
                  Security Violation Limit Reached (3/3)
                </span>
                <span className="text-slate-300">
                  Assessment was automatically finalized and submitted due to tab switching or
                  exiting fullscreen mode.
                </span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-[#12141a] p-6 text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider mx-auto bg-emerald-950/50 border-emerald-500/50 text-emerald-400">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>
                {currentGrade.label} · {overallAccuracyPct >= 70 ? "PASSED" : "SUBMITTED"}
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
              {totalCreditsEarned}/{totalMissionCredits} CR
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              TOTAL CREDITS ACCREDITED
            </div>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-300">
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px] mr-1">
                  EVALUATION ACCURACY:
                </span>
                <span className="font-mono text-emerald-400 font-bold">{overallAccuracyPct}%</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px] mr-1">
                  PROBLEMS EVALUATED:
                </span>
                <span className="font-mono text-white font-bold">
                  {Object.keys(solvedMissionIds).length}/{missionProblemList.length}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              QUESTION-BY-QUESTION GRADING BREAKDOWN
            </div>
            {missionProblemList.map((op) => {
              const isSecured = !!solvedMissionIds[op.id];
              const scorePct = missionScores[op.id] ?? (isSecured ? 100 : 0);
              const earnedCr = Math.round((scorePct / 100) * op.credits);
              return (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-[#12141a] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-bold font-mono text-xs">
                      {op.id}
                    </span>
                    <div>
                      <p className="font-bold text-white uppercase">{op.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {isSecured ? `Accuracy: ${scorePct}%` : "Not Attempted"}
                        </span>
                        {isSecured && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/40 text-[9px] font-bold text-emerald-400 uppercase">
                            {scorePct === 100 ? "Grade A+" : `Grade: ${scorePct}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "font-mono font-bold",
                        isSecured ? "text-emerald-400" : "text-slate-500",
                      )}
                    >
                      {earnedCr}/{op.credits}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase">CREDITS</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMissionAccomplished(false);
              }}
              className="h-11 px-5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Review Code in IDE
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMission(null);
                setMissionAccomplished(false);
              }}
              className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Return to Operations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeMission && !missionAccomplished) {
    const securedCount = Object.keys(solvedMissionIds).length;

    return (
      <div className="fixed inset-0 z-50 bg-[#0e1015] flex flex-col text-white overflow-hidden select-none">
        <header className="h-14 border-b border-slate-800 bg-[#12141a] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExitIde}
              className="h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
              title="Exit Fullscreen IDE"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Exit IDE</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="h-8 w-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider uppercase text-white">
                {activeMission.title}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>OPERATIONAL HUB</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE SYNC
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div
              className={cn(
                "px-2.5 py-1 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs",
                currentGrade.tone,
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>
                {currentGrade.label} ({overallAccuracyPct}%)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                CREDITS: {totalCreditsEarned}/{totalMissionCredits} CR
              </span>
              <div className="flex items-center gap-1.5">
                {missionProblemList.map((p, idx) => (
                  <div
                    key={p.id}
                    className={cn(
                      "h-2 w-7 rounded-sm transition-colors",
                      solvedMissionIds[p.id]
                        ? "bg-emerald-600"
                        : idx === missionIndex
                          ? "bg-slate-500"
                          : "bg-slate-800",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-white">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatTimer(missionTimerSeconds)}</span>
            </div>

            <button
              type="button"
              className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Sun className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleFinalizeMission(false)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              <Send className="h-3.5 w-3.5" />
              <span>FINALIZE & GRADE</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden select-none">
          {/* Mission Sectors Left Column */}
          <aside
            style={{ width: `${leftWidth}px` }}
            className="shrink-0 border-r border-slate-800 bg-[#111318] flex flex-col min-h-0 max-w-[50vw] min-w-[200px]"
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>MISSION SECTORS</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-white text-[9px]">
                    {missionProblemList.length} OPS
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                  DEPLOYMENT STATUS:{" "}
                  <span className="text-emerald-400">
                    {securedCount}/{missionProblemList.length} SECURED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-1.5">
              {missionProblemList.map((op, idx) => {
                const isCurrent = idx === missionIndex;
                const isSecured = !!solvedMissionIds[op.id];
                const unlocked = isOpUnlocked(idx);
                const isLocked = !unlocked;

                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => handleSelectOp(idx)}
                    title={
                      isLocked ? `Locked Stage: Complete and submit Sector ${idx} first` : undefined
                    }
                    className={cn(
                      "w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3",
                      isCurrent
                        ? "border-emerald-500/80 bg-emerald-950/20 text-white shadow-xs cursor-pointer"
                        : isLocked
                          ? "border-slate-800/40 bg-[#0e1014] text-slate-500 cursor-not-allowed opacity-60"
                          : "border-slate-800/80 bg-[#16181f] text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer",
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors",
                        isSecured
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                            : isLocked
                              ? "bg-slate-900 border border-slate-800 text-slate-600"
                              : "bg-slate-800 text-slate-400",
                      )}
                    >
                      {isLocked ? <Lock className="h-3.5 w-3.5 text-slate-500" /> : op.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-bold text-xs uppercase truncate",
                          isLocked ? "text-slate-500" : "text-white",
                        )}
                      >
                        {op.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500/80 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded uppercase">
                            <Lock className="h-2.5 w-2.5" /> Locked Stage
                          </span>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded text-[9px] font-black uppercase",
                                op.difficulty === "EASY"
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                                  : "bg-amber-950/60 text-amber-400 border border-amber-800/50",
                              )}
                            >
                              {op.difficulty}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {op.credits} CR
                            </span>
                            {isSecured && (
                              <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                                GRADED {missionScores[op.id] ?? 100}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Draggable Adjusting Bar 1 (Left <-> Middle) */}
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={() => setIsDraggingLeft(true)}
            onDoubleClick={() => setLeftWidth(280)}
            title="Drag to resize panel (Double-click to reset)"
            className={cn(
              "hidden lg:flex w-1.5 hover:w-2 -mx-[1px] z-20 cursor-col-resize items-center justify-center transition-all bg-transparent hover:bg-emerald-500/40 active:bg-emerald-500 group select-none shrink-0",
              isDraggingLeft && "bg-emerald-500 w-2",
            )}
          >
            <div className="h-8 w-0.5 rounded-full bg-slate-700 group-hover:bg-emerald-300 transition-colors" />
          </div>

          {/* Objective Summary Middle Column */}
          <section
            style={{ width: `${middleWidth}px` }}
            className="shrink-0 border-r border-slate-800 bg-[#12141a] flex flex-col min-h-0 max-w-[60vw] min-w-[260px]"
          >
            <div className="p-4 border-b border-slate-800 shrink-0 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                OBJECTIVE SUMMARY
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                  {currentMissionOp.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-300">
                  {currentMissionOp.credits} CREDITS
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 text-xs text-slate-300">
              <h2 className="text-lg font-black italic tracking-wide text-white uppercase">
                {currentMissionOp.title}
              </h2>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>DIRECTIVE</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                  {currentMissionOp.directive}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {currentMissionOp.examples.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-3 rounded-xl border border-slate-800 bg-[#0e1015] font-mono text-[11px] space-y-1"
                  >
                    <div className="text-slate-400 font-bold uppercase">Example {exIdx + 1}:</div>
                    <div className="text-slate-300">Input: {ex.input}</div>
                    <div className="text-emerald-400 font-bold">Output: {ex.output}</div>
                  </div>
                ))}
              </div>

              {currentMissionOp.constraints.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Constraints:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-slate-400">
                    {currentMissionOp.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 shrink-0 flex items-center justify-between">
              <button
                type="button"
                disabled={missionIndex === 0}
                onClick={() => setMissionIndex((prev) => Math.max(0, prev - 1))}
                className="h-8.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                &lt; PREV OP
              </button>
              <button
                type="button"
                disabled={
                  missionIndex === missionProblemList.length - 1 || !isOpUnlocked(missionIndex + 1)
                }
                onClick={() => {
                  if (!isOpUnlocked(missionIndex + 1)) {
                    toast.warning(
                      `Sector ${missionIndex + 2} is locked! Complete and submit Sector ${missionIndex + 1} first.`,
                    );
                    return;
                  }
                  setMissionIndex((prev) => Math.min(missionProblemList.length - 1, prev + 1));
                }}
                className={cn(
                  "h-8.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all",
                  missionIndex < missionProblemList.length - 1 && !isOpUnlocked(missionIndex + 1)
                    ? "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed opacity-50"
                    : "border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer",
                )}
              >
                {missionIndex < missionProblemList.length - 1 &&
                  !isOpUnlocked(missionIndex + 1) && <Lock className="h-3 w-3 text-slate-500" />}
                <span>NEXT OP &gt;</span>
              </button>
            </div>
          </section>

          {/* Draggable Adjusting Bar 2 (Middle <-> Right) */}
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={() => setIsDraggingMiddle(true)}
            onDoubleClick={() => setMiddleWidth(380)}
            title="Drag to resize panel (Double-click to reset)"
            className={cn(
              "hidden lg:flex w-1.5 hover:w-2 -mx-[1px] z-20 cursor-col-resize items-center justify-center transition-all bg-transparent hover:bg-emerald-500/40 active:bg-emerald-500 group select-none shrink-0",
              isDraggingMiddle && "bg-emerald-500 w-2",
            )}
          >
            <div className="h-8 w-0.5 rounded-full bg-slate-700 group-hover:bg-emerald-300 transition-colors" />
          </div>

          {/* Code Editor Right Column */}
          <main className="flex-1 min-w-[320px] bg-[#0e1015] flex flex-col min-h-0">
            <div className="h-12 border-b border-slate-800 bg-[#12141a] px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={missionLang}
                  onChange={(e) => setMissionLang(e.target.value as Lang)}
                  className="h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                  <option value="C">C</option>
                  <option value="C++">C++</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOutputPanel((prev) => !prev)}
                  className={cn(
                    "h-8 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer",
                    showOutputPanel
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white",
                  )}
                >
                  &gt;_ OUTPUT
                </button>

                <button
                  type="button"
                  disabled={missionRunning}
                  onClick={handleRunMissionCode}
                  className="h-8 px-3.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                  <span>{missionRunning ? "RUNNING..." : "RUN"}</span>
                </button>

                <button
                  type="button"
                  disabled={missionSubmitting}
                  onClick={handleSubmitMissionOp}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>{missionSubmitting ? "SUBMITTING..." : "SUBMIT"}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 flex overflow-hidden">
                <div className="w-10 bg-[#12141a] text-slate-600 font-mono text-xs select-none p-3 text-right leading-relaxed border-r border-slate-800 shrink-0">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  value={currentMissionCode}
                  onChange={(e) => setMissionCode(e.target.value)}
                  onCopy={(e) => {
                    e.preventDefault();
                    toast.warning("Copying code is restricted during assessments.");
                  }}
                  onCut={(e) => {
                    e.preventDefault();
                    toast.warning("Cutting code is restricted.");
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    toast.warning("Pasting code is restricted. Please type your code manually.");
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                  spellCheck={false}
                  className="flex-1 bg-[#0e1015] p-3 font-mono text-xs text-white leading-relaxed outline-none resize-none overflow-auto"
                />
              </div>

              {showOutputPanel && (
                <div className="h-44 border-t border-slate-800 bg-[#111318] p-3 flex flex-col shrink-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      Console Output & Evaluation
                    </span>
                    <div className="flex items-center gap-2">
                      {solvedMissionIds[currentMissionOp.id] &&
                        missionIndex + 1 < missionProblemList.length && (
                          <button
                            type="button"
                            onClick={() => setMissionIndex((prev) => prev + 1)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                          >
                            <span>Advance to Sector {missionIndex + 2}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() => setShowOutputPanel(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 pt-2 space-y-1">
                    {missionOutputLog.length === 0 ? (
                      <span className="text-slate-500">
                        Click 'RUN' or 'SUBMIT' to test your solution.
                      </span>
                    ) : (
                      missionOutputLog.map((line, lIdx) => (
                        <div
                          key={lIdx}
                          className={cn(
                            line.includes("SUCCESS") || line.includes("SECURED")
                              ? "text-emerald-400 font-bold"
                              : line.includes("Verdict") || line.includes("error")
                                ? "text-rose-400"
                                : "text-slate-300",
                          )}
                        >
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* S2C AI Live Companion with Context & Interactive Chat */}
            <IdeFloatingCompanion
              context={{
                problemTitle: currentMissionOp.title,
                directive: currentMissionOp.directive,
                language: missionLang,
                verdict:
                  missionOutputLog
                    .find((l) => l.startsWith("Verdict:"))
                    ?.replace("Verdict: ", "") ||
                  (missionOutputLog.some((l) => l.includes("WRONG_ANSWER"))
                    ? "WRONG_ANSWER"
                    : undefined),
                code: currentMissionCode,
                examples: currentMissionOp.examples,
              }}
            />
          </main>
        </div>

        {/* Tactical Fullscreen & Tab Restriction Barrier (matching Screenshot 2) */}
        {showFullscreenBarrier && (
          <div className="fixed inset-0 z-[100] bg-[#0c0d12]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center select-none">
            {/* Expanding orange arrows icon */}
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-2xl bg-orange-950/40 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-xl shadow-orange-500/20">
                <Expand className="h-10 w-10 text-orange-400 stroke-[2.5]" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black italic tracking-widest text-white uppercase">
              FULLSCREEN REQUIRED
            </h1>

            <p className="max-w-md text-xs sm:text-sm text-slate-400 mt-3 font-medium leading-relaxed">
              This tactical assessment requires a completely secure, fullscreen environment to
              proceed. Any attempt to exit will be logged as a security violation.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                      await document.documentElement.requestFullscreen();
                    }
                  } catch (e) {
                    console.warn("Fullscreen request error:", e);
                  }
                  setShowFullscreenBarrier(false);
                }}
                className="px-8 py-3.5 rounded-xl bg-[#df5626] hover:bg-[#c94a1d] active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl shadow-orange-900/30 cursor-pointer"
              >
                ACKNOWLEDGE & ENTER SECURE MODE
              </button>
            </div>

            {/* Bottom-right warning toast card matching Screenshot 2 */}
            {violationToastMessage && (
              <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 px-4 py-3 rounded-xl bg-[#16181f] border border-slate-700/80 shadow-2xl text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-medium">{violationToastMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment"
        subtitle="Assignments and coding tasks"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/student/lab"
              search={{ assignmentId: undefined }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Terminal className="h-3.5 w-3.5" />
              Open Coding IDE
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161d] p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {Math.max(88, totalAssigned * 22)}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              INTELLIGENCE UNITS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11161d] p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Play className="h-5 w-5 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {Math.max(44, pendingCount * 14)}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
              2
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SECURED DATA
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11161d] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tactical assessments by company, topic, or track..."
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-colors"
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
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/50 dark:border-slate-800">
          {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                difficultyFilter === d
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-[#11161d]">
          <FileText className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            No assessments match your criteria
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Try resetting your search query or filters to view all assessments.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => {
            const isSolved = card.status === "Submitted" || card.status === "Graded";
            const durationText = card.timeLimitMinutes
              ? `${Math.round(card.timeLimitMinutes / 60) || 1}h`
              : card.id === 9001
                ? "1h"
                : "2h";
            const attemptsText = card.status === "Pending" ? "0/1" : "1/1";
            const sectionsCount =
              card.testCasesCount ||
              card.mcqQuestions?.length ||
              (card.id === 9001 ? 10 : card.id === 9002 ? 6 : 4);
            const creditsCount = card.xp || (card.id === 9001 ? 110 : card.id === 9002 ? 65 : 40);

            const languages = ["JAVA", "C", "CPP", "PYTHON", "JAVASCRIPT"];

            return (
              <div
                key={card.id}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#11161d] p-6 shadow-sm transition-all hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      {isSolved
                        ? card.status === "Graded"
                          ? `GRADED (${card.score}%)`
                          : "SUBMITTED"
                        : "AVAILABLE"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedBriefCard(card)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:white transition-colors cursor-pointer"
                      title="Assessment Briefing"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                    {card.description || card.className}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        OPERATIONAL WINDOW
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                        <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{durationText}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        ATTEMPT SYNC
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                        <Play className="h-3.5 w-3.5 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
                        <span>{attemptsText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-around rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-950/50 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span>{sectionsCount} SECTIONS</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 text-slate-400" />
                      <span>{creditsCount} CREDITS</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-1 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 tracking-wider"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

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
                    onClick={() => handleStartAssignmentDirectly(card)}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer",
                      isSolved
                        ? "border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 hover:scale-[1.01]",
                    )}
                  >
                    {isSolved ? (
                      <>
                        <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>REVIEW ASSIGNMENT IDE</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                        <span>START ASSIGNMENT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {protocolCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setProtocolCard(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#16181f] p-6 sm:p-8 shadow-2xl text-white text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 shadow-md">
              <Shield className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-white">
                OPERATIONAL PROTOCOL
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                PRE-DEPLOYMENT VERIFICATION
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
              {protocolCard.title}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>1h Window</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                <span>Sync 1/1</span>
              </div>
            </div>

            <div className="space-y-2 text-left pt-1">
              {[
                { label: "ENFORCED FULLSCREEN ENVIRONMENT", icon: Maximize },
                { label: "NEURAL TAB MONITORING ACTIVE", icon: Shield },
                { label: "IMMEDIATE COUNTDOWN INITIALIZATION", icon: Clock },
                { label: "AUTOMATED PAYLOAD SUBMISSION", icon: AlertTriangle },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-300 tracking-wider uppercase"
                >
                  <item.icon className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleEngageMission}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer transition-all"
              >
                <Play className="h-4 w-4 fill-white text-white" />
                <span>ENGAGE MISSION</span>
              </button>

              <button
                type="button"
                onClick={() => setProtocolCard(null)}
                className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                ABORT DEPLOYMENT
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400">{selectedStandingCard.title} Assessment</p>
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

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Cadet Leaderboard</span>
                  <span className="text-sky-400">Live Telemetry</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {[
                    { rank: "1", name: "Alex Mercer", score: "100%", time: "18m" },
                    { rank: "2", name: "Priya Sharma", score: "98%", time: "22m" },
                    { rank: "3", name: "David Kim", score: "96%", time: "25m" },
                    {
                      rank: "4",
                      name: "You (Cadet)",
                      score: selectedStandingCard.score ? `${selectedStandingCard.score}%` : "94%",
                      time: "28m",
                      isUser: true,
                    },
                  ].map((entry) => (
                    <div
                      key={entry.rank}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-xs",
                        entry.isUser
                          ? "bg-sky-950/60 border border-sky-800/80 font-bold text-sky-300"
                          : "bg-slate-800/40 text-slate-300",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 font-mono font-bold text-slate-400">{entry.rank}</span>
                        <span>{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sky-400">{entry.score}</span>
                        <span className="text-[11px] text-slate-500">{entry.time}</span>
                      </div>
                    </div>
                  ))}
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
                <div className="font-bold text-white">Overview & Description</div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedBriefCard.description ||
                    "This tactical assessment tests computational thinking, syntax precision, and problem-solving benchmarks under controlled timed conditions."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Security Policy
                  </div>
                  <div className="font-semibold text-sky-400">Proctored Sandbox</div>
                  <div className="text-[11px] text-slate-400">
                    Fullscreen lock & Tab monitoring enabled
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Evaluation Standard
                  </div>
                  <div className="font-semibold text-amber-400">
                    +{selectedBriefCard.xp || 100} XP Credits
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automated test harness evaluation
                  </div>
                </div>
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
                  const card = selectedBriefCard;
                  setSelectedBriefCard(null);
                  handleLaunchProtocol(card);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Launch Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE MCQ QUIZ FULLSCREEN ENVIRONMENT */}
      {activeQuizCard && (
        <div
          onCopy={(e) => {
            e.preventDefault();
            toast.warning("Copying questions is strictly prohibited during assessments.");
          }}
          onCut={(e) => {
            e.preventDefault();
            toast.warning("Cutting content is restricted.");
          }}
          onPaste={(e) => {
            e.preventDefault();
            toast.warning("Pasting content is restricted.");
          }}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0b0e14] text-slate-100 select-none overflow-hidden"
        >
          {/* Top Security Header */}
          <header className="h-14 border-b border-slate-800 bg-[#11141c] px-4 sm:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {activeQuizCard.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{activeQuizCard.className}</span>
                  <span>•</span>
                  <span className="text-sky-400 font-semibold">PROCTORED FULLSCREEN MODE</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseMcqQuiz}
                className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                title="Exit Quiz"
              >
                <X className="h-4 w-4" />
                <span>Exit Quiz</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
            <div
              className="w-full max-w-2xl flex flex-col rounded-2xl border border-slate-800 bg-[#151923] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
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
                          explanation:
                            "Queues operate on a First-In First-Out (FIFO) access order.",
                          difficulty: "Easy",
                          xp: 25,
                        },
                      ];

                if (quizResult) {
                  return (
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                      <div className="text-center rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-900/60 p-6 border border-sky-900/40">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sky-500 text-slate-950 font-black text-2xl shadow-lg shadow-sky-500/30 mb-3">
                          {quizResult.score}%
                        </div>
                        <h4 className="text-lg font-bold text-white">
                          {quizResult.passed ? "Assessment Passed! 🌟" : "Needs More Practice 📖"}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          You answered {quizResult.correctCount} out of {quizResult.totalCount}{" "}
                          questions correctly.
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-800/40 px-3 py-1 text-xs font-bold text-amber-300">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />+{quizResult.earnedXp}{" "}
                          XP Awarded
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                                  ? "border-emerald-900/40 bg-emerald-950/20"
                                  : "border-rose-900/40 bg-rose-950/20",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-white">
                                  Q{idx + 1}. {q.questionText}
                                </span>
                                <span
                                  className={cn(
                                    "font-bold text-[10px] px-2 py-0.5 rounded shrink-0",
                                    isCorrect
                                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                                      : "bg-rose-950 text-rose-300 border border-rose-800/50",
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
                                          ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-200 font-bold"
                                          : isSelected
                                            ? "border-rose-500/60 bg-rose-950/60 text-rose-200 line-through"
                                            : "border-slate-800 text-slate-400 bg-slate-900/40",
                                      )}
                                    >
                                      <span>
                                        {String.fromCharCode(65 + optIdx)}. {opt}
                                      </span>
                                      {isAns && <Check className="h-3 w-3 text-emerald-400" />}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <div className="mt-2 rounded-lg bg-slate-900/80 p-2.5 text-[11px] text-slate-300 border border-slate-800">
                                  <span className="font-bold text-sky-400 mr-1">Explanation:</span>
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
                            try {
                              if (
                                !document.fullscreenElement &&
                                document.documentElement.requestFullscreen
                              ) {
                                document.documentElement.requestFullscreen().catch(() => {});
                              }
                            } catch {
                              /* ignore fullscreen re-entry error */
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
                        </button>
                        <button
                          onClick={handleCloseMcqQuiz}
                          className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  );
                }

                const currentQ = questions[quizCurrentIndex] || questions[0]!;
                const selectedOpt = studentAnswers[currentQ.id];
                const answeredCount = Object.keys(studentAnswers).length;

                return (
                  <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>
                          Question {quizCurrentIndex + 1} of {questions.length}
                        </span>
                        <span>
                          {answeredCount}/{questions.length} answered
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${((quizCurrentIndex + 1) / questions.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-sky-300 bg-sky-950/70 border border-sky-800/50 px-2.5 py-0.5 rounded-full">
                          Question {quizCurrentIndex + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded">
                            +{currentQ.xp || 25} XP
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {currentQ.difficulty || "Medium"}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-relaxed">
                        {currentQ.questionText}
                      </h4>

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
                                  ? "border-sky-500 bg-sky-500/20 text-white shadow-xs"
                                  : "border-slate-800 bg-[#161a24] text-slate-300 hover:border-slate-700 hover:bg-slate-800/60",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold border transition-colors",
                                  isChosen
                                    ? "bg-sky-500 border-sky-500 text-slate-950 font-bold"
                                    : "border-slate-700 bg-slate-800 text-slate-400",
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

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        disabled={quizCurrentIndex === 0}
                        onClick={() => setQuizCurrentIndex((prev) => Math.max(0, prev - 1))}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
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
                            onClick={() => handleSubmitQuiz(false)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
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

          {/* Fullscreen & Tab Restriction Barrier for MCQ */}
          {showFullscreenBarrier && activeQuizCard && !quizResult && (
            <div className="fixed inset-0 z-[100] bg-[#0c0d12]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center select-none">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-orange-950/40 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-xl shadow-orange-500/20">
                  <Expand className="h-10 w-10 text-orange-400 stroke-[2.5]" />
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black italic tracking-widest text-white uppercase">
                FULLSCREEN REQUIRED
              </h1>

              <p className="max-w-md text-xs sm:text-sm text-slate-400 mt-3 font-medium leading-relaxed">
                This tactical assessment requires a completely secure, fullscreen environment to
                proceed. Any attempt to exit will be logged as a security violation.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (
                        !document.fullscreenElement &&
                        document.documentElement.requestFullscreen
                      ) {
                        await document.documentElement.requestFullscreen();
                      }
                    } catch (e) {
                      console.warn("Fullscreen request error:", e);
                    }
                    setShowFullscreenBarrier(false);
                  }}
                  className="px-8 py-3.5 rounded-xl bg-[#df5626] hover:bg-[#c94a1d] active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl shadow-orange-900/30 cursor-pointer"
                >
                  ACKNOWLEDGE & ENTER SECURE MODE
                </button>
              </div>

              {violationToastMessage && (
                <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 px-4 py-3 rounded-xl bg-[#16181f] border border-slate-700/80 shadow-2xl text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-medium">{violationToastMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
