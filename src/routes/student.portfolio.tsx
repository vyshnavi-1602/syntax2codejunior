/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Globe, Lock, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, Pill, Avatar, Bar } from "@/client/components/app/primitives";

import { cn } from "@/client/lib/utils";
import { getStudentProfileFn, getStudentProjectsFn } from "@/server/api/student";

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
    const profile = await getStudentProfileFn();
    const projects = await getStudentProjectsFn();
    return { ...profile, projects, certificates: [] };
  },
  component: PortfolioPage,
});

function PortfolioPage() {
  const { currentStudent: s, achievements, certificates, projects } = Route.useLoaderData();
  const [publicView, setPublicView] = useState(false);
  const [privacy, setPrivacy] = useState({
    showScore: true,
    showClass: true,
    showCerts: true,
    showClubs: false,
  });
  const featured = projects.filter((p: any) => p.student === s.name || p.featured).slice(0, 3);

  return (
    <>
      <PageHeader
        title="My Portfolio"
        subtitle="A credible, verifiable record of everything you've built."
        actions={
          <>
            <button
              onClick={() => setPublicView((v) => !v)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
                publicView
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <Eye className="h-4 w-4" /> {publicView ? "Public view" : "Private view"}
            </button>
            <button
              onClick={() =>
                toast.success("Share link copied", {
                  description: "s2cjunior.com/p/aarav-sharma-8a",
                })
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Share2 className="h-4 w-4" /> Share portfolio
            </button>
          </>
        }
      />

      <Panel bodyClassName="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar initials="AS" size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Aarav Sharma</h2>
            <p className="text-sm text-slate-500">
              {privacy.showClass
                ? "Grade 8A · Greenfield International School"
                : "Student · Greenfield International School"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="violet">Level {s.level}</Pill>
              {privacy.showScore && <Pill tone="emerald">S2C Score {s.score}</Pill>}
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
        <Panel title="Skills profile" description="Assessed across lessons, practice and projects">
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

        <Panel
          className="lg:col-span-2"
          title="Featured projects"
          description="Curated by you, verified by your teacher"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((p: any) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
                <Pill
                  tone={
                    p.status === "Showcased" ? "teal" : p.status === "Approved" ? "emerald" : "sky"
                  }
                >
                  {p.status}
                </Pill>
                <p className="mt-2.5 text-sm font-semibold text-slate-900">{p.title}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                  {p.brief}
                </p>
                <button
                  onClick={() =>
                    toast("Project preview", { description: `${p.title} · ${p.track}` })
                  }
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  View case study
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Verified credentials
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {privacy.showCerts &&
                certificates.map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">ID {c.credential}</p>
                  </div>
                ))}
              {!privacy.showCerts && (
                <p className="text-xs text-slate-500">
                  Certificates are hidden on your public profile.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Achievements
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

      <Panel
        title="Privacy controls"
        description="You decide what the public version of your portfolio shows"
      >
        <div className="grid gap-3 md:grid-cols-4">
          {(
            [
              ["showScore", "Show S2C Score"],
              ["showClass", "Show class & section"],
              ["showCerts", "Show certificates"],
              ["showClubs", "Show club memberships"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setPrivacy((p) => ({ ...p, [key]: !p[key] }));
                toast(`${label}: ${privacy[key] ? "hidden" : "visible"}`);
              }}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                privacy[key]
                  ? "border-emerald-200 bg-emerald-50/60 text-slate-800"
                  : "border-slate-200 text-slate-500",
              )}
            >
              {label}
              {privacy[key] ? (
                <Globe className="h-4 w-4 text-emerald-600" />
              ) : (
                <Lock className="h-4 w-4 text-slate-400" />
              )}
            </button>
          ))}
        </div>
        {publicView && (
          <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-slate-600">
            You are previewing the public version. Hidden items are removed and only school-verified
            credentials appear.
          </p>
        )}
      </Panel>
    </>
  );
}
