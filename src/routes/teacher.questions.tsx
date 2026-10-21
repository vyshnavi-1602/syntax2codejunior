import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Layers,
  FileText,
  BookOpen,
  Tag,
  HelpCircle,
  Plus,
  Upload,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  ChevronRight,
  FolderPlus,
  Clock,
  Sparkles,
  Calendar,
  Award,
  FileUp,
  X,
  Check,
  AlertCircle,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/client/lib/utils";
import {
  loadQuestionBank,
  saveQuestionBank,
  loadExams,
  saveExams,
  extractTextFromUploadedFile,
  extractQuestionsFromDocumentText,
  type SubjectItem,
  type TopicItem,
  type McqQuestionItem,
  type ExamItem,
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
      { title: "Question Bank & Assessments · Syntax2Code" },
      {
        name: "description",
        content:
          "Organize subject-wise MCQs, upload curriculum documents to generate questions, and publish exams.",
      },
    ],
  }),
  component: TeacherQuestionsPage,
});

function TeacherQuestionsPage() {
  // Top view switcher: Question Bank vs MCQ Exams
  const [activeMainTab, setActiveMainTab] = useState<"bank" | "exams">("bank");

  // Question Bank State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");

  // Exams State
  const [exams, setExams] = useState<ExamItem[]>([]);

  // Modals
  const [uploadDocxModalOpen, setUploadDocxModalOpen] = useState(false);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<McqQuestionItem | null>(null);
  const [newSubjectModalOpen, setNewSubjectModalOpen] = useState(false);
  const [newTopicModalOpen, setNewTopicModalOpen] = useState(false);
  const [fromOldTestModalOpen, setFromOldTestModalOpen] = useState(false);
  const [createExamModalOpen, setCreateExamModalOpen] = useState(false);

  // Document Upload (.docx / .doc / .txt)
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState("");
  const [docFileSize, setDocFileSize] = useState("");
  const [rawDocText, setRawDocText] = useState("");
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [extractedDocQuestions, setExtractedDocQuestions] = useState<McqQuestionItem[]>([]);
  const [uploadTargetSubjectId, setUploadTargetSubjectId] = useState("");
  const [uploadTargetTopicId, setUploadTargetTopicId] = useState("");
  const [isNewTopicForUpload, setIsNewTopicForUpload] = useState(false);
  const [newTopicTitleForUpload, setNewTopicTitleForUpload] = useState("");
  const [docInputMode, setDocInputMode] = useState<"file" | "paste">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Subject Form
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");

  // New Topic Form
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");

  // New / Edit Question Form
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [questionExplanation, setQuestionExplanation] = useState("");
  const [questionDifficulty, setQuestionDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium",
  );
  const [questionXp, setQuestionXp] = useState(20);

  // New Exam Form
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamSubjectId, setNewExamSubjectId] = useState("");
  const [newExamTopicIds, setNewExamTopicIds] = useState<string[]>([]);
  const [newExamTotalQuestions, setNewExamTotalQuestions] = useState(20);
  const [newExamDuration, setNewExamDuration] = useState(45);
  const [newExamPassing, setNewExamPassing] = useState(60);

  // Initialize Data
  useEffect(() => {
    const loadedSubs = loadQuestionBank();
    setSubjects(loadedSubs);

    const loadedEx = loadExams();
    setExams(loadedEx);

    if (loadedSubs.length > 0) {
      const firstSub = loadedSubs[0];
      if (firstSub) {
        setSelectedSubjectId(firstSub.id);
        if (firstSub.topics && firstSub.topics.length > 0) {
          const firstTopic = firstSub.topics[0];
          if (firstTopic) {
            setSelectedTopicId(firstTopic.id);
          }
        }
      }
    }
  }, []);

  // Sync upload target with active selection
  useEffect(() => {
    if (selectedSubjectId) setUploadTargetSubjectId(selectedSubjectId);
    if (selectedTopicId) setUploadTargetTopicId(selectedTopicId);
  }, [selectedSubjectId, selectedTopicId]);

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId],
  );

  const activeTopic = useMemo(() => {
    if (!activeSubject) return null;
    return activeSubject.topics.find((t) => t.id === selectedTopicId) || null;
  }, [activeSubject, selectedTopicId]);

  const updateSubjects = (newSubs: SubjectItem[]) => {
    setSubjects(newSubs);
    saveQuestionBank(newSubs);
  };

  const updateExams = (newEx: ExamItem[]) => {
    setExams(newEx);
    saveExams(newEx);
  };

  const handleRefresh = () => {
    const loaded = loadQuestionBank();
    setSubjects(loaded);
    const loadedEx = loadExams();
    setExams(loadedEx);
    toast.success("Question bank refreshed");
  };

  const handleSelectSubject = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = subjects.find((s) => s.id === subId);
    if (sub && sub.topics.length > 0 && sub.topics[0]) {
      setSelectedTopicId(sub.topics[0].id);
    } else {
      setSelectedTopicId("");
    }
  };

  // -------------------------------------------------------------
  // File Upload & Document Extraction (.docx / .doc / .txt / .md)
  // -------------------------------------------------------------
  const handleFileUpload = async (file: File) => {
    setDocFile(file);
    setDocFileName(file.name);
    setDocFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    // Auto default new topic title based on document filename
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setNewTopicTitleForUpload(cleanName);

    try {
      setIsExtractingDoc(true);
      const text = await extractTextFromUploadedFile(file);
      setRawDocText(text);

      const targetSub = subjects.find((s) => s.id === uploadTargetSubjectId) || activeSubject;
      const subName = targetSub ? targetSub.name : "General";

      const parsedQuestions = extractQuestionsFromDocumentText(text, subName, file.name);
      setExtractedDocQuestions(parsedQuestions);
      setIsExtractingDoc(false);

      if (parsedQuestions.length > 0) {
        toast.success(`Successfully parsed ${parsedQuestions.length} questions from ${file.name}!`);
      } else {
        toast.warning(
          "No questions recognized automatically. You can review or edit the text on the right.",
        );
      }
    } catch (err) {
      setIsExtractingDoc(false);
      console.error("Doc extract error:", err);
      toast.error("Failed to parse document file.");
    }
  };

  const handleManualDocParse = () => {
    if (!rawDocText.trim()) {
      toast.error("Please enter or paste document content.");
      return;
    }
    setIsExtractingDoc(true);
    setTimeout(() => {
      const targetSub = subjects.find((s) => s.id === uploadTargetSubjectId) || activeSubject;
      const subName = targetSub ? targetSub.name : "General";
      const parsed = extractQuestionsFromDocumentText(
        rawDocText,
        subName,
        docFileName || "Pasted Document",
      );
      setExtractedDocQuestions(parsed);
      setIsExtractingDoc(false);
      if (parsed.length > 0) {
        toast.success(`Parsed ${parsed.length} questions!`);
      } else {
        toast.warning(
          "Could not detect MCQ pattern. Try formatting as: 1. Question? A) ... B) ...",
        );
      }
    }, 300);
  };

  const handleSaveDocQuestionsToBank = () => {
    if (!uploadTargetSubjectId) {
      toast.error("Please select a target subject.");
      return;
    }

    if (extractedDocQuestions.length === 0) {
      toast.error("No questions to import.");
      return;
    }

    let targetTopicId = uploadTargetTopicId;

    const updated = subjects.map((sub) => {
      if (sub.id !== uploadTargetSubjectId) return sub;

      let subTopics = [...sub.topics];

      // If creating a new topic for the uploaded questions
      if (isNewTopicForUpload || !targetTopicId) {
        const topicName =
          newTopicTitleForUpload.trim() ||
          docFileName.replace(/\.[^/.]+$/, "") ||
          "Uploaded Questions";
        const newTopic: TopicItem = {
          id: `top_${Date.now()}`,
          subjectId: sub.id,
          name: topicName,
          description: `Questions imported from ${docFileName || "document"}`,
          questions: extractedDocQuestions,
        };
        subTopics = [...subTopics, newTopic];
        targetTopicId = newTopic.id;
      } else {
        // Append to existing topic
        subTopics = subTopics.map((top) => {
          if (top.id === targetTopicId) {
            return {
              ...top,
              questions: [...top.questions, ...extractedDocQuestions],
            };
          }
          return top;
        });
      }

      return {
        ...sub,
        topics: subTopics,
      };
    });

    updateSubjects(updated);
    setSelectedSubjectId(uploadTargetSubjectId);
    if (targetTopicId) {
      setSelectedTopicId(targetTopicId);
    }

    toast.success(
      `Saved ${extractedDocQuestions.length} questions to ${activeSubject?.name || "Subject"}!`,
    );

    // Reset upload modal state
    setUploadDocxModalOpen(false);
    setDocFile(null);
    setDocFileName("");
    setRawDocText("");
    setExtractedDocQuestions([]);
  };

  // -------------------------------------------------------------
  // Question Add / Edit
  // -------------------------------------------------------------
  const handleOpenAddQuestion = () => {
    if (!activeTopic) {
      toast.error("Please select or create a topic first.");
      return;
    }
    setEditingQuestion(null);
    setQuestionPrompt("");
    setQuestionOptions(["", "", "", ""]);
    setCorrectOptionIdx(0);
    setQuestionExplanation("");
    setQuestionDifficulty("Medium");
    setQuestionXp(20);
    setAddQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: McqQuestionItem) => {
    setEditingQuestion(q);
    setQuestionPrompt(q.questionText);
    setQuestionOptions(
      q.options.length >= 4 ? [...q.options] : [...q.options, "", "", ""].slice(0, 4),
    );
    const corrIdx = q.options.findIndex((o) => o === q.correctAnswer);
    setCorrectOptionIdx(corrIdx >= 0 ? corrIdx : 0);
    setQuestionExplanation(q.explanation || "");
    setQuestionDifficulty(q.difficulty || "Medium");
    setQuestionXp(q.xp || 20);
    setAddQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !activeTopic) {
      toast.error("Please select a subject and topic.");
      return;
    }

    if (!questionPrompt.trim()) {
      toast.error("Please enter a question prompt.");
      return;
    }

    const cleanedOptions = questionOptions.map((o) => o.trim());
    if (cleanedOptions.some((o) => !o)) {
      toast.error("Please fill in all 4 options.");
      return;
    }

    const correctAns = cleanedOptions[correctOptionIdx] || cleanedOptions[0] || "";

    if (editingQuestion) {
      // Update existing
      const updated = subjects.map((sub) => {
        if (sub.id !== activeSubject.id) return sub;
        return {
          ...sub,
          topics: sub.topics.map((top) => {
            if (top.id !== activeTopic.id) return top;
            return {
              ...top,
              questions: top.questions.map((q) => {
                if (q.id !== editingQuestion.id) return q;
                return {
                  ...q,
                  questionText: questionPrompt.trim(),
                  options: cleanedOptions,
                  correctAnswer: correctAns,
                  explanation: questionExplanation.trim(),
                  difficulty: questionDifficulty,
                  xp: questionXp,
                };
              }),
            };
          }),
        };
      });
      updateSubjects(updated);
      toast.success("Question updated successfully!");
    } else {
      // Add new
      const newQ: McqQuestionItem = {
        id: `q_${Date.now()}`,
        topicId: activeTopic.id,
        questionText: questionPrompt.trim(),
        options: cleanedOptions,
        correctAnswer: correctAns,
        explanation: questionExplanation.trim(),
        difficulty: questionDifficulty,
        xp: questionXp,
      };

      const updated = subjects.map((sub) => {
        if (sub.id !== activeSubject.id) return sub;
        return {
          ...sub,
          topics: sub.topics.map((top) => {
            if (top.id !== activeTopic.id) return top;
            return {
              ...top,
              questions: [newQ, ...top.questions],
            };
          }),
        };
      });
      updateSubjects(updated);
      toast.success("Question added to topic!");
    }

    setAddQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!activeSubject || !activeTopic) return;
    const updated = subjects.map((sub) => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        topics: sub.topics.map((top) => {
          if (top.id !== activeTopic.id) return top;
          return {
            ...top,
            questions: top.questions.filter((q) => q.id !== questionId),
          };
        }),
      };
    });
    updateSubjects(updated);
    toast.success("Question deleted");
  };

  // -------------------------------------------------------------
  // Add Subject & Add Topic
  // -------------------------------------------------------------
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      toast.error("Subject name is required.");
      return;
    }

    const newSub: SubjectItem = {
      id: `sub_${Date.now()}`,
      name: newSubjectName.trim(),
      description: newSubjectDesc.trim() || `Questions and topics for ${newSubjectName.trim()}`,
      iconName: "BookOpen",
      color: "emerald",
      topics: [],
      questions: [],
    };

    const updated = [...subjects, newSub];
    updateSubjects(updated);
    setSelectedSubjectId(newSub.id);
    setSelectedTopicId("");
    setNewSubjectModalOpen(false);
    setNewSubjectName("");
    setNewSubjectDesc("");
    toast.success(`Subject "${newSub.name}" created!`);
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject) {
      toast.error("Please select a subject first.");
      return;
    }
    if (!newTopicName.trim()) {
      toast.error("Topic name is required.");
      return;
    }

    const newTop: TopicItem = {
      id: `top_${Date.now()}`,
      subjectId: activeSubject.id,
      name: newTopicName.trim(),
      description: newTopicDesc.trim(),
      questions: [],
    };

    const updated = subjects.map((sub) => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        topics: [...sub.topics, newTop],
      };
    });

    updateSubjects(updated);
    setSelectedTopicId(newTop.id);
    setNewTopicModalOpen(false);
    setNewTopicName("");
    setNewTopicDesc("");
    toast.success(`Topic "${newTop.name}" created!`);
  };

  // Import from old test sample
  const handleImportSampleQuestions = (count: number) => {
    if (!activeSubject || !activeTopic) {
      toast.error("Select a subject and topic first.");
      return;
    }

    const samplePool: McqQuestionItem[] = [
      {
        id: `mock_${Date.now()}_1`,
        questionText: `Which of the following represents standard behavior in ${activeSubject.name}?`,
        options: [
          "Deterministic execution with validated inputs",
          "Random state mutation without locks",
          "Blocking the event loop continuously",
          "Ignoring runtime exceptions unconditionally",
        ],
        correctAnswer: "Deterministic execution with validated inputs",
        explanation: "Robust systems guarantee deterministic execution with verified inputs.",
        difficulty: "Easy",
        xp: 15,
        sourceDoc: "Past Mock Exam 2025",
      },
      {
        id: `mock_${Date.now()}_2`,
        questionText: `What is the optimal complexity for search operations in an indexed ${activeTopic.name} structure?`,
        options: ["O(log n)", "O(n²)", "O(n!)", "O(2ⁿ)"],
        correctAnswer: "O(log n)",
        explanation:
          "Binary and tree-based indexed lookups typically achieve logarithmic O(log n) time.",
        difficulty: "Medium",
        xp: 25,
        sourceDoc: "Past Mock Exam 2025",
      },
      {
        id: `mock_${Date.now()}_3`,
        questionText: `In competitive assessments, what is the best practice when handling boundary constraints?`,
        options: [
          "Validate edge cases such as empty input, maximum bounds, and negative values",
          "Assume all inputs fit within typical integer limits without bounds checks",
          "Discard any input that exceeds 10 elements",
          "Rely entirely on default compiler traps",
        ],
        correctAnswer:
          "Validate edge cases such as empty input, maximum bounds, and negative values",
        explanation: "Defensive boundary testing guarantees correctness against edge test cases.",
        difficulty: "Hard",
        xp: 35,
        sourceDoc: "Past Mock Exam 2025",
      },
    ];

    const toAdd = samplePool.slice(0, count);
    const updated = subjects.map((sub) => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        topics: sub.topics.map((top) => {
          if (top.id !== activeTopic.id) return top;
          return {
            ...top,
            questions: [...top.questions, ...toAdd],
          };
        }),
      };
    });

    updateSubjects(updated);
    setFromOldTestModalOpen(false);
    toast.success(`Imported ${toAdd.length} questions from previous test paper!`);
  };

  // -------------------------------------------------------------
  // Filtered Questions in Current Topic
  // -------------------------------------------------------------
  const displayedQuestions = useMemo(() => {
    if (!activeTopic) return [];
    return activeTopic.questions.filter((q) => {
      const matchSearch =
        !searchQuery.trim() ||
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchLevel = levelFilter === "All" || q.difficulty === levelFilter;

      return matchSearch && matchLevel;
    });
  }, [activeTopic, searchQuery, levelFilter]);

  // Handle Exam Creation
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamSubjectId) {
      toast.error("Please fill in the exam title and subject.");
      return;
    }

    const sub = subjects.find((s) => s.id === newExamSubjectId);
    const newEx: ExamItem = {
      id: `exam_${Date.now()}`,
      title: newExamTitle.trim(),
      subjectId: newExamSubjectId,
      subjectName: sub ? sub.name : "Subject",
      topicIds: newExamTopicIds,
      totalQuestions: newExamTotalQuestions,
      durationMinutes: newExamDuration,
      passingPercentage: newExamPassing,
      status: "Published",
      scheduledDate: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      questions: [],
    };

    const updated = [newEx, ...exams];
    updateExams(updated);
    setCreateExamModalOpen(false);
    setNewExamTitle("");
    toast.success(`Exam "${newEx.title}" published!`);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* ========================================================= */}
      {/* Top Switcher: [QUESTION BANK] vs [MCQ EXAMS]             */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveMainTab("bank")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs",
            activeMainTab === "bank"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800",
          )}
        >
          <Layers className="h-4 w-4" />
          <span>QUESTION BANK</span>
        </button>

        <button
          onClick={() => setActiveMainTab("exams")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs",
            activeMainTab === "exams"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800",
          )}
        >
          <FileText className="h-4 w-4" />
          <span>MCQ EXAMS</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* Header Row: Title, Subtitle, Refresh                      */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Question Bank
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Subject → Topic → Questions. Exams draw their papers from this bank.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: QUESTION BANK 3-COLUMN VIEW                       */}
      {/* ========================================================= */}
      {activeMainTab === "bank" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start min-h-[640px]">
          {/* ------------------------------------------------------- */}
          {/* COLUMN 1: SUBJECTS                                      */}
          {/* ------------------------------------------------------- */}
          <div className="md:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#13151b] overflow-hidden flex flex-col h-[700px] shadow-sm">
            {/* Column Header */}
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>SUBJECTS</span>
              </div>
              <button
                onClick={() => setNewSubjectModalOpen(true)}
                title="Add New Subject"
                className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Subject List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubject(sub.id)}
                    className={cn(
                      "w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer group flex flex-col justify-center",
                      isSelected
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-transparent",
                    )}
                  >
                    <div className="text-sm font-semibold truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sub.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {sub.topics.length} topic(s)
                    </div>
                  </button>
                );
              })}

              {subjects.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No subjects found. Click + to create one.
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLUMN 2: TOPICS                                        */}
          {/* ------------------------------------------------------- */}
          <div className="md:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#13151b] overflow-hidden flex flex-col h-[700px] shadow-sm">
            {/* Column Header */}
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>TOPICS</span>
              </div>
              <button
                onClick={() => {
                  if (!activeSubject) {
                    toast.error("Select a subject first.");
                    return;
                  }
                  setNewTopicModalOpen(true);
                }}
                title="Add Topic to Subject"
                className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Topics List or Empty state */}
            <div className="flex-1 overflow-y-auto p-2">
              {!activeSubject ? (
                <div className="h-full flex items-center justify-center p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Select a subject first.
                </div>
              ) : activeSubject.topics.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No topics created for {activeSubject.name}.
                  </p>
                  <button
                    onClick={() => setNewTopicModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Topic</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {activeSubject.topics.map((top) => {
                    const isSelected = top.id === selectedTopicId;
                    return (
                      <button
                        key={top.id}
                        onClick={() => setSelectedTopicId(top.id)}
                        className={cn(
                          "w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer group flex flex-col justify-center",
                          isSelected
                            ? "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-transparent",
                        )}
                      >
                        <div className="text-sm font-semibold truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {top.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {top.questions.length} question(s)
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLUMN 3: QUESTIONS                                     */}
          {/* ------------------------------------------------------- */}
          <div className="md:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#13151b] overflow-hidden flex flex-col h-[700px] shadow-sm">
            {/* Top Toolbar */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 space-y-3 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                  <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>QUESTIONS</span>
                  {activeTopic && (
                    <span className="text-[11px] font-normal normal-case text-slate-500 truncate max-w-[140px]">
                      ({activeTopic.name})
                    </span>
                  )}
                </div>

                {/* Upload (.docx) Button */}
                <button
                  onClick={() => {
                    setDocInputMode("file");
                    setExtractedDocQuestions([]);
                    setUploadDocxModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs cursor-pointer transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Upload (.docx)</span>
                </button>
              </div>

              {/* Search + Filter Row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  />
                </div>

                <select
                  value={levelFilter}
                  onChange={(e) =>
                    setLevelFilter(e.target.value as "All" | "Easy" | "Medium" | "Hard")
                  }
                  className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500"
                >
                  <option value="All">All levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Action Buttons: From old test & + Add */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setFromOldTestModalOpen(true)}
                  disabled={!activeTopic}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>From old test</span>
                </button>

                <button
                  onClick={handleOpenAddQuestion}
                  disabled={!activeTopic}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add</span>
                </button>
              </div>
            </div>

            {/* Questions Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {!activeTopic ? (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Select a topic to manage its questions.
                </div>
              ) : displayedQuestions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No questions in this topic yet.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAddQuestion}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add First Question</span>
                    </button>
                    <button
                      onClick={() => setUploadDocxModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Upload (.docx)</span>
                    </button>
                  </div>
                </div>
              ) : (
                displayedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    {/* Card Top: Number, Badges, Delete/Edit */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          #{idx + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            q.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : q.difficulty === "Medium"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                          )}
                        >
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {q.xp || 20} XP
                        </span>
                        {q.sourceDoc && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            • {q.sourceDoc}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditQuestion(q)}
                          title="Edit Question"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Delete Question"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {q.questionText}
                    </div>

                    {/* 4 Choices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded-lg text-xs transition-colors",
                              isCorrect
                                ? "bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium"
                                : "bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300",
                            )}
                          >
                            <span
                              className={cn(
                                "h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                                isCorrect
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                              )}
                            >
                              {letter}
                            </span>
                            <span className="flex-1 break-words leading-tight">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Explanation:
                        </span>{" "}
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: MCQ EXAMS TAB                                     */}
      {/* ========================================================= */}
      {activeMainTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Published & Scheduled Exams
              </h2>
              <p className="text-xs text-slate-500">
                Automated assessments drawing questions directly from the question bank.
              </p>
            </div>
            <button
              onClick={() => {
                setNewExamSubjectId(selectedSubjectId || subjects[0]?.id || "");
                setCreateExamModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create MCQ Exam</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151b] p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {exam.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {exam.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {exam.title}
                  </h3>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {exam.subjectName}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Questions Pool:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {exam.totalQuestions} Questions
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pass Score:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {exam.passingPercentage}%
                    </span>
                  </div>
                  {exam.scheduledDate && (
                    <div className="flex items-center justify-between">
                      <span>Schedule:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {exam.scheduledDate}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => toast.success(`Exam link copied to clipboard!`)}
                    className="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => toast.info(`Previewing exam "${exam.title}"`)}
                    className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: UPLOAD (.docx) & DOCUMENT PARSER                  */}
      {/* ========================================================= */}
      <Dialog open={uploadDocxModalOpen} onOpenChange={setUploadDocxModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Upload Document to Question Bank</span>
            </DialogTitle>
            <DialogDescription>
              Upload curriculum notes, tests, or questions from Word (.docx), text (.txt), markdown
              (.md), or paste document text directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Input Mode Toggle */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setDocInputMode("file")}
                className={cn(
                  "flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                  docInputMode === "file"
                    ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400",
                )}
              >
                Upload File (.docx / .doc / .txt)
              </button>
              <button
                type="button"
                onClick={() => setDocInputMode("paste")}
                className={cn(
                  "flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                  docInputMode === "paste"
                    ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400",
                )}
              >
                Paste Text / Questions
              </button>
            </div>

            {/* Target Subject & Topic Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Import into Subject *
                </label>
                <select
                  value={uploadTargetSubjectId}
                  onChange={(e) => {
                    setUploadTargetSubjectId(e.target.value);
                    const sub = subjects.find((s) => s.id === e.target.value);
                    if (sub && sub.topics.length > 0) {
                      setUploadTargetTopicId(sub.topics[0]?.id || "");
                    }
                  }}
                  className="h-8.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Topic Destination
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewTopicForUpload(!isNewTopicForUpload)}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isNewTopicForUpload ? "Use Existing Topic" : "+ Create New Topic"}
                  </button>
                </div>

                {isNewTopicForUpload ? (
                  <input
                    type="text"
                    placeholder="New topic name..."
                    value={newTopicTitleForUpload}
                    onChange={(e) => setNewTopicTitleForUpload(e.target.value)}
                    className="h-8.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                ) : (
                  <select
                    value={uploadTargetTopicId}
                    onChange={(e) => setUploadTargetTopicId(e.target.value)}
                    className="h-8.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
                  >
                    {subjects
                      .find((s) => s.id === uploadTargetSubjectId)
                      ?.topics.map((top) => (
                        <option key={top.id} value={top.id}>
                          {top.name}
                        </option>
                      ))}
                    {(!subjects.find((s) => s.id === uploadTargetSubjectId)?.topics ||
                      subjects.find((s) => s.id === uploadTargetSubjectId)?.topics.length ===
                        0) && <option value="">No topics (will create default)</option>}
                  </select>
                )}
              </div>
            </div>

            {/* Mode 1: File Dropzone */}
            {docInputMode === "file" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,.txt,.md,.json,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {docFileName ? docFileName : "Choose a document or drag it here"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supports Word (.docx), Plain text (.txt), Markdown (.md)
                  </div>
                  {docFileSize && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {docFileSize}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Paste text */}
            {docInputMode === "paste" && (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  placeholder={`Paste questions here, for example:\n\n1. What is the antonym of Abundant?\nA) Scarce\nB) Plentiful\nC) Ample\nD) Broad\nAnswer: A\nExplanation: Scarce means insufficient.`}
                  value={rawDocText}
                  onChange={(e) => setRawDocText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-xs outline-none focus:border-emerald-500 font-mono"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleManualDocParse}
                    disabled={isExtractingDoc}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Parse Pasted Text
                  </button>
                </div>
              </div>
            )}

            {/* Extracted Preview */}
            {extractedDocQuestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Parsed {extractedDocQuestions.length} Questions Ready to Import</span>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {extractedDocQuestions.slice(0, 5).map((q, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 space-y-1"
                    >
                      <div className="font-semibold truncate">
                        {i + 1}. {q.questionText}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Answer: {q.correctAnswer}
                      </div>
                    </div>
                  ))}
                  {extractedDocQuestions.length > 5 && (
                    <div className="text-center text-[11px] text-slate-400 py-1">
                      + {extractedDocQuestions.length - 5} more questions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUploadDocxModalOpen(false)}
                className="h-8.5 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDocQuestionsToBank}
                disabled={extractedDocQuestions.length === 0}
                className="h-8.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Save {extractedDocQuestions.length} Questions to Bank
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT QUESTION                              */}
      {/* ========================================================= */}
      <Dialog open={addQuestionModalOpen} onOpenChange={setAddQuestionModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Multiple Choice Question" : "Add Question to Topic"}
            </DialogTitle>
            <DialogDescription>
              {activeTopic ? `Topic: ${activeTopic.name}` : "Configure question and options"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuestion} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Question Prompt *
              </label>
              <textarea
                rows={3}
                placeholder="Type the question prompt..."
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Answer Choices (Select the radio of the correct answer) *
              </label>
              {questionOptions.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = correctOptionIdx === idx;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectOptionIdx(idx)}
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200",
                      )}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${letter}...`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...questionOptions];
                        next[idx] = e.target.value;
                        setQuestionOptions(next);
                      }}
                      className="h-8.5 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Difficulty
                </label>
                <select
                  value={questionDifficulty}
                  onChange={(e) =>
                    setQuestionDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
                  }
                  className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  XP Points
                </label>
                <input
                  type="number"
                  value={questionXp}
                  onChange={(e) => setQuestionXp(Number(e.target.value))}
                  className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Explanation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Why is this answer correct?"
                value={questionExplanation}
                onChange={(e) => setQuestionExplanation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAddQuestionModalOpen(false)}
                className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                {editingQuestion ? "Update Question" : "Save Question"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: NEW SUBJECT                                      */}
      {/* ========================================================= */}
      <Dialog open={newSubjectModalOpen} onOpenChange={setNewSubjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Create a new subject bucket to categorize topics and questions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubject} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Verbal Ability, Cloud Computing"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Subject description or curriculum note..."
                value={newSubjectDesc}
                onChange={(e) => setNewSubjectDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNewSubjectModalOpen(false)}
                className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Create Subject
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 4: NEW TOPIC                                        */}
      {/* ========================================================= */}
      <Dialog open={newTopicModalOpen} onOpenChange={setNewTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>
              {activeSubject
                ? `Add a topic under "${activeSubject.name}"`
                : "Create a topic under selected subject"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTopic} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Syllogisms, Profit and Loss, Async Await"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Topic syllabus or guidelines..."
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNewTopicModalOpen(false)}
                className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Create Topic
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 5: FROM OLD TEST MODAL                              */}
      {/* ========================================================= */}
      <Dialog open={fromOldTestModalOpen} onOpenChange={setFromOldTestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import from Previous Test Papers</DialogTitle>
            <DialogDescription>
              Quickly seed questions into "{activeTopic?.name || "Topic"}" from past archived test
              banks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Mock Semester Examination 2025
              </div>
              <p className="text-[11px] text-slate-500">
                Standard questions vetted by curriculum chairs with complete answer keys.
              </p>
              <button
                onClick={() => handleImportSampleQuestions(3)}
                className="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Import 3 High-Yield Questions
              </button>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Diagnostic Placement Exam Set
              </div>
              <p className="text-[11px] text-slate-500">
                Foundational and speed-accuracy problem sets.
              </p>
              <button
                onClick={() => handleImportSampleQuestions(2)}
                className="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Import 2 Diagnostic Questions
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 6: CREATE EXAM                                      */}
      {/* ========================================================= */}
      <Dialog open={createExamModalOpen} onOpenChange={setCreateExamModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create MCQ Exam</DialogTitle>
            <DialogDescription>
              Configure an automated exam drawing questions from the question bank.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExam} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Exam Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Mid-Term Assessment - C Programming"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject *
              </label>
              <select
                value={newExamSubjectId}
                onChange={(e) => setNewExamSubjectId(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  value={newExamDuration}
                  onChange={(e) => setNewExamDuration(Number(e.target.value))}
                  className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pass Score (%)
                </label>
                <input
                  type="number"
                  value={newExamPassing}
                  onChange={(e) => setNewExamPassing(Number(e.target.value))}
                  className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateExamModalOpen(false)}
                className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Publish Exam
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
