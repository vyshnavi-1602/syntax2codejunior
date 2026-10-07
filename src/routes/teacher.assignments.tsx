import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Copy,
  Code2,
  Eye,
  EyeOff,
  Sparkles,
  FileCode,
  X,
  Terminal,
  Send,
  Award,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
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
  updateAssignmentFn,
  duplicateAssignmentFn,
  deleteAssignmentFn,
  getAssignmentSubmissionsFn,
  gradeAssignmentSubmissionFn,
  sendAssignmentReminderFn,
  type TeacherAssignmentItem,
  type AssignmentSubmissionDetail,
} from "@/api/teacher.server";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments · Syntax2Code" },
      {
        name: "description",
        content:
          "Create coding assessments with automated test cases, publish multi-question tasks, and review performance.",
      },
      { property: "og:title", content: "Assignments · Syntax2Code" },
      {
        property: "og:description",
        content:
          "Assignment creator, multi-question coding round builder, test suites, submissions grader, and analytics.",
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
        { q: "Q1. Variables & I/O", correct: 85 },
        { q: "Q2. Conditional Logic", correct: 65 },
        { q: "Q3. Loops & Range", correct: 48 },
        { q: "Q4. Functions & Arrays", correct: 74 },
      ],
    };
  },
  component: AssignmentsPage,
});

export interface CodingTestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface AssignmentQuestionItem {
  id: string;
  title: string;
  prompt: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  testCases: CodingTestCase[];
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
}

interface ParsedCodingRound {
  isCodingRound: boolean;
  description: string;
  prompt?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  xp?: number;
  starters?: Record<string, string>;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
  questions?: Array<AssignmentQuestionItem>;
}

const tabs = ["All assignments", "Coding assessments", "Question analytics"] as const;
type StarterLang = "Python" | "JavaScript" | "Java" | "C++" | "C";

const DEFAULT_STARTERS: Record<StarterLang, string> = {
  Python: `# Write your solution in Python\n# Read input from standard input\ntry:\n    # Example: a, b = map(int, input().split())\n    # print(a + b)\n    pass\nexcept Exception as e:\n    pass\n`,
  JavaScript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on('line', (line) => {\n  // Process input and output with console.log\n  process.exit(0);\n});\n`,
  Java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write solution here\n    }\n}\n`,
  "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write solution here\n    return 0;\n}\n`,
  C: `#include <stdio.h>\n\nint main() {\n    // Write solution here\n    return 0;\n}\n`,
};

function createInitialQuestion(num = 1): AssignmentQuestionItem {
  return {
    id: `q-${Date.now()}-${num}`,
    title: `Problem ${num}: Sum of Two Numbers`,
    prompt: "Read two space-separated integers from standard input and output their sum.",
    inputFormat: "Two space-separated integers: a b (e.g. 10 20)",
    outputFormat: "A single integer representing the result (e.g. 30)",
    constraints: "0 <= a, b <= 1000",
    testCases: [
      { id: 1, input: "10 20", expectedOutput: "30", isHidden: false },
      { id: 2, input: "45 55", expectedOutput: "100", isHidden: false },
      { id: 3, input: "999 1", expectedOutput: "1000", isHidden: true },
    ],
    difficulty: "Easy",
    xp: 50,
  };
}

