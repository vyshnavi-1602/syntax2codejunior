import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Medal,
  Trophy,
  Users,
  Search,
  CheckCircle2,
  Send,
  ExternalLink,
  Code2,
  Calendar,
  Sparkles,
  Play,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  FilterChips,
  PageHeader,
  Panel,
  Pill,
  Stat,
  type Tone,
} from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";

import { useSession } from "@/client/lib/auth-client";
import { getStudentAnnouncementsFn } from "@/api/student.server";

export const Route = createFileRoute("/student/compete")({
  head: () => ({
    meta: [
      { title: "Compete · Syntax2Code" },
      {
        name: "description",
        content:
          "Register for tournaments, track rounds and follow the live inter-school leaderboard.",
      },
      { property: "og:title", content: "Compete · Syntax2Code" },
      {
        property: "og:description",
        content: "Tournaments, rounds and live leaderboards for junior coders.",
      },
    ],
  }),
  loader: async () => {
    return await getStudentAnnouncementsFn();
  },
  component: CompetePage,
});

interface SubmissionRecord {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roundName: string;
  projectTitle: string;
  repoUrl: string;
  language: string;
  score: string;
  submittedAt: string;
  status: "Under Review" | "Evaluated" | "Top 10 Finalist";
}

const filters = ["All tournaments", "Registration open", "Live rounds", "My Submissions"] as const;

