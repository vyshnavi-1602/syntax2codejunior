import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface CompItem {
  id: string;
  name: string;
  status: string;
  participants: number;
  schools: number;
  level: string;
  date: string;
  registered?: boolean;
  prize?: string;
  rounds: Array<{
    name: string;
    date: string;
    type?: string;
    status?: string;
    state?: string;
    score?: string;
  }>;
}
interface CompLeaderboardItem {
  rank: number;
  name: string;
  school: string;
  score: number;
}
const compLeaderboard: Array<CompLeaderboardItem> = [];
const competitions: Array<CompItem> = [];
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/admin/competitions")({
  head: () => ({
    meta: [
      { title: "Competition Manager · Syntax2Code Platform" },
      {
        name: "description",
        content:
          "Create tournaments, configure rounds and prize pools, track enrollments and publish results.",
      },
      { property: "og:title", content: "Competition Manager · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Run national tournaments like Syntax2Code Genesis end to end.",
      },
    ],
  }),
  component: AdminCompetitions,
});

type Comp = (typeof competitions)[number] & { prize?: string };

function AdminCompetitions() {
  const [list, setList] = useState<Comp[]>(
    competitions.map((c) => ({
      ...c,
      prize: c.id === "genesis-2026" ? "₹12,00,000" : c.id === "ai-cup" ? "₹3,50,000" : "₹50,000",
    })),
  );
  const [sel, setSel] = useState(list[0]!.id);
  const [tab, setTab] = useState<"Rounds" | "Enrollments" | "Results">("Rounds");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    level: "National",
    date: "12 Jan 2027",
    prize: "₹5,00,000",
  });

  const comp = list.find((c) => c.id === sel)!;

  return (
    <>
      <PageHeader
        title="Competition Manager"
        subtitle="Tournaments, rounds, prize pools and result publishing"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New competition
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active tournaments"
          value={list.filter((c) => c.status !== "Closed").length}
          sub="Across all levels"
          tone="violet"
          icon={<Trophy className="h-4 w-4" />}
        />
        <Stat
          label="Total participants"
          value={list.reduce((n, c) => n + c.participants, 0).toLocaleString()}
          sub="This season"
          tone="sky"
        />
        <Stat
          label="Schools enrolled"
          value={list[0]!.schools}
          sub="In Genesis 2026"
          tone="emerald"
        />
        <Stat label="Prize pool" value="₹15.9L" sub="Committed for 2026" tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Panel title="Tournaments">
          <div className="space-y-1.5">
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => setSel(c.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                  sel === c.id
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 hover:bg-slate-50",
                )}
              >
                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Pill
                    tone={
                      c.status === "Closed" ? "slate" : c.status === "Upcoming" ? "sky" : "emerald"
                    }
                  >
                    {c.status}
                  </Pill>
                  <span className="text-[11px] text-slate-400">{c.level}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel
            title={comp.name}
            description={`${comp.level} · ${comp.date} · ${comp.participants.toLocaleString()} participants · prize pool ${comp.prize}`}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    toast.success(`${comp.name} results published`, {
                      description: "Certificates queued for all finalists.",
                    })
                  }
                  className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Publish results
                </button>
                <button
                  onClick={() => {
                    setList((l) =>
                      l.map((c) =>
                        c.id === comp.id
                          ? { ...c, status: c.status === "Closed" ? "Registration open" : "Closed" }
                          : c,
                      ),
                    );
                    toast(
                      comp.status === "Closed" ? "Registration reopened" : "Registration closed",
                    );
                  }}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {comp.status === "Closed" ? "Reopen" : "Close registration"}
                </button>
              </div>
            }
          >
            <FilterChips
              options={["Rounds", "Enrollments", "Results"] as const}
              value={tab}
              onChange={setTab}
            />

            {tab === "Rounds" && (
              <div className="mt-4 space-y-2.5">
                {comp.rounds.map((r) => (
                  <div
                    key={r.name}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill
                        tone={
                          r.state === "Live" ? "emerald" : r.state === "Completed" ? "slate" : "sky"
                        }
                      >
                        {r.state}
                      </Pill>
                      <button
                        onClick={() =>
                          toast.success(`${r.name} configuration opened`, {
                            description: "Problem set, timing and scoring weights.",
                          })
                        }
                        className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    toast.success("Round added", {
                      description: `${comp.name} · configure dates and problem set.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add round
                </button>
              </div>
            )}

            {tab === "Enrollments" && (
              <div className="mt-4 space-y-2.5">
                {[
                  "Greenfield International School",
                  "Bluewood Academy",
                  "Northstar Public School",
                  "Sunrise Global School",
                  "St. Xavier's Junior",
                ].map((s, i) => (
                  <div
                    key={s}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s}</p>
                      <p className="text-xs text-slate-500">
                        {[318, 412, 289, 164, 97][i]} students registered
                      </p>
                    </div>
                    <button
                      onClick={() => toast.success(`Entry approved for ${s}`)}
                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Approve entry
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === "Results" && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                    <tr>
                      {["Rank", "Student", "School", "Score", ""].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compLeaderboard.map((r) => (
                      <tr key={r.rank} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">#{r.rank}</td>
                        <td className="px-4 py-3 text-slate-700">{r.name}</td>
                        <td className="px-4 py-3 text-slate-500">{r.school}</td>
                        <td className="px-4 py-3 text-slate-700">{r.score}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              toast.success(`Certificate issued to ${r.name}`, {
                                description: "Competition Finalist — Gold",
                              })
                            }
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            Issue certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">New competition</h3>
            <div className="mt-4 grid gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Competition name"
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {["School", "City", "State", "National"].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="Start date"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <input
                value={form.prize}
                onChange={(e) => setForm({ ...form, prize: e.target.value })}
                placeholder="Prize pool"
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = form.name || "Untitled Competition";
                  const id = `comp-${Date.now()}`;
                  setList((l) => [
                    {
                      id,
                      name,
                      status: "Upcoming",
                      level: form.level,
                      date: form.date,
                      participants: 0,
                      schools: 0,
                      registered: false,
                      prize: form.prize,
                      rounds: [
                        { name: "Qualifier", date: form.date, state: "Upcoming", score: "—" },
                      ],
                    },
                    ...l,
                  ]);
                  setSel(id);
                  setOpen(false);
                  setForm({ ...form, name: "" });
                  toast.success(`${name} created`, {
                    description: `${form.level} · prize pool ${form.prize}`,
                  });
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create competition
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
