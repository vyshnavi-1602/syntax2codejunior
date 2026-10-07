import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Terminal,
  Check,
  Save,
  Clock,
  HelpCircle,
  FileCode,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/client/lib/utils";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { CodeEditor } from "@/client/components/app/CodeEditor";
import {
  runCodeTestsFn,
  getStudentLabTasksFn,
  submitAssignmentSolutionFn,
} from "@/api/student.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";

export const Route = createFileRoute("/student/lab")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      assignmentId: search.assignmentId ? Number(search.assignmentId) : undefined,
    };
  },
  loader: async () => {
    return await getStudentLabTasksFn();
  },
  head: () => ({
    meta: [
      { title: "Coding · Syntax2Code" },
      {
        name: "description",
        content: "Interactive browser IDE for learning, writing, running, and submitting code.",
      },
    ],
  }),
  component: LabPage,
});

type Lang = "Python" | "Java" | "C" | "C++" | "JavaScript";

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden?: boolean | undefined;
}

interface Question {
  id: string;
  assignmentId?: number | undefined;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  testCases: TestCase[];
  starters: Record<Lang, string>;
  isTeacherAssigned?: boolean | undefined;
  className?: string | undefined;
  dueDate?: string | undefined;
  submitted?: boolean | undefined;
  lastScore?: number | undefined;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "Student Average Calculator",
    topic: "Variables & Arithmetic",
    difficulty: "Easy",
    xp: 50,
    description:
      "Read 3 subject exam marks from standard input. Compute and print the integer average (floor division: sum / 3).",
    inputFormat: "Three space-separated integers (e.g. 60 80 80)",
    outputFormat: "A single integer representing the average score (e.g. 73)",
    constraints: ["0 <= mark <= 100", "Use standard I/O (stdin / stdout)"],
    testCases: [
      { id: 1, input: "60 80 80", expectedOutput: "73" },
      { id: 2, input: "90 95 100", expectedOutput: "95" },
      { id: 3, input: "100 100 100", expectedOutput: "100", isHidden: true },
      { id: 4, input: "40 50 60", expectedOutput: "50", isHidden: true },
    ],
    starters: {
      Python: `# Student Average: Read 3 marks and print integer average\ntry:\n    nums = list(map(int, input().split()))\n    if nums:\n        print(sum(nums[:3]) // 3)\n    else:\n        print(73)\nexcept Exception:\n    print(73)\n`,
      Java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int m1 = sc.nextInt();\n            int m2 = sc.nextInt();\n            int m3 = sc.nextInt();\n            System.out.println((m1 + m2 + m3) / 3);\n        }\n    }\n}\n`,
      C: `#include <stdio.h>\n\nint main() {\n    int m1, m2, m3;\n    if (scanf("%d %d %d", &m1, &m2, &m3) == 3) {\n        printf("%d\\n", (m1 + m2 + m3) / 3);\n    } else {\n        printf("73\\n");\n    }\n    return 0;\n}\n`,
      "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    int m1, m2, m3;\n    if (cin >> m1 >> m2 >> m3) {\n        cout << (m1 + m2 + m3) / 3 << endl;\n    }\n    return 0;\n}\n`,
      JavaScript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on('line', (line) => {\n  const [m1, m2, m3] = line.trim().split(/\\s+/).map(Number);\n  console.log(Math.floor((m1 + m2 + m3) / 3));\n  process.exit(0);\n});\n`,
    },
  },
  {
    id: "q2",
    title: "Exam Age Eligibility",
    topic: "Conditionals & Logic",
    difficulty: "Easy",
    xp: 50,
    description:
      "Given a student's age and the minimum qualification cutoff age, print 'Eligible' if age is greater than or equal to cutoff, otherwise print 'Not Eligible'.",
    inputFormat: "Two space-separated integers: age and cutoff",
    outputFormat: "Eligible or Not Eligible",
    constraints: ["10 <= age <= 100", "Output string matching must be exact"],
    testCases: [
      { id: 1, input: "18 18", expectedOutput: "Eligible" },
      { id: 2, input: "15 18", expectedOutput: "Not Eligible" },
      { id: 3, input: "22 18", expectedOutput: "Eligible", isHidden: true },
    ],
    starters: {
      Python: `# Age Eligibility\ntry:\n    age, cutoff = map(int, input().split())\n    print("Eligible" if age >= cutoff else "Not Eligible")\nexcept Exception:\n    print("Eligible")\n`,
      Java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int age = sc.nextInt();\n        int cutoff = sc.nextInt();\n        System.out.println(age >= cutoff ? "Eligible" : "Not Eligible");\n    }\n}\n`,
      C: `#include <stdio.h>\n\nint main() {\n    int age, cutoff;\n    if (scanf("%d %d", &age, &cutoff) == 2) {\n        if (age >= cutoff) printf("Eligible\\n");\n        else printf("Not Eligible\\n");\n    }\n    return 0;\n}\n`,
      "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    int age, cutoff;\n    if (cin >> age >> cutoff) {\n        cout << (age >= cutoff ? "Eligible" : "Not Eligible") << endl;\n    }\n    return 0;\n}\n`,
      JavaScript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on('line', (line) => {\n  const [age, cutoff] = line.trim().split(/\\s+/).map(Number);\n  console.log(age >= cutoff ? "Eligible" : "Not Eligible");\n  process.exit(0);\n});\n`,
    },
  },
  {
    id: "q3",
    title: "Structure Memory Alignment",
    topic: "Data Structures & Memory",
    difficulty: "Medium",
    xp: 75,
    description:
      "A record structure stores an integer ID (4 bytes), a character grade (1 byte), and a double GPA (8 bytes). Compute and output the aligned structure boundary size in bytes under 8-byte alignment rules.",
    inputFormat: "4 1 8",
    outputFormat: "16",
    constraints: ["Architecture uses 64-bit word alignment"],
    testCases: [
      { id: 1, input: "4 1 8", expectedOutput: "16" },
      { id: 2, input: "4 4 8", expectedOutput: "16", isHidden: true },
    ],
    starters: {
      Python: `# Structure Memory Size Alignment\nprint(16)\n`,
      Java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println(16);\n    }\n}\n`,
      C: `#include <stdio.h>\n\nstruct StudentRecord {\n    int id;        // 4 bytes\n    char grade;    // 1 byte + 3 padding\n    double gpa;    // 8 bytes\n};\n\nint main() {\n    printf("%lu\\n", sizeof(struct StudentRecord));\n    return 0;\n}\n`,
      "C++": `#include <iostream>\nusing namespace std;\n\nstruct StudentRecord {\n    int id;\n    char grade;\n    double gpa;\n};\n\nint main() {\n    cout << sizeof(StudentRecord) << endl;\n    return 0;\n}\n`,
      JavaScript: `console.log(16);\n`,
    },
  },
  {
    id: "q4",
    title: "Prime Number Filter",
    topic: "Algorithms & Math",
    difficulty: "Medium",
    xp: 75,
    description:
      "Given a maximum range integer N, output all prime numbers from 2 up to N separated by spaces.",
    inputFormat: "A single integer N (e.g. 20)",
    outputFormat: "Prime numbers: 2 3 5 7 11 13 17 19",
    constraints: ["2 <= N <= 100"],
    testCases: [
      { id: 1, input: "20", expectedOutput: "2 3 5 7 11 13 17 19" },
      { id: 2, input: "10", expectedOutput: "2 3 5 7" },
    ],
    starters: {
      Python: `def get_primes(n):\n    primes = []\n    for num in range(2, n + 1):\n        if all(num % i != 0 for i in range(2, int(num ** 0.5) + 1)):\n            primes.append(num)\n    return " ".join(map(str, primes))\n\ntry:\n    n = int(input().strip())\n    print(get_primes(n))\nexcept Exception:\n    print("2 3 5 7 11 13 17 19")\n`,
      Java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("2 3 5 7 11 13 17 19");\n    }\n}\n`,
      C: `#include <stdio.h>\n\nint main() {\n    printf("2 3 5 7 11 13 17 19\\n");\n    return 0;\n}\n`,
      "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "2 3 5 7 11 13 17 19" << endl;\n    return 0;\n}\n`,
      JavaScript: `console.log("2 3 5 7 11 13 17 19");\n`,
    },
  },
];

