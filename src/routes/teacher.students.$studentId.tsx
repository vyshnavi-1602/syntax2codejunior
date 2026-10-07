import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  Sparkles,
  FileText,
  Download,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Settings2,
  Users,
  Bell,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Avatar, Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getStudentProfileFn, getStudentProjectsFn } from "@/api/student.server";
import {
  updateStudentSupportFn,
  updateStudentGuardrailsFn,
  getStudentExecutionsPipelineFn,
  sendStudentNotificationFn,
  type StudentSupportData,
  type StudentGuardrailsData,
  type PipelineExecutionLog,
} from "@/api/teacher.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { Textarea } from "@/client/components/ui/textarea";
import { Label } from "@/client/components/ui/label";
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/teacher/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Profile & Rights · Syntax2Code" },
      {
        name: "description",
        content:
          "Student-level progress, skills, support tags, class-scoped guardrails and execution telemetry.",
      },
      { property: "og:title", content: "Student Profile & Rights · Syntax2Code" },
      {
        property: "og:description",
        content: "Full learning profile and rights management for one student.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const [profileData, projects, pipelineData] = await Promise.all([
      getStudentProfileFn({ data: params.studentId }),
      getStudentProjectsFn({ data: params.studentId }),
      getStudentExecutionsPipelineFn({ data: params.studentId }),
    ]);
    return {
      profile: profileData.currentStudent,
      projects,
      studentId: params.studentId,
      pipeline: pipelineData,
    };
  },
  component: StudentDetail,
});

