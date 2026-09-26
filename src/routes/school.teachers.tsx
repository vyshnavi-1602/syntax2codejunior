import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Bar, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface SchoolTeacher {
  id: string;
  name: string;
  subject: string;
  students: number;
  email: string;
  classes: string[];
  readiness: number;
  active: boolean;
}
const teachers: Array<SchoolTeacher> = [];
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/school/teachers")({
  head: () => ({
    meta: [
      { title: "Teacher Management · Syntax2Code" },
      {
        name: "description",
        content: "Manage faculty, class allocations, readiness scores and platform access.",
      },
      { property: "og:title", content: "Teacher Management · Syntax2Code" },
      { property: "og:description", content: "Faculty readiness and class allocation management." },
    ],
  }),
  component: SchoolTeachers,
});

function SchoolTeachers() {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(teachers.map((t) => [t.id, t.active])),
  );
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <>
      <PageHeader
        title="Teacher Management"
        subtitle="14 faculty members onboarded · 4 leading S2C classes"
        actions={
          <button
            onClick={() => setInvite(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Invite teacher
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Faculty on platform" value="14" sub="4 active this week" tone="sky" />
        <Stat label="Avg readiness" value="80%" sub="Target: 85%" tone="emerald" />
        <Stat label="Classes covered" value="6" sub="Grades 6 to 10" tone="violet" />
        <Stat label="Enablement due" value="1" sub="Mr. Arun Pillai" tone="amber" />
      </div>

      <Panel
        title="Faculty"
        description="Readiness is based on training completion, class activity and review turnaround"
      >
        <div className="space-y-3">
          {teachers.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    {t.subject} · {t.students} students · {t.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.classes.map((c) => (
                      <Pill key={c} tone="sky">
                        {c}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-36">
                    <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                      <span>Readiness</span>
                      <span>{t.readiness}%</span>
                    </div>
                    <Bar
                      value={t.readiness}
                      tone={t.readiness >= 85 ? "emerald" : t.readiness >= 70 ? "indigo" : "amber"}
                    />
                  </div>
                  <button
                    onClick={() =>
                      toast.success(`Enablement track assigned to ${t.name}`, {
                        description: "3-week mentor-led programme.",
                      })
                    }
                    className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Assign training
                  </button>
                  <button
                    onClick={() => {
                      setActive((a) => ({ ...a, [t.id]: !a[t.id] }));
                      toast(`${t.name} ${active[t.id] ? "deactivated" : "activated"}`);
                    }}
                    className={cn(
                      "h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors",
                      active[t.id] ? "bg-emerald-500" : "bg-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-4 w-4 rounded-full bg-white transition-transform",
                        active[t.id] && "translate-x-4",
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {invite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setInvite(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Invite a teacher</h3>
            <p className="mt-1 text-xs text-slate-500">
              They'll receive setup instructions and an onboarding track.
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@greenfield.edu.in"
              className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setInvite(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setInvite(false);
                  toast.success("Invitation sent", {
                    description: email || "teacher@greenfield.edu.in",
                  });
                  setEmail("");
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