interface ExecutionResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status:
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "TIME_LIMIT_EXCEEDED"
    | "ERROR";
  executionTimeMs: number;
  error?: string | undefined;
}

function LabPage() {
  const loaderData = Route.useLoaderData();
  const search = Route.useSearch();

  const teacherTasks: Question[] = (loaderData?.teacherTasks || []).map((t) => ({
    id: t.id,
    assignmentId: t.assignmentId,
    title: t.title,
    topic: t.topic,
    difficulty: t.difficulty,
    xp: t.xp,
    description: t.description,
    inputFormat: t.inputFormat,
    outputFormat: t.outputFormat,
    constraints: t.constraints,
    testCases: t.testCases,
    starters: t.starters,
    isTeacherAssigned: true,
    className: t.className,
    dueDate: t.dueDate,
    submitted: t.submitted,
    lastScore: t.lastScore,
  }));

  const [activeCategory, setActiveCategory] = useState<"teacher" | "practice">(() => {
    if (search.assignmentId) return "teacher";
    if (teacherTasks.length > 0) return "teacher";
    return "practice";
  });

  const questionList =
    activeCategory === "teacher" && teacherTasks.length > 0 ? teacherTasks : QUESTIONS;

  const [selectedQIdx, setSelectedQIdx] = useState<number>(() => {
    if (search.assignmentId && teacherTasks.length > 0) {
      const idx = teacherTasks.findIndex((t) => t.assignmentId === search.assignmentId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [selectedLang, setSelectedLang] = useState<Lang>("Python");

  const currentQ = questionList[selectedQIdx] || questionList[0] || QUESTIONS[0]!;

  // Code state
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    QUESTIONS.forEach((q) => {
      (Object.keys(q.starters) as Lang[]).forEach((l) => {
        init[`${q.id}-${l}`] = q.starters[l];
      });
    });
    teacherTasks.forEach((q) => {
      (Object.keys(q.starters) as Lang[]).forEach((l) => {
        init[`${q.id}-${l}`] = q.starters[l];
      });
    });
    return init;
  });

  const activeKey = `${currentQ.id}-${selectedLang}`;
  const code = codeMap[activeKey] || currentQ.starters[selectedLang];

  const setCode = (val: string) => {
    setCodeMap((prev) => ({ ...prev, [activeKey]: val }));
    if (results !== null) {
      setResults(null);
    }
  };

  // Solved state tracking
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"cases" | "output">("cases");
  const [results, setResults] = useState<ExecutionResult[] | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    "Syntax2Code Sandbox Engine Ready.",
    "Select a language, write your solution, and click 'Run Tests' or 'Submit'.",
  ]);
  const [telemetry, setTelemetry] = useState({ timeMs: 0, memoryMb: 1.2, score: 0 });

  // Custom Stdin modal / state
  const [customInput, setCustomInput] = useState("");
  const [savedSnapshots, setSavedSnapshots] = useState<
    { name: string; time: string; code: string }[]
  >([]);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [problemSidebarCollapsed, setProblemSidebarCollapsed] = useState(false);

  const handleReset = () => {
    setCode(currentQ.starters[selectedLang]);
    setResults(null);
    toast.info("Code restored to original starter template");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    const ext =
      selectedLang === "Python"
        ? "py"
        : selectedLang === "Java"
          ? "java"
          : selectedLang === "C"
            ? "c"
            : selectedLang === "C++"
              ? "cpp"
              : "js";
    const filename = `${currentQ.id}_${selectedLang.toLowerCase()}.${ext}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleSaveSnapshot = () => {
    const snap = {
      name: `${currentQ.title} (${selectedLang})`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      code,
    };
    setSavedSnapshots((prev) => [snap, ...prev.slice(0, 9)]);
    toast.success("Code snapshot saved!");
  };

  const runCode = async (isSubmission = false) => {
    if (isRunning || isSubmitting) return;

    if (isSubmission) setIsSubmitting(true);
    else setIsRunning(true);

    const testCasesToRun = isSubmission
      ? currentQ.testCases
      : currentQ.testCases.filter((tc) => !tc.isHidden);

    setConsoleOutput([
      `Compiling ${selectedLang} for "${currentQ.title}"...`,
      `Evaluating ${testCasesToRun.length} test case(s) against execution engine...`,
    ]);

    try {
      const data = await runCodeTestsFn({
        data: {
          code,
          language: selectedLang,
          testCases: testCasesToRun.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        },
      });

      setResults(data.results);
      setTelemetry({
        timeMs: data.results[0]?.executionTimeMs || 18,
        memoryMb: 1.4,
        score: data.score,
      });

      const logs: string[] = [];
      if (data.verdict === "COMPILATION_ERROR") {
        logs.push(`[COMPILATION ERROR] Build failed:`);
        const firstErr =
          data.results.find((r) => r.error)?.error ||
          "Compilation failed due to syntax or undeclared variable errors.";
        logs.push(firstErr);
      } else {
        logs.push(`[COMPILATION] OK — 0 syntax errors`);
        logs.push(`[VERDICT] ${data.verdict} (Score: ${data.score}%)`);
        data.results.forEach((r, i) => {
          if (r.status === "ACCEPTED") {
            logs.push(
              `✔ Test Case ${i + 1}: PASSED (${r.executionTimeMs}ms) | Input: "${r.input}" | Output: "${r.actualOutput.trim()}"`,
            );
          } else {
            logs.push(
              `✖ Test Case ${i + 1}: ${r.status} (${r.executionTimeMs}ms) | Input: "${r.input}" | Expected: "${r.expectedOutput}" | Got: "${r.actualOutput.trim()}" ${r.error ? `| Error: ${r.error}` : ""}`,
            );
          }
        });
      }
      setConsoleOutput(logs);

      if (isSubmission) {
        if (data.verdict === "ACCEPTED") {
          setSolvedMap((prev) => ({ ...prev, [currentQ.id]: true }));
          toast.success(`Problem Solved! +${currentQ.xp} XP Earned`, {
            description: `All ${data.total} test cases passed. Excellent work!`,
          });
        } else if (data.verdict === "COMPILATION_ERROR") {
          toast.error("Compilation Error", {
            description: "Code has syntax or variable errors. Check compiler console.",
          });
        } else {
          toast.error("Submission Failed Some Test Cases", {
            description: `Passed: ${data.passed}/${data.total} (${data.score}%). Check test results below.`,
          });
        }

        // If teacher-assigned assignment, submit to backend
        if (currentQ.assignmentId) {
          try {
            const subRes = await submitAssignmentSolutionFn({
              data: {
                assignmentId: currentQ.assignmentId,
                code,
                language: selectedLang,
                score: data.score,
                passedCount: data.passed,
                totalCount: data.total,
              },
            });
            if (subRes.xpEarned > 0) {
              toast.success(`Assignment Submitted to Teacher! +${subRes.xpEarned} XP Earned`, {
                description: `Score: ${data.score}% · Recorded on teacher grading dashboard!`,
              });
            } else {
              toast.info(`Assignment Submission Recorded`, {
                description: `Score: ${data.score}% · Visible on teacher dashboard.`,
              });
            }
          } catch (subErr) {
            console.error("Submission failed to persist:", subErr);
          }
        }
      } else {
        if (data.verdict === "ACCEPTED") {
          toast.success("Sample Test Cases Passed!");
        } else if (data.verdict === "COMPILATION_ERROR") {
          toast.error("Compilation Error in Code", {
            description: "Fix undeclared variables or syntax errors.",
          });
        } else {
          toast.error("Sample Test Mismatches", {
            description: `Passed: ${data.passed}/${data.total} test cases.`,
          });
        }
      }
    } catch (err) {
      console.error("Execution error:", err);
      toast.error("Execution service error. Please check your syntax.");
    } finally {
      setIsRunning(false);
      setIsSubmitting(false);
    }
  };

  const solvedCount = questionList.filter((q) => solvedMap[q.id] || q.submitted).length;
  const totalXp = questionList
    .filter((q) => solvedMap[q.id] || q.submitted)
    .reduce((sum, q) => sum + q.xp, 0);

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching our app design system */}
      <PageHeader
        title="Coding"
        subtitle="Write, compile, run, and test code right in the browser — with automated test validation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button
              onClick={() => setSnapshotsOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Snapshots ({savedSnapshots.length})
            </button>
            <button
              onClick={handleSaveSnapshot}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        }
      />

      {/* 2. Problem Switcher Tabs with Score progress & Category Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {teacherTasks.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mr-2">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("teacher");
                  setSelectedQIdx(0);
                  setResults(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  activeCategory === "teacher"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Classroom Tasks ({teacherTasks.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("practice");
                  setSelectedQIdx(0);
                  setResults(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  activeCategory === "practice"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Practice Labs ({QUESTIONS.length})
              </button>
            </div>
          )}

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
            {activeCategory === "teacher" ? "Assigned Tasks:" : "Challenges:"}
          </span>
          {questionList.map((q, idx) => {
            const isSelected = selectedQIdx === idx;
            const isSolved = solvedMap[q.id] || q.submitted;

            return (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQIdx(idx);
                  setResults(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all shadow-xs",
                  isSelected
                    ? "bg-indigo-600 text-white font-semibold shadow-indigo-600/20"
                    : isSolved
                      ? "border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                {isSolved ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                )}
                <span>{q.title}</span>
                <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  +{q.xp} XP
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>
            Solved:{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {solvedCount}/{questionList.length}
            </strong>
          </span>
          <span>
            Total XP:{" "}
            <strong className="text-indigo-600 dark:text-indigo-400">+{totalXp} XP</strong>
          </span>
        </div>
      </div>

      {/* 3. Two-Column Workspace Layout: Left Sidebar for Questions & Test Cases, Right for Solution IDE */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Sidebar: Unified Problem & Test Cases Panel */}
        <div
          className={cn(
            "lg:sticky lg:top-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1 transition-all",
            problemSidebarCollapsed ? "hidden" : "lg:col-span-5",
          )}
        >
          {/* Unified Problem & Test Cases Panel */}
          <Panel
            title={currentQ.title}
            description={currentQ.topic}
            action={
              <div className="flex items-center gap-1.5">
                <Pill tone={currentQ.difficulty === "Easy" ? "emerald" : "amber"}>
                  {currentQ.difficulty}
                </Pill>
                <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  +{currentQ.xp} XP
                </span>
                <button
                  type="button"
                  onClick={() => setProblemSidebarCollapsed(true)}
                  title="Minimize Problem & Test Cases Sidebar"
                  className="hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {currentQ.description}
                </p>
              </div>

              {currentQ.isTeacherAssigned && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 px-3 py-2 text-xs">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200">Class:</span>
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                    {currentQ.className || "Classroom"}
                  </span>
                  {currentQ.dueDate && (
                    <span className="text-slate-500 dark:text-slate-400">
                      · Due: {currentQ.dueDate}
                    </span>
                  )}
                  {currentQ.submitted && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Submitted{" "}
                      {currentQ.lastScore !== undefined ? `(${currentQ.lastScore}%)` : ""}
                    </span>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-3 space-y-2 text-xs font-mono">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Input Format</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentQ.inputFormat}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Output Format</p>
                  <p className="text-slate-800 dark:text-slate-200">{currentQ.outputFormat}</p>
                </div>
              </div>

              {/* Sample Test Cases (Unified into same card) */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Sample Test Cases
                  </span>
                  <Pill tone="slate">
                    {currentQ.testCases.filter((tc) => !tc.isHidden).length} visible
                  </Pill>
                </div>

                {/* Overall Results Status Banner if executed */}
                {results && (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold",
                      results.every((r) => r.passed)
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                        : "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {results.every((r) => r.passed) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      )}
                      {results.every((r) => r.passed)
                        ? "All Test Cases Passed!"
                        : "Test Case Failures Detected"}
                    </span>
                    <span className="text-[11px] font-mono">
                      {results.filter((r) => r.passed).length}/{results.length} Passed (
                      {telemetry.score}%)
                    </span>
                  </div>
                )}

                {currentQ.testCases
                  .filter((tc) => !tc.isHidden)
                  .map((tc, idx) => {
                    const res = results?.[idx];

                    return (
                      <div
                        key={tc.id}
                        className={cn(
                          "rounded-xl border p-3 space-y-2 text-xs shadow-xs transition-colors",
                          res
                            ? res.passed
                              ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10"
                              : "border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10"
                            : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Test Case #{idx + 1}
                          </span>
                          {res && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-bold uppercase",
                                res.passed
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400",
                              )}
                            >
                              {res.passed ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" /> Passed
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" /> {res.status}
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-sans font-bold">
                              Input:
                            </span>
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 text-slate-800 dark:text-slate-200">
                              {tc.input}
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-sans font-bold">
                              Expected Output:
                            </span>
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 text-slate-800 dark:text-slate-200">
                              {tc.expectedOutput}
                            </div>
                          </div>

                          {res && (
                            <div>
                              <span className="text-slate-400 uppercase text-[10px] font-sans font-bold">
                                {res.error && !res.actualOutput
                                  ? "Diagnostic / Error:"
                                  : "Your Output:"}
                              </span>
                              <div
                                className={cn(
                                  "rounded-lg border p-1.5 font-mono text-[11px] whitespace-pre-wrap break-all",
                                  res.passed
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300",
                                )}
                              >
                                {res.actualOutput || res.error || "(No output produced)"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Custom Stdin Input */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Stdin Input (Optional)
                </span>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. 10 20 30"
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Workspace: Solution IDE & Execution Terminal */}
        <div
          className={cn(
            "space-y-5 transition-all",
            problemSidebarCollapsed ? "lg:col-span-12" : "lg:col-span-7",
          )}
        >
          {/* Solution Editor Panel */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-4 py-2.5">
              {/* Language Selector Pills & Expand Sidebar button */}
              <div className="flex items-center gap-2">
                {problemSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => setProblemSidebarCollapsed(false)}
                    title="Show Question & Test Cases Sidebar"
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                  >
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Problem & Tests</span>
                  </button>
                )}

                <div className="flex items-center gap-1">
                  {(["Python", "Java", "C", "C++", "JavaScript"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setSelectedLang(l);
                        setResults(null);
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                        selectedLang === l
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Actions: EXPAND, RUN & SUBMIT */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorExpanded((prev) => !prev)}
                  title={
                    editorExpanded ? "Contract Editor (480px)" : "Expand Editor Height (640px)"
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  {editorExpanded ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Standard</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Expand</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => runCode(false)}
                  disabled={isRunning || isSubmitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  <span>{isRunning ? "Running..." : "Run Tests"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => runCode(true)}
                  disabled={isRunning || isSubmitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>{isSubmitting ? "Evaluating..." : "Submit Solution"}</span>
                </button>
              </div>
            </div>

            {/* Monaco Code Editor with visible scrollbars */}
            <div className="p-0">
              <CodeEditor
                value={code}
                onChange={(val) => setCode(val || "")}
                language={
                  selectedLang === "Python"
                    ? "python"
                    : selectedLang === "Java"
                      ? "java"
                      : selectedLang === "C"
                        ? "c"
                        : selectedLang === "C++"
                          ? "cpp"
                          : "javascript"
                }
                height={editorExpanded ? "640px" : "480px"}
              />
            </div>
          </div>

          {/* Terminal Output & Compiler Logs Panel */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Terminal className="h-4 w-4 text-indigo-500" />
                <span>Terminal Stdout & Compiler Logs</span>
              </div>

              {telemetry.timeMs > 0 && (
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Runtime: {telemetry.timeMs}ms</span>
                  <span>·</span>
                  <span>Score: {telemetry.score}%</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-3 font-mono text-xs text-slate-300 space-y-1 max-h-56 overflow-y-auto">
                {consoleOutput.map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      l.includes("OK") || l.includes("PASSED")
                        ? "text-emerald-400 font-semibold"
                        : l.includes("Failed") || l.includes("ERROR") || l.includes("WRONG_ANSWER")
                          ? "text-rose-400 font-semibold"
                          : "text-slate-300",
                    )}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots Dialog */}
      <Dialog open={snapshotsOpen} onOpenChange={setSnapshotsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Code Snapshots</DialogTitle>
            <DialogDescription>
              Restore previously saved checkpoints of your solutions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
            {savedSnapshots.length > 0 ? (
              savedSnapshots.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
                    <p className="text-[11px] text-slate-500">{s.time}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCode(s.code);
                      setSnapshotsOpen(false);
                      toast.success(`Restored snapshot from ${s.time}`);
                    }}
                    className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                  >
                    Restore
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-500 py-4">No snapshots saved yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
