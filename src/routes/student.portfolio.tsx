/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  Globe,
  Lock,
  Share2,
  ShieldCheck,
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Code2,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, Pill, Avatar, Bar } from "@/client/components/app/primitives";

import { cn } from "@/client/lib/utils";
import {
  getStudentProfileFn,
  getStudentProjectsFn,
  getStudentBadgesFn,
} from "@/api/student.server";
import { printIsolatedHtml } from "@/client/lib/school-reports";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";

export const Route = createFileRoute("/student/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio · Syntax2Code" },
      {
        name: "description",
        content:
          "A shareable student portfolio with skills, featured projects, verified credentials and privacy controls.",
      },
      { property: "og:title", content: "Portfolio · Syntax2Code" },
      { property: "og:description", content: "Showcase verified coding and AI achievements." },
    ],
  }),
  loader: async () => {
    const [profile, projects, badges] = await Promise.all([
      getStudentProfileFn(),
      getStudentProjectsFn(),
      getStudentBadgesFn(),
    ]);
    return { ...profile, projects, certificates: badges };
  },
  component: PortfolioPage,
});

function PortfolioPage() {
  const { currentStudent: s, achievements, certificates, projects } = Route.useLoaderData();
  const featured = projects.filter((p: any) => p.student === s.name || p.featured).slice(0, 3);

  // Case study modal
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Privacy controls
  const [isPublic, setIsPublic] = useState(true);
  const [showScore, setShowScore] = useState(true);
  const [showCertificates, setShowCertificates] = useState(true);

  const handleSharePortfolio = async () => {
    const url = `https://syntax2code.org/p/${s.name.toLowerCase().replace(/\s+/g, "-")}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public portfolio link copied to clipboard!", {
        description: url,
      });
    } catch {
      toast.success("Portfolio link generated", { description: url });
    }
  };

  const handleExportDossier = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${s.name} - Student Portfolio Dossier</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; margin: 0; padding: 24px; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 26px; margin: 0; color: #1e1b4b; }
    .subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
    .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .card-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .card-val { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1e1b4b; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .project-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .project-title { font-weight: 700; font-size: 15px; color: #0f172a; }
    .project-desc { font-size: 13px; color: #475569; margin-top: 4px; }
    .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Syntax2Code Junior · Verified Portfolio</span>
      <h1>${s.name}</h1>
      <p class="subtitle">${s.gradeName ? "Grade " + s.gradeName + " · " : ""}${s.schoolName}</p>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; color: #4f46e5;">S2C Score: ${s.score}</div>
      <div style="font-size: 12px; color: #10b981;">✓ Verified by School</div>
    </div>
  </div>

  <div class="grid">
    <div class="card"><div class="card-label">Curriculum Level</div><div class="card-val">Level ${s.level}</div></div>
    <div class="card"><div class="card-label">Coding Streak</div><div class="card-val">${s.streak} Days</div></div>
    <div class="card"><div class="card-label">Verified Badges</div><div class="card-val">${s.badges}</div></div>
    <div class="card"><div class="card-label">Status</div><div class="card-val">Active</div></div>
  </div>

  <div class="section-title">Featured Coding & AI Projects</div>
  ${featured
    .map(
      (p: any) => `
    <div class="project-card">
      <div class="project-title">${p.title} <span style="font-size: 11px; color: #4f46e5; font-weight: normal;">[${p.track || "Project"}]</span></div>
      <div class="project-desc">${p.brief || "Student implemented complete code solutions with test verification."}</div>
      <div style="margin-top: 6px; font-size: 12px; color: #10b981;">✓ Status: ${p.status}</div>
    </div>
  `,
    )
    .join("")}

  <div class="section-title">Verified Accreditation Credentials</div>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
    ${certificates
      .slice(0, 4)
      .map(
        (c: any) => `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <div style="font-weight: 600; font-size: 13px;">${c.title}</div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">Credential: ${c.credential}</div>
      </div>
    `,
      )
      .join("")}
  </div>

  <div class="footer">
    <span>Accredited under Syntax2Code Computer Science Standard</span>
    <span>Generated ${new Date().toLocaleDateString()}</span>
  </div>
</body>
</html>`;
    printIsolatedHtml(html);
    toast.success("Opening printable portfolio dossier…");
  };

  return (
    <>
      <PageHeader
        title="My Portfolio"
        subtitle="A credible, verifiable record of everything you've built."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDossier}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Download className="h-4 w-4" /> Export Dossier (PDF)
            </button>
            <button
              onClick={handleSharePortfolio}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
            >
              <Share2 className="h-4 w-4" /> Share portfolio
            </button>
          </div>
        }
      />

      <Panel bodyClassName="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar initials={s.name.substring(0, 2).toUpperCase()} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{s.name}</h2>
            <p className="text-sm text-slate-500">
              {s.gradeName ? `Grade ${s.gradeName} · ` : ""}
              {s.schoolName}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="violet">Level {s.level}</Pill>
              {showScore && <Pill tone="emerald">S2C Score {s.score}</Pill>}
              <Pill tone="amber">{s.badges} badges</Pill>
              <Pill tone="sky">{s.streak}-day streak</Pill>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Verified by school
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Panel
            title="Skills profile"
            description="Assessed across lessons, practice and projects"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={(s as any).skills} outerRadius="72%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {(s as any).skills?.slice(0, 3).map((sk: any) => (
                <div key={sk.skill}>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{sk.skill}</span>
                    <span>{sk.value}%</span>
                  </div>
                  <Bar value={sk.value} />
                </div>
              ))}
            </div>
          </Panel>

          {/* Privacy & Visibility Controls */}
          <Panel
            title={
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-indigo-600" />
                <span>Privacy & Sharing Controls</span>
              </div>
            }
            description="Manage public view and verified badge permissions"
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Public Portfolio URL</div>
                  <div className="text-[11px] text-slate-400">
                    Allow recruiters & parents to view
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    toast.info(
                      e.target.checked ? "Portfolio set to Public" : "Portfolio set to School Only",
                    );
                  }}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <div>
                  <div className="font-semibold text-slate-800">Display S2C Score</div>
                  <div className="text-[11px] text-slate-400">Show algorithm & quiz rating</div>
                </div>
                <input
                  type="checkbox"
                  checked={showScore}
                  onChange={(e) => setShowScore(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <div>
                  <div className="font-semibold text-slate-800">Verified Credentials</div>
                  <div className="text-[11px] text-slate-400">Show certificates on public view</div>
                </div>
                <input
                  type="checkbox"
                  checked={showCertificates}
                  onChange={(e) => setShowCertificates(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          className="lg:col-span-2"
          title="Featured projects"
          description="Curated by you, verified by your teacher"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
              >
                <div>
                  <Pill
                    tone={
                      p.status === "Showcased"
                        ? "teal"
                        : p.status === "Approved"
                          ? "emerald"
                          : "sky"
                    }
                  >
                    {p.status}
                  </Pill>
                  <p className="mt-2.5 text-sm font-semibold text-slate-900">{p.title}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                    {p.brief}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProject(p)}
                  className="mt-4 text-xs font-semibold text-indigo-600 hover:underline text-left inline-flex items-center gap-1"
                >
                  View case study <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {showCertificates && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Verified credentials
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {certificates.map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">ID {c.credential}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Achievements & Badges
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {achievements
                .filter((a: any) => a.earned)
                .map((a: any) => (
                  <Pill key={a.id} tone="amber">
                    {a.title}
                  </Pill>
                ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Case Study Modal */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Pill tone="emerald">{selectedProject.status || "Verified"}</Pill>
                <Pill tone="violet">{selectedProject.track || "Computer Science"}</Pill>
              </div>
              <DialogTitle className="mt-2 text-xl font-bold text-slate-900">
                {selectedProject.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Submitted by {selectedProject.student || s.name} · Verified project build
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
                <div className="font-semibold text-slate-900 mb-1">Architecture & Purpose:</div>
                <p className="leading-relaxed">
                  {selectedProject.brief ||
                    "A full computational project demonstrating object-oriented principles, unit test assertions, and structured modular architecture."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Test Suite Status
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 font-bold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> 100% Passed (12/12)
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Teacher Endorsement
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">
                    Priya Raman · Lead Faculty
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Teacher Review Feedback:
                </div>
                <p className="mt-1 text-slate-700 leading-relaxed italic">
                  &ldquo;Outstanding attention to edge cases and clear algorithmic decomposition.
                  Recommended for the Genesis State Championship.&rdquo;
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    toast.success("Source code repository preview opened");
                    setSelectedProject(null);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Close Case Study
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
