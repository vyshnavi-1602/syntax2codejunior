import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Mail,
  Megaphone,
  Printer,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import {
  getSchoolReportsFn,
  createSchoolAnnouncementFn,
  deleteSchoolAnnouncementFn,
  dispatchParentReportsFn,
} from "@/api/school.server";
import {
  generateSchoolReportHtml,
  printIsolatedHtml,
  downloadHtmlFile,
  exportLiveSchoolCsv,
  SchoolReportData,
} from "@/client/lib/school-reports";

export const Route = createFileRoute("/school/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Announcements · Syntax2Code" },
      {
        name: "description",
        content: "Institutional reports for leadership plus school-wide announcements.",
      },
      { property: "og:title", content: "Reports & Announcements · Syntax2Code" },
      { property: "og:description", content: "Leadership reporting and school-wide broadcasts." },
    ],
  }),
  loader: async () => {
    return await getSchoolReportsFn();
  },
  component: ReportsPage,
});

const tabs = ["Reports", "Announcements", "Parent Dispatches"] as const;

const reports = [
  {
    id: "monthly-report",
    t: "Monthly Institutional Performance",
    d: "Engagement, completion, scores and competition results across all classes",
    f: "PDF",
    when: "Live generated",
  },
  {
    id: "board-pack",
    t: "Executive Board Presentation Pack",
    d: "High-level metrics, enrollment vs capacity, and curriculum adoption rates",
    f: "PDF",
    when: "Q3 2026",
  },
  {
    id: "grade-breakdown",
    t: "Grade-Wise Performance Matrix",
    d: "Section-level comparative analytics and progress milestones",
    f: "PDF",
    when: "Current term",
  },
  {
    id: "full-export",
    t: "Complete Institutional Activity Export",
    d: "Raw roster, student levels, XP totals, and completion percentages",
    f: "CSV",
    when: "Real-time live data",
  },
  {
    id: "faculty-readiness",
    t: "Faculty Readiness & Adoption Audit",
    d: "Teacher training completion, review turnaround, and class activity logs",
    f: "PDF",
    when: "September 2026",
  },
  {
    id: "parent-summary",
    t: "Guardian Progress Overview Pack",
    d: "Aggregated parent-friendly summaries and coding achievements",
    f: "PDF",
    when: "Term summary",
  },
];

interface ParentReportLog {
  id: number;
  schoolId: number;
  reportType: string;
  recipientCount: number;
  subject: string;
  customNote?: string | null;
  status: string;
  sentAt: Date | string | null;
}

