/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Globe, Lock, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { PageHeader, Panel, Pill, Avatar, Bar } from "@/client/components/app/primitives";

import { cn } from "@/client/lib/utils";
import { getStudentProfileFn, getStudentProjectsFn } from "@/api/student.server";

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
  const featured = projects.filter((p: any) => p.student === s.name || p.featured).slice(0, 3);

  return (
    <>
      <PageHeader
        title="My Portfolio"
        subtitle="A credible, verifiable record of everything you've built."
        actions={
          <>
            <button
              onClick={() =>
                toast.success("Share link copied", {
                  description: `s2cjunior.com/p/${s.name.toLowerCase().replace(/\s+/g, "-")}-8a`,
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
          <Avatar initials={s.name.substring(0, 2).toUpperCase()} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{s.name}</h2>
            <p className="text-sm text-slate-500">
              {s.gradeName ? `Grade ${s.gradeName} · ` : ""}
              {s.schoolName}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="violet">Level {s.level}</Pill>
              <Pill tone="emerald">S2C Score {s.score}</Pill>
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
              {certificates.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-900">{c.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">ID {c.credential}</p>
                </div>
              ))}
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
    </>
  );
}
