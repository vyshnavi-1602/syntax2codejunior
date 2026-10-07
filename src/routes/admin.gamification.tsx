import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Sparkles, CheckCircle2, RotateCcw, Sliders, Trophy, Flame } from "lucide-react";
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
import { getAdminGamificationFn } from "@/api/admin.server";

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
  loader: async () => {
    return await getAdminGamificationFn();
  },
  component: AdminGamification,
});

const tabs = ["XP rewards", "Levels", "Badges", "S2C Score formula"] as const;
const tones: Tone[] = ["amber", "teal", "violet", "sky", "emerald", "rose"];

const PROFILES = [
  {
    name: "Balanced Growth (Default)",
    desc: "Equally rewards steady curriculum progress, tests, and daily streaks",
    rules: [
      { id: "lesson", value: 50 },
      { id: "quiz", value: 20 },
      { id: "streak", value: 100 },
      { id: "project", value: 200 },
    ],
  },
  {
    name: "Competitive Tournament Focus",
    desc: "Higher multipliers for hackathons, speed rounds, and inter-school leaderboards",
    rules: [
      { id: "lesson", value: 35 },
      { id: "quiz", value: 30 },
      { id: "streak", value: 80 },
      { id: "project", value: 350 },
    ],
  },
  {
    name: "Elementary Quick-Wins",
    desc: "Accelerated positive reinforcement for beginners and younger grades",
    rules: [
      { id: "lesson", value: 75 },
      { id: "quiz", value: 40 },
      { id: "streak", value: 150 },
      { id: "project", value: 250 },
    ],
  },
];

