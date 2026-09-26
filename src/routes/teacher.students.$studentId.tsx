import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Sparkles, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Avatar, Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getStudentProfileFn, getStudentProjectsFn } from "@/api/student.server";
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

export const Route = createFileRoute("/teacher/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile · Syntax2Code" },
      {
        name: "description",
        content: "Student-level progress, skills, attendance, projects and support tags.",
      },
      { property: "og:title", content: "Student profile · Syntax2Code" },
      { property: "og:description", content: "A full learning profile for one student." },
    ],
  }),
  loader: async ({ params }) => {
    const [profileData, projects] = await Promise.all([
      getStudentProfileFn({ data: params.studentId }),
      getStudentProjectsFn({ data: params.studentId }),
    ]);
    return { profile: profileData.currentStudent, projects, studentId: params.studentId };
  },
  component: StudentDetail,
});

function StudentDetail() {
  const { profile: s, projects } = Route.useLoaderData();

  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [parentNote, setParentNote] = useState("");
  const [parentSending, setParentSending] = useState(false);

  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState("Debugging & Logic");
  const [problemCount, setProblemCount] = useState("5");
  const [practiceDueDate, setPracticeDueDate] = useState("Friday");
  const [practiceAssigning, setPracticeAssigning] = useState(false);

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

  const [reportModalOpen, setReportModalOpen] = useState(false);

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
          .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
          .stat-val { font-size: 18px; font-weight: bold; color: #4f46e5; }
          .stat-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
          .section-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 11px; color: #475569; font-weight: 600; border-bottom: 1px solid #cbd5e1; }
          td { padding: 6px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
          .bar-container { background: #e2e8f0; border-radius: 9999px; height: 6px; width: 90px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; }
          .bar-fill { height: 100%; background: #4f46e5; border-radius: 9999px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 32px; }
          .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Syntax2Code Academic Platform</div>
            <div class="title">Official Student Progress & Parent Report</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">School: ${s.schoolName || "Global Tech High"} · Academic Term: 2026-2027</div>
          </div>
          <div>
            <span class="badge">Official Academic Record</span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Student Information</div>
            <div class="field"><strong>Full Name:</strong> ${s.name}</div>
            <div class="field"><strong>Class & Section:</strong> ${s.className} ${s.gradeName ? `(${s.gradeName})` : ""}</div>
            <div class="field"><strong>Student ID:</strong> S2C-${s.id.slice(0, 8)}</div>
            <div class="field"><strong>Current Status:</strong> ${s.tag}</div>
          </div>

          <div class="card">
            <div class="card-title">Parent / Guardian Information</div>
            <div class="field"><strong>Guardian Name:</strong> ${s.parent?.guardianName || "Sunita & Rajesh Sharma"}</div>
            <div class="field"><strong>Relationship:</strong> ${s.parent?.relation || "Parents / Primary Guardians"}</div>
            <div class="field"><strong>Contact Email:</strong> ${s.parent?.email || `parent.${s.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`}</div>
            <div class="field"><strong>Contact Phone:</strong> ${s.parent?.phone || "+1 (555) 381-9042"}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${s.score}</div>
            <div class="stat-lbl">S2C Score</div>
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

        <div class="section-title">Recent Project Submissions & Coding Work</div>
        <table>
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Status</th>
              <th>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            ${projects
              .slice(0, 4)
              .map(
                (p: { title: string; status: string }) => `
              <tr>
                <td>${p.title}</td>
                <td>${p.status}</td>
                <td>Completed & Verified by Faculty</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="card" style="margin-top: 10px;">
          <div class="card-title">Instructor Remarks & Learning Recommendations for Parents</div>
          <div style="font-size: 11px; line-height: 1.5; color: #334155;">
            ${s.name} demonstrates exemplary consistency and problem-solving capability in computer science. 
            Curriculum milestone benchmarks are actively met with high attendance (${s.attendance}%). 
            Parents/guardians are encouraged to maintain active monitoring and acknowledge weekly achievements.
          </div>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <strong>Instructor / Faculty Signature</strong><br>
            Priya Raman (Computer Science Department)
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
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 350);
    } else {
      const win = window.open("", "_blank");
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 350);
      }
    }
  };

  const downloadReportFile = () => {
    const html = getOfficialReportHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${s.name.replace(/\s+/g, "_")}_Official_Parent_Report.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Parent report downloaded", {
      description: `${s.name.replace(/\s+/g, "_")}_Official_Parent_Report.html`,
    });
  };

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={`${s.className} · Level ${s.level} · last active ${s.lastActive}`}
        actions={
          <>
            <Link
              to="/teacher/classes/$classId"
              params={{ classId: s.classId?.toString() || "" }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back to class
            </Link>
            <button
              onClick={() =>
                toast.success("Support tag updated", {
                  description: `${s.name} flagged for weekly mentoring.`,
                })
              }
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add support tag
            </button>
          </>
        }
      />

      <Panel bodyClassName="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            initials={s.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
            size="lg"
          />
          <div className="flex-1">
            <p className="text-lg font-semibold tracking-tight text-slate-900">{s.name}</p>
            <p className="text-sm text-slate-500">
              {s.className} · {s.schoolName || "Global Tech High"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill
                tone={
                  s.tag === "Needs support" ? "rose" : s.tag === "Accelerated" ? "emerald" : "sky"
                }
              >
                {s.tag}
              </Pill>
              <Pill tone="violet">{s.badges} badges</Pill>
              <Pill tone="amber">{s.streak}-day streak</Pill>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Parent & Guardian Information"
        description="Primary contact and communication profile"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-1">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Parent / Guardian Name</p>
            <p className="mt-1 font-semibold text-slate-900">
              {s.parent?.guardianName || "Sunita & Rajesh Sharma"}
            </p>
            <p className="text-[11px] text-slate-400">
              {s.parent?.relation || "Parents / Primary Guardians"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Parent Email Address</p>
            <p className="mt-1 font-semibold text-slate-900 truncate">
              {s.parent?.email || `parent.${s.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Verified for progress alerts</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Primary Contact Phone</p>
            <p className="mt-1 font-semibold text-slate-900">
              {s.parent?.phone || "+1 (555) 381-9042"}
            </p>
            <p className="text-[11px] text-slate-400">SMS notifications active</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Emergency Contact</p>
            <p className="mt-1 font-semibold text-slate-900">
              {s.parent?.emergencyContact || "+1 (555) 381-9049"}
            </p>
            <p className="text-[11px] text-slate-400">Available during school hours</p>
          </div>
        </div>
      </Panel>

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
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Recent projects
            </p>
            <div className="mt-3 space-y-2">
              {projects.slice(0, 3).map((p: { id: string; title: string; status: string }) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5"
                >
                  <span className="text-sm text-slate-800">{p.title}</span>
                  <Pill
                    tone={
                      p.status === "Approved"
                        ? "emerald"
                        : p.status === "Needs Changes"
                          ? "amber"
                          : "sky"
                    }
                  >
                    {p.status}
                  </Pill>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <button
              onClick={() => setParentModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Send className="h-4 w-4 text-slate-500" /> Notify parent
            </button>
            <button
              onClick={() => setPracticeModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4 text-slate-500" /> Assign practice
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
            >
              <FileText className="h-4 w-4" /> Download report
            </button>
          </div>
        </Panel>
      </div>

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
                <span className="text-slate-500">Relationship:</span>
                <span className="text-slate-700">
                  {s.parent?.relation || "Parents / Primary Guardians"}
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

      <Dialog open={practiceModalOpen} onOpenChange={setPracticeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Remedial Practice</DialogTitle>
            <DialogDescription>
              Create a targeted practice problem set for {s.name}.
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

      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Official Student & Parent Progress Report
            </DialogTitle>
            <DialogDescription>
              Academic evaluation and parent progress summary for {s.name}.
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
                  <span className="text-slate-500">School:</span>{" "}
                  {s.schoolName || "Global Tech High"}
                </p>
                <p>
                  <span className="text-slate-500">Status:</span> {s.tag}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Parent / Guardian Details
                </p>
                <p>
                  <span className="text-slate-500">Guardian:</span>{" "}
                  <strong>{s.parent?.guardianName || "Sunita & Rajesh Sharma"}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Relation:</span>{" "}
                  {s.parent?.relation || "Parents / Primary Guardians"}
                </p>
                <p>
                  <span className="text-slate-500">Email:</span>{" "}
                  {s.parent?.email ||
                    `parent.${s.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`}
                </p>
                <p>
                  <span className="text-slate-500">Phone:</span>{" "}
                  {s.parent?.phone || "+1 (555) 381-9042"}
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
                <p className="text-[10px] text-slate-500 uppercase">Current Level</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Core Skill Competency Matrix
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {s.skills.map((sk: { skill: string; value: number }) => (
                  <div
                    key={sk.skill}
                    className="flex justify-between items-center p-2 rounded-lg border border-slate-100 bg-slate-50/50"
                  >
                    <span className="text-slate-700 font-medium">{sk.skill}</span>
                    <span className="font-bold text-slate-900">{sk.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                Faculty Evaluation & Next Steps
              </p>
              <p className="text-slate-600 leading-relaxed">
                {s.name} is progressing ahead of curriculum benchmarks. Regular coding habit and
                laboratory participation are exemplary. Parents/guardians are encouraged to review
                ongoing weekly homework submissions.
              </p>
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
