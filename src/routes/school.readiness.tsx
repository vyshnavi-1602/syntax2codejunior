import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface ReadinessDimension {
  dimension: string;
  value: number;
}
interface ReadinessAction {
  title: string;
  impact: string;
  detail: string;
}

const readinessIndex: Array<ReadinessDimension> = [
  { dimension: "Curriculum Coverage", value: 82 },
  { dimension: "Faculty Readiness", value: 76 },
  { dimension: "Student Engagement", value: 88 },
  { dimension: "Infrastructure & Lab", value: 91 },
  { dimension: "AI Ethics & Safety", value: 84 },
];
const readinessRecommendations: Array<ReadinessAction> = [
  {
    title: "Expand Grade 9 Python curriculum",
    impact: "High",
    detail: "Introduce object-oriented concepts before mid-term.",
  },
  {
    title: "Faculty AI training workshops",
    impact: "Medium",
    detail: "Upskill 8 CS teachers in generative AI classroom tools.",
  },
];

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
  component: ReadinessPage,
});

function ReadinessPage() {
  const overall = Math.round(
    readinessIndex.reduce((n, r) => n + r.value, 0) / readinessIndex.length,
  );

  return (
    <>
      <PageHeader
        title="School AI & Coding Readiness Index"
        subtitle="How prepared Greenfield International is for an AI-first decade"
        actions={
          <button
            onClick={() =>
              toast.success("Readiness report exported", {
                description: "greenfield_readiness_index_2026.pdf",
              })
            }
            className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Download index report
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Overall index"
          value={`${overall}/100`}
          sub="National benchmark 68"
          tone="emerald"
        />
        <Stat label="Percentile" value="Top 18%" sub="Among 148 schools" tone="violet" />
        <Stat label="Strongest" value="Participation" sub="86 · student engagement" tone="sky" />
        <Stat
          label="Priority gap"
          value="Teacher readiness"
          sub="68 · lowest dimension"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Readiness radar" description="Five institutional dimensions">
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

        <Panel title="Dimension scores" description="Benchmarked against comparable schools">
          <div className="space-y-4">
            {readinessIndex.map((r) => (
              <div key={r.dimension}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{r.dimension}</span>
                  <span className="font-semibold text-slate-900">{r.value}</span>
                </div>
                <div className="mt-1.5">
                  <Bar
                    value={r.value}
                    tone={r.value >= 80 ? "emerald" : r.value >= 70 ? "indigo" : "amber"}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Benchmark {r.value > 75 ? "exceeded" : "below"} · peer average{" "}
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
        <div className="grid gap-3 md:grid-cols-2">
          {readinessRecommendations.map((r) => (
            <div key={r.title} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                <Pill tone={r.impact === "High" ? "emerald" : "sky"}>{r.impact} impact</Pill>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{r.detail}</p>
              <button
                onClick={() =>
                  toast.success("Added to the school action plan", { description: r.title })
                }
                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Add to action plan
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
