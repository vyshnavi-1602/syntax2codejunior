import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Cpu,
  Edit2,
  Globe,
  Layers,
  Play,
  Plus,
  Search,
  Terminal,
  Trash2,
  Video,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Stat } from "@/client/components/app/primitives";
import {
  getPlatformSchedulesFn,
  createPlatformScheduleFn,
  updatePlatformScheduleFn,
  deletePlatformScheduleFn,
  executePlatformScheduleFn,
} from "@/api/admin.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";

export const Route = createFileRoute("/admin/schedule")({
  head: () => ({
    meta: [
      { title: "Master Schedule & Operations · Syntax2Code Super Admin" },
      {
        name: "description",
        content:
          "Platform maintenance windows, automated jobs, competitions and curriculum milestones.",
      },
    ],
  }),
  loader: async () => {
    return await getPlatformSchedulesFn();
  },
  component: AdminSchedulePage,
});

const CATEGORIES = [
  { value: "all", label: "All Operations", icon: Layers },
  { value: "maintenance", label: "Maintenance & Downtime", icon: Wrench },
  { value: "cron_job", label: "Automated Jobs & Crons", icon: Cpu },
  { value: "competition", label: "Hackathons & Contests", icon: Award },
  { value: "webinar", label: "Masterclasses & Webinars", icon: Video },
  { value: "curriculum_release", label: "Curriculum Releases", icon: BookOpen },
];