function AdminGamification() {
  const {
    rules: initialRules,
    levelThresholds: initialLevels,
    badgeLibrary: initialBadges,
    scoreWeights: initialWeights,
  } = Route.useLoaderData();

  const [tab, setTab] = useState<(typeof tabs)[number]>("XP rewards");
  const [rules, setRules] = useState<GamificationRule[]>(initialRules);
  const [weights, setWeights] = useState<ScoreWeight[]>(initialWeights);
  const [badges, setBadges] = useState<BadgeItem[]>(initialBadges);
  const [levels, setLevels] = useState<LevelThreshold[]>(initialLevels);

  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState({ name: "", criteria: "", tone: "amber" as Tone });

  // Level Edit modal
  const [editingLevel, setEditingLevel] = useState<LevelThreshold | null>(null);
  const [levelForm, setLevelForm] = useState({ title: "", xp: 0 });

  // Load persisted gamification data
  useEffect(() => {
    try {
      const savedRules = localStorage.getItem("s2c_admin_gamification_rules");
      if (savedRules) setRules(JSON.parse(savedRules));

      const savedWeights = localStorage.getItem("s2c_admin_gamification_weights");
      if (savedWeights) setWeights(JSON.parse(savedWeights));

      const savedBadges = localStorage.getItem("s2c_admin_gamification_badges");
      if (savedBadges) setBadges(JSON.parse(savedBadges));
    } catch {
      // ignore
    }
  }, []);

  const total = weights.reduce((n, w) => n + w.value, 0);

  const handlePublishAll = () => {
    try {
      localStorage.setItem("s2c_admin_gamification_rules", JSON.stringify(rules));
      localStorage.setItem("s2c_admin_gamification_weights", JSON.stringify(weights));
      localStorage.setItem("s2c_admin_gamification_badges", JSON.stringify(badges));
    } catch {
      // ignore
    }
    toast.success("Gamification engine rules published live to all 148 schools", {
      description: "Updated XP triggers, levels, and weight formulas are active.",
    });
  };

  const handleApplyProfile = (prof: (typeof PROFILES)[number]) => {
    setRules((prev) =>
      prev.map((r) => {
        const found = prof.rules.find((pr) => pr.id === r.id);
        return found ? { ...r, value: found.value } : r;
      }),
    );
    toast.success(`Applied ${prof.name} profile!`);
  };

  const handleSaveLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;
    setLevels((prev) =>
      prev.map((l) =>
        l.level === editingLevel.level ? { ...l, title: levelForm.title, xp: levelForm.xp } : l,
      ),
    );
    toast.success(`Level ${editingLevel.level} threshold updated`);
    setEditingLevel(null);
  };

  return (
    <>
      <PageHeader
        title="Gamification Rules"
        subtitle="How students earn XP, level up and build their Syntax2Code Score"
        actions={
          <button
            onClick={handlePublishAll}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4" /> Publish rules
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
          icon={<Trophy className="h-4 w-4" />}
        />
        <Stat
          label="Score weights"
          value={`${total}%`}
          sub={total === 100 ? "Balanced formula" : "Must total 100%"}
          tone={total === 100 ? "emerald" : "rose"}
        />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "XP rewards" && (
        <div className="space-y-6">
          {/* Motivation Profiles */}
          <Panel
            title="Motivation Profiles"
            description="Select a pre-calibrated motivation model for your network"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {PROFILES.map((prof) => (
                <button
                  key={prof.name}
                  type="button"
                  onClick={() => handleApplyProfile(prof)}
                  className="flex flex-col items-start justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-amber-500" />
                      <p className="text-xs font-semibold text-slate-900">{prof.name}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{prof.desc}</p>
                  </div>
                  <span className="mt-3 text-[10px] font-semibold text-indigo-600">
                    Apply Profile →
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title="XP reward rules"
            description="Drag the sliders to retune how much each action is worth in real time"
            action={
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("s2c_admin_gamification_rules", JSON.stringify(rules));
                  } catch {
                    // ignore
                  }
                  toast.success("XP rules saved successfully");
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Save Rules
              </button>
            }
          >
            <div className="space-y-5">
              {rules.map((r) => (
                <div key={r.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium">{r.rule}</span>
                    <span className="font-semibold text-slate-900 font-mono">
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
            </div>
          </Panel>
        </div>
      )}

      {tab === "Levels" && (
        <Panel title="Level progression" description="XP thresholds and tier titles">
          <div className="space-y-2.5">
            {levels.map((l, i) => (
              <div
                key={l.level}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-sm font-semibold text-white shadow-xs">
                  {l.level}
                </div>
                <div className="min-w-32 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{l.title}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {l.xp.toLocaleString()} XP required
                  </p>
                </div>
                <div className="w-40 hidden sm:block">
                  <Bar value={Math.min(100, (i + 1) * 16)} tone="indigo" />
                </div>
                <button
                  onClick={() => {
                    setEditingLevel(l);
                    setLevelForm({ title: l.title, xp: l.xp });
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
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
          description="Triggers that unlock commemorative digital badges"
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> Create badge
            </button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Pill tone={b.tone}>{b.name}</Pill>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {b.awarded.toLocaleString()} awarded
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{b.criteria}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "S2C Score formula" && (
        <Panel
          title="Syntax2Code Score formula"
          description={`Weights must total 100% · currently ${total}%`}
        >
          <div className="space-y-5">
            {weights.map((w) => (
              <div key={w.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">{w.label}</span>
                  <span className="font-semibold text-slate-900 font-mono">{w.value}%</span>
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
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (total === 100) {
                    try {
                      localStorage.setItem(
                        "s2c_admin_gamification_weights",
                        JSON.stringify(weights),
                      );
                    } catch {
                      // ignore
                    }
                    toast.success("Score formula saved & balanced", {
                      description: "Recalculation scheduled across all schools tonight.",
                    });
                  } else {
                    toast.error("Weights must total exactly 100%", {
                      description: `Currently ${total}%.`,
                    });
                  }
                }}
                className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Save formula
              </button>
              <button
                onClick={() => setWeights(initialWeights)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-xs hover:bg-slate-50"
              >
                Reset to default
              </button>
              <Pill tone={total === 100 ? "emerald" : "amber"}>Total {total}%</Pill>
            </div>
          </div>
        </Panel>
      )}

      {/* Edit Level Modal */}
      {editingLevel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setEditingLevel(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Edit Level {editingLevel.level} Threshold
            </h3>
            <form onSubmit={handleSaveLevel} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Tier Title</label>
                <input
                  required
                  value={levelForm.title}
                  onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">XP Required</label>
                <input
                  type="number"
                  required
                  value={levelForm.xp}
                  onChange={(e) => setLevelForm({ ...levelForm, xp: Number(e.target.value) })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLevel(null)}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Badge Modal */}
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
              className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
            />
            <input
              value={badge.criteria}
              onChange={(e) => setBadge({ ...badge, criteria: e.target.value })}
              placeholder="Unlock criteria"
              className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
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
                  const newBadgeItem: BadgeItem = {
                    id: `b-${Date.now()}`,
                    name: badge.name || "New Badge",
                    criteria: badge.criteria || "Criteria to be defined",
                    tone: badge.tone,
                    awarded: 0,
                  };
                  const updated = [...badges, newBadgeItem];
                  setBadges(updated);
                  try {
                    localStorage.setItem("s2c_admin_gamification_badges", JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
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
