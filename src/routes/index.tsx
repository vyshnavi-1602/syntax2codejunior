import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

const roleHome: any = [];
import { useSession } from "@/client/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syntax2Code — AI & Coding Platform for Schools" },
      {
        name: "description",
        content:
          "Syntax2Code gives schools a complete AI and coding curriculum with student portals, teacher analytics and institutional readiness scoring.",
      },
      { property: "og:title", content: "Syntax2Code — AI & Coding Platform for Schools" },
      {
        property: "og:description",
        content:
          "Learning paths, coding labs, competitions, certificates and school-wide analytics for Grades 6-10.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { role, ready } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    navigate({ to: role ? roleHome[role] : "/login", replace: true });
  }, [ready, role, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 font-bold text-white">
          S2
        </span>
        <p className="mt-4 text-sm text-slate-500">Loading Syntax2Code…</p>
      </div>
    </div>
  );
}