function ReportsPage() {
  const router = useRouter();
  const loaderData = Route.useLoaderData();
  const { school, announcements } = loaderData;
  const parentLogs: ParentReportLog[] =
    (loaderData.parentReportLogs as ParentReportLog[]) || [];

  const [tab, setTab] = useState<(typeof tabs)[number]>("Reports");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parent report dispatch modal state
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchType, setDispatchType] = useState("Monthly Progress Summary");
  const [dispatchSubject, setDispatchSubject] = useState(
    "Student Coding Progress & Achievement Card",
  );
  const [dispatchNote, setDispatchNote] = useState(
    "Dear Guardian, please find attached the student's coding milestones, completion rates, and problem-solving assessment scores for this term.",
  );

  const handleDispatchReports = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await dispatchParentReportsFn({
        data: {
          reportType: dispatchType,
          subject: dispatchSubject.trim(),
          customNote: dispatchNote.trim(),
        },
      });
      toast.success("Report cards dispatched to parents!", {
        description: `Delivered to ${res.recipientCount} student guardians via verified email channels.`,
      });
      setDispatchOpen(false);
      router.invalidate();
    } catch {
      toast.error("Failed to dispatch report cards");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message body are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSchoolAnnouncementFn({
        data: {
          title: title.trim(),
          body: body.trim(),
          targetAudience: audience,
        },
      });
      toast.success("Announcement broadcasted successfully", {
        description: `Delivered to target audience: ${audience}`,
      });
      setTitle("");
      setBody("");
      router.invalidate();
    } catch {
      toast.error("Failed to publish announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (idStr: string) => {
    try {
      await deleteSchoolAnnouncementFn({ data: Number(idStr) });
      toast.success("Announcement deleted");
      router.invalidate();
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const handlePrintPdf = (r: (typeof reports)[number]) => {
    const reportData: SchoolReportData = {
      school,
      schoolKpis: loaderData.schoolKpis || {
        enrolled: 120,
        activeWeekly: 104,
        curriculum: 68,
        avgScore: 740,
        licensedSeats: 1500,
      },
      classes: loaderData.classes || [],
      teachers: loaderData.teachers || [],
      students: loaderData.students || [],
      readinessIndex: loaderData.readinessIndex || [],
    };

    const html = generateSchoolReportHtml(r.id, reportData);
    printIsolatedHtml(html);
    toast.success(`Opening ${r.t}`, {
      description: "Select 'Save as PDF' or print from the dialog.",
    });
  };

  const handleDownloadHtml = (r: (typeof reports)[number]) => {
    const reportData: SchoolReportData = {
      school,
      schoolKpis: loaderData.schoolKpis || {
        enrolled: 120,
        activeWeekly: 104,
        curriculum: 68,
        avgScore: 740,
        licensedSeats: 1500,
      },
      classes: loaderData.classes || [],
      teachers: loaderData.teachers || [],
      students: loaderData.students || [],
      readinessIndex: loaderData.readinessIndex || [],
    };

    const html = generateSchoolReportHtml(r.id, reportData);
    const filename = `${r.id}_${(school.name || "school").toLowerCase().replace(/\s+/g, "_")}.html`;
    downloadHtmlFile(html, filename);
    toast.success(`${r.t} downloaded as standalone report.`);
  };

  const handleDownloadCsv = () => {
    const reportData: SchoolReportData = {
      school,
      schoolKpis: loaderData.schoolKpis || {
        enrolled: 120,
        activeWeekly: 104,
        curriculum: 68,
        avgScore: 740,
        licensedSeats: 1500,
      },
      classes: loaderData.classes || [],
      teachers: loaderData.teachers || [],
      students: loaderData.students || [],
      readinessIndex: loaderData.readinessIndex || [],
    };

    exportLiveSchoolCsv(reportData);
    toast.success("Complete institutional roster & KPI export downloaded as CSV");
  };

  return (
    <>
      <PageHeader
        title="Reports & Announcements"
        subtitle={`Institutional reporting and campus communications for ${school.name || "Global Tech High"}`}
      />
      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Reports" && (
        <Panel
          title="Report Library"
          description="Official documents generated from live institutional data"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Pill tone={r.f === "PDF" ? "violet" : "emerald"}>{r.f}</Pill>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{r.t}</h3>
                  <p className="mt-1 text-xs text-slate-500">{r.d}</p>
                  <p className="mt-3 text-[11px] font-medium text-slate-400">{r.when}</p>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-3.5 flex gap-2">
                  {r.f === "PDF" ? (
                    <>
                      <button
                        onClick={() => handlePrintPdf(r)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print / PDF
                      </button>
                      <button
                        onClick={() => handleDownloadHtml(r)}
                        title="Download standalone HTML file"
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleDownloadCsv}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Live CSV
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Announcements" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="School Broadcasts"
            description="Announcements displayed on student and faculty dashboards"
          >
            <div className="space-y-3.5">
              {announcements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">No active announcements</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use the broadcast form to send updates to teachers or students.
                  </p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">{a.title}</h4>
                          <Pill tone="sky">{a.audience}</Pill>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          Posted by {a.author} · {a.when}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-700">{a.body}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Broadcast Announcement"
            description="Send a school-wide or targeted notification"
          >
            <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="All">All (Teachers & Students)</option>
                  <option value="Teachers">Faculty / Teachers Only</option>
                  <option value="Students">Enrolled Students Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Announcement Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Regional Hackathon Registration Open"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write message details for the campus community…"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Post Broadcast
              </button>
            </form>
          </Panel>
        </div>
      )}

      {tab === "Parent Dispatches" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Mail className="h-4 w-4" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  Automated Guardian Report Cards
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-xl">
                Batch email verified coding progress summaries, lesson completion percentages, and
                achievement transcripts directly to enrolled students' parents and guardians.
              </p>
            </div>
            <button
              onClick={() => setDispatchOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition shrink-0"
            >
              <Send className="h-4 w-4" /> Dispatch Report Cards
            </button>
          </div>

          <Panel
            title="Dispatch History & Delivery Logs"
            description="Audit trail of report card broadcasts sent to parent email contacts"
          >
            {parentLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Mail className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No parent reports dispatched yet
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Click "Dispatch Report Cards" to trigger your first term progress release.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {parentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{log.reportType}</p>
                        <Pill tone="emerald">
                          <CheckCircle2 className="h-3 w-3 mr-1 inline" /> {log.status}
                        </Pill>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{log.subject}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                      <span className="font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {log.recipientCount} Recipients
                      </span>
                      <span>
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setDispatchOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Dispatch Parent Progress Cards
                </h3>
                <p className="text-xs text-slate-500">
                  Email customized coding achievement cards to student guardians.
                </p>
              </div>
            </div>

            <form onSubmit={handleDispatchReports} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Report Package</label>
                <select
                  value={dispatchType}
                  onChange={(e) => setDispatchType(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="Monthly Progress Summary">Monthly Progress Summary</option>
                  <option value="Term 1 Midterm Coding Card">Term 1 Midterm Coding Card</option>
                  <option value="AI & Coding Readiness Audit">AI & Coding Readiness Audit</option>
                  <option value="End-of-Term Transcript">End-of-Term Transcript</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Subject</label>
                <input
                  required
                  value={dispatchSubject}
                  onChange={(e) => setDispatchSubject(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Guardian Notice Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-[11px] text-indigo-900">
                Reports will be rendered dynamically with student-specific XP, completed modules,
                and teacher evaluation rubrics.
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDispatchOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Send to All Parents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
