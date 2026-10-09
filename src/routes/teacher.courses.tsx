import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  Archive,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Calendar,
  Code2,
  Check,
  X,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/client/lib/utils";
import {
  loadCourses,
  saveCourses,
  type CourseItem,
  type CourseModule,
  type CourseCategory,
  type CourseLevel,
  DEFAULT_COURSES,
} from "@/client/components/app/coursesData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";

export const Route = createFileRoute("/teacher/courses")({
  head: () => ({
    meta: [
      { title: "Course Management · Syntax2Code" },
      {
        name: "description",
        content:
          "Create and manage courses. Add questions and topics, and set language restrictions.",
      },
    ],
  }),
  component: TeacherCoursesPage,
});

const ALL_LANGUAGES = ["C", "C++", "Java", "Python", "JavaScript", "SQL"];

function TeacherCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({});

  // Modals
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [feedbackModalCourse, setFeedbackModalCourse] = useState<CourseItem | null>(null);
  const [addModuleCourseId, setAddModuleCourseId] = useState<string | null>(null);

  // Form State for Add / Edit Course
  const [formTitle, setFormTitle] = useState("");
  const [formInstructor, setFormInstructor] = useState("Admin");
  const [formCategory, setFormCategory] = useState<CourseCategory>("Academics");
  const [formLevel, setFormLevel] = useState<CourseLevel>("Beginner");
  const [formLanguages, setFormLanguages] = useState<string[]>(["C"]);
  const [formDescription, setFormDescription] = useState("");
  const [formDaysCount, setFormDaysCount] = useState(6);

  // Form State for New Module
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleTopicsText, setModuleTopicsText] = useState("");
  const [moduleQuestionsCount, setModuleQuestionsCount] = useState(5);

  useEffect(() => {
    const loaded = loadCourses("teacher");
    setCourses(loaded);
  }, []);

  const updateAndSaveCourses = (newCourses: CourseItem[]) => {
    setCourses(newCourses);
    saveCourses("teacher", newCourses);
  };

  const isAllExpanded = courses.length > 0 && courses.every((c) => expandedCourseIds[c.id]);

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedCourseIds({});
    } else {
      const all: Record<string, boolean> = {};
      courses.forEach((c) => {
        all[c.id] = true;
      });
      setExpandedCourseIds(all);
    }
  };

  const handleToggleCourse = (id: string) => {
    setExpandedCourseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleTogglePublish = (id: string) => {
    const updated = courses.map((c) => {
      if (c.id === id) {
        const nextStatus = c.status === "Published" ? ("Draft" as const) : ("Published" as const);
        toast.success(`Course "${c.title}" marked as ${nextStatus}!`);
        return { ...c, status: nextStatus };
      }
      return c;
    });
    updateAndSaveCourses(updated);
  };

  const handleArchiveCourse = (id: string) => {
    const updated = courses.map((c) => {
      if (c.id === id) {
        const nextStatus = c.status === "Archived" ? ("Published" as const) : ("Archived" as const);
        toast.info(`Course "${c.title}" ${nextStatus === "Archived" ? "archived" : "unarchived"}.`);
        return { ...c, status: nextStatus };
      }
      return c;
    });
    updateAndSaveCourses(updated);
  };

  const handleDeleteCourse = (id: string) => {
    const target = courses.find((c) => c.id === id);
    const updated = courses.filter((c) => c.id !== id);
    updateAndSaveCourses(updated);
    toast.success(`Course "${target?.title || "Course"}" deleted`);
  };

  const handleOpenAddCourse = () => {
    setEditingCourse(null);
    setFormTitle("");
    setFormInstructor("Admin");
    setFormCategory("Academics");
    setFormLevel("Beginner");
    setFormLanguages(["C"]);
    setFormDescription("");
    setFormDaysCount(6);
    setAddCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: CourseItem) => {
    setEditingCourse(course);
    setFormTitle(course.title);
    setFormInstructor(course.instructor);
    setFormCategory(course.category);
    setFormLevel(course.level);
    setFormLanguages(course.languages);
    setFormDescription(course.description || "");
    setFormDaysCount(course.modules.length || 6);
    setAddCourseModalOpen(true);
  };

  const toggleLanguage = (lang: string) => {
    setFormLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a course title.");
      return;
    }
    if (formLanguages.length === 0) {
      toast.error("Please select at least one programming language.");
      return;
    }

    if (editingCourse) {
      const updated = courses.map((c) => {
        if (c.id === editingCourse.id) {
          return {
            ...c,
            title: formTitle.trim(),
            instructor: formInstructor.trim() || "Admin",
            category: formCategory,
            level: formLevel,
            languages: formLanguages,
            description: formDescription.trim(),
          };
        }
        return c;
      });
      updateAndSaveCourses(updated);
      toast.success("Course details updated successfully!");
    } else {
      // Generate default modules for the days specified
      const generatedModules: CourseModule[] = Array.from({ length: formDaysCount }, (_, i) => ({
        id: `mod-${Date.now()}-${i + 1}`,
        day: i + 1,
        title: `Day ${i + 1}: ${formTitle.trim()} Module`,
        topics: ["Core Concepts", "Coding Challenges", "Daily Assessment"],
        questionsCount: 4,
      }));

      const newCourse: CourseItem = {
        id: `crs-${Date.now()}`,
        title: formTitle.trim(),
        instructor: formInstructor.trim() || "Admin",
        totalQuestions: formDaysCount * 4,
        languages: formLanguages,
        category: formCategory,
        level: formLevel,
        status: "Published",
        version: "v1",
        description: formDescription.trim(),
        modules: generatedModules,
        feedbacks: [],
      };

      const updated = [newCourse, ...courses];
      updateAndSaveCourses(updated);
      setExpandedCourseIds((prev) => ({ ...prev, [newCourse.id]: true }));
      toast.success(`Course "${newCourse.title}" created successfully!`);
    }

    setAddCourseModalOpen(false);
  };

  const handleSaveNewModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addModuleCourseId || !moduleTitle.trim()) return;

    const topics = moduleTopicsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const updated = courses.map((c) => {
      if (c.id === addModuleCourseId) {
        const nextDay = (c.modules.length || 0) + 1;
        const newMod: CourseModule = {
          id: `mod-${Date.now()}`,
          day: nextDay,
          title: moduleTitle.trim(),
          topics: topics.length > 0 ? topics : ["Syllabus Topic"],
          questionsCount: moduleQuestionsCount,
        };
        const newMods = [...c.modules, newMod];
        return {
          ...c,
          modules: newMods,
          totalQuestions: c.totalQuestions + moduleQuestionsCount,
        };
      }
      return c;
    });

    updateAndSaveCourses(updated);
    toast.success("Module added to course!");
    setAddModuleCourseId(null);
    setModuleTitle("");
    setModuleTopicsText("");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-500 flex items-center gap-2">
            Course Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create and manage courses. Add questions and topics, and set language restrictions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleExpandAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-700 bg-[#1e2129] px-4 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            {isAllExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{isAllExpanded ? "Collapse All" : "Expand All"}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddCourse}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] px-4 text-xs font-bold text-slate-950 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Course</span>
          </button>
        </div>
      </div>

      {/* Courses List matching screenshot */}
      <div className="space-y-4">
        {courses.map((course) => {
          const isExpanded = Boolean(expandedCourseIds[course.id]);

          return (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-800 bg-[#16181f] p-5 shadow-sm space-y-4 transition-all"
            >
              {/* Card Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {course.title}
                  </h3>

                  {/* Status Badge */}
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      course.status === "Published"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : course.status === "Archived"
                          ? "bg-slate-800 text-slate-400 border-slate-700"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30",
                    )}
                  >
                    {course.status}
                  </span>

                  {/* Version Badge */}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/80">
                    {course.version || "v1"}
                  </span>
                </div>

                {/* Right Action Buttons matching screenshot */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(course.id)}
                    className="h-8 px-3 rounded-lg border border-slate-700 bg-[#1e2129] hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    {course.status === "Published" ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArchiveCourse(course.id)}
                    className="h-8 px-3 rounded-lg border border-slate-700 bg-[#1e2129] hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    Archive
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackModalCourse(course)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 bg-[#1e2129] hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span>Feedback</span>
                    {course.feedbacks && course.feedbacks.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400">
                        ({course.feedbacks.length})
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditCourse(course)}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-700 bg-[#1e2129] hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id)}
                    title="Delete Course"
                    className="h-8 w-8 rounded-lg border border-slate-700 bg-[#1e2129] hover:bg-rose-950/40 hover:border-rose-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCourse(course.id)}
                    title={isExpanded ? "Collapse Course" : "Expand Course"}
                    className="h-8 w-8 rounded-lg border border-slate-700 bg-[#1e2129] hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Subtitle / Metadata row matching screenshot */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  <span>Instructor: </span>
                  <span className="font-semibold text-slate-200">{course.instructor}</span>
                  <span> • {course.totalQuestions} questions</span>
                </div>

                {/* Programming Language Restriction Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {course.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#1e2129] text-slate-300 border border-slate-700"
                    >
                      {lang}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-slate-400">
                  <span>Category: </span>
                  <span className="font-semibold text-slate-200">{course.category}</span>
                  <span> • Level: </span>
                  <span className="font-semibold text-slate-200">{course.level}</span>
                </div>
              </div>

              {/* Expandable Module / Day-by-Day Syllabus Section */}
              {isExpanded && (
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Curriculum Modules ({course.modules.length} Days)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAddModuleCourseId(course.id);
                        setModuleTitle("");
                        setModuleTopicsText("");
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Add Day / Module
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {course.modules.map((mod) => (
                      <div
                        key={mod.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-[#12141a] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                            Day {mod.day}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {mod.questionsCount} questions
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white leading-tight">
                          {mod.title}
                        </h4>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {mod.topics.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {courses.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#16181f] text-slate-400 space-y-3">
            <BookOpen className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold">No courses created yet.</p>
            <button
              onClick={handleOpenAddCourse}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-600 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Course</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT COURSE                                */}
      {/* ========================================================= */}
      <Dialog open={addCourseModalOpen} onOpenChange={setAddCourseModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#16181f] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Set up bootcamps, modules, and configure allowed programming languages.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCourse} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Course Title *
              </label>
              <input
                type="text"
                placeholder="e.g. C Programming Bootcamp - 9 Days"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={formInstructor}
                  onChange={(e) => setFormInstructor(e.target.value)}
                  className="h-8.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formDaysCount}
                  onChange={(e) => setFormDaysCount(Number(e.target.value))}
                  disabled={Boolean(editingCourse)}
                  className="h-8.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CourseCategory)}
                  className="h-8.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="Academics">Academics</option>
                  <option value="Placements">Placements</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Foundation">Foundation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Target Level
                </label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value as CourseLevel)}
                  className="h-8.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Allowed Programming Languages *
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_LANGUAGES.map((lang) => {
                  const isChecked = formLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        isChecked
                          ? "bg-emerald-500 text-slate-950 border-emerald-500"
                          : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600",
                      )}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Course Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief course syllabus summary..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAddCourseModalOpen(false)}
                className="h-8.5 px-4 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8.5 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 text-xs font-bold cursor-pointer shadow-xs"
              >
                {editingCourse ? "Update Course" : "Create Course"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: FEEDBACK VIEW                                    */}
      {/* ========================================================= */}
      <Dialog
        open={Boolean(feedbackModalCourse)}
        onOpenChange={(open) => !open && setFeedbackModalCourse(null)}
      >
        <DialogContent className="sm:max-w-md bg-[#16181f] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              <span>Student Feedback & Ratings</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {feedbackModalCourse?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-72 overflow-y-auto">
            {!feedbackModalCourse?.feedbacks || feedbackModalCourse.feedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No student feedback recorded for this course yet.
              </p>
            ) : (
              feedbackModalCourse.feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3 rounded-xl border border-slate-800 bg-[#12141a] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{fb.studentName}</span>
                    <span className="text-[10px] text-slate-500">{fb.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: fb.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{fb.comment}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: ADD MODULE                                       */}
      {/* ========================================================= */}
      <Dialog
        open={Boolean(addModuleCourseId)}
        onOpenChange={(open) => !open && setAddModuleCourseId(null)}
      >
        <DialogContent className="sm:max-w-md bg-[#16181f] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Curriculum Day / Module</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a day-wise training block to the course.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewModule} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Module Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Memory Layout & Pointer Arithmetic"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Topics (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. malloc, free, dangling pointers, memory leaks"
                value={moduleTopicsText}
                onChange={(e) => setModuleTopicsText(e.target.value)}
                className="h-8.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Estimated Questions
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={moduleQuestionsCount}
                onChange={(e) => setModuleQuestionsCount(Number(e.target.value))}
                className="h-8.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAddModuleCourseId(null)}
                className="h-8.5 px-4 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8.5 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 text-xs font-bold cursor-pointer shadow-xs"
              >
                Add Module
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
