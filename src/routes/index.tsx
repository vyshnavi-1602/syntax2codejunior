import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/client/lib/session";
import { ChevronRight, GraduationCap, Users, School, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syntax2Code — AI & Coding Platform for Schools" },
      {
        name: "description",
        content:
          "Syntax2Code gives schools a complete AI and coding curriculum with student portals, teacher analytics and institutional readiness scoring.",
      },
    ],
  }),
  component: Index,
});

const roles = [
  {
    id: "student",
    title: "Sign in as Student",
    desc: "Access your coding labs, projects, and portfolio",
    icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    id: "teacher",
    title: "Sign in as Teacher",
    desc: "Grade assignments, view analytics, and manage classes",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    id: "school",
    title: "Sign in as School Admin",
    desc: "Monitor school readiness and teacher performance",
    icon: School,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "admin",
    title: "Sign in as S2C Admin",
    desc: "Platform administration and curriculum management",
    icon: LayoutDashboard,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

function Index() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-teal-500 text-xl font-bold text-white shadow-xl shadow-indigo-200">
            S2
          </span>
          <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Welcome to Syntax2Code
          </h1>
          <p className="mt-2 text-slate-500">Select your portal to continue to the login screen.</p>
        </div>

        <div className="grid gap-3">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                navigate({ to: "/login", search: { role: r.id } });
              }}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.bg} ${r.color}`}
              >
                <r.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {r.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
