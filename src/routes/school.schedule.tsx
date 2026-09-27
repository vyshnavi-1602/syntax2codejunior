import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  Layers,
  MapPin,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
  Sparkles,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Stat } from "@/client/components/app/primitives";
import {
  getSchoolScheduleFn,
  createSchoolScheduleFn,
  updateSchoolScheduleFn,
  deleteSchoolScheduleFn,
  toggleSchoolScheduleStatusFn,
} from "@/api/school.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";

export const Route = createFileRoute("/school/schedule")({
  head: () => ({
    meta: [
      { title: "Timetable & Schedule · Syntax2Code School Admin" },
      {
        name: "description",
        content: "Master schedule, period timetable, lab room bookings and faculty allocations.",
      },
    ],
  }),
  loader: async () => {
    return await getSchoolScheduleFn();
  },
  component: SchoolSchedulePage,
});

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SCHEDULE_TYPES = [
  {
    value: "regular_class",
    label: "Regular Class",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "lab_session",
    label: "Lab Session",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  { value: "workshop", label: "Workshop", color: "bg-purple-50 text-purple-700 border-purple-200" },
  {
    value: "hackathon_prep",
    label: "Competition / Club",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  { value: "exam", label: "Assessment / Exam", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

function SchoolSchedulePage() {
  const router = useRouter();
  const { schedules, classes, teachers, conflicts, rooms, stats } = Route.useLoaderData();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [selectedRoom, setSelectedRoom] = useState<string>("All");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<(typeof schedules)[0] | null>(null);

  const [form, setForm] = useState({
    title: "",
    subject: "Computer Science",
    classId: classes[0]?.id ? String(classes[0].id) : "none",
    teacherId: teachers[0]?.id || "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:15",
    room: rooms[0] || "Computer Lab 1",
    scheduleType: "regular_class",
    recurrence: "weekly",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchDay =
        selectedDay === "All" || s.dayOfWeek.toLowerCase() === selectedDay.toLowerCase();
      const matchRoom = selectedRoom === "All" || s.room === selectedRoom;
      const matchClass =
        selectedClass === "All" ||
        (selectedClass === "none" ? !s.classId : String(s.classId) === selectedClass);
      const matchSearch =
        searchQuery === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDay && matchRoom && matchClass && matchSearch;
    });
  }, [schedules, selectedDay, selectedRoom, selectedClass, searchQuery]);

  const handleOpenAdd = () => {
    setEditingSlot(null);
    setForm({
      title: "",
      subject: "Computer Science",
      classId: classes[0]?.id ? String(classes[0].id) : "none",
      teacherId: teachers[0]?.id || "",
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:15",
      room: rooms[0] || "Computer Lab 1",
      scheduleType: "regular_class",
      recurrence: "weekly",
      notes: "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (slot: (typeof schedules)[0]) => {
    setEditingSlot(slot);
    setForm({
      title: slot.title,
      subject: slot.subject,
      classId: slot.classId ? String(slot.classId) : "none",
      teacherId: slot.teacherId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      scheduleType: slot.scheduleType,
      recurrence: slot.recurrence,
      notes: slot.notes || "",
    });
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a title for this schedule slot");
      return;
    }
    if (!form.teacherId) {
      toast.error("Please select an assigned faculty member");
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSlot) {
        await updateSchoolScheduleFn({
          data: {
            id: editingSlot.id,
            title: form.title.trim(),
            subject: form.subject,
            classId: form.classId === "none" ? null : Number(form.classId),
            teacherId: form.teacherId,
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime,
            room: form.room,
            scheduleType: form.scheduleType,
            recurrence: form.recurrence,
            status: editingSlot.status,
            notes: form.notes.trim() || undefined,
          },
        });
        toast.success("Schedule slot updated successfully");
      } else {
        await createSchoolScheduleFn({
          data: {
            title: form.title.trim(),
            subject: form.subject,
            classId: form.classId === "none" ? null : Number(form.classId),
            teacherId: form.teacherId,
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime,
            room: form.room,
            scheduleType: form.scheduleType,
            recurrence: form.recurrence,
            notes: form.notes.trim() || undefined,
          },
        });
        toast.success("Schedule slot added to timetable", {
          description: `${form.title} on ${form.dayOfWeek} at ${form.startTime}`,
        });
      }
      setOpenModal(false);
      router.invalidate();
    } catch {
      toast.error("Failed to save schedule slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the master timetable?`)) {
      return;
    }
    try {
      await deleteSchoolScheduleFn({ data: id });
      toast.success(`Removed "${title}"`);
      router.invalidate();
    } catch {
      toast.error("Failed to delete slot");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "cancelled" : "active";
    try {
      await toggleSchoolScheduleStatusFn({ data: { id, status: nextStatus } });
      toast.success(`Slot marked as ${nextStatus}`);
      router.invalidate();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleExport = () => {
    window.print();
    toast.info("Preparing print / PDF export...");
  };

  return (
    <>
      <PageHeader
        title="Class Timetable & Master Schedule"
        subtitle="Manage daily periods, lab allocations, faculty assignments and prevent room double-booking."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Download className="h-4 w-4 text-slate-500" /> Export / Print
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" /> Add schedule slot
            </button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          label="Weekly Periods"
          value={stats.totalWeeklySlots}
          sub="Active timetable sessions"
          tone="violet"
        />
        <Stat
          label="Active Computer Labs"
          value={stats.totalRooms}
          sub="Configured teaching spaces"
          tone="sky"
        />
        <Stat
          label="Faculty Allocated"
          value={stats.facultyAllocated}
          sub="Assigned instructors"
          tone="emerald"
        />
        <Stat
          label={`Today's Sessions (${stats.todayName})`}
          value={stats.todaySlotsCount}
          sub="Scheduled for today"
          tone="amber"
        />
        <Stat
          label="Schedule Conflicts"
          value={stats.conflictsCount}
          sub={stats.conflictsCount === 0 ? "Zero double-bookings" : "Attention required"}
          tone={stats.conflictsCount === 0 ? "emerald" : "rose"}
        />
      </div>

      {/* Conflict Warning Banner */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-900">
                {conflicts.length} Timetable {conflicts.length === 1 ? "Conflict" : "Conflicts"}{" "}
                Detected
              </h4>
              <p className="mt-0.5 text-xs text-rose-700">
                Overlapping room bookings or faculty double-assignments will cause logistical issues
                during school hours.
              </p>
              <div className="mt-2 space-y-1.5">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-medium text-rose-800 border border-rose-200/60"
                  >
                    <span className="font-semibold uppercase tracking-wider text-rose-600 text-[10px]">
                      {c.dayOfWeek}
                    </span>
                    <span>{c.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, teacher, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Day Filter */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="All">All Days</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="All">All Rooms / Labs</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="All">All Classes</option>
            <option value="none">Open Lab / Multi-Class</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "grid"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> Weekly Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Agenda List
          </button>
        </div>
      </div>

      {/* WEEKLY TIMETABLE GRID VIEW */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = filteredSchedules.filter(
              (s) => s.dayOfWeek.toLowerCase() === day.toLowerCase(),
            );
            const isToday = (stats.todayName || "").toLowerCase() === day.toLowerCase();

            return (
              <div
                key={day}
                className={`flex flex-col rounded-2xl border transition ${
                  isToday
                    ? "border-indigo-300 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-200"
                    : "border-slate-200 bg-slate-50/30"
                }`}
              >
                {/* Day Header */}
                <div
                  className={`flex items-center justify-between border-b px-3.5 py-3 ${
                    isToday
                      ? "border-indigo-100 bg-indigo-50/60"
                      : "border-slate-200 bg-slate-100/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {day}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold uppercase text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-2xs">
                    {daySlots.length}
                  </span>
                </div>

                {/* Day Cards */}
                <div className="flex-1 space-y-3 p-3">
                  {daySlots.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-400">No sessions scheduled</p>
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const defaultBadge = SCHEDULE_TYPES[0]!;
                      const typeBadge =
                        SCHEDULE_TYPES.find((t) => t.value === slot.scheduleType) ?? defaultBadge;
                      const isCancelled = slot.status === "cancelled";

                      return (
                        <div
                          key={slot.id}
                          className={`group relative flex flex-col justify-between rounded-xl border p-3.5 shadow-2xs transition hover:shadow-xs ${
                            isCancelled
                              ? "border-slate-200 bg-slate-100/60 opacity-60"
                              : "border-slate-200/80 bg-white hover:border-indigo-200"
                          }`}
                        >
                          <div>
                            {/* Time & Type Tag */}
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                                <Clock className="h-3 w-3" />
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span
                                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeBadge.color}`}
                              >
                                {typeBadge.label}
                              </span>
                            </div>

                            {/* Title */}
                            <h5 className="mt-2 text-xs font-bold text-slate-900 leading-snug">
                              {slot.title}
                            </h5>

                            {/* Class & Subject */}
                            <p className="mt-1 text-[11px] font-medium text-slate-600">
                              {slot.className}
                            </p>
                            <p className="text-[10px] text-slate-400">{slot.subject}</p>

                            {/* Room & Teacher */}
                            <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700">{slot.room}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{slot.teacherName}</span>
                              </div>
                            </div>

                            {slot.notes && (
                              <p className="mt-2 rounded bg-slate-50 p-1.5 text-[10px] text-slate-500 italic">
                                "{slot.notes}"
                              </p>
                            )}
                          </div>

                          {/* Card Actions */}
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                            <button
                              onClick={() => handleToggleStatus(slot.id, slot.status)}
                              className={`text-[10px] font-semibold transition ${
                                isCancelled
                                  ? "text-emerald-600 hover:text-emerald-700"
                                  : "text-slate-400 hover:text-amber-600"
                              }`}
                            >
                              {isCancelled ? "Reactivate" : "Cancel slot"}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(slot)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                                title="Edit Slot"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(slot.id, slot.title)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete Slot"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* AGENDA / LIST VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Day & Time</th>
                  <th className="px-4 py-3">Session & Subject</th>
                  <th className="px-4 py-3">Class Section</th>
                  <th className="px-4 py-3">Room / Lab</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No schedule slots match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((slot) => {
                    const defaultBadge = SCHEDULE_TYPES[0]!;
                    const typeBadge =
                      SCHEDULE_TYPES.find((t) => t.value === slot.scheduleType) ?? defaultBadge;
                    const isCancelled = slot.status === "cancelled";

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-medium">
                          <span className="font-bold text-slate-900">{slot.dayOfWeek}</span>
                          <span className="block text-[11px] text-indigo-600">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{slot.title}</div>
                          <div className="text-[11px] text-slate-500">{slot.subject}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{slot.className}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {slot.room}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{slot.teacherName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${typeBadge.color}`}
                          >
                            {typeBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isCancelled
                                ? "bg-slate-100 text-slate-500"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isCancelled ? "Cancelled" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(slot.id, slot.status)}
                              className="rounded px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            >
                              {isCancelled ? "Activate" : "Cancel"}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(slot)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(slot.id, slot.title)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT SCHEDULE MODAL */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingSlot ? "Edit Schedule Slot" : "Add New Schedule Slot"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Schedule a computer lab session, regular classroom period, or competition practice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Session Title *</label>
              <input
                type="text"
                placeholder="e.g. Python Explorers: Loops & Functions"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Subject Area</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science Principles</option>
                  <option value="Python Programming">Python Programming</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Game Development">Game Development</option>
                  <option value="Competitive Coding">Competitive Coding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Schedule Type</label>
                <select
                  value={form.scheduleType}
                  onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  {SCHEDULE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Class Section</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="none">Open Lab / Multi-Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Assigned Faculty *
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Day of Week</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Teaching Room / Lab
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Lab 1"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Recurrence</label>
                <select
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="weekly">Weekly Recurring</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="daily">Daily</option>
                  <option value="one_off">One-Off Session</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Instructor Notes / Requirements
              </label>
              <textarea
                rows={2}
                placeholder="Bring charged Chromebooks, review lesson 4..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
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
                {isSubmitting ? "Saving..." : editingSlot ? "Save Changes" : "Create Schedule Slot"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
