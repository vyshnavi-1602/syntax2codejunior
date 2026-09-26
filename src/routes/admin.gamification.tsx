import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  FilterChips,
  PageHeader,
  Panel,
  Pill,
  Stat,
  type Tone,
} from "@/client/components/app/primitives";

interface BadgeItem {
  id: string;
  name: string;
  tone: Tone;
  criteria: string;
  awarded: number;
}
interface GamificationRule {
  id: string;
  name: string;
  rule: string;
  value: number;
  unit: string;
}
interface LevelThreshold {
  level: number;
  xp: number;
  title: string;
}
interface ScoreWeight {
  id: string;
  label: string;
  action: string;
  value: number;
  weight: number;
}

const badgeLibrary: Array<BadgeItem> = [];
const gamificationRules: Array<GamificationRule> = [];
const levelThresholds: Array<LevelThreshold> = [];
const scoreWeights: Array<ScoreWeight> = [];

export const Route = createFileRoute("/admin/gamification")({
  head: () => ({
    meta: [
      { title: "Gamification Rules · Syntax2Code Platform" },
      {
        name: "description",
        content: "Tune XP rewards, level thresholds, badges and the Syntax2Code Score formula.",
      },
      { property: "og:title", content: "Gamification Rules · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "The motivation engine behind Syntax2Code, fully configurable.",
      },
    ],
  }),
  component: AdminGamification,
});

const tabs = ["XP rewards", "Levels", "Badges", "S2C Score formula"] as const;
const tones: Tone[] = ["amber", "teal", "violet", "sky", "emerald", "rose"];

function AdminGamification() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("XP rewards");
  const [rules, setRules] = useState(gamificationRules);
  const [weights, setWeights] = useState(scoreWeights);
  const [badges, setBadges] = useState(badgeLibrary);
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState({ name: "", criteria: "", tone: "amber" as Tone });

  const total = weights.reduce((n, w) => n + w.value, 0);

  return (
    <>
      <PageHeader
        title="Gamification Rules"
        subtitle="How students earn XP, level up and build their Syntax2Code Score"
        actions={
          <button
            onClick={() =>
              toast.success("Gamification config published to all schools", {
                description: "Applies from the next scoring cycle.",
              })
            }
            className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Publish rules
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="XP rules"
          value={rules.length}
          sub="Active reward triggers"
          tone="violet"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <Stat label="Levels" value="20" sub="Spark to Trailblazer" tone="sky" />
        <Stat
          label="Badges"
          value={badges.length}
          sub={`${badges.reduce((n, b) => n + b.awarded, 0).toLocaleString()} awarded`}
          tone="amber"
        />
        <Stat
          label="Score weights"
          value={`${total}%`}
          sub={total === 100 ? "Balanced" : "Must total 100%"}
          tone={total === 100 ? "emerald" : "rose"}
        />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "XP rewards" && (
        <Panel
          title="XP reward rules"
          description="Drag the sliders to retune how much each action is worth"
        >
          <div className="space-y-5">
            {rules.map((r) => (
              <div key={r.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{r.rule}</span>
                  <span className="font-semibold text-slate-900">
                    {r.value} {r.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={r.value}
                  onChange={(e) =>
                    setRules((l) =>
                      l.map((x) => (x.id === r.id ? { ...x, value: Number(e.target.value) } : x)),
                    )
                  }
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
            ))}
            <button
              onClick={() =>
                toast.success("XP rules saved", {
                  description: rules.map((r) => `${r.rule}: ${r.value}`).join(" · "),
                })
              }
              className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Save XP rules
            </button>
          </div>
        </Panel>
      )}

      {tab === "Levels" && (
        <Panel title="Level progression" description="XP thresholds and level titles">
          <div className="space-y-2.5">
            {levelThresholds.map((l, i) => (
              <div
                key={l.level}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-sm font-semibold text-white">
                  {l.level}
                </div>
                <div className="min-w-32 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{l.title}</p>
                  <p className="text-xs text-slate-500">{l.xp.toLocaleString()} XP required</p>
                </div>
                <div className="w-40">
                  <Bar value={(i + 1) * 16} tone="indigo" />
                </div>
                <button
                  onClick={() =>
                    toast.success(`Level ${l.level} threshold editor opened`, {
                      description: `${l.title} · ${l.xp.toLocaleString()} XP`,
                    })
                  }
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Badges" && (
        <Panel
          title="Badge library"
          description="Criteria-driven achievements students can unlock"
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> Create badge
            </button>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {badges.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
                <Pill tone={b.tone as Tone}>{b.name}</Pill>
                <p className="mt-2.5 text-xs text-slate-600">{b.criteria}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {b.awarded.toLocaleString()} awarded
                </p>
                <button
                  onClick={() => toast.success(`${b.name} criteria editor opened`)}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Edit criteria
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "S2C Score formula" && (
        <Panel
          title="Syntax2Code Score weights"
          description={`Weights must total 100% · currently ${total}%`}
        >
          <div className="space-y-5">
            {weights.map((w) => (
              <div key={w.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{w.label}</span>
                  <span className="font-semibold text-slate-900">{w.value}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={w.value}
                  onChange={(e) =>
                    setWeights((l) =>
                      l.map((x) => (x.id === w.id ? { ...x, value: Number(e.target.value) } : x)),
                    )
                  }
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  total === 100
                    ? toast.success("Score formula saved", {
                        description: "Recalculation scheduled for tonight.",
                      })
                    : toast.error("Weights must total exactly 100%", {
                        description: `Currently ${total}%.`,
                      })
                }
                className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save formula
              </button>
              <button
                onClick={() => setWeights(scoreWeights)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50"
              >
                Reset to default
              </button>
              <Pill tone={total === 100 ? "emerald" : "amber"}>Total {total}%</Pill>
            </div>
          </div>
        </Panel>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">Create a badge</h3>
            <input
              value={badge.name}
              onChange={(e) => setBadge({ ...badge, name: e.target.value })}
              placeholder="Badge name"
              className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
            <input
              value={badge.criteria}
              onChange={(e) => setBadge({ ...badge, criteria: e.target.value })}
              placeholder="Unlock criteria"
              className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">Colour</p>
              <FilterChips
                options={tones}
                value={badge.tone}
                onChange={(v) => setBadge({ ...badge, tone: v })}
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
                  setBadges((l) => [
                    ...l,
                    {
                      id: `b-${Date.now()}`,
                      name: badge.name || "New Badge",
                      criteria: badge.criteria || "Criteria to be defined",
                      tone: badge.tone,
                      awarded: 0,
                    },
                  ]);
                  setOpen(false);
                  setBadge({ name: "", criteria: "", tone: "amber" });
                  toast.success("Badge created", { description: badge.name || "New Badge" });
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create badge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
