import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  Plus,
  Upload,
  FileText,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Search,
  Check,
  X,
  FileCode,
  Layers,
  ChevronRight,
  RefreshCw,
  FolderPlus,
  AlertCircle,
  CheckSquare,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import {
  loadQuestionBank,
  saveQuestionBank,
  extractQuestionsFromDocumentText,
  extractTheoryQuestionsFromDocumentText,
  type SubjectItem,
  type McqQuestionItem,
  type TheoryQuestionItem,
  DEFAULT_SUBJECTS,
} from "@/client/components/app/questionBank";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";

export const Route = createFileRoute("/teacher/questions")({
  head: () => ({
    meta: [
      { title: "Question Bank & MCQs · Syntax2Code" },
      {
        name: "description",
        content:
          "Organize subject-wise MCQs, upload curriculum documents to generate questions, and publish assessments.",
      },
    ],
  }),
  component: TeacherQuestionsPage,
});

function TeacherQuestionsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"mcq" | "theory">("mcq");

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);
  const [newSubjectModalOpen, setNewSubjectModalOpen] = useState(false);

  // Document Upload Form
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionTarget, setExtractionTarget] = useState<"mcq" | "theory">("mcq");
  const [extractedPreview, setExtractedPreview] = useState<McqQuestionItem[]>([]);
  const [extractedTheoryPreview, setExtractedTheoryPreview] = useState<TheoryQuestionItem[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Question Form (MCQ)
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [xp, setXp] = useState(25);

  // Manual Question Form (Theory / Coding)
  const [theoryPrompt, setTheoryPrompt] = useState("");
  const [theoryExpectedAnswer, setTheoryExpectedAnswer] = useState("");
  const [theoryRubric, setTheoryRubric] = useState("");
  const [theoryDifficulty, setTheoryDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [theoryMarks, setTheoryMarks] = useState(5);

  // New Subject Form
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");

  useEffect(() => {
    const loaded = loadQuestionBank();
    setSubjects(loaded);
    if (loaded.length > 0 && loaded[0]) {
      setSelectedSubjectId((prev) => prev || loaded[0]!.id);
    }
  }, []);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const updateSubjects = (newSubs: SubjectItem[]) => {
    setSubjects(newSubs);
    saveQuestionBank(newSubs);
  };

  const totalMcqs = subjects.reduce((sum, s) => sum + s.questions.length, 0);
  const totalTheory = subjects.reduce((sum, s) => sum + (s.theoryQuestions?.length || 0), 0);
  const docExtractedCount = subjects.reduce(
    (sum, s) =>
      sum +
      s.questions.filter((q) => q.sourceDoc).length +
      (s.theoryQuestions || []).filter((q) => q.sourceDoc).length,
    0,
  );

  // File Upload Handlers
  const handleFile = (file: File) => {
    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setDocContent(content);
        toast.success(`Loaded "${file.name}"!`, {
          description: "Click 'Extract Questions' below to parse questions.",
        });
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle Document Upload & Extraction
  const handleExtractFromDoc = () => {
    if (!docContent.trim()) {
      toast.error("Please provide document content or select a file to extract from.");
      return;
    }
    setIsExtracting(true);
    setTimeout(() => {
      if (extractionTarget === "mcq") {
        const generated = extractQuestionsFromDocumentText(
          docContent,
          activeSubject ? activeSubject.name : "Subject",
          docTitle || uploadedFileName || "Uploaded Syllabus Notes",
        );
        setExtractedPreview(generated);
        setExtractedTheoryPreview([]);
        setIsExtracting(false);
        toast.success(`Extracted ${generated.length} Multiple Choice Questions!`, {
          description: "Review the questions below and click 'Save to Subject Bank'.",
        });
      } else {
        const generated = extractTheoryQuestionsFromDocumentText(
          docContent,
          activeSubject ? activeSubject.name : "Subject",
          docTitle || uploadedFileName || "Uploaded Syllabus Notes",
        );
        setExtractedTheoryPreview(generated);
        setExtractedPreview([]);
        setIsExtracting(false);
        toast.success(`Extracted ${generated.length} Theory & Coding Questions!`, {
          description: "Review the questions below and click 'Save to Subject Bank'.",
        });
      }
    }, 600);
  };

  const handleSaveExtracted = () => {
    if (!activeSubject) return;

    if (extractionTarget === "mcq" && extractedPreview.length > 0) {
      const updated = subjects.map((s) => {
        if (s.id === activeSubject.id) {
          return {
            ...s,
            questions: [...s.questions, ...extractedPreview],
          };
        }
        return s;
      });

      updateSubjects(updated);
      toast.success(`Added ${extractedPreview.length} MCQs to ${activeSubject.name}!`);
      setExtractedPreview([]);
    } else if (extractionTarget === "theory" && extractedTheoryPreview.length > 0) {
      const updated = subjects.map((s) => {
        if (s.id === activeSubject.id) {
          return {
            ...s,
            theoryQuestions: [...(s.theoryQuestions || []), ...extractedTheoryPreview],
          };
        }
        return s;
      });

      updateSubjects(updated);
      toast.success(
        `Added ${extractedTheoryPreview.length} Theory questions to ${activeSubject.name}!`,
      );
      setExtractedTheoryPreview([]);
    }

    setDocContent("");
    setDocTitle("");
    setUploadedFileName("");
    setUploadedFileSize("");
    setUploadModalOpen(false);
  };

  // Handle Manual MCQ Creation
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionPrompt.trim()) {
      toast.error("Please enter the question prompt.");
      return;
    }
    const filteredOptions = options.map((o) => o.trim());
    if (filteredOptions.some((o) => !o)) {
      toast.error("Please fill in all 4 options.");
      return;
    }

    const newQ: McqQuestionItem = {
      id: `manual_${Date.now()}`,
      questionText: questionPrompt.trim(),
      options: filteredOptions,
      correctAnswer: filteredOptions[correctOptionIdx] || filteredOptions[0] || "Option A",
      explanation: explanation.trim() || "Concept explanation provided by instructor.",
      difficulty,
      xp,
    };

    if (!activeSubject) return;
    const currentSubId = activeSubject.id;
    const updated = subjects.map((s) => {
      if (s.id === currentSubId) {
        return {
          ...s,
          questions: [newQ, ...s.questions],
        };
      }
      return s;
    });

    updateSubjects(updated);
    toast.success("MCQ created successfully!");
    setAddQuestionModalOpen(false);
    setQuestionPrompt("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIdx(0);
    setExplanation("");
  };

  // Handle Manual Theory Question Creation
  const handleCreateTheoryQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theoryPrompt.trim()) {
      toast.error("Please enter the question prompt.");
      return;
    }
    if (!theoryExpectedAnswer.trim()) {
      toast.error("Please provide the expected answer or solution.");
      return;
    }

    const newQ: TheoryQuestionItem = {
      id: `th_manual_${Date.now()}`,
      questionText: theoryPrompt.trim(),
      expectedAnswer: theoryExpectedAnswer.trim(),
      rubricOrGuidelines: theoryRubric.trim() || undefined,
      difficulty: theoryDifficulty,
      marks: theoryMarks,
    };

    if (!activeSubject) return;
    const updated = subjects.map((s) => {
      if (s.id === activeSubject.id) {
        return {
          ...s,
          theoryQuestions: [newQ, ...(s.theoryQuestions || [])],
        };
      }
      return s;
    });

    updateSubjects(updated);
    toast.success("Theory question created successfully!");
    setAddQuestionModalOpen(false);
    setTheoryPrompt("");
    setTheoryExpectedAnswer("");
    setTheoryRubric("");
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!activeSubject) return;
    const updated = subjects.map((s) => {
      if (s.id === activeSubject.id) {
        return {
          ...s,
          questions: s.questions.filter((q) => q.id !== qId),
        };
      }
      return s;
    });
    updateSubjects(updated);
    toast.success("Question removed from bank.");
  };

  const handleDeleteTheoryQuestion = (qId: string) => {
    if (!activeSubject) return;
    const updated = subjects.map((s) => {
      if (s.id === activeSubject.id) {
        return {
          ...s,
          theoryQuestions: (s.theoryQuestions || []).filter((q) => q.id !== qId),
        };
      }
      return s;
    });
    updateSubjects(updated);
    toast.success("Theory question removed from bank.");
  };

  // Handle New Subject Creation
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      toast.error("Please enter a subject name.");
      return;
    }
    const newSub: SubjectItem = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      description: newSubDesc.trim() || `Coursework and assessments for ${newSubName.trim()}`,
      iconName: "BookOpen",
      color: "indigo",
      questions: [],
    };

    const updated = [...subjects, newSub];
    updateSubjects(updated);
    setSelectedSubjectId(newSub.id);
    setNewSubjectModalOpen(false);
    setNewSubName("");
    setNewSubDesc("");
    toast.success(`Subject "${newSub.name}" added to bank!`);
  };

  // Filtered Questions in Current Subject
  const filteredMcqs = activeSubject
    ? activeSubject.questions.filter(
        (q) =>
          q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.options.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : [];

  const filteredTheory = activeSubject
    ? (activeSubject.theoryQuestions || []).filter(
        (q) =>
          q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.expectedAnswer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank & Assessments"
        subtitle="Organize Multiple Choice Questions (MCQs) and Theory / Coding problems, upload curriculum documents, and create assessments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setNewSubjectModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5 text-indigo-600" />
              <span>+ New Subject</span>
            </button>
            <button
              onClick={() => {
                setExtractionTarget(activeTab);
                setUploadModalOpen(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Upload Document to Extract</span>
            </button>
            <button
              onClick={() => setAddQuestionModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 text-xs font-semibold text-white shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add {activeTab === "mcq" ? "MCQ" : "Theory Question"}</span>
            </button>
          </div>
        }
      />

      {/* Top Level Metric Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active Subjects"
          value={subjects.length}
          sub="Organized topic banks"
          tone="violet"
        />
        <Stat label="Total MCQs" value={totalMcqs} sub="Multiple choice questions" tone="emerald" />
        <Stat
          label="Theory & Coding"
          value={totalTheory}
          sub="Descriptive problem bank"
          tone="teal"
        />
        <Stat
          label="Current Pool"
          value={
            activeTab === "mcq"
              ? activeSubject?.questions.length || 0
              : activeSubject?.theoryQuestions?.length || 0
          }
          sub={
            activeSubject
              ? `${activeSubject.name} (${activeTab === "mcq" ? "MCQs" : "Theory"})`
              : "Select subject"
          }
          tone="amber"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Subjects Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <Panel
            title="Subjects & Domains"
            description="Select a subject to view its questions"
            action={
              <button
                onClick={() => setNewSubjectModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                + Add Subject
              </button>
            }
          >
            <div className="space-y-1.5">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs font-semibold"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                        )}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate">{sub.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{sub.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                        )}
                      >
                        {sub.questions.length} MCQs
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        {(sub.theoryQuestions || []).length} Th
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Document Upload Quick Info Banner */}
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 to-teal-50/40 dark:from-indigo-950/40 dark:to-slate-900 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Document Question Generator
              </h4>
            </div>
            <p className="text-xs text-indigo-950/80 dark:text-indigo-300 leading-relaxed">
              Upload your syllabus file (.txt, .md, .pdf, .docx, .json) or copy-paste lecture notes.
              The AI parser extracts both <strong>MCQs</strong> and{" "}
              <strong>Theory Questions</strong> with model answers.
            </p>
            <button
              onClick={() => {
                setExtractionTarget(activeTab);
                setUploadModalOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 text-xs font-bold text-white shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Syllabus Document
            </button>
          </div>
        </div>

        {/* Right Column: Question Bank for Selected Subject */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {activeSubject?.name || "Subject Questions"}
                </h3>
                <Pill tone="emerald">{activeSubject?.questions.length || 0} MCQs</Pill>
                <Pill tone="teal">{(activeSubject?.theoryQuestions || []).length} Theory</Pill>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSubject?.description || "Browse questions to include in assessments."}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === "mcq" ? "MCQs" : "Theory questions"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Segmented View Switcher: MCQs vs Theory Questions */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("mcq")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "mcq"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Multiple Choice (MCQs) ({activeSubject?.questions.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "theory"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <FileText className="h-4 w-4" />
              <span>
                Theory & Coding Questions ({(activeSubject?.theoryQuestions || []).length})
              </span>
            </button>
          </div>

          {/* VIEW 1: Multiple Choice Questions (MCQs) */}
          {activeTab === "mcq" &&
            (filteredMcqs.length > 0 ? (
              <div className="space-y-3">
                {filteredMcqs.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Q{idx + 1}.
                          </span>
                          <Pill
                            tone={
                              q.difficulty === "Easy"
                                ? "emerald"
                                : q.difficulty === "Medium"
                                  ? "amber"
                                  : "rose"
                            }
                          >
                            {q.difficulty}
                          </Pill>
                          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            +{q.xp} XP
                          </span>
                          {q.sourceDoc && (
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 px-2 py-0.5">
                              <FileText className="h-3 w-3" />
                              <span>{q.sourceDoc}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {q.questionText}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid gap-2 sm:grid-cols-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        const letter = ["A", "B", "C", "D"][optIdx] || `${optIdx + 1}`;
                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium border transition-colors",
                              isCorrect
                                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-700 dark:text-slate-300",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                              )}
                            >
                              {letter}
                            </span>
                            <span className="flex-1 truncate">{opt}</span>
                            {isCorrect && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Correct</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    {q.explanation && (
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 p-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          Explanation:
                        </strong>{" "}
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No MCQs in Subject
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Upload a syllabus document or add multiple choice questions manually.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setExtractionTarget("mcq");
                      setUploadModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload Document
                  </button>
                  <button
                    onClick={() => setAddQuestionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add MCQ
                  </button>
                </div>
              </div>
            ))}

          {/* VIEW 2: Theory & Coding Questions */}
          {activeTab === "theory" &&
            (filteredTheory.length > 0 ? (
              <div className="space-y-3">
                {filteredTheory.map((tq, idx) => (
                  <div
                    key={tq.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Q{idx + 1}.
                          </span>
                          <Pill
                            tone={
                              tq.difficulty === "Easy"
                                ? "emerald"
                                : tq.difficulty === "Medium"
                                  ? "amber"
                                  : "rose"
                            }
                          >
                            {tq.difficulty}
                          </Pill>
                          <span className="rounded bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                            {tq.marks} Marks
                          </span>
                          {tq.sourceDoc && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 px-2 py-0.5">
                              <FileText className="h-3 w-3" />
                              <span>{tq.sourceDoc}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {tq.questionText}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteTheoryQuestion(tq.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Model Answer / Solution Card */}
                    <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 space-y-1 text-xs">
                      <p className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Expected Answer / Model Solution:</span>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                        {tq.expectedAnswer}
                      </p>
                    </div>

                    {/* Rubric / Evaluation Guidelines */}
                    {tq.rubricOrGuidelines && (
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 p-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          Evaluation Rubric:
                        </strong>{" "}
                        {tq.rubricOrGuidelines}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No Theory Questions Found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Extract open-ended or coding questions from syllabus notes or add them manually.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setExtractionTarget("theory");
                      setUploadModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload Document
                  </button>
                  <button
                    onClick={() => setAddQuestionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Theory Question
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL 1: Upload Document & Extract Questions */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>Extract Questions from Subject Document</span>
            </DialogTitle>
            <DialogDescription>
              Upload or paste chapter notes for <strong>{activeSubject?.name}</strong>. Choose
              whether to extract MCQs or Theory questions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Extraction Type Selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setExtractionTarget("mcq")}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  extractionTarget === "mcq"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                🎯 Extract as Multiple Choice (MCQs)
              </button>
              <button
                type="button"
                onClick={() => setExtractionTarget("theory")}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  extractionTarget === "theory"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                📝 Extract as Theory & Coding Questions
              </button>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40"
                  : uploadedFileName
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/50",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv,.doc,.docx,.pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                  <FileUp className="h-5 w-5" />
                </div>
                {uploadedFileName ? (
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 justify-center">
                      <Check className="h-3.5 w-3.5" /> {uploadedFileName} ({uploadedFileSize})
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to browse or drag and drop syllabus / notes file
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports .txt, .md, .json, .csv, and formatted documents
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Document / Chapter Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4: Object-Oriented Programming & Classes"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Curriculum Notes or Document Text
              </label>
              <textarea
                rows={5}
                placeholder="Paste curriculum notes, lecture content, syllabus guidelines, or formatted Q&A text here...&#10;&#10;e.g.&#10;In Python, lists are mutable while tuples are immutable. Functions are created with the 'def' keyword."
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs font-mono outline-none focus:border-indigo-400"
              />
            </div>

            {/* Quick Demo Pre-Fill Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDocTitle(`${activeSubject?.name || "Subject"} Core Lecture Notes`);
                  setDocContent(
                    `Q1: What is the main purpose of encapsulation in object-oriented programming?\na) To hide internal state and require all interaction through methods\nb) To allow multiple inheritance\nc) To compile code faster\nd) To execute parallel threads\nAnswer: To hide internal state and require all interaction through methods\n\nQ2: Explain the significance of polymorphism in scalable software architecture.\nExpected Answer: Polymorphism allows code to work with objects of multiple types uniformly through a common interface or abstract class, enabling loose coupling and easy extensibility.\nRubric: Award 3 marks for interface definition and 2 marks for real-world example.\n\nQ3: What happens when an exception is not caught in a program?\na) The program terminates abnormally\nb) The computer automatically reboots\nc) The code compiles into JavaScript\nd) The execution ignores all errors\nAnswer: The program terminates abnormally`,
                  );
                }}
                className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                + Paste Sample Curriculum Text
              </button>

              <button
                type="button"
                onClick={handleExtractFromDoc}
                disabled={isExtracting || !docContent.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isExtracting
                    ? "Extracting..."
                    : `Extract & Generate ${extractionTarget === "mcq" ? "MCQs" : "Theory Questions"}`}
                </span>
              </button>
            </div>

            {/* Extracted MCQs Preview */}
            {extractionTarget === "mcq" && extractedPreview.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Extracted MCQs ({extractedPreview.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveExtracted}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save {extractedPreview.length} MCQs to Bank</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {extractedPreview.map((pq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-2 text-xs"
                    >
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {pq.questionText}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {pq.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={cn(
                              "rounded p-1 border truncate",
                              opt === pq.correctAnswer
                                ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold"
                                : "bg-white border-slate-200 text-slate-600",
                            )}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Theory Questions Preview */}
            {extractionTarget === "theory" && extractedTheoryPreview.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Extracted Theory Questions ({extractedTheoryPreview.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveExtracted}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save {extractedTheoryPreview.length} Theory Questions</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {extractedTheoryPreview.map((tq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5 text-xs"
                    >
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {tq.questionText}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        <strong>Expected:</strong> {tq.expectedAnswer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Add Question Manually (MCQ or Theory) */}
      <Dialog open={addQuestionModalOpen} onOpenChange={setAddQuestionModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add {activeTab === "mcq" ? "MCQ Question" : "Theory & Coding Question"}
            </DialogTitle>
            <DialogDescription>
              Create a question for <strong>{activeSubject?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {activeTab === "mcq" ? (
            <form onSubmit={handleCreateQuestion} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Question Prompt *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Which of the following data structures operates on a FIFO basis?"
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Answer Choices (Select the radio of the correct answer) *
                </label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={correctOptionIdx === idx}
                      onChange={() => setCorrectOptionIdx(idx)}
                      className="h-4 w-4 text-emerald-600 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-slate-400 w-4">
                      {["A", "B", "C", "D"][idx]}:
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${["A", "B", "C", "D"][idx]}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[idx] = e.target.value;
                        setOptions(updated);
                      }}
                      className="h-8.5 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 text-xs outline-none focus:border-indigo-400"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Explanation (Shown after student submits)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. A Queue follows First-In, First-Out (FIFO), unlike Stacks which use LIFO."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs outline-none"
                  >
                    <option value="Easy">Easy (15 XP)</option>
                    <option value="Medium">Medium (25 XP)</option>
                    <option value="Hard">Hard (35 XP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    value={xp}
                    onChange={(e) => setXp(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddQuestionModalOpen(false)}
                  className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  Add MCQ
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateTheoryQuestion} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Question Prompt *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Explain how Merge Sort works and derive its time complexity."
                  value={theoryPrompt}
                  onChange={(e) => setTheoryPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Expected Answer / Model Solution *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the complete expected solution or key points..."
                  value={theoryExpectedAnswer}
                  onChange={(e) => setTheoryExpectedAnswer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Evaluation Rubric & Guidelines (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 3 marks for dividing step, 2 marks for merging explanation."
                  value={theoryRubric}
                  onChange={(e) => setTheoryRubric(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={theoryDifficulty}
                    onChange={(e) =>
                      setTheoryDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
                    }
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={theoryMarks}
                    onChange={(e) => setTheoryMarks(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddQuestionModalOpen(false)}
                  className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  Add Theory Question
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: New Subject */}
      <Dialog open={newSubjectModalOpen} onOpenChange={setNewSubjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new topic/domain to categorize multiple choice questions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubject} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Cybersecurity & Network Defense"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 text-xs outline-none focus:border-indigo-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Description
              </label>
              <textarea
                rows={2}
                placeholder="Brief description of the domain..."
                value={newSubDesc}
                onChange={(e) => setNewSubDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNewSubjectModalOpen(false)}
                className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Create Subject
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