function AssignmentsPage() {
  const data = Route.useLoaderData();
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>(data?.assignments || []);

  useEffect(() => {
    if (data?.assignments) {
      setAssignments(data.assignments);
    }
  }, [data?.assignments]);

  const classes = data?.classes || [];
  const questionAnalytics = data?.questionAnalytics || [];
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All assignments");

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);
  const [titleError, setTitleError] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Duplication Modal state
  const [duplicatingAssignment, setDuplicatingAssignment] = useState<TeacherAssignmentItem | null>(
    null,
  );
  const [targetCloneClass, setTargetCloneClass] = useState("");
  const [isCloning, setIsCloning] = useState(false);

  // Submissions & Grading Drawer Modal state
  const [gradingAssignment, setGradingAssignment] = useState<TeacherAssignmentItem | null>(null);
  const [submissionData, setSubmissionData] = useState<{
    assignment: {
      id: number;
      title: string;
      type: string;
      className: string;
      instructions: string | null;
      dueDate: string | null | undefined;
    };
    students: AssignmentSubmissionDetail[];
    stats: { total: number; submitted: number; avgScore: number };
  } | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AssignmentSubmissionDetail | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const availableClasses =
    classes.length > 0
      ? classes
      : [
          { id: 1, name: "Grade 8A" },
          { id: 2, name: "Grade 8B" },
          { id: 3, name: "Grade 9A" },
          { id: 4, name: "Grade 6A" },
        ];

  // Base Form
  const [form, setForm] = useState({
    title: "",
    className: availableClasses[0]?.name || "Grade 8A",
    due: new Date().toISOString().split("T")[0],
    type: "Coding task",
    status: "Active",
    instructions: "",
    difficulty: "Easy" as "Easy" | "Medium" | "Hard",
    xp: 60,
  });

  // Multiple Questions Support in Coding Rounds
  const [isCodingRound, setIsCodingRound] = useState(true);
  const [questions, setQuestions] = useState<AssignmentQuestionItem[]>([createInitialQuestion(1)]);
  const [activeQIndex, setActiveQIndex] = useState(0);

  // Current active question in view
  const currentQ = questions[activeQIndex] || questions[0] || createInitialQuestion(1);

  // Starter Code Tabs
  const [starterTab, setStarterTab] = useState<StarterLang>("Python");
  const [starters, setStarters] = useState<Record<StarterLang, string>>(DEFAULT_STARTERS);
  const [showStartersEditor, setShowStartersEditor] = useState(false);

  // View modal for an assignment's test cases
  const [viewingCodingRound, setViewingCodingRound] = useState<{
    title: string;
    className: string;
    details: ParsedCodingRound;
  } | null>(null);
  const [viewingQIndex, setViewingQIndex] = useState(0);

  const updateCurrentQuestion = <K extends keyof AssignmentQuestionItem>(
    key: K,
    value: AssignmentQuestionItem[K],
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQIndex ? { ...q, [key]: value } : q)),
    );
  };

  const addQuestion = (preset?: Partial<AssignmentQuestionItem>) => {
    const nextNum = questions.length + 1;
    const newQ: AssignmentQuestionItem = {
      id: `q-${Date.now()}-${nextNum}`,
      title: preset?.title || `Problem ${nextNum}: New Task`,
      prompt: preset?.prompt || "",
      inputFormat: preset?.inputFormat || "Standard Input (stdin)",
      outputFormat: preset?.outputFormat || "Standard Output (stdout)",
      constraints: preset?.constraints || "1 <= N <= 1000",
      testCases: preset?.testCases || [
        { id: 1, input: "10 20", expectedOutput: "30", isHidden: false },
        { id: 2, input: "100 200", expectedOutput: "300", isHidden: true },
      ],
      difficulty: preset?.difficulty || "Easy",
      xp: preset?.xp || 50,
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQIndex(questions.length);
    toast.success(`Added question: ${newQ.title}`);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) {
      toast.error("At least one question is required in a coding assignment");
      return;
    }
    const filtered = questions.filter((_, i) => i !== idx);
    setQuestions(filtered);
    if (activeQIndex >= filtered.length) {
      setActiveQIndex(filtered.length - 1);
    }
  };

  const resetFormState = () => {
    setForm({
      title: "",
      className: availableClasses[0]?.name || "Grade 8A",
      due: new Date().toISOString().split("T")[0],
      type: "Coding task",
      status: "Active",
      instructions: "",
      difficulty: "Easy",
      xp: 60,
    });
    setIsCodingRound(true);
    setQuestions([createInitialQuestion(1)]);
    setActiveQIndex(0);
    setStarters(DEFAULT_STARTERS);
    setShowStartersEditor(false);
    setTitleError("");
    setEditingId(null);
  };

  const loadPresetIntoCurrentQ = (
    presetType: "sum" | "even_odd" | "average" | "palindrome" | "max_of_three" | "fizzbuzz",
    asNewQuestion = false,
  ) => {
    let presetData: Partial<AssignmentQuestionItem> = {};
    if (presetType === "sum") {
      presetData = {
        title: "Sum of Two Numbers",
        difficulty: "Easy",
        xp: 50,
        prompt: "Read two space-separated integers from standard input and output their sum.",
        inputFormat: "Two integers separated by a space (e.g. 10 20)",
        outputFormat: "A single integer output (e.g. 30)",
        constraints: "-10^6 <= a, b <= 10^6",
        testCases: [
          { id: 1, input: "10 20", expectedOutput: "30", isHidden: false },
          { id: 2, input: "-5 15", expectedOutput: "10", isHidden: false },
          { id: 3, input: "100 500", expectedOutput: "600", isHidden: true },
        ],
      };
    } else if (presetType === "even_odd") {
      presetData = {
        title: "Even or Odd Checker",
        difficulty: "Easy",
        xp: 40,
        prompt:
          "Read a single integer from standard input. If it is divisible by 2, output 'EVEN'. Otherwise output 'ODD'.",
        inputFormat: "A single integer N (e.g. 4)",
        outputFormat: "'EVEN' or 'ODD'",
        constraints: "-10^9 <= N <= 10^9",
        testCases: [
          { id: 1, input: "4", expectedOutput: "EVEN", isHidden: false },
          { id: 2, input: "7", expectedOutput: "ODD", isHidden: false },
          { id: 3, input: "0", expectedOutput: "EVEN", isHidden: true },
          { id: 4, input: "-15", expectedOutput: "ODD", isHidden: true },
        ],
      };
    } else if (presetType === "average") {
      presetData = {
        title: "Student Average Calculator",
        difficulty: "Medium",
        xp: 80,
        prompt:
          "Read 3 subject exam marks from standard input. Compute and print the integer floor average (sum / 3).",
        inputFormat: "Three space-separated integers (e.g. 60 80 80)",
        outputFormat: "A single integer representing the average score (e.g. 73)",
        constraints: "0 <= mark <= 100",
        testCases: [
          { id: 1, input: "60 80 80", expectedOutput: "73", isHidden: false },
          { id: 2, input: "90 95 100", expectedOutput: "95", isHidden: false },
          { id: 3, input: "100 100 100", expectedOutput: "100", isHidden: true },
          { id: 4, input: "40 50 60", expectedOutput: "50", isHidden: true },
        ],
      };
    } else if (presetType === "palindrome") {
      presetData = {
        title: "Palindrome String Verifier",
        difficulty: "Medium",
        xp: 75,
        prompt:
          "Read a string from standard input. Print 'YES' if it is a palindrome (reads identically forwards and backwards), otherwise print 'NO'.",
        inputFormat: "A single lowercase word (e.g. racecar)",
        outputFormat: "'YES' or 'NO'",
        constraints: "Length <= 500 characters",
        testCases: [
          { id: 1, input: "racecar", expectedOutput: "YES", isHidden: false },
          { id: 2, input: "syntax", expectedOutput: "NO", isHidden: false },
          { id: 3, input: "madam", expectedOutput: "YES", isHidden: true },
          { id: 4, input: "noon", expectedOutput: "YES", isHidden: true },
        ],
      };
    } else if (presetType === "max_of_three") {
      presetData = {
        title: "Maximum of Three Numbers",
        difficulty: "Easy",
        xp: 50,
        prompt:
          "Read three space-separated integers from standard input. Output the largest number among them.",
        inputFormat: "Three integers separated by spaces (e.g. 12 45 3)",
        outputFormat: "A single integer representing the maximum (e.g. 45)",
        constraints: "-10^5 <= a, b, c <= 10^5",
        testCases: [
          { id: 1, input: "12 45 3", expectedOutput: "45", isHidden: false },
          { id: 2, input: "-10 -20 -5", expectedOutput: "-5", isHidden: false },
          { id: 3, input: "100 100 100", expectedOutput: "100", isHidden: true },
        ],
      };
    } else if (presetType === "fizzbuzz") {
      presetData = {
        title: "FizzBuzz Challenge",
        difficulty: "Hard",
        xp: 100,
        prompt:
          "Given an integer N from standard input, print numbers from 1 to N space-separated. Replace multiples of 3 with 'Fizz', multiples of 5 with 'Buzz', and multiples of both with 'FizzBuzz'.",
        inputFormat: "A single positive integer N (e.g. 5)",
        outputFormat: "Space-separated tokens (e.g. 1 2 Fizz 4 Buzz)",
        constraints: "1 <= N <= 100",
        testCases: [
          { id: 1, input: "5", expectedOutput: "1 2 Fizz 4 Buzz", isHidden: false },
          {
            id: 2,
            input: "15",
            expectedOutput: "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz",
            isHidden: false,
          },
        ],
      };
    }

    if (asNewQuestion) {
      addQuestion(presetData);
    } else {
      setQuestions((prev) =>
        prev.map((q, idx) => (idx === activeQIndex ? { ...q, ...presetData } : q)),
      );
      toast.success(`Loaded "${presetData.title}" into Question ${activeQIndex + 1}`);
    }
  };

  const addTestCase = () => {
    const currentTests = currentQ.testCases;
    const nextId = currentTests.length > 0 ? Math.max(...currentTests.map((t) => t.id)) + 1 : 1;
    updateCurrentQuestion("testCases", [
      ...currentTests,
      {
        id: nextId,
        input: "",
        expectedOutput: "",
        isHidden: false,
      },
    ]);
  };

  const removeTestCase = (id: number) => {
    if (currentQ.testCases.length <= 1) {
      toast.error("At least one testcase is required");
      return;
    }
    updateCurrentQuestion(
      "testCases",
      currentQ.testCases.filter((t) => t.id !== id),
    );
  };

  const updateTestCase = (
    id: number,
    key: "input" | "expectedOutput" | "isHidden",
    value: string | boolean,
  ) => {
    updateCurrentQuestion(
      "testCases",
      currentQ.testCases.map((tc) => (tc.id === id ? { ...tc, [key]: value } : tc)),
    );
  };

  const parseCodingRound = (instructions: string | null): ParsedCodingRound | null => {
    if (!instructions) return null;
    try {
      const parsed = JSON.parse(instructions);
      if (
        parsed &&
        (parsed.isCodingRound || Array.isArray(parsed.testCases) || Array.isArray(parsed.questions))
      ) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Open edit modal for an assignment
  const handleEdit = (a: TeacherAssignmentItem) => {
    const parsed = parseCodingRound(a.instructions);
    setEditingId(a.id);
    setForm({
      title: a.title,
      className: a.className,
      due: a.due !== "No date" ? a.due : new Date().toISOString().split("T")[0],
      type: a.type,
      status: a.status || "Active",
      instructions: parsed?.description || parsed?.prompt || (parsed ? "" : a.instructions || ""),
      difficulty: parsed?.difficulty || (a.type === "Assessment" ? "Medium" : "Easy"),
      xp: parsed?.xp ?? (a.type === "Assessment" ? 100 : 60),
    });

    if (parsed) {
      setIsCodingRound(true);
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        setQuestions(
          parsed.questions.map((q, idx) => ({
            id: q.id || `q-${idx + 1}`,
            title: q.title || `Problem ${idx + 1}`,
            prompt: q.prompt || "",
            inputFormat: q.inputFormat || "Standard Input",
            outputFormat: q.outputFormat || "Standard Output",
            constraints: q.constraints || "",
            testCases: Array.isArray(q.testCases)
              ? q.testCases.map((tc, tcIdx) => ({
                  id: tc.id || tcIdx + 1,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: Boolean(tc.isHidden),
                }))
              : [],
            difficulty: q.difficulty || "Easy",
            xp: q.xp || 50,
          })),
        );
        setActiveQIndex(0);
      } else {
        setQuestions([
          {
            id: "q-1",
            title: a.title || "Problem 1",
            prompt: parsed.description || parsed.prompt || "",
            inputFormat: parsed.inputFormat || "Standard Input",
            outputFormat: parsed.outputFormat || "Standard Output",
            constraints: parsed.constraints || "",
            testCases: Array.isArray(parsed.testCases)
              ? parsed.testCases.map((tc, idx) => ({
                  id: idx + 1,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: Boolean(tc.isHidden),
                }))
              : [{ id: 1, input: "10 20", expectedOutput: "30", isHidden: false }],
            difficulty: parsed.difficulty || "Easy",
            xp: parsed.xp || 60,
          },
        ]);
        setActiveQIndex(0);
      }

      if (parsed.starters) {
        setStarters({ ...DEFAULT_STARTERS, ...parsed.starters });
      }
    } else {
      setIsCodingRound(false);
    }

    setCreating(true);
  };

  // Handle clone / duplicate
  const handleStartClone = (a: TeacherAssignmentItem) => {
    setDuplicatingAssignment(a);
    const otherClass = availableClasses.find((c) => c.name !== a.className);
    setTargetCloneClass(otherClass ? otherClass.name : a.className);
  };

  const handleExecuteClone = async () => {
    if (!duplicatingAssignment) return;
    setIsCloning(true);
    try {
      await duplicateAssignmentFn({
        data: {
          assignmentId: duplicatingAssignment.id,
          targetClassName: targetCloneClass,
          newTitle: `${duplicatingAssignment.title} (${targetCloneClass})`,
        },
      });
      toast.success("Assignment cloned successfully!", {
        description: `Duplicated "${duplicatingAssignment.title}" for ${targetCloneClass}.`,
      });
      setDuplicatingAssignment(null);
      await router.invalidate();
    } catch (err: unknown) {
      toast.error("Failed to clone assignment", {
        description: (err as Error).message,
      });
    } finally {
      setIsCloning(false);
    }
  };

  // Open Submissions / Grade Drawer
  const handleOpenGrading = async (a: TeacherAssignmentItem) => {
    setGradingAssignment(a);
    setLoadingSubmissions(true);
    try {
      const res = await getAssignmentSubmissionsFn({ data: a.id });
      setSubmissionData(res);
      const firstSubmitted = res.students.find((s) => s.status === "SUBMITTED");
      const defaultStudent = firstSubmitted || res.students[0] || null;
      setSelectedStudent(defaultStudent);
      if (defaultStudent?.score !== undefined) {
        setGradeScore(defaultStudent.score);
      } else {
        setGradeScore(100);
      }
      setGradeFeedback(defaultStudent?.feedback || "");
    } catch (err: unknown) {
      toast.error("Failed to load submissions", {
        description: (err as Error).message,
      });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent?.submissionId) {
      toast.error("Student has not submitted work yet");
      return;
    }
    setIsSavingGrade(true);
    try {
      await gradeAssignmentSubmissionFn({
        data: {
          submissionId: selectedStudent.submissionId,
          score: Number(gradeScore),
          feedback: gradeFeedback,
        },
      });
      toast.success(`Grade saved for ${selectedStudent.studentName}!`, {
        description: `Score: ${gradeScore}%`,
      });

      // Update in local state
      if (submissionData) {
        setSubmissionData({
          ...submissionData,
          students: submissionData.students.map((s) =>
            s.studentId === selectedStudent.studentId
              ? {
                  ...s,
                  score: Number(gradeScore),
                  feedback: gradeFeedback,
                  reviewStatus: "COMPLETED",
                }
              : s,
          ),
        });
      }
      await router.invalidate();
    } catch (err: unknown) {
      toast.error("Failed to save grade", {
        description: (err as Error).message,
      });
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Send real assignment reminder
  const handleSendReminder = async (a: TeacherAssignmentItem) => {
    try {
      const res = await sendAssignmentReminderFn({ data: a.id });
      toast.success("Reminder broadcasted to class!", {
        description: `${res.pendingCount} students in ${res.className} notified.`,
      });
    } catch (err: unknown) {
      toast.error("Failed to send reminder", {
        description: (err as Error).message,
      });
    }
  };

  // Filter assignments
  const displayedAssignments = assignments.filter((a) => {
    if (tab === "Coding assessments") {
      const isCoding =
        a.type === "Coding task" || a.type === "Assessment" || !!parseCodingRound(a.instructions);
      if (!isCoding) return false;
    }
    if (classFilter !== "ALL" && a.className !== classFilter) {
      return false;
    }
    if (statusFilter !== "ALL" && a.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchClass = a.className.toLowerCase().includes(q);
      const matchType = a.type.toLowerCase().includes(q);
      if (!matchTitle && !matchClass && !matchType) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Create coding rounds with single or multiple questions, configure test suites, and review student code."
        actions={
          <button
            onClick={() => {
              resetFormState();
              setCreating(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> New assignment
          </button>
        }
      />

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab !== "Question analytics" && (
        <Panel
          title={
            tab === "Coding assessments" ? "Active Coding Assessments" : "All Classroom Assignments"
          }
          description={
            tab === "Coding assessments"
              ? "Assignments with automated input/output test case evaluation"
              : "Assignments deployed across your classes"
          }
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">
                {displayedAssignments.length} item(s)
              </span>
            </div>
          }
        >
          {/* SEARCH & FILTERS BAR */}
          <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, class, or type..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Classes</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Graded">Graded</option>
              </select>

              {(searchQuery || classFilter !== "ALL" || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setClassFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {displayedAssignments.map((a) => {
              const codingData = parseCodingRound(a.instructions);
              const questionCount = codingData?.questions?.length || (codingData ? 1 : 0);
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4.5 transition-all hover:border-slate-300 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{a.title}</p>
                        <Pill
                          tone={
                            a.status === "Graded"
                              ? "emerald"
                              : a.status === "Active"
                                ? "sky"
                                : "slate"
                          }
                        >
                          {a.status}
                        </Pill>
                        {codingData && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                            <Code2 className="h-3 w-3" /> Coding Round ·{" "}
                            {questionCount > 1
                              ? `${questionCount} Questions`
                              : `${codingData.testCases?.length || 0} Test Case(s)`}
                          </span>
                        )}
                        {codingData?.difficulty && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {codingData.difficulty}
                          </span>
                        )}
                        {codingData?.xp && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                            <Award className="h-3 w-3" /> {codingData.xp} XP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {a.className} · {a.type} · due {a.due}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {codingData && (
                        <button
                          onClick={() => {
                            setViewingCodingRound({
                              title: a.title,
                              className: a.className,
                              details: codingData,
                            });
                            setViewingQIndex(0);
                          }}
                          className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100/60 transition-colors"
                          title="View configured questions & test cases"
                        >
                          <Eye className="h-3.5 w-3.5" /> View{" "}
                          {questionCount > 1 ? `Questions (${questionCount})` : "Tests"}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenGrading(a)}
                        className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Review and grade student submissions"
                      >
                        <Award className="h-3.5 w-3.5 text-indigo-600" /> Grade ({a.submitted}/
                        {a.total})
                      </button>

                      <button
                        onClick={() => handleEdit(a)}
                        className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Edit assignment details and questions"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>

                      <button
                        onClick={() => handleStartClone(a)}
                        className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Clone assignment to another class"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>

                      <button
                        onClick={() => handleSendReminder(a)}
                        className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Broadcast due date reminder to students"
                      >
                        <Send className="h-3.5 w-3.5" /> Remind
                      </button>

                      <button
                        disabled={deletingId === a.id}
                        onClick={() => setConfirmDelete({ id: a.id, title: a.title })}
                        className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 transition-colors"
                        title="Delete assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex-1">
                      <Bar
                        value={(a.submitted / (a.total || 1)) * 100}
                        tone={a.submitted === a.total ? "emerald" : "indigo"}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {a.submitted}/{a.total} submitted · avg {a.avg || "—"}%
                    </span>
                  </div>
                </div>
              );
            })}

            {displayedAssignments.length === 0 && (
              <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <FileCode className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  No assignments match your criteria
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust your search or click "New assignment" to create and publish a coding round.
                </p>
              </div>
            )}
          </div>
        </Panel>
      )}

      {tab === "Question analytics" && (
        <Panel title="Question-level analytics" description="Class assessment response performance">
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
        </Panel>
      )}

      {/* CREATE & EDIT ASSIGNMENT MODAL WITH MULTI-QUESTION CODING ROUND BUILDER */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setCreating(false);
            resetFormState();
          }}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-indigo-600" />
                  {editingId ? "Edit Assignment" : "Create New Assignment"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingId
                    ? "Modify assignment specifications, questions, test cases, and student guidelines"
                    : "Deploy tasks or multi-question coding rounds with automated test suites"}
                </p>
              </div>
              <button
                onClick={() => {
                  setCreating(false);
                  resetFormState();
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assignment Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (e.target.value.trim()) setTitleError("");
                  }}
                  placeholder="e.g. Loops & Arrays Midterm Exam / Algorithm Challenges"
                  className={cn(
                    "h-10 w-full rounded-xl border px-3 text-sm outline-none transition-colors",
                    titleError
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-200 focus:border-indigo-400",
                  )}
                />
                {titleError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{titleError}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Target Class
                  </label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  >
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due}
                    onChange={(e) => setForm({ ...form, due: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  >
                    <option value="Active">Active (Visible)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Graded">Graded (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assignment Category
                </label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setForm({ ...form, type: newType });
                    if (newType === "Coding task" || newType === "Assessment") {
                      setIsCodingRound(true);
                    }
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="Coding task">Coding task (IDE & Test cases)</option>
                  <option value="Assessment">Assessment (Coding evaluation round)</option>
                  <option value="Practice set">Practice set</option>
                  <option value="Project milestone">Project milestone</option>
                </select>
              </div>

              {/* CODING ROUND & TEST CASES TOGGLE */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Code2 className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Include Automated Test Cases (Interactive Coding Round)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Add one or more coding problems evaluated automatically against sample &
                        hidden test cases
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCodingRound}
                    onChange={(e) => setIsCodingRound(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {isCodingRound ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  {/* MULTI-QUESTION SELECTOR BAR */}
                  <div className="rounded-xl border border-indigo-200/70 bg-white p-3 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        Questions In This Assignment ({questions.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => addQuestion()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Another Question
                      </button>
                    </div>

                    {/* Question Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveQIndex(idx)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border",
                              activeQIndex === idx
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200",
                            )}
                          >
                            <span>{q.title || `Problem ${idx + 1}`}</span>
                            <span
                              className={cn(
                                "rounded px-1 text-[10px]",
                                activeQIndex === idx
                                  ? "bg-indigo-700 text-white"
                                  : "bg-slate-200 text-slate-600",
                              )}
                            >
                              {q.testCases?.length || 0} tests
                            </span>
                          </button>
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestion(idx);
                              }}
                              className="ml-0.5 p-1 text-slate-400 hover:text-rose-600 rounded-md"
                              title="Delete this question"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACTIVE QUESTION EDITOR */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Question {activeQIndex + 1} Title
                        </label>
                        <input
                          value={currentQ.title}
                          onChange={(e) => updateCurrentQuestion("title", e.target.value)}
                          placeholder="e.g. Problem 1: Even/Odd Numbers"
                          className="h-8.5 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Difficulty
                          </label>
                          <select
                            value={currentQ.difficulty}
                            onChange={(e) =>
                              updateCurrentQuestion(
                                "difficulty",
                                e.target.value as "Easy" | "Medium" | "Hard",
                              )
                            }
                            className="h-8.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            XP Reward
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            step="5"
                            value={currentQ.xp}
                            onChange={(e) =>
                              updateCurrentQuestion("xp", Number(e.target.value) || 50)
                            }
                            className="h-8.5 w-20 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick presets for this question */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Load template for this question:
                      </span>
                      <button
                        type="button"
                        onClick={() => loadPresetIntoCurrentQ("sum")}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Sum of Two
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPresetIntoCurrentQ("even_odd")}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Even/Odd
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPresetIntoCurrentQ("average")}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Average
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPresetIntoCurrentQ("palindrome")}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Palindrome
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPresetIntoCurrentQ("fizzbuzz")}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        FizzBuzz
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Problem Statement / Description *
                      </label>
                      <textarea
                        value={currentQ.prompt}
                        onChange={(e) => updateCurrentQuestion("prompt", e.target.value)}
                        rows={3}
                        placeholder="Describe the coding challenge in detail for the students..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-400 leading-relaxed"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Input Format (stdin)
                        </label>
                        <input
                          value={currentQ.inputFormat}
                          onChange={(e) => updateCurrentQuestion("inputFormat", e.target.value)}
                          placeholder="e.g. Two space-separated integers"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Expected Output Format (stdout)
                        </label>
                        <input
                          value={currentQ.outputFormat}
                          onChange={(e) => updateCurrentQuestion("outputFormat", e.target.value)}
                          placeholder="e.g. Single integer output"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Constraints
                      </label>
                      <input
                        value={currentQ.constraints}
                        onChange={(e) => updateCurrentQuestion("constraints", e.target.value)}
                        placeholder="e.g. 1 <= N <= 1000, Time limit 5.0s"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"
                      />
                    </div>

                    {/* TEST CASES LIST FOR CURRENT QUESTION */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-indigo-600" />
                          Test Cases Suite for {currentQ.title} ({currentQ.testCases.length})
                        </label>
                        <button
                          type="button"
                          onClick={addTestCase}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <Plus className="h-3 w-3" /> Add Test Case
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {currentQ.testCases.map((tc, index) => (
                          <div
                            key={tc.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">
                                Test Case #{index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateTestCase(tc.id, "isHidden", false)}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all border cursor-pointer",
                                      !tc.isHidden
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs font-bold"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700",
                                    )}
                                    title="Mark as Sample (Visible to students)"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Sample</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateTestCase(tc.id, "isHidden", true)}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all border cursor-pointer",
                                      tc.isHidden
                                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs font-bold"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700",
                                    )}
                                    title="Mark as Hidden (Used for evaluation only)"
                                  >
                                    <EyeOff className="h-3 w-3" />
                                    <span>Hidden</span>
                                  </button>
                                </div>
                                {currentQ.testCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTestCase(tc.id)}
                                    className="text-slate-400 hover:text-rose-600 p-0.5"
                                    title="Delete test case"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <span className="text-[11px] text-slate-500 font-medium block mb-0.5">
                                  Input (stdin):
                                </span>
                                <input
                                  value={tc.input}
                                  onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                                  placeholder="e.g. 10 20"
                                  className="h-8 w-full rounded-md border border-slate-200 bg-white font-mono text-xs px-2.5 outline-none focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-500 font-medium block mb-0.5">
                                  Expected Output (stdout):
                                </span>
                                <input
                                  value={tc.expectedOutput}
                                  onChange={(e) =>
                                    updateTestCase(tc.id, "expectedOutput", e.target.value)
                                  }
                                  placeholder="e.g. 30"
                                  className="h-8 w-full rounded-md border border-slate-200 bg-white font-mono text-xs px-2.5 outline-none focus:border-indigo-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CUSTOM STARTER CODE DRAWER */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowStartersEditor(!showStartersEditor)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      {showStartersEditor
                        ? "Hide Starter Code Templates"
                        : "Customize Starter Code Templates"}
                    </button>

                    {showStartersEditor && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                        <div className="flex gap-1.5 border-b border-slate-100 pb-2">
                          {(["Python", "JavaScript", "Java", "C++", "C"] as StarterLang[]).map(
                            (lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => setStarterTab(lang)}
                                className={cn(
                                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                                  starterTab === lang
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-600 hover:bg-slate-100",
                                )}
                              >
                                {lang}
                              </button>
                            ),
                          )}
                        </div>
                        <textarea
                          value={starters[starterTab] || ""}
                          onChange={(e) =>
                            setStarters({ ...starters, [starterTab]: e.target.value })
                          }
                          rows={6}
                          className="w-full rounded-lg border border-slate-200 bg-slate-900 text-emerald-400 p-2.5 font-mono text-xs outline-none focus:border-indigo-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Instructions for students
                  </label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    rows={4}
                    placeholder="Provide detailed instructions or reading materials for students…"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  resetFormState();
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingForm}
                onClick={async () => {
                  if (!form.title.trim()) {
                    setTitleError("Assignment title cannot be blank. Please enter a title.");
                    toast.error("Please provide an assignment title");
                    return;
                  }

                  setIsSubmittingForm(true);
                  try {
                    const totalXp = questions.reduce((sum, q) => sum + (q.xp || 50), 0);
                    const primaryQ = questions[0] || createInitialQuestion(1);

                    const payload = {
                      title: form.title,
                      className: form.className,
                      due: form.due || "",
                      type: form.type,
                      status: form.status,
                      difficulty: primaryQ.difficulty || form.difficulty,
                      xp: totalXp || form.xp,
                      instructions: form.instructions || primaryQ.prompt,
                      starters: isCodingRound ? starters : undefined,
                      questions: isCodingRound ? questions : undefined,
                      testCases: isCodingRound ? primaryQ.testCases : undefined,
                      inputFormat: isCodingRound ? primaryQ.inputFormat : undefined,
                      outputFormat: isCodingRound ? primaryQ.outputFormat : undefined,
                      constraints: isCodingRound ? primaryQ.constraints : undefined,
                    };

                    if (editingId) {
                      await updateAssignmentFn({
                        data: {
                          id: editingId,
                          ...payload,
                        },
                      });
                      toast.success("Assignment updated successfully!", {
                        description: `${form.title} · ${form.className} (${questions.length} questions)`,
                      });
                    } else {
                      await createAssignmentFn({ data: payload });
                      toast.success("Assignment published successfully!", {
                        description: `${form.title} · ${form.className} ${
                          isCodingRound ? `(${questions.length} question(s) configured)` : ""
                        }`,
                      });
                    }

                    setCreating(false);
                    resetFormState();
                    await router.invalidate();
                  } catch (e: unknown) {
                    toast.error("Failed to save assignment", {
                      description: (e as Error).message,
                    });
                  } finally {
                    setIsSubmittingForm(false);
                  }
                }}
                className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmittingForm
                  ? "Saving..."
                  : editingId
                    ? "Update Assignment"
                    : "Publish Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CODING ASSESSMENT DETAILS & TEST CASES MODAL (WITH MULTI-QUESTION TABS) */}
      {viewingCodingRound && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setViewingCodingRound(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-indigo-600" />
                  {viewingCodingRound.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingCodingRound.className} · Automated Coding Assessment
                </p>
              </div>
              <button
                onClick={() => setViewingCodingRound(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Questions switcher if multiple */}
            {viewingCodingRound.details.questions &&
              viewingCodingRound.details.questions.length > 1 && (
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-bold uppercase text-slate-500 shrink-0">
                    Problems:
                  </span>
                  {viewingCodingRound.details.questions.map((q, idx) => (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setViewingQIndex(idx)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-bold transition-all shrink-0",
                        viewingQIndex === idx
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {q.title || `Q${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

            {(() => {
              const activeViewQ =
                viewingCodingRound.details.questions &&
                viewingCodingRound.details.questions.length > 0
                  ? viewingCodingRound.details.questions[viewingQIndex] ||
                    viewingCodingRound.details.questions[0]
                  : null;

              const promptText = activeViewQ
                ? activeViewQ.prompt
                : viewingCodingRound.details.description ||
                  viewingCodingRound.details.prompt ||
                  "Solve the coding task as instructed.";

              const inputFmt = activeViewQ
                ? activeViewQ.inputFormat
                : viewingCodingRound.details.inputFormat || "Standard Input";

              const outputFmt = activeViewQ
                ? activeViewQ.outputFormat
                : viewingCodingRound.details.outputFormat || "Standard Output";

              const testCasesList = activeViewQ
                ? activeViewQ.testCases
                : viewingCodingRound.details.testCases || [];

              return (
                <div className="space-y-4 px-6 py-5 overflow-y-auto flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Problem Statement {activeViewQ ? `· ${activeViewQ.title}` : ""}</span>
                      {activeViewQ?.xp && (
                        <span className="text-[11px] font-semibold text-amber-700">
                          {activeViewQ.xp} XP ({activeViewQ.difficulty || "Easy"})
                        </span>
                      )}
                    </h4>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {promptText}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 mb-1">Input Format:</h4>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 font-mono">
                        {inputFmt}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 mb-1">Output Format:</h4>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 font-mono">
                        {outputFmt}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Configured Test Cases ({testCasesList.length})</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Evaluated automatically against student submissions
                      </span>
                    </h4>

                    <div className="space-y-2">
                      {testCasesList.map((tc, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                              Test Case #{idx + 1}
                            </span>
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                                tc.isHidden
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800",
                              )}
                            >
                              {tc.isHidden ? "Hidden / Grading" : "Sample / Public"}
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs">
                            <div className="rounded bg-slate-50 p-2 border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Input:
                              </span>
                              <span className="text-slate-800">{tc.input || "—"}</span>
                            </div>
                            <div className="rounded bg-slate-50 p-2 border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Expected Output:
                              </span>
                              <span className="text-emerald-700 font-semibold">
                                {tc.expectedOutput || "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                onClick={() => setViewingCodingRound(null)}
                className="h-9 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLONE / DUPLICATE MODAL */}
      {duplicatingAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setDuplicatingAssignment(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Copy className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Duplicate Assignment</h3>
                <p className="text-xs text-slate-500">
                  Clone into another class with all questions & test cases
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Source</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                  <span className="font-bold">{duplicatingAssignment.title}</span> (
                  {duplicatingAssignment.className})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assign To Class
                </label>
                <select
                  value={targetCloneClass}
                  onChange={(e) => setTargetCloneClass(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                >
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDuplicatingAssignment(null)}
                className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCloning}
                onClick={handleExecuteClone}
                className="h-9 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCloning ? "Cloning..." : "Create Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS & GRADING MODAL / DRAWER */}
      {gradingAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setGradingAssignment(null);
            setSubmissionData(null);
          }}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                  {gradingAssignment.title} · Submissions & Grading
                </h3>
                <p className="text-xs text-slate-500">
                  {gradingAssignment.className} · {submissionData?.stats.submitted ?? 0} of{" "}
                  {submissionData?.stats.total ?? 0} submitted (Avg:{" "}
                  {submissionData?.stats.avgScore ?? 0}%)
                </p>
              </div>
              <button
                onClick={() => {
                  setGradingAssignment(null);
                  setSubmissionData(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="py-20 text-center">
                <RefreshCw className="mx-auto h-7 w-7 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-600">Loading student submissions...</p>
              </div>
            ) : submissionData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
                {/* ROSTER LIST */}
                <div className="border-r border-slate-100 p-4 overflow-y-auto max-h-[65vh] space-y-2 bg-slate-50/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Enrolled Students ({submissionData.students.length})
                  </span>
                  {submissionData.students.map((student) => {
                    const isSelected = selectedStudent?.studentId === student.studentId;
                    return (
                      <div
                        key={student.studentId}
                        onClick={() => {
                          setSelectedStudent(student);
                          setGradeScore(student.score !== undefined ? student.score : 100);
                          setGradeFeedback(student.feedback || "");
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl p-3 border transition-all text-left",
                          isSelected
                            ? "border-indigo-400 bg-indigo-50/60 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{student.studentName}</p>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              student.status === "SUBMITTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {student.status === "SUBMITTED"
                              ? `${student.score !== undefined ? student.score + "%" : "Submitted"}`
                              : "Pending"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {student.studentEmail}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* SUBMISSION CODE & REVIEW DETAILS */}
                <div className="md:col-span-2 p-5 overflow-y-auto max-h-[65vh] space-y-4">
                  {selectedStudent ? (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {selectedStudent.studentName}
                          </h4>
                          <p className="text-xs text-slate-500">{selectedStudent.studentEmail}</p>
                        </div>
                        <span
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-bold",
                            selectedStudent.status === "SUBMITTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200",
                          )}
                        >
                          {selectedStudent.status === "SUBMITTED"
                            ? "Code Submitted"
                            : "Pending Submission"}
                        </span>
                      </div>

                      {selectedStudent.status === "SUBMITTED" ? (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Terminal className="h-3.5 w-3.5 text-indigo-600" />
                                Submitted Solution Code
                              </span>
                              {selectedStudent.code && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(selectedStudent.code || "");
                                    toast.success("Code copied to clipboard!");
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700"
                                >
                                  <Copy className="h-3 w-3" /> Copy
                                </button>
                              )}
                            </div>
                            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-56 leading-relaxed">
                              {selectedStudent.code || "// No code provided"}
                            </pre>
                            {selectedStudent.notes && (
                              <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
                                Evaluation Run: {selectedStudent.notes}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                            <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                              Grade & Feedback Override
                            </h5>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                  Score (0 - 100%)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={gradeScore}
                                  onChange={(e) => setGradeScore(Number(e.target.value))}
                                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                  Review Status
                                </label>
                                <div className="h-9 rounded-lg border border-slate-200 bg-white px-3 flex items-center text-xs font-semibold text-emerald-700">
                                  COMPLETED
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">
                                Teacher Feedback & Guidance Notes
                              </label>
                              <textarea
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                rows={2}
                                placeholder="Write encouraging feedback or optimization advice..."
                                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-400"
                              />
                            </div>

                            <button
                              type="button"
                              disabled={isSavingGrade}
                              onClick={handleSaveGrade}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {isSavingGrade ? "Saving Grade..." : "Save Grade & Feedback"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                          <AlertCircle className="mx-auto h-7 w-7 text-amber-500 mb-2" />
                          <p className="text-xs font-bold text-slate-700">
                            Student Has Not Submitted
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                            The student hasn't completed and submitted their code solution for this
                            assignment yet.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-14 text-center text-slate-400 text-xs">
                      Select a student from the roster to view their submission.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                onClick={() => {
                  setGradingAssignment(null);
                  setSubmissionData(null);
                }}
                className="h-9 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close Submissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Assignment</h3>
                <p className="text-xs text-slate-500">Confirm deletion action</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 font-semibold">"{confirmDelete.title}"</strong>?
              This will permanently remove the assignment and associated submissions.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  if (!target) return;
                  setDeletingId(target.id);

                  // Optimistic removal: item disappears immediately from the screen
                  setAssignments((prev) => prev.filter((a) => a.id !== target.id));

                  try {
                    await deleteAssignmentFn({ data: target.id });
                    toast.success(`Assignment "${target.title}" deleted`);
                    await router.invalidate();
                  } catch (err: unknown) {
                    const error = err as Error;
                    toast.error("Failed to delete assignment", {
                      description: error.message,
                    });
                    if (data?.assignments) {
                      setAssignments(data.assignments);
                    }
                  } finally {
                    setDeletingId(null);
                  }
                }}
                className="h-9 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                Yes, delete assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
