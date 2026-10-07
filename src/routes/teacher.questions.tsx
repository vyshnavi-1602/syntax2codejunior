import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import {
  loadQuestionBank,
  saveQuestionBank,
  extractQuestionsFromDocumentText,
  type SubjectItem,
  type McqQuestionItem,
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

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);
  const [newSubjectModalOpen, setNewSubjectModalOpen] = useState(false);

  // Document Upload Form
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<McqQuestionItem[]>([]);

  // Manual Question Form
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [xp, setXp] = useState(25);

  // New Subject Form
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");

  useEffect(() => {
    const loaded = loadQuestionBank();
    setSubjects(loaded);
    if (loaded.length > 0 && loaded[0]) {
      setSelectedSubjectId((prev) => prev || loaded[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const updateSubjects = (newSubs: SubjectItem[]) => {
    setSubjects(newSubs);
    saveQuestionBank(newSubs);
  };

  const totalQuestions = subjects.reduce((sum, s) => sum + s.questions.length, 0);
  const docExtractedCount = subjects.reduce(
    (sum, s) => sum + s.questions.filter((q) => q.sourceDoc).length,
    0,
  );

  // Handle Document Upload & Extraction
  const handleExtractFromDoc = () => {
    if (!docContent.trim()) {
      toast.error("Please provide document content or notes to extract questions from.");
      return;
    }
    setIsExtracting(true);
    setTimeout(() => {
      const generated = extractQuestionsFromDocumentText(
        docContent,
        activeSubject ? activeSubject.name : "Subject",
        docTitle || "Uploaded Syllabus Notes",
      );
      setExtractedPreview(generated);
      setIsExtracting(false);
      toast.success(`Successfully extracted ${generated.length} MCQs!`, {
        description: "Review the questions below and click 'Save to Subject Bank'.",
      });
    }, 600);
  };

  const handleSaveExtracted = () => {
    if (extractedPreview.length === 0 || !activeSubject) return;

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
    toast.success(`Added ${extractedPreview.length} questions to ${activeSubject.name}!`);
    setExtractedPreview([]);
    setDocContent("");
    setDocTitle("");
    setUploadModalOpen(false);
  };

  // Handle Manual Question Creation
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
    toast.success("Question created successfully!");
    setAddQuestionModalOpen(false);
    // Reset form
    setQuestionPrompt("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIdx(0);
    setExplanation("");
  };

  // Handle Delete Question
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
  const filteredQuestions = activeSubject
    ? activeSubject.questions.filter(
        (q) =>
          q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.options.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank & MCQs"
        subtitle="Manage subject-wise multiple-choice question banks, extract questions from syllabus documents, and publish tests."
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
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Upload Document to Extract MCQs</span>
            </button>
            <button
              onClick={() => setAddQuestionModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 text-xs font-semibold text-white shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Question</span>
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
        <Stat
          label="Total MCQ Questions"
          value={totalQuestions}
          sub="Ready for student assessments"
          tone="emerald"
        />
        <Stat
          label="From Documents"
          value={docExtractedCount}
          sub="Extracted via document notes"
          tone="sky"
        />
        <Stat
          label="Current Subject Pool"
          value={activeSubject?.questions.length || 0}
          sub={activeSubject ? activeSubject.name : "Select subject"}
          tone="amber"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Subjects Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <Panel
            title="Subjects & Domains"
            description="Select a subject to view or add questions"
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
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ml-2",
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {sub.questions.length} MCQs
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Document Upload Quick Info Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-teal-50/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-900">Document MCQ Generator</h4>
            </div>
            <p className="text-xs text-indigo-950/80 leading-relaxed">
              Upload your syllabus PDF, chapter notes, or copy-paste lecture slides. The system will
              automatically extract key concepts and formulate multiple choice questions with 4
              options, correct answers, and explanations.
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 text-xs font-bold text-white shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Curriculum Document
            </button>
          </div>
        </div>

        {/* Right Column: Question Bank for Selected Subject */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {activeSubject?.name || "Subject Questions"}
                </h3>
                <Pill tone="emerald">{filteredQuestions.length} Questions</Pill>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSubject?.description || "Browse questions to include in your assessments."}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions in subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length > 0 ? (
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => (
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
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Questions Found
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload a curriculum document to automatically generate MCQs or add your first
                  question manually.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Document
                </button>
                <button
                  onClick={() => setAddQuestionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Upload Document & Extract MCQs */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>Extract Questions from Subject Document</span>
            </DialogTitle>
            <DialogDescription>
              Upload or paste chapter notes for <strong>{activeSubject?.name}</strong>. The system
              will generate multiple choice questions with 4 options and answer explanations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                rows={6}
                placeholder="Paste curriculum notes, lecture content, syllabus guidelines, or formatted Q&A text here...&#10;&#10;e.g.&#10;In Python, lists are mutable while tuples are immutable. Functions are created with the 'def' keyword. List comprehensions provide a concise way to create lists."
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
                    `Q1: What is the main purpose of encapsulation in object-oriented programming?\na) To hide internal state and require all interaction through methods\nb) To allow multiple inheritance\nc) To compile code faster\nd) To execute parallel threads\nAnswer: To hide internal state and require all interaction through methods\n\nQ2: Which statement best describes polymorphism?\na) The ability of an object to take on many forms\nb) Converting code directly into binary\nc) A database normalization technique\nd) Creating infinite recursive loops\nAnswer: The ability of an object to take on many forms\n\nQ3: What happens when an exception is not caught in a program?\na) The program terminates abnormally\nb) The computer automatically reboots\nc) The code compiles into JavaScript\nd) The execution ignores all errors\nAnswer: The program terminates abnormally`,
                  );
                }}
                className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                + Paste Sample Q&A Curriculum Text
              </button>

              <button
                type="button"
                onClick={handleExtractFromDoc}
                disabled={isExtracting || !docContent.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isExtracting ? "Extracting MCQs..." : "Extract & Generate MCQs"}</span>
              </button>
            </div>

            {/* Extracted Questions Preview */}
            {extractedPreview.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Extracted Questions ({extractedPreview.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveExtracted}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save {extractedPreview.length} Questions to Bank</span>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Add MCQ Manually */}
      <Dialog open={addQuestionModalOpen} onOpenChange={setAddQuestionModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add MCQ Question Manually</DialogTitle>
            <DialogDescription>
              Create a multiple choice question for <strong>{activeSubject?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

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
                Add Question
              </button>
            </div>
          </form>
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
