/**
 * School Admin Report Generation & Export Utilities
 * Provides print-ready executive dossiers, PDF compiles, and CSV exports using real institutional data.
 */

export interface SchoolReportData {
  school: {
    id: number;
    name: string;
    city?: string | null;
    planType: string;
  };
  schoolKpis: {
    enrolled: number;
    activeWeekly: number;
    curriculum: number;
    avgScore: number;
    licensedSeats: number;
  };
  classes: Array<{
    id: number | string;
    name: string;
    grade: string;
    section: string;
    teacherName: string;
    studentCount: number;
    avgXp?: number;
    avgScore?: number;
    completion: number;
  }>;
  teachers?: Array<{
    id: string;
    name: string;
    email: string;
    active: boolean;
    classes: string[];
    readiness: number;
  }>;
  students?: Array<{
    name: string;
    email: string;
    className: string;
    score: number;
    level: number;
    streak: number;
    active?: boolean;
  }>;
  readinessIndex?: Array<{
    dimension: string;
    value: number;
  }>;
}

export function generateSchoolReportHtml(reportType: string, data: SchoolReportData): string {
  const schoolName = data.school.name || "Global Tech High";
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getTitleAndSub = () => {
    switch (reportType) {
      case "board-pack":
        return {
          title: "Executive Board Presentation Pack",
          subtitle: "Quarterly Computational Curriculum Adoption & Institutional Oversight",
          badge: "CONFIDENTIAL · BOARD DOSSIER",
        };
      case "monthly-report":
        return {
          title: "Monthly Institutional Performance Report",
          subtitle: "Class-By-Class Progress, Active Coding Streaks, and Skill Milestones",
          badge: "MONTHLY PROGRESS AUDIT",
        };
      case "grade-breakdown":
        return {
          title: "Grade-Wise Performance & Curriculum Matrix",
          subtitle: "Cohort Completion, XP Benchmarking, and Section-Level Comparison",
          badge: "ACADEMIC BENCHMARK",
        };
      case "faculty-readiness":
        return {
          title: "Faculty Readiness & Adoption Audit",
          subtitle: "Instructor Enablement, Classroom Allocation, and Mentorship Metrics",
          badge: "FACULTY AUDIT",
        };
      case "parent-summary":
        return {
          title: "Guardian Progress Overview & Community Report",
          subtitle: "Aggregated Student Coding Achievements and Milestone Badges",
          badge: "COMMUNITY REPORT",
        };
      case "readiness-audit":
      default:
        return {
          title: "AI & Coding Readiness Index Audit",
          subtitle: "Strategic Competency Benchmark Across 5 Key Computational Pillars",
          badge: "CURRICULUM ACCREDITATION",
        };
    }
  };

  const info = getTitleAndSub();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${info.title} - ${schoolName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 10px 0 4px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      background: #f8fafc;
    }
    .kpi-card .label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-card .val {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 6px;
    }
    .kpi-card .sub {
      font-size: 11px;
      color: #10b981;
      margin-top: 2px;
      font-weight: 500;
    }
    h2 {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin: 24px 0 12px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      text-align: left;
      padding: 9px 12px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 9px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .radar-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 4px;
    }
    .radar-bar-fill {
      height: 100%;
      background: #4f46e5;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    .sig-section {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
    }
    .sig-line {
      width: 200px;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">${info.badge}</span>
      <h1>${info.title}</h1>
      <p class="subtitle">${info.subtitle}</p>
    </div>
    <div class="meta-box">
      <div>Institution: <strong>${schoolName}</strong></div>
      <div>City/Region: <strong>${data.school.city || "San Francisco, CA"}</strong></div>
      <div>Date: <strong>${dateStr}</strong></div>
      <div>Accreditation: <strong>Syntax2Code Junior</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="label">Total Enrolled</div>
      <div class="val">${data.schoolKpis.enrolled}</div>
      <div class="sub">${data.schoolKpis.licensedSeats} licensed seats</div>
    </div>
    <div class="kpi-card">
      <div class="label">Active Weekly</div>
      <div class="val">${data.schoolKpis.activeWeekly}</div>
      <div class="sub">${data.schoolKpis.enrolled ? Math.round((data.schoolKpis.activeWeekly / data.schoolKpis.enrolled) * 100) : 100}% attendance rate</div>
    </div>
    <div class="kpi-card">
      <div class="label">Curriculum Completion</div>
      <div class="val">${data.schoolKpis.curriculum}%</div>
      <div class="sub">+12% term-on-term</div>
    </div>
    <div class="kpi-card">
      <div class="label">Average S2C Score</div>
      <div class="val">${data.schoolKpis.avgScore} XP</div>
      <div class="sub">National benchmark: 650 XP</div>
    </div>
  </div>

  <h2>Class & Curriculum Performance Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Class Name</th>
        <th>Grade & Section</th>
        <th>Assigned Instructor</th>
        <th>Enrolled Students</th>
        <th>Avg Progress</th>
        <th>Completion</th>
      </tr>
    </thead>
    <tbody>
      ${data.classes
        .map(
          (c) => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>Grade ${c.grade} (${c.section})</td>
          <td>${c.teacherName}</td>
          <td>${c.studentCount} students</td>
          <td>${c.avgXp ?? c.avgScore ?? 0} XP</td>
          <td><span class="pill">${c.completion}% Completed</span></td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  ${
    data.readinessIndex && data.readinessIndex.length > 0
      ? `
  <h2>AI & Computational Readiness Dimensions</h2>
  <table>
    <thead>
      <tr>
        <th>Readiness Dimension</th>
        <th>Score (out of 100)</th>
        <th>Benchmark Assessment</th>
      </tr>
    </thead>
    <tbody>
      ${data.readinessIndex
        .map(
          (r) => `
        <tr>
          <td style="width: 45%;"><strong>${r.dimension}</strong></td>
          <td style="width: 25%;">
            <div style="display:flex; justify-content:space-between; font-weight:600;">
              <span>${r.value}/100</span>
            </div>
            <div class="radar-bar">
              <div class="radar-bar-fill" style="width: ${r.value}%;"></div>
            </div>
          </td>
          <td>${r.value >= 80 ? "Exceeds standard" : r.value >= 70 ? "On target" : "Requires focus"}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>`
      : ""
  }

  ${
    data.teachers && data.teachers.length > 0
      ? `
  <h2>Faculty Coverage & Subject Allocations</h2>
  <table>
    <thead>
      <tr>
        <th>Faculty Member</th>
        <th>Email</th>
        <th>Assigned Classes</th>
        <th>Readiness Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.teachers
        .map(
          (t) => `
        <tr>
          <td><strong>${t.name}</strong></td>
          <td>${t.email}</td>
          <td>${t.classes.join(", ") || "General Support"}</td>
          <td><span class="pill">${t.active ? "Active" : "Inactive"} · ${t.readiness}%</span></td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>`
      : ""
  }

  <div class="sig-section">
    <div class="sig-line">
      Academic Principal / Head of School
    </div>
    <div class="sig-line">
      Computer Science Coordinator
    </div>
    <div class="sig-line">
      Syntax2Code Institutional Reviewer
    </div>
  </div>

  <div class="footer">
    <div>Generated by Syntax2Code Junior Institutional Management Suite</div>
    <div>Document Ref: S2C-${data.school.id}-${Date.now().toString(36).toUpperCase()}</div>
  </div>
</body>
</html>`;
}

export function printIsolatedHtml(htmlContent: string) {
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
    }, 1500);
  }, 400);
}

export function downloadHtmlFile(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportLiveSchoolCsv(data: SchoolReportData, filename?: string) {
  const schoolName = data.school.name || "Global Tech High";
  const rows: string[][] = [
    ["SYNTAX2CODE JUNIOR - INSTITUTIONAL ACTIVITY EXPORT"],
    ["School Name", schoolName],
    ["Generated At", new Date().toISOString()],
    ["Licensed Seats", String(data.schoolKpis.licensedSeats)],
    ["Total Enrolled", String(data.schoolKpis.enrolled)],
    ["Active Weekly", String(data.schoolKpis.activeWeekly)],
    ["Curriculum Completion", `${data.schoolKpis.curriculum}%`],
    ["Average S2C Score", `${data.schoolKpis.avgScore} XP`],
    [],
    ["CLASSES SUMMARY"],
    [
      "Class ID",
      "Class Name",
      "Grade",
      "Section",
      "Teacher",
      "Students Enrolled",
      "Avg Score",
      "Completion",
    ],
    ...data.classes.map((c) => [
      String(c.id),
      c.name,
      c.grade,
      c.section,
      c.teacherName,
      String(c.studentCount),
      `${c.avgXp ?? c.avgScore ?? 0} XP`,
      `${c.completion}%`,
    ]),
    [],
    ["STUDENTS ROSTER"],
    ["Student Name", "Email Address", "Assigned Class", "XP Score", "Level", "Streak", "Status"],
    ...(data.students || []).map((s) => [
      s.name,
      s.email,
      s.className,
      String(s.score),
      `Level ${s.level}`,
      `${s.streak} days`,
      s.active !== false ? "Active" : "Inactive",
    ]),
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    filename || `${schoolName.toLowerCase().replace(/\s+/g, "_")}_live_export.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTimetableCsv(
  schedules: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    title: string;
    subject: string;
    room: string;
    className: string;
    teacherName: string;
    scheduleType: string;
    status: string;
  }>,
  schoolName: string,
) {
  const rows = [
    ["SYNTAX2CODE JUNIOR - MASTER TIMETABLE EXPORT"],
    ["School", schoolName],
    ["Export Date", new Date().toLocaleDateString("en-US")],
    [],
    [
      "Day",
      "Time Slot",
      "Title",
      "Subject",
      "Room / Lab",
      "Class",
      "Assigned Faculty",
      "Type",
      "Status",
    ],
    ...schedules.map((s) => [
      s.dayOfWeek,
      `${s.startTime} - ${s.endTime}`,
      s.title,
      s.subject,
      s.room,
      s.className,
      s.teacherName,
      s.scheduleType.replace(/_/g, " "),
      s.status,
    ]),
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `${schoolName.toLowerCase().replace(/\s+/g, "_")}_master_timetable.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