const PRIORITIES = [
  { value: "critical", label: "Critical", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { value: "high", label: "High", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

function AdminSchedulePage() {
  const router = useRouter();
  const { schedules, schools, stats } = Route.useLoaderData();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<(typeof schedules)[0] | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "maintenance",
    targetSchoolId: "all",
    targetRole: "all",
    scheduledStart: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    scheduledEnd: new Date(Date.now() + 86400000 + 7200000).toISOString().slice(0, 16),
    recurrence: "once",
    priority: "high",
    isAutomated: false,
    actionPayload: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchCategory = activeTab === "all" || s.category === activeTab;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchPriority = priorityFilter === "all" || s.priority === priorityFilter;
      const matchSearch =
        searchQuery === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchStatus && matchPriority && matchSearch;
    });
  }, [schedules, activeTab, statusFilter, priorityFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: "",
      description: "",
      category: "maintenance",
      targetSchoolId: "all",
      targetRole: "all",
      scheduledStart: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      scheduledEnd: new Date(Date.now() + 86400000 + 7200000).toISOString().slice(0, 16),
      recurrence: "once",
      priority: "high",
      isAutomated: false,
      actionPayload: "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (item: (typeof schedules)[0]) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
      targetSchoolId: item.targetSchoolId ? String(item.targetSchoolId) : "all",
      targetRole: item.targetRole,
      scheduledStart: new Date(item.scheduledStart).toISOString().slice(0, 16),
      scheduledEnd: new Date(item.scheduledEnd).toISOString().slice(0, 16),
      recurrence: item.recurrence,
      priority: item.priority,
      isAutomated: item.isAutomated,
      actionPayload: item.actionPayload || "",
    });
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updatePlatformScheduleFn({
          data: {
            id: editingItem.id,
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            category: form.category,
            targetSchoolId: form.targetSchoolId === "all" ? null : Number(form.targetSchoolId),
            targetRole: form.targetRole,
            scheduledStart: new Date(form.scheduledStart).toISOString(),
            scheduledEnd: new Date(form.scheduledEnd).toISOString(),
            recurrence: form.recurrence,
            status: editingItem.status,
            priority: form.priority,
            isAutomated: form.isAutomated,
            actionPayload: form.actionPayload.trim() || undefined,
          },
        });
        toast.success("Platform schedule updated");
      } else {
        await createPlatformScheduleFn({
          data: {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            category: form.category,
            targetSchoolId: form.targetSchoolId === "all" ? null : Number(form.targetSchoolId),
            targetRole: form.targetRole,
            scheduledStart: new Date(form.scheduledStart).toISOString(),
            scheduledEnd: new Date(form.scheduledEnd).toISOString(),
            recurrence: form.recurrence,
            priority: form.priority,
            isAutomated: form.isAutomated,
            actionPayload: form.actionPayload.trim() || undefined,
          },
        });
        toast.success("Schedule item queued successfully");
      }
      setOpenModal(false);
      router.invalidate();
    } catch {
      toast.error("Failed to save schedule item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}"?`)) return;
    try {
      await deletePlatformScheduleFn({ data: id });
      toast.success(`Removed "${title}"`);
      router.invalidate();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleExecute = async (id: number, title: string) => {
    setExecutingId(id);
    try {
      const res = await executePlatformScheduleFn({ data: { id } });
      toast.success(res.message || `Executed "${title}" successfully!`);
      router.invalidate();
    } catch {
      toast.error(`Execution failed for "${title}"`);
    } finally {
      setExecutingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance":
        return <Wrench className="h-4 w-4 text-amber-600" />;
      case "cron_job":
        return <Cpu className="h-4 w-4 text-indigo-600" />;
      case "competition":
        return <Award className="h-4 w-4 text-purple-600" />;
      case "webinar":
        return <Video className="h-4 w-4 text-sky-600" />;
      case "curriculum_release":
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <PageHeader
        title="Platform Master Schedule & Operations"
        subtitle="Manage cross-school hackathons, cloud maintenance windows, automated crons and curriculum releases."
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> Schedule platform task
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Total Scheduled Tasks"
          value={stats.total}
          sub="Platform operations queue"
          tone="violet"
        />
        <Stat
          label="Maintenance Windows"
          value={stats.maintenanceCount}
          sub={stats.maintenanceCount > 0 ? "Upcoming system window" : "Normal operations"}
          tone={stats.maintenanceCount > 0 ? "amber" : "emerald"}
        />
        <Stat
          label="Automated Engine Jobs"
          value={stats.automatedJobsCount}
          sub="Self-executing cron runners"
          tone="sky"
        />
        <Stat
          label="Events & Hackathons"
          value={stats.upcomingEventsCount}
          sub="Community competitions"
          tone="violet"
        />
        <Stat
          label="Partner Schools In Scope"
          value={stats.partnerSchoolsCount}
          sub="Network-wide broadcast"
          tone="emerald"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {CATEGORIES.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredSchedules.length}</span>{" "}
          operations
        </div>
      </div>

      {/* OPERATIONS LIST CARDS */}
      <div className="space-y-3.5">
        {filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              No scheduled platform operations found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search criteria or click "Schedule platform task".
            </p>
          </div>
        ) : (
          filteredSchedules.map((item) => {
            const defaultPriority = PRIORITIES[2]!;
            const priorityBadge =
              PRIORITIES.find((p) => p.value === item.priority) ?? defaultPriority;
            const isInProgress = item.status === "in_progress";
            const isCompleted = item.status === "completed";
            const isCancelled = item.status === "cancelled";

            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition hover:shadow-sm md:flex-row md:items-center ${
                  isInProgress
                    ? "border-amber-300 bg-amber-50/30 ring-1 ring-amber-200"
                    : isCompleted
                      ? "border-slate-200 bg-slate-50/40 opacity-80"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex-1 space-y-2 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {getCategoryIcon(item.category)}
                      <span className="capitalize">{item.category.replace("_", " ")}</span>
                    </div>

                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge.color}`}
                    >
                      {priorityBadge.label} Priority
                    </span>

                    {item.isAutomated && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        <Zap className="h-2.5 w-2.5" /> Automated Cron
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isInProgress
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : isCancelled
                              ? "bg-slate-100 text-slate-600"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isInProgress && <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />}
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(item.scheduledStartIso)} – {formatDate(item.scheduledEndIso)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      {item.schoolName}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      Audience:{" "}
                      <strong className="text-slate-700 capitalize">{item.targetRole}</strong>
                    </span>
                    {item.actionPayload && (
                      <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                        <Terminal className="h-3 w-3" />
                        {item.actionPayload}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 md:mt-0 md:border-0 md:pt-0">
                  {/* Trigger Run Button */}
                  <button
                    onClick={() => handleExecute(item.id, item.title)}
                    disabled={executingId === item.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    {executingId === item.id ? "Running..." : "Run / Trigger"}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
                    title="Edit Task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete Task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE PLATFORM TASK MODAL */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingItem ? "Edit Platform Task" : "Schedule New Platform Operation"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure system maintenance windows, automated cron routines, or network hackathons.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Task / Event Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly Global XP Audit & Recalculation"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                rows={2}
                placeholder="Detailed objectives or maintenance scope..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="maintenance">System Maintenance</option>
                  <option value="cron_job">Automated Cron Job</option>
                  <option value="competition">Competition / Hackathon</option>
                  <option value="webinar">Webinar / Masterclass</option>
                  <option value="curriculum_release">Curriculum Release</option>
                  <option value="event">General Platform Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target School Scope
                </label>
                <select
                  value={form.targetSchoolId}
                  onChange={(e) => setForm({ ...form, targetSchoolId: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Partner Schools (Network-wide)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name} ({s.city || "Campus"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target User Role
                </label>
                <select
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Roles (Students, Teachers, Admins)</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="school">School Administrators Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledStart}
                  onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledEnd}
                  onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Recurrence</label>
                <select
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="once">Once (Single Run)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Automation Trigger
                </label>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAutomated"
                    checked={form.isAutomated}
                    onChange={(e) => setForm({ ...form, isAutomated: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isAutomated" className="text-xs font-medium text-slate-700">
                    Automated Execution Engine
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Action Payload / Command / URL
              </label>
              <input
                type="text"
                placeholder="e.g. recalc_xp_streaks or https://syntax2code.junior/hackathon-2026"
                value={form.actionPayload}
                onChange={(e) => setForm({ ...form, actionPayload: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? "Saving..." : editingItem ? "Save Changes" : "Queue Schedule Task"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
