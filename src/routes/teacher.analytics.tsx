import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, Printer, Search, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getTeacherAnalyticsFn } from "@/api/teacher.server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";

export const Route = createFileRoute("/teacher/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Reports · Syntax2Code" },
      {
        name: "description",
        content: "Completion graphs, skill comparisons and downloadable class reports.",
      },
      { property: "og:title", content: "Analytics & Reports · Syntax2Code" },
      {
        property: "og:description",
        content: "Visual analytics and exportable reports for your classes.",
      },
    ],
  }),
  loader: async () => {
    return await getTeacherAnalyticsFn();
  },
  component: AnalyticsPage,
});

const ranges = ["Last 6 weeks", "This term", "This year"] as const;

function printIsolatedHtml(htmlContent: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 350);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1200);
  }, 350);
}

function downloadHtmlFile(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function AnalyticsPage() {
  const data = Route.useLoaderData();
  const [range, setRange] = useState<(typeof ranges)[number]>("Last 6 weeks");
  const myClasses = data?.classes || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students: any[] = data?.students || [];

  const [parentPackOpen, setParentPackOpen] = useState(false);
  const [classReportOpen, setClassReportOpen] = useState(false);
  const [executiveReportOpen, setExecutiveReportOpen] = useState(false);

  const [parentSearch, setParentSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const filteredStudents = students.filter((st) => {
    const matchesClass =
      selectedClassId === "all" || String(st.classId) === String(selectedClassId);
    const q = parentSearch.toLowerCase();
    const matchesSearch =
      !q ||
      st.name.toLowerCase().includes(q) ||
      st.parent?.guardianName?.toLowerCase().includes(q) ||
      st.parent?.email?.toLowerCase().includes(q);
    return matchesClass && matchesSearch;
  });

  const getParentSummaryPackHtml = () => {
    const studentCards = filteredStudents
      .map(
        (st) => `
      <div class="page-card">
        <div class="header">
          <div>
            <div class="logo">Syntax2Code Academic Platform</div>
            <div class="report-title">Official Student Progress & Parent Summary</div>
            <div class="sub-info">Academic Term: 2026-2027 · ${st.className || "Computer Science"}</div>
          </div>
          <div>
            <span class="badge">Official Academic Record</span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Student Information</div>
            <div class="field"><strong>Full Name:</strong> ${st.name}</div>
            <div class="field"><strong>Class:</strong> ${st.className}</div>
            <div class="field"><strong>Current Status:</strong> <span class="tag-badge">${st.tag || "On track"}</span></div>
            <div class="field"><strong>Student ID:</strong> S2C-${st.id.slice(0, 8)}</div>
          </div>

          <div class="card highlight-card">
            <div class="card-title">Parent / Guardian Contact Details</div>
            <div class="field"><strong>Guardian:</strong> ${st.parent?.guardianName || "Parent / Guardian"}</div>
            <div class="field"><strong>Relationship:</strong> ${st.parent?.relation || "Parents / Primary Guardians"}</div>
            <div class="field"><strong>Email Address:</strong> ${st.parent?.email || "parent@example.com"}</div>
            <div class="field"><strong>Primary Phone:</strong> ${st.parent?.phone || "+1 (555) 381-9042"}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${st.score || 750}</div>
            <div class="stat-lbl">S2C Score</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${st.completion || 65}%</div>
            <div class="stat-lbl">Curriculum Completion</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${st.attendance || 92}%</div>
            <div class="stat-lbl">Attendance Rate</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">Level ${st.level || 1}</div>
            <div class="stat-lbl">${(st.xp || 500).toLocaleString()} Total XP</div>
          </div>
        </div>

        <div class="card remarks-card">
          <div class="card-title">Faculty Evaluation & Notes for Parents</div>
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #334155;">
            ${st.name} is making commendable progress in core computer science competencies. 
            Attendance is recorded at ${st.attendance}%. Parents/guardians are encouraged to encourage 30 minutes of independent coding practice every weekend.
          </p>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <strong>Instructor / Faculty Signature</strong><br>
            Department of Computer Science
          </div>
          <div class="sig-line">
            <strong>Parent / Guardian Signature & Date</strong><br>
            Acknowledgement of Academic Progress
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parent Summary Pack - Syntax2Code</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; }
          .page-card { page-break-after: always; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; }
          .page-card:last-child { page-break-after: auto; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 20px; font-weight: bold; color: #4f46e5; }
          .report-title { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 3px; }
          .sub-info { font-size: 11px; color: #64748b; margin-top: 2px; }
          .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .highlight-card { background: #f0fdf4; border-color: #bbf7d0; }
          .card-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .highlight-card .card-title { color: #166534; border-color: #dcfce7; }
          .field { font-size: 12px; margin-bottom: 4px; }
          .field strong { color: #334155; }
          .tag-badge { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center; background: #fff; }
          .stat-val { font-size: 17px; font-weight: bold; color: #4f46e5; }
          .stat-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
          .remarks-card { margin-top: 12px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 28px; }
          .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        ${studentCards}
      </body>
      </html>
    `;
  };

  const handleExportParentContactsCsv = () => {
    const headers = [
      "Student Name",
      "Class",
      "Status",
      "Guardian Name",
      "Relationship",
      "Parent Email",
      "Parent Phone",
      "Attendance %",
      "Score",
      "Level",
      "XP",
    ];
    const rows = filteredStudents.map((st) => [
      `"${st.name}"`,
      `"${st.className || ""}"`,
      `"${st.tag || ""}"`,
      `"${st.parent?.guardianName || ""}"`,
      `"${st.parent?.relation || ""}"`,
      `"${st.parent?.email || ""}"`,
      `"${st.parent?.phone || ""}"`,
      st.attendance || 0,
      st.score || 0,
      st.level || 1,
      st.xp || 0,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "parent_summary_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Parent contacts CSV exported", {
      description: "parent_summary_contacts.csv",
    });
  };

  const getExecutiveReportHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Analytics & Leadership Report - Syntax2Code</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 20px; font-weight: bold; color: #4f46e5; }
          .title { font-size: 16px; font-weight: 600; color: #0f172a; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .m-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
          .m-val { font-size: 22px; font-weight: bold; color: #4f46e5; }
          .m-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .section-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Syntax2Code Academic Portal</div>
            <div class="title">Executive Academic Analytics & Term Report</div>
            <div style="font-size: 11px; color: #64748b;">Academic Range: ${range} · Faculty: Priya Raman</div>
          </div>
          <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="metrics">
          <div class="m-box"><div class="m-val">72%</div><div class="m-lbl">Avg Curriculum Completion</div></div>
          <div class="m-box"><div class="m-val">84%</div><div class="m-lbl">Weekly Active Engagement</div></div>
          <div class="m-box"><div class="m-val">79%</div><div class="m-lbl">Assessment Average Score</div></div>
          <div class="m-box"><div class="m-val">41</div><div class="m-lbl">Verified Projects Approved</div></div>
        </div>

        <div class="section-title">Class Breakdown & Performance Overview</div>
        <table>
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Active Students</th>
              <th>Completion Rate</th>
              <th>Average Score</th>
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            ${myClasses
              .map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (c: any) => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.grade || "N/A"}</td>
                <td>${c.section || "A"}</td>
                <td>${c.students || 0}</td>
                <td>${c.completion || 0}%</td>
                <td>${c.avgScore || 0}</td>
                <td>${c.attendance || 0}%</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const getClassPerformanceReportHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Class Performance Report - Syntax2Code</title>
        <style>
          @page { size: A4 portrait; margin: 14mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 20px; font-weight: bold; color: #4f46e5; }
          .title { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .badge { background: #e0e7ff; color: #4338ca; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Syntax2Code Academic Portal</div>
            <div class="title">Class Performance & Evaluation Roster Report</div>
            <div style="font-size: 11px; color: #64748b;">Term 2026-2027 · ${myClasses.length} Active Classes</div>
          </div>
          <div><span class="badge">Official Report</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Level</th>
              <th>Score</th>
              <th>Completion</th>
              <th>Attendance</th>
              <th>Parent / Guardian</th>
              <th>Parent Phone</th>
            </tr>
          </thead>
          <tbody>
            ${students
              .map(
                (st) => `
              <tr>
                <td><strong>${st.name}</strong></td>
                <td>${st.className || ""}</td>
                <td>Level ${st.level || 1}</td>
                <td>${st.score || 0}</td>
                <td>${st.completion || 0}%</td>
                <td>${st.attendance || 0}%</td>
                <td>${st.parent?.guardianName || "N/A"}</td>
                <td>${st.parent?.phone || "N/A"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Evidence you can take into parent meetings and leadership reviews."
        actions={
          <>
            <button
              onClick={() => setExecutiveReportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FileText className="h-4 w-4" /> Generate PDF
            </button>
            <button
              onClick={() => {
                const headers = [
                  "Class Name",
                  "Grade",
                  "Section",
                  "Students",
                  "Completion %",
                  "Avg Score",
                  "Attendance %",
                ];
                const rows = myClasses.map(
                  (c: {
                    name: string;
                    grade?: string | null;
                    section?: string | null;
                    students?: number;
                    completion?: number;
                    avgScore?: number;
                    attendance?: number;
                  }) => [
                    `"${c.name}"`,
                    `"${c.grade || ""}"`,
                    `"${c.section || ""}"`,
                    c.students || 0,
                    c.completion || 0,
                    c.avgScore || 0,
                    c.attendance || 0,
                  ],
                );
                const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "analytics_export.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success("CSV exported", { description: "analytics_export.csv" });
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </>
        }
      />

      <FilterChips options={ranges} value={range} onChange={setRange} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Avg completion" value="72%" sub={`${range}`} tone="emerald" />
        <Stat label="Engagement" value="84%" sub="Weekly active students" tone="sky" />
        <Stat label="Assessment avg" value="79%" sub="Across 6 assessments" tone="violet" />
        <Stat label="Projects approved" value="41" sub="12 showcased" tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Completion & engagement" description={range}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.weeklyActivity || []}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="#0d9488"
                  fill="#14b8a6"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Skill comparison across classes"
          description="Mastery scores across core programming competencies"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.skillHeatmap || []}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                  formatter={(val: number) => [`${val}%`, "Mastery"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                {myClasses.map((c: { id: number; name: string }, i: number) => {
                  const colors = ["#6366f1", "#0d9488", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
                  return (
                    <RBar
                      key={c.id}
                      dataKey={c.name}
                      fill={colors[i % colors.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="Report library"
        description="Preview and download official documents with full data"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4 bg-white flex flex-col justify-between">
            <div>
              <Pill tone="violet">PDF</Pill>
              <p className="mt-2 text-sm font-semibold text-slate-900">Class performance report</p>
              <p className="mt-1 text-xs text-slate-500">
                Completion, scores and attendance per student roster
              </p>
            </div>
            <button
              onClick={() => setClassReportOpen(true)}
              className="mt-4 h-9 w-full rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Preview & download
            </button>
          </div>

          <div className="rounded-2xl border border-indigo-200 p-4 bg-indigo-50/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Pill tone="emerald">PDF + CSV</Pill>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  Parent Data
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">Parent summary pack</p>
              <p className="mt-1 text-xs text-slate-500">
                One-page summaries with guardian contacts and feedback
              </p>
            </div>
            <button
              onClick={() => setParentPackOpen(true)}
              className="mt-4 h-9 w-full rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Preview & download
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-white flex flex-col justify-between">
            <div>
              <Pill tone="sky">CSV</Pill>
              <p className="mt-2 text-sm font-semibold text-slate-900">Raw data export</p>
              <p className="mt-1 text-xs text-slate-500">
                All activity data, completions and metrics for your classes
              </p>
            </div>
            <button
              onClick={() => {
                const headers = [
                  "Class Name",
                  "Grade",
                  "Section",
                  "Students",
                  "Completion %",
                  "Avg Score",
                  "Attendance %",
                ];
                const rows = myClasses.map(
                  (c: {
                    name: string;
                    grade?: string | null;
                    section?: string | null;
                    students?: number;
                    completion?: number;
                    avgScore?: number;
                    attendance?: number;
                  }) => [
                    `"${c.name}"`,
                    `"${c.grade || ""}"`,
                    `"${c.section || ""}"`,
                    c.students || 0,
                    c.completion || 0,
                    c.avgScore || 0,
                    c.attendance || 0,
                  ],
                );
                const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join(
                  "\n",
                );
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "raw_data_export.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Report downloaded", { description: "raw_data_export.csv" });
              }}
              className="mt-4 h-9 w-full rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </Panel>

      <Dialog open={parentPackOpen} onOpenChange={setParentPackOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Parent Summary Pack & Guardian Information
            </DialogTitle>
            <DialogDescription>
              One-page academic progress summaries and primary parent contact details for all
              students.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search student or parent name..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Classes ({students.length} students)</option>
                {myClasses.map((c: { id: number; name: string }) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mt-3 max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Guardian Name</th>
                  <th className="py-2.5 px-3">Relationship</th>
                  <th className="py-2.5 px-3">Parent Email</th>
                  <th className="py-2.5 px-3">Parent Phone</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No student records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">
                        {st.className}
                      </td>
                      <td className="py-2 px-3 text-emerald-800 font-medium">
                        {st.parent?.guardianName || "N/A"}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {st.parent?.relation || "Guardian"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-[160px]">
                        {st.parent?.email || "N/A"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {st.parent?.phone || "N/A"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                          {st.attendance}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-indigo-600">
                        {st.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
            <strong>Parent Summary Pack includes:</strong> Individual student report pages with full
            guardian contact details, attendance records, curriculum completion scores, core
            programming skills, and teacher remarks.
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setParentPackOpen(false)}>
              Close Preview
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportParentContactsCsv}
                className="flex items-center gap-1.5 text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Download Parent CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const html = getParentSummaryPackHtml();
                  downloadHtmlFile(html, "Parent_Summary_Pack_Reports.html");
                  toast.success("Parent summary report downloaded", {
                    description: "Parent_Summary_Pack_Reports.html",
                  });
                }}
                className="flex items-center gap-1.5 text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" /> Download HTML Pack
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const html = getParentSummaryPackHtml();
                  printIsolatedHtml(html);
                  toast.success("Generating printable Parent Summary Pack", {
                    description: "Opening isolated print dialog without site navigation.",
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs h-9 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={classReportOpen} onOpenChange={setClassReportOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Class Performance Report & Student Roster
            </DialogTitle>
            <DialogDescription>
              Complete assessment averages, completion rates, and guardian records for your classes.
            </DialogDescription>
          </DialogHeader>

          <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-center">Completion</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 font-semibold text-slate-900">{st.name}</td>
                    <td className="py-2 px-3 text-slate-600">{st.className}</td>
                    <td className="py-2 px-3 text-center font-bold text-indigo-600">{st.score}</td>
                    <td className="py-2 px-3 text-center">{st.completion}%</td>
                    <td className="py-2 px-3 text-center font-medium text-emerald-600">
                      {st.attendance}%
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {st.parent?.guardianName} ({st.parent?.phone})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setClassReportOpen(false)}>
              Close Preview
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const html = getClassPerformanceReportHtml();
                  downloadHtmlFile(html, "Class_Performance_Report.html");
                  toast.success("Class performance report downloaded", {
                    description: "Class_Performance_Report.html",
                  });
                }}
                className="flex items-center gap-1.5 text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Download HTML
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const html = getClassPerformanceReportHtml();
                  printIsolatedHtml(html);
                  toast.success("Printing Class Performance Report", {
                    description: "Isolated PDF preview without website dashboard.",
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs h-9 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={executiveReportOpen} onOpenChange={setExecutiveReportOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Executive Academic Analytics & Term Report
            </DialogTitle>
            <DialogDescription>
              Official leadership progress summary and class-by-class performance metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-3 my-2 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xl font-bold text-indigo-600">72%</p>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5">Avg Completion</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xl font-bold text-sky-600">84%</p>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5">Engagement</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xl font-bold text-violet-600">79%</p>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5">Assessment Avg</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xl font-bold text-amber-600">41</p>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5">Approved Projects</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden my-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Class Name</th>
                  <th className="py-2 px-3">Grade</th>
                  <th className="py-2 px-3">Students</th>
                  <th className="py-2 px-3 text-center">Completion</th>
                  <th className="py-2 px-3 text-center">Avg Score</th>
                  <th className="py-2 px-3 text-center">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myClasses.map(
                  (c: {
                    id: number;
                    name: string;
                    grade?: string | null;
                    students?: number;
                    completion?: number;
                    avgScore?: number;
                    attendance?: number;
                  }) => (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-2 px-3 text-slate-600">{c.grade || "N/A"}</td>
                      <td className="py-2 px-3 text-slate-600">{c.students || 0}</td>
                      <td className="py-2 px-3 text-center font-medium text-emerald-600">
                        {c.completion || 0}%
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-indigo-600">
                        {c.avgScore || 0}
                      </td>
                      <td className="py-2 px-3 text-center font-medium text-sky-600">
                        {c.attendance || 0}%
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setExecutiveReportOpen(false)}>
              Close Preview
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const html = getExecutiveReportHtml();
                  downloadHtmlFile(html, "Executive_Term_Report.html");
                  toast.success("Executive report downloaded", {
                    description: "Executive_Term_Report.html",
                  });
                }}
                className="flex items-center gap-1.5 text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Download HTML
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const html = getExecutiveReportHtml();
                  printIsolatedHtml(html);
                  toast.success("Printing Executive Term Report", {
                    description: "Isolated PDF preview without website dashboard.",
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs h-9 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