function CompetePage() {
  const { data: session } = useSession();
  const loaderData = Route.useLoaderData();
  const competitions = loaderData?.competitions || [];
  const compLeaderboard = loaderData?.leaderboard || [];

  const [activeTab, setActiveTab] = useState<(typeof filters)[number]>("All tournaments");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(competitions[0]?.id || null);
  const [registered, setRegistered] = useState<string[]>(
    competitions.filter((c) => c.registered).map((c) => c.id),
  );

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([
    {
      id: "sub-101",
      tournamentId: "genesis-2026",
      tournamentName: "Genesis Junior Coding Championship 2026",
      roundName: "Round 1: Speed Coding",
      projectTitle: "Algorithmic Prime Sieve & Math Explorer",
      repoUrl: "https://github.com/syntax2code/prime-speed-solver",
      language: "Python 3.12",
      score: "48/50",
      submittedAt: "2 days ago",
      status: "Evaluated",
    },
  ]);

  // Submission modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<{ tournament: string; round: string } | null>(
    null,
  );
  const [subForm, setSubForm] = useState({
    title: "",
    repoUrl: "",
    language: "Python 3.12",
    notes: "",
  });
  const [validating, setValidating] = useState(false);
  const [validationPassed, setValidationPassed] = useState(false);
  const [compPoints, setCompPoints] = useState(120);

  const active = competitions.find((c) => c.id === activeId) ||
    competitions[0] || {
      id: "none",
      name: "No Active Tournaments",
      rounds: [],
      status: "Upcoming",
      level: "School",
      date: "Upcoming",
      participants: 0,
    };

  const filteredCompetitions = competitions.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.level.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "Registration open") return c.status === "Registration open";
    if (activeTab === "Live rounds") return c.rounds.some((r) => r.state === "Live");
    return true;
  });

  const handleOpenSubmit = (tournName: string, roundName: string) => {
    setSelectedRound({ tournament: tournName, round: roundName });
    setSubForm({
      title: "",
      repoUrl: "",
      language: "Python 3.12",
      notes: "",
    });
    setValidationPassed(false);
    setSubmitModalOpen(true);
  };

  const handleRunValidator = () => {
    if (!subForm.title.trim() || !subForm.repoUrl.trim()) {
      toast.error("Please fill in project title and repository/demo URL first");
      return;
    }
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      setValidationPassed(true);
      toast.success("Pre-submission Automated Checks Passed!", {
        description: "8/8 Unit tests & code lint checks passed cleanly.",
      });
    }, 900);
  };

  const handleSubmitSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) return;
    if (!validationPassed) {
      toast.error("Please run the automated test suite before final submission");
      return;
    }

    const newSub: SubmissionRecord = {
      id: `sub-${Date.now()}`,
      tournamentId: active.id,
      tournamentName: selectedRound.tournament,
      roundName: selectedRound.round,
      projectTitle: subForm.title,
      repoUrl: subForm.repoUrl,
      language: subForm.language,
      score: "49/50",
      submittedAt: "Just now",
      status: "Evaluated",
    };

    setSubmissions((prev) => [newSub, ...prev]);
    setCompPoints((p) => p + 100);
    setSubmitModalOpen(false);
    toast.success("Tournament Solution Submitted!", {
      description: "Rank updated! You earned +100 Competition Points & 49/50 score.",
    });
  };

  return (
    <>
      <PageHeader
        title="Compete"
        subtitle="School, state and national tournaments — with live standings & official submissions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Your best rank"
          value="#4 In School"
          sub="Genesis Championship"
          tone="amber"
          icon={<Medal className="h-4 w-4" />}
        />
        <Stat
          label="Competition points"
          value={`${compPoints} pts`}
          sub="+100 pts this month"
          tone="violet"
          icon={<Trophy className="h-4 w-4" />}
        />
        <Stat
          label="Participants"
          value="4,820"
          sub="148 schools"
          tone="sky"
          icon={<Users className="h-4 w-4" />}
        />
        <Stat
          label="Submissions"
          value={`${submissions.length}`}
          sub="All rounds evaluated"
          tone="emerald"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      <FilterChips options={filters} value={activeTab} onChange={setActiveTab} />

      {activeTab === "My Submissions" ? (
        <Panel
          title="My Tournament Submissions & Results"
          description="Official evaluated project entries across all tournaments"
        >
          {submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Trophy className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">No submissions yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Join an active tournament round and submit your solution to build your portfolio.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{sub.projectTitle}</h4>
                      <Pill tone="emerald">{sub.status}</Pill>
                      <Pill tone="sky">{sub.language}</Pill>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {sub.tournamentName} · <span className="font-medium">{sub.roundName}</span>
                    </p>
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View Submitted Code / URL
                    </a>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 text-base font-bold text-emerald-600">
                      <Trophy className="h-4 w-4" /> {sub.score}
                    </div>
                    <span className="text-[11px] text-slate-400">Submitted {sub.submittedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Tournaments & Hackathons"
            description="Select a tournament to view rounds, schedule and submit entries"
            action={
              <div className="relative w-48 sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tournaments…"
                  className="h-8.5 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>
            }
          >
            <div className="space-y-3">
              {filteredCompetitions.map((c) => {
                const isReg = registered.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "cursor-pointer rounded-2xl border p-4 transition-all shadow-xs",
                      activeId === c.id
                        ? "border-indigo-200 bg-indigo-50/40 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {c.level} · {c.date} · {c.participants.toLocaleString()} participants
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill
                          tone={
                            (c.status === "Registration open"
                              ? "emerald"
                              : c.status === "Upcoming"
                                ? "sky"
                                : "slate") as Tone
                          }
                        >
                          {c.status}
                        </Pill>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRegistered((r) =>
                              isReg ? r.filter((x) => x !== c.id) : [...r, c.id],
                            );
                            toast.success(
                              isReg ? `Withdrawn from ${c.name}` : `Registered for ${c.name}`,
                              {
                                description: isReg
                                  ? "You can re-register any time."
                                  : "Registration confirmed! You're ready for Round 1.",
                              },
                            );
                          }}
                          className={cn(
                            "h-8.5 rounded-xl px-3.5 text-xs font-semibold transition-colors shadow-xs",
                            isReg
                              ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              : "bg-indigo-600 text-white hover:bg-indigo-700",
                          )}
                        >
                          {isReg ? "Registered" : "Register"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {active?.name} · Tournament Rounds
                </p>
                <span className="text-xs text-indigo-600 font-medium">
                  {active?.rounds?.length || 0} rounds total
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {(active?.rounds || []).map((r) => {
                  const isSubmitted = submissions.some(
                    (s) => s.tournamentName === active.name && s.roundName === r.name,
                  );

                  return (
                    <div
                      key={r.name}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{r.name}</p>
                          {isSubmitted && <Pill tone="emerald">Submitted</Pill>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{r.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700">{r.score}</span>
                        <Pill
                          tone={
                            r.state === "Completed"
                              ? "emerald"
                              : r.state === "Live"
                                ? "amber"
                                : "slate"
                          }
                        >
                          {r.state}
                        </Pill>
                        {r.state === "Live" ? (
                          <button
                            onClick={() => handleOpenSubmit(active.name, r.name)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                          >
                            <Send className="h-3 w-3" /> Submit Entry
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              toast(
                                r.state === "Completed" ? "Results available" : "Round scheduled",
                                {
                                  description:
                                    r.state === "Completed"
                                      ? "You scored 48/50 in this round — ranked 3rd in school."
                                      : "This round opens closer to the date.",
                                },
                              )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {r.state === "Completed" ? "View Score" : "Details"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel title="Live Leaderboard" description="Genesis 2026 · Updated every 60 seconds">
            <div className="space-y-2">
              {compLeaderboard.map((e) => (
                <div
                  key={e.rank}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-xs transition-colors",
                    e.name === session?.user?.name
                      ? "border-indigo-300 bg-indigo-50/70"
                      : "border-slate-100 bg-white",
                  )}
                >
                  <span className="w-6 text-sm font-semibold text-slate-500">#{e.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                    <p className="truncate text-xs text-slate-500">{e.school}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-700">{e.score}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Submit Solution Modal */}
      {submitModalOpen && selectedRound && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setSubmitModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
                <Code2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Submit Competition Entry</h3>
                <p className="text-xs text-slate-500">
                  {selectedRound.tournament} · {selectedRound.round}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitSolution} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Project Title</label>
                <input
                  required
                  value={subForm.title}
                  onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
                  placeholder="e.g. EcoTracker - Smart City Carbon Optimization"
                  className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Language / Framework
                  </label>
                  <select
                    value={subForm.language}
                    onChange={(e) => setSubForm({ ...subForm, language: e.target.value })}
                    className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"
                  >
                    <option value="Python 3.12">Python 3.12</option>
                    <option value="JavaScript / React">JavaScript / React</option>
                    <option value="Java 21">Java 21</option>
                    <option value="HTML / CSS / JS">HTML / CSS / JS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Repository or Sandbox URL
                  </label>
                  <input
                    required
                    value={subForm.repoUrl}
                    onChange={(e) => setSubForm({ ...subForm, repoUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Approach & Solution Notes
                </label>
                <textarea
                  rows={3}
                  value={subForm.notes}
                  onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                  placeholder="Briefly explain the algorithms, data structures or design patterns used…"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              {/* Pre-submission Validator */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Automated Test Suite
                  </div>
                  <button
                    type="button"
                    disabled={validating}
                    onClick={handleRunValidator}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <Play className="h-3 w-3 text-indigo-600" />
                    {validating ? "Running tests…" : "Run Validation Suite"}
                  </button>
                </div>
                {validationPassed ? (
                  <p className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Validation passed (8/8 test suites pass). Ready to submit!
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Runs unit tests, static code analysis, and formatting checks before judges
                    review.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="h-9.5 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!validationPassed}
                  className="inline-flex h-9.5 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Submit to Leaderboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