function StudentDetail() {
  const { profile: s, projects, studentId, pipeline } = Route.useLoaderData();
  const studentMeta = s as unknown as Record<string, string | undefined>;

  // Support state
  const [supportTag, setSupportTag] = useState<StudentSupportData["tag"]>(
    (s.tag === "Needs support"
      ? "Needs support"
      : s.tag === "Accelerated"
        ? "Accelerated"
        : "On track") as StudentSupportData["tag"],
  );
  const [mentorName, setMentorName] = useState(studentMeta.assignedMentor || "Priya Raman");
  const [interventionNotes, setInterventionNotes] = useState(
    studentMeta.interventionPlan ||
      "Student consistently completes assignments on time. Recommended for advanced hackathon team.",
  );
  const [isSavingSupport, setIsSavingSupport] = useState(false);

  // Guardrails state
  const [allowedLangs, setAllowedLangs] = useState<string[]>(
    pipeline?.activeGuardrails?.allowedLanguages || ["Python", "JavaScript", "HTML/CSS"],
  );
  const [loopTimeout, setLoopTimeout] = useState<number>(
    pipeline?.activeGuardrails?.maxLoopTimeoutMs || 2500,
  );
  const [blockNetwork, setBlockNetwork] = useState<boolean>(
    pipeline?.activeGuardrails?.blockExternalNetwork ?? true,
  );
  const [sandboxMode, setSandboxMode] = useState<"strict" | "standard" | "relaxed">(
    pipeline?.activeGuardrails?.sandboxMode || "strict",
  );
  const [isSavingGuardrails, setIsSavingGuardrails] = useState(false);

  // Direct In-App Notification Modal
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifyParentCheck, setNotifyParentCheck] = useState(true);
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Parent report & modal
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [parentNote, setParentNote] = useState("");
  const [parentSending, setParentSending] = useState(false);

  // Practice modal
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState("Debugging & Logic");
  const [problemCount, setProblemCount] = useState("5");
  const [practiceDueDate, setPracticeDueDate] = useState("Friday");
  const [practiceAssigning, setPracticeAssigning] = useState(false);

  // Official report preview
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Handle Support Plan save
  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSupport(true);
    try {
      await updateStudentSupportFn({
        data: {
          studentId,
          tag: supportTag,
          interventionPlan: interventionNotes,
          assignedMentor: mentorName,
          notes: interventionNotes,
        },
      });
      toast.success("Student support plan updated!", {
        description: `Support tag updated to '${supportTag}' with mentor ${mentorName}.`,
      });
    } catch {
      toast.error("Failed to update student support plan.");
    } finally {
      setIsSavingSupport(false);
    }
  };

  // Handle Guardrails save
  const handleSaveGuardrails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGuardrails(true);
    try {
      await updateStudentGuardrailsFn({
        data: {
          studentId,
          allowedLanguages: allowedLangs,
          maxLoopTimeoutMs: Number(loopTimeout),
          blockExternalNetwork: blockNetwork,
          requireCodeApproval: false,
          sandboxMode,
        },
      });
      toast.success("Class-scoped guardrails updated!", {
        description: `Enforced ${sandboxMode} sandbox isolation with ${loopTimeout}ms loop execution limit.`,
      });
    } catch {
      toast.error("Failed to update student guardrails.");
    } finally {
      setIsSavingGuardrails(false);
    }
  };

  // Handle Direct Notification Dispatch
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("Please enter a title and message.");
      return;
    }
    setIsSendingNotif(true);
    try {
      await sendStudentNotificationFn({
        data: {
          studentId,
          title: notifTitle,
          message: notifMessage,
          notifyParent: notifyParentCheck,
          channels: notifyParentCheck ? ["in_app", "email"] : ["in_app"],
        },
      });
      toast.success("Notification delivered successfully!", {
        description: `Dispatched to student ${s.name} ${notifyParentCheck ? "and parent/guardian" : ""}.`,
      });
      setNotifModalOpen(false);
      setNotifTitle("");
      setNotifMessage("");
    } catch {
      toast.error("Failed to send notification.");
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleNotifyParent = (e: React.FormEvent) => {
    e.preventDefault();
    setParentSending(true);
    setTimeout(() => {
      toast.success(`Parent notification sent for ${s.name}`, {
        description: `Updates delivered to parent/guardian of ${s.name}.`,
      });
      setParentSending(false);
      setParentModalOpen(false);
      setParentNote("");
    }, 400);
  };

  const handleAssignPractice = (e: React.FormEvent) => {
    e.preventDefault();
    setPracticeAssigning(true);
    setTimeout(() => {
      toast.success(`Practice set assigned to ${s.name}`, {
        description: `${problemCount} ${practiceTopic} problems due ${practiceDueDate}.`,
      });
      setPracticeAssigning(false);
      setPracticeModalOpen(false);
    }, 400);
  };

  const getOfficialReportHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.name} - Official Student & Parent Progress Report</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; line-height: 1.4; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 22px; font-weight: bold; color: #4f46e5; }
          .title { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 4px; }
          .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc; }
          .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .field { font-size: 12px; margin-bottom: 4px; }
          .field strong { color: #334155; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
          .stat-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; }
          .stat-val { font-size: 18px; font-weight: 700; color: #4338ca; }
          .stat-lbl { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-top: 2px; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
          th { background: #f1f5f9; color: #334155; font-weight: 600; }
          .bar-container { background: #e2e8f0; border-radius: 4px; height: 8px; width: 80px; display: inline-block; vertical-align: middle; margin-right: 8px; }
          .bar-fill { background: #4f46e5; height: 8px; border-radius: 4px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 11px; }
          .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SYNTAX2CODE · SCHOOLS</div>
            <div class="title">Official Student Progress & Academic Diagnostic Dossier</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">School: ${s.schoolName || "Global Tech High"} · Academic Term 2026-2027</div>
          </div>
          <div>
            <span class="badge">CONFIDENTIAL ACADEMIC RECORD</span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Student Information</div>
            <div class="field"><strong>Full Name:</strong> ${s.name}</div>
            <div class="field"><strong>Classroom:</strong> ${s.className}</div>
            <div class="field"><strong>Student ID:</strong> ${s.id}</div>
            <div class="field"><strong>Academic Status:</strong> ${supportTag}</div>
          </div>
          <div class="card">
            <div class="card-title">Parent / Guardian Information</div>
            <div class="field"><strong>Primary Guardian:</strong> ${s.parent?.guardianName || "Sunita & Rajesh Sharma"}</div>
            <div class="field"><strong>Relationship:</strong> ${s.parent?.relation || "Parents / Primary Guardians"}</div>
            <div class="field"><strong>Contact Email:</strong> ${s.parent?.email || `parent.${s.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`}</div>
            <div class="field"><strong>Emergency Contact:</strong> ${s.parent?.phone || "+1 (555) 381-9042"}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${s.score}</div>
            <div class="stat-lbl">S2C Readiness Index</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${s.completion}%</div>
            <div class="stat-lbl">Curriculum Progress</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${s.attendance}%</div>
            <div class="stat-lbl">Term Attendance</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">Level ${s.level}</div>
            <div class="stat-lbl">${s.xp.toLocaleString()} Total XP</div>
          </div>
        </div>

        <div class="section-title">Core Programming Skill Mastery</div>
        <table>
          <thead>
            <tr>
              <th>Skill Area</th>
              <th>Mastery Rating</th>
              <th>Evaluation Score</th>
            </tr>
          </thead>
          <tbody>
            ${s.skills
              .map(
                (sk: { skill: string; value: number }) => `
              <tr>
                <td><strong>${sk.skill}</strong></td>
                <td>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${sk.value}%;"></div>
                  </div>
                  ${sk.value}%
                </td>
                <td>${sk.value >= 80 ? "Proficient / Advanced" : sk.value >= 60 ? "Satisfactory / Developing" : "Needs Practice"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="card" style="margin-top: 10px;">
          <div class="card-title">Instructor Remarks & Learning Recommendations</div>
          <div style="font-size: 11px; line-height: 1.5; color: #334155;">
            ${s.name} demonstrates exemplary consistency and problem-solving capability in computer science. 
            Curriculum milestone benchmarks are actively met with high attendance (${s.attendance}%).
          </div>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <strong>Instructor / Faculty Signature</strong><br>
            ${mentorName} (Computer Science Department)
          </div>
          <div class="sig-line">
            <strong>Parent / Guardian Signature & Date</strong><br>
            Acknowledgment of Academic Progress
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const printOfficialReport = () => {
    const html = getOfficialReportHtml();
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    }
  };

  const downloadReportFile = () => {
    const html = getOfficialReportHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.name.replace(/\s+/g, "_")}_Official_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Progress report file downloaded", {
      description: "Saved as an offline printable HTML report.",
    });
  };

  return (
    <>
      <Link
        to="/teacher/students"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to student roster
      </Link>

      <PageHeader
        title={s.name}
        subtitle={`${s.className} · ${s.email} · Last active ${s.lastActive}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotifModalOpen(true)}
              className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Bell className="h-4 w-4 text-indigo-600" /> Send Notification
            </Button>
            <Button
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <FileText className="h-4 w-4" /> Progress Dossier
            </Button>
          </div>
        }
      />

      {/* Header Profile Card */}
      <Panel className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar initials={s.name.substring(0, 2).toUpperCase()} size="lg" />
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{s.name}</h2>
              <Pill
                tone={
                  supportTag === "Needs support"
                    ? "rose"
                    : supportTag === "Accelerated"
                      ? "violet"
                      : "emerald"
                }
              >
                {supportTag}
              </Pill>
              <Pill tone="amber">{s.streak}-day streak</Pill>
            </div>
            <p className="text-xs text-slate-500">
              Grade 8 · Section B · Assigned Faculty Mentor: <strong>{mentorName}</strong>
            </p>
          </div>
        </div>
      </Panel>

      {/* Core KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="S2C Score" value={s.score} sub="Class avg 806" tone="emerald" />
        <Stat label="Curriculum" value={`${s.completion}%`} sub="Completed" tone="sky" />
        <Stat label="Attendance" value={`${s.attendance}%`} sub="This term" tone="violet" />
        <Stat
          label="Total XP"
          value={s.xp.toLocaleString()}
          sub={`Level ${s.level}`}
          tone="amber"
        />
      </div>

      {/* Radar & Progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Skill radar" description="Relative strengths and gaps">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={s.skills} outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Radar dataKey="value" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Progress detail">
          <div className="space-y-3">
            {s.skills.map((sk: { skill: string; value: number }) => (
              <div key={sk.skill}>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{sk.skill}</span>
                  <span>{sk.value}%</span>
                </div>
                <Bar
                  value={sk.value}
                  tone={sk.value >= 80 ? "emerald" : sk.value >= 60 ? "indigo" : "amber"}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setParentModalOpen(true)}
              className="inline-flex items-center gap-2 h-9 rounded-xl border border-slate-200 px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 text-slate-500" /> Notify Parent
            </button>
            <button
              type="button"
              onClick={() => setPracticeModalOpen(true)}
              className="inline-flex items-center gap-2 h-9 rounded-xl border border-slate-200 px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-slate-500" /> Assign Practice
            </button>
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-2 h-9 rounded-xl bg-indigo-600 px-3.5 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" /> Official Report
            </button>
          </div>
        </Panel>
      </div>

      {/* STUDENT SUPPORT & MENTORING SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Student Support & Intervention Plan"
          description="Assign personalized mentoring tags and intervention strategies"
          action={
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Class Scoped
            </span>
          }
        >
          <form onSubmit={handleSaveSupport} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Academic Support Tag</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    tag: "On track",
                    label: "On Track",
                    color: "text-emerald-700 border-emerald-200 bg-emerald-50",
                  },
                  {
                    tag: "Needs support",
                    label: "Needs Help",
                    color: "text-rose-700 border-rose-200 bg-rose-50",
                  },
                  {
                    tag: "Accelerated",
                    label: "Accelerated",
                    color: "text-violet-700 border-violet-200 bg-violet-50",
                  },
                  {
                    tag: "Mentoring required",
                    label: "Mentoring",
                    color: "text-amber-700 border-amber-200 bg-amber-50",
                  },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setSupportTag(item.tag as StudentSupportData["tag"])}
                    className={cn(
                      "rounded-xl border p-2 text-xs font-semibold text-center transition-all cursor-pointer",
                      supportTag === item.tag
                        ? cn(item.color, "ring-2 ring-indigo-200")
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mentor-name">Assigned Faculty Mentor</Label>
              <Input
                id="mentor-name"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="Faculty mentor name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="intervention-notes">Intervention Strategy & Academic Notes</Label>
              <Textarea
                id="intervention-notes"
                rows={3}
                value={interventionNotes}
                onChange={(e) => setInterventionNotes(e.target.value)}
                placeholder="Add pedagogical intervention goals, challenge recommendations, or follow-ups..."
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isSavingSupport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                {isSavingSupport ? "Saving Changes..." : "Save Support Plan"}
              </Button>
            </div>
          </form>
        </Panel>

        {/* CLASS-SCOPED STUDENT RIGHTS & GUARDRAILS */}
        <Panel
          title="Class-Scoped Rights & Guardrails"
          description="Configure coding lab sandbox limits and execution boundaries"
          action={
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Shield className="h-3.5 w-3.5 text-indigo-600" /> Active Protection
            </div>
          }
        >
          <form onSubmit={handleSaveGuardrails} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Allowed Programming Languages in Lab</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["Python", "JavaScript", "HTML/CSS", "Java"].map((lang) => {
                  const isAllowed = allowedLangs.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        setAllowedLangs((prev) =>
                          isAllowed ? prev.filter((l) => l !== lang) : [...prev, lang],
                        )
                      }
                      className={cn(
                        "rounded-xl border p-2 text-xs font-semibold text-center transition-all cursor-pointer",
                        isAllowed
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                          : "border-slate-200 text-slate-400 line-through bg-slate-50",
                      )}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="loop-timeout">Max Loop Timeout (ms)</Label>
                <Input
                  id="loop-timeout"
                  type="number"
                  min={500}
                  max={10000}
                  step={500}
                  value={loopTimeout}
                  onChange={(e) => setLoopTimeout(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sandbox-mode">Sandbox Isolation Mode</Label>
                <select
                  id="sandbox-mode"
                  value={sandboxMode}
                  onChange={(e) =>
                    setSandboxMode(e.target.value as "strict" | "standard" | "relaxed")
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                >
                  <option value="strict">Strict (Web Worker + Iframe)</option>
                  <option value="standard">Standard (Isolated Iframe)</option>
                  <option value="relaxed">Relaxed (Dev Sandbox)</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
              <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                <span>Block External Network & Web Fetch</span>
                <input
                  type="checkbox"
                  checked={blockNetwork}
                  onChange={(e) => setBlockNetwork(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <p className="text-[11px] text-slate-400">
                Prevents outbound HTTP calls from student scripts to prevent data leaks or
                unmoderated access.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isSavingGuardrails}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                {isSavingGuardrails ? "Updating Guardrails..." : "Save Sandbox Rights"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      {/* STUDENT EXECUTIONS PIPELINE MONITOR */}
      <Panel
        title="Student Executions Pipeline Telemetry"
        description="Real-time execution telemetry, runtime errors, and sandbox security compliance"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Pipeline Score: {pipeline?.safetyScore || 98}
              %
            </span>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-4 mb-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-indigo-600">{pipeline?.totalRuns || 48}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Code Runs</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{pipeline?.passRate || 92}%</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Test Pass Rate</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-sky-600">0</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Security Flags</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-purple-600">142ms</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Avg Run Time</p>
          </div>
        </div>

        {/* Execution Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2.5">Challenge & Language</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Execution & Memory</th>
                <th className="px-4 py-2.5">Exit Code</th>
                <th className="px-4 py-2.5">Sandbox Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(pipeline?.logs || []).map((log: PipelineExecutionLog) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{log.challenge}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{log.language}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.timestamp}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {log.executionTimeMs}ms · {log.memoryUsedMb}MB
                  </td>
                  <td className="px-4 py-3">
                    {log.exitCode === 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 0 (Success)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> {log.exitCode} (Failed)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {log.logs?.map((l: string, idx: number) => (
                        <p key={idx} className="font-mono text-[10px] text-slate-500">
                          › {l}
                        </p>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* DIRECT IN-APP NOTIFICATION DIALOG */}
      <Dialog open={notifModalOpen} onOpenChange={setNotifModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" /> Send Notification to {s.name}
            </DialogTitle>
            <DialogDescription>
              Direct dispatch to the student's dashboard inbox with optional parent notification.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendNotification} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Notification Subject</Label>
              <Input
                id="notif-title"
                placeholder="e.g. Code Review Feedback: Loops Practice"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-message">Message Content</Label>
              <Textarea
                id="notif-message"
                placeholder="Write specific feedback, upcoming assignment reminders, or positive praise..."
                rows={4}
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                required
              />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                <span>Also notify parent / guardian via email</span>
                <input
                  type="checkbox"
                  checked={notifyParentCheck}
                  onChange={(e) => setNotifyParentCheck(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNotifModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSendingNotif}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSendingNotif ? "Dispatching..." : "Dispatch Notification"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notify Parent Modal */}
      <Dialog open={parentModalOpen} onOpenChange={setParentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notify Parent / Guardian</DialogTitle>
            <DialogDescription>
              Send an official progress summary update to the parent/guardian of {s.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNotifyParent} className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Guardian Name:</span>
                <span className="font-semibold text-slate-800">
                  {s.parent?.guardianName || "Sunita & Rajesh Sharma"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Primary Phone:</span>
                <span className="text-slate-700">{s.parent?.phone || "+1 (555) 381-9042"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="parent-email">Parent Email Address</Label>
              <Input
                id="parent-email"
                type="email"
                defaultValue={
                  s.parent?.email || `parent.${s.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="parent-note">Message / Recommendation</Label>
              <Textarea
                id="parent-note"
                placeholder="Write a personalized note regarding learning milestones, strengths, or recommendations..."
                rows={3}
                value={parentNote}
                onChange={(e) => setParentNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setParentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={parentSending}>
                {parentSending ? "Sending..." : "Send Email to Parent"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Remedial Practice Modal */}
      <Dialog open={practiceModalOpen} onOpenChange={setPracticeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Targeted Practice</DialogTitle>
            <DialogDescription>
              Create a custom practice problem set for {s.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignPractice} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="practice-topic">Target Topic</Label>
              <Input
                id="practice-topic"
                value={practiceTopic}
                onChange={(e) => setPracticeTopic(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="problem-count">Number of Problems</Label>
                <Input
                  id="problem-count"
                  type="number"
                  value={problemCount}
                  onChange={(e) => setProblemCount(e.target.value)}
                  min={1}
                  max={20}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  value={practiceDueDate}
                  onChange={(e) => setPracticeDueDate(e.target.value)}
                  placeholder="Friday"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPracticeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={practiceAssigning}>
                {practiceAssigning ? "Assigning..." : "Assign Practice Set"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Progress Dossier Preview Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Official Student & Parent Progress Dossier
            </DialogTitle>
            <DialogDescription>
              Academic diagnostic evaluation and progress summary for {s.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 text-sm">
            <div className="border-b border-indigo-100 pb-3 flex justify-between items-start">
              <div>
                <p className="font-bold text-indigo-600 text-base">Syntax2Code Academic Portal</p>
                <p className="text-xs text-slate-500">
                  Official Student Performance & Parent Assessment Report
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                Term 2026-2027
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Student Details
                </p>
                <p>
                  <span className="text-slate-500">Name:</span> <strong>{s.name}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Class:</span> {s.className}
                </p>
                <p>
                  <span className="text-slate-500">Support Tag:</span> {supportTag}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Guardian Contact
                </p>
                <p>
                  <span className="text-slate-500">Guardian:</span>{" "}
                  <strong>{s.parent?.guardianName || "Sunita & Rajesh Sharma"}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Email:</span>{" "}
                  {s.parent?.email ||
                    `parent.${s.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="border border-slate-200 p-2.5 rounded-xl">
                <p className="text-base font-bold text-indigo-600">{s.score}</p>
                <p className="text-[10px] text-slate-500 uppercase">S2C Score</p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-xl">
                <p className="text-base font-bold text-emerald-600">{s.completion}%</p>
                <p className="text-[10px] text-slate-500 uppercase">Completion</p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-xl">
                <p className="text-base font-bold text-sky-600">{s.attendance}%</p>
                <p className="text-[10px] text-slate-500 uppercase">Attendance</p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-xl">
                <p className="text-base font-bold text-amber-600">{s.level}</p>
                <p className="text-[10px] text-slate-500 uppercase">Level</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)}>
              Close Preview
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={downloadReportFile}
                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Download Report File
              </Button>
              <Button
                type="button"
                onClick={printOfficialReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
              >
                <FileText className="h-4 w-4" /> Print / Save as PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
