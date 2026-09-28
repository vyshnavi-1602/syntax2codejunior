import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { getSchoolOverviewFn } from "@/api/school.server";
import {
  generateSchoolReportHtml,
  printIsolatedHtml,
  SchoolReportData,
} from "@/client/lib/school-reports";

export const Route = createFileRoute("/school/readiness")({
  head: () => ({
    meta: [
      { title: "AI & Coding Readiness Index · Syntax2Code" },
      {
        name: "description",
        content:
          "A multi-dimensional readiness score for your school with strategic recommendations.",
      },
      { property: "og:title", content: "AI & Coding Readiness Index · Syntax2Code" },
      {
        property: "og:description",
        content: "Benchmark your institution's AI and coding readiness.",
      },
    ],
  }),
  loader: async () => {
    return await getSchoolOverviewFn();
  },
  component: ReadinessPage,
});

function ReadinessPage() {
  const { school, readinessIndex, schoolKpis, classes } = Route.useLoaderData();

  const overall = Math.round(
    readinessIndex.reduce((n, r) => n + r.value, 0) / (readinessIndex.length || 1),
  );

  const strongest = [...readinessIndex].sort((a, b) => b.value - a.value)[0];
  const lowest = [...readinessIndex].sort((a, b) => a.value - b.value)[0];

  const handleDownloadReport = () => {
    const reportData: SchoolReportData = {
      school,
      schoolKpis,
      classes: classes || [],
      readinessIndex,
    };
    const html = generateSchoolReportHtml("readiness-audit", reportData);
    printIsolatedHtml(html);
    toast.success("Readiness Audit Report compiled", {
      description: "Select 'Save as PDF' or print from the dialog.",
    });
  };

  const recommendations = [
    {
      title: "Expand Grade 9 & 10 Python and AI curriculum",
      impact: "High",
      detail: `Current completion is at ${schoolKpis.curriculum}%. Introduce object-oriented programming and AI model training before end-of-term assessments.`,
    },
    {
      title: "Faculty Generative AI & Classroom Tooling Workshop",
      impact: "Medium",
      detail:
        "Empower computer science teachers to leverage automated sandbox feedback and project rubric evaluations.",
    },
    {
      title: "Student Coding Competition & Hackathon Participation",
      impact: "High",
      detail:
        "Incentivize top performing students in accelerated tracks to represent the school in the upcoming regional coding challenge.",
    },
    {
      title: "Targeted Remedial Support for Foundation Classes",
      impact: "Medium",
      detail:
        "Set up peer coding circles and interactive practice sessions for students with low weekly streaks.",
    },
  ];

  return (
    <>
      <PageHeader
        title="School AI & Coding Readiness Index"
        subtitle={`Institutional readiness benchmark for ${school.name || "Global Tech High"} · Academic Year 2026-2027`}
        actions={
          <button
            onClick={handleDownloadReport}
            className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Download index report
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Overall index"
          value={`${overall}/100`}
          sub="National benchmark: 68"
          tone="emerald"
        />
        <Stat
          label="Institutional ranking"
          value="Top 15%"
          sub="Among regional partner schools"
          tone="violet"
        />
        <Stat
          label="Strongest dimension"
          value={strongest?.dimension || "Digital Literacy"}
          sub={`${strongest?.value || 88}/100 score`}
          tone="sky"
        />
        <Stat
          label="Priority focus area"
          value={lowest?.dimension || "Syntax Proficiency"}
          sub={`${lowest?.value || 60}/100 score`}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Readiness radar" description="Multi-dimensional competency assessment">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={readinessIndex} outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Radar dataKey="value" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Dimension scores" description="Benchmarked against national standards">
          <div className="space-y-4">
            {readinessIndex.map((r) => (
              <div key={r.dimension}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{r.dimension}</span>
                  <span className="font-semibold text-slate-900">{r.value}/100</span>
                </div>
                <div className="mt-1.5">
                  <Bar
                    value={r.value}
                    tone={r.value >= 80 ? "emerald" : r.value >= 70 ? "indigo" : "amber"}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {r.value >= 75 ? "Exceeds benchmark" : "Approaching benchmark"} · peer average{" "}
                  {Math.max(50, r.value - 6)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Strategic recommendations"
        description="Ranked by projected institutional impact"
      >
        <div className="grid gap-3.5 md:grid-cols-2">
          {recommendations.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                <Pill tone={r.impact === "High" ? "emerald" : "sky"}>{r.impact} impact</Pill>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{r.detail}</p>
              <button
                onClick={() =>
                  toast.success("Added to institutional action plan", { description: r.title })
                }
                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Add to action plan →
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
