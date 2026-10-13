import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Cpu,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { Button } from "@/client/components/ui/button";
import { updateStudentGuardrailsFn } from "@/api/teacher.server";
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/teacher/guardrails")({
  head: () => ({
    meta: [
      { title: "Class Guardrails & Execution Security · Syntax2Code" },
      {
        name: "description",
        content: "Configure sandboxed execution environments, loop timeouts, and network policies.",
      },
    ],
  }),
  component: TeacherGuardrailsPage,
});

const CLASSES = [
  { id: "all", name: "All Enrolled Classes" },
  { id: "g8a", name: "Grade 8A - Python Essentials" },
  { id: "g8b", name: "Grade 8B - Algorithmic Thinking" },
  { id: "g9a", name: "Grade 9A - Advanced Data Structures" },
  { id: "g6a", name: "Grade 6A - Junior Web & Logic" },
];

const PRESETS = [
  {
    id: "strict",
    name: "Exam & Contest Mode",
    desc: "Strict sandbox, 1500ms timeout, network completely isolated, verified languages only.",
    langs: ["Python", "JavaScript"],
    timeout: 1500,
    blockNet: true,
    sandbox: "strict" as const,
  },
  {
    id: "standard",
    name: "Standard Classroom Lab",
    desc: "Balanced safety with interactive learning APIs, 2500ms loop limit, offline isolated.",
    langs: ["Python", "JavaScript", "HTML/CSS", "Java"],
    timeout: 2500,
    blockNet: true,
    sandbox: "moderate" as const,
  },
  {
    id: "hackathon",
    name: "Open Project & Hackathon",
    desc: "Permissive mode for advanced builds, 5000ms timeout, web APIs and external fetches permitted.",
    langs: ["Python", "JavaScript", "HTML/CSS", "Java", "SQL"],
    timeout: 5000,
    blockNet: false,
    sandbox: "permissive" as const,
  },
];

const STORAGE_KEY = "s2c_class_guardrails_v2";

function TeacherGuardrailsPage() {
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([
    "Python",
    "JavaScript",
    "HTML/CSS",
    "Java",
  ]);
  const [maxLoopTimeoutMs, setMaxLoopTimeoutMs] = useState(2500);
  const [blockExternalNetwork, setBlockExternalNetwork] = useState(true);
  const [sandboxMode, setSandboxMode] = useState<"strict" | "moderate" | "permissive">("moderate");
  const [requireCodeApproval, setRequireCodeApproval] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load persisted settings per class
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${selectedClassId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.allowedLanguages) setAllowedLanguages(parsed.allowedLanguages);
        if (parsed.maxLoopTimeoutMs) setMaxLoopTimeoutMs(parsed.maxLoopTimeoutMs);
        if (typeof parsed.blockExternalNetwork === "boolean")
          setBlockExternalNetwork(parsed.blockExternalNetwork);
        if (parsed.sandboxMode) setSandboxMode(parsed.sandboxMode);
        if (typeof parsed.requireCodeApproval === "boolean")
          setRequireCodeApproval(parsed.requireCodeApproval);
      }
    } catch {
      // ignore
    }
  }, [selectedClassId]);

  const toggleLanguage = (lang: string) => {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setAllowedLanguages(preset.langs);
    setMaxLoopTimeoutMs(preset.timeout);
    setBlockExternalNetwork(preset.blockNet);
    setSandboxMode(preset.sandbox);
    toast.info(`Applied "${preset.name}" preset! Click 'Save Classroom Guardrails' to enforce.`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const resolvedMode: "strict" | "standard" | "relaxed" =
        sandboxMode === "moderate"
          ? "standard"
          : sandboxMode === "permissive"
            ? "relaxed"
            : "strict";

      const payload = {
        studentId: selectedClassId === "all" ? "class_all" : selectedClassId,
        allowedLanguages,
        maxLoopTimeoutMs,
        blockExternalNetwork,
        sandboxMode: resolvedMode,
        requireCodeApproval,
      };

      // Call server fn
      await updateStudentGuardrailsFn({ data: payload });

      // Save locally
      localStorage.setItem(
        `${STORAGE_KEY}_${selectedClassId}`,
        JSON.stringify({
          allowedLanguages,
          maxLoopTimeoutMs,
          blockExternalNetwork,
          sandboxMode,
          requireCodeApproval,
        }),
      );

      const targetClassName =
        CLASSES.find((c) => c.id === selectedClassId)?.name || "Selected Class";
      toast.success("Class guardrails successfully saved!", {
        description: `Enforced ${sandboxMode.toUpperCase()} sandbox with ${maxLoopTimeoutMs}ms execution limit on ${targetClassName}.`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update guardrails.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Class Execution Guardrails & Rights"
        subtitle="Enforce student sandbox security boundaries, infinite loop timeouts, and network privacy policies across classrooms."
        actions={
          <div className="flex items-center gap-2">
            <Pill tone="emerald">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Active Class Isolation
              </span>
            </Pill>
          </div>
        }
      />

      {/* Target Class Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Select Class to Configure:
          </span>
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 cursor-pointer"
        >
          {CLASSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Security Status Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151b] shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sandbox Mode
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white capitalize">
              {sandboxMode} Mode
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151b] shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Execution Timeout
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {maxLoopTimeoutMs} ms limit
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151b] shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Network Access
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {blockExternalNetwork ? "Isolated Offline" : "External Permitted"}
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Quick Security Presets
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151b] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {preset.name}
                </span>
                <Zap className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {preset.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Guardrails Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Panel
          title="Sandbox Security & Runtime Policies"
          description={`Configuring rules enforced inside the coding lab for: ${CLASSES.find((c) => c.id === selectedClassId)?.name}`}
          className="p-6 bg-white dark:bg-[#13151b] border border-slate-200 dark:border-slate-800"
        >
          <div className="space-y-6 max-w-2xl">
            {/* Allowed Languages */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Allowed Programming Languages in Lab
              </label>
              <div className="flex flex-wrap gap-2">
                {["Python", "JavaScript", "HTML/CSS", "Java", "SQL", "C++"].map((lang) => {
                  const isChecked = allowedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                        isChecked
                          ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300",
                      )}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loop Execution Limit */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Infinite Loop & Execution Timeout
                </label>
                <span className="text-xs font-bold text-emerald-500">{maxLoopTimeoutMs} ms</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Terminates student script execution if a loop runs longer than this threshold to
                prevent browser locking.
              </p>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={maxLoopTimeoutMs}
                onChange={(e) => setMaxLoopTimeoutMs(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>500ms (High Alert)</span>
                <span>2500ms (Recommended)</span>
                <span>5000ms (Permissive)</span>
              </div>
            </div>

            {/* Sandbox Enforcement Mode */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Sandbox Enforcement Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "strict",
                    label: "Strict Sandbox",
                    desc: "Blocks all DOM and system cookies via isolated Web Workers.",
                  },
                  {
                    id: "moderate",
                    label: "Moderate",
                    desc: "Allows standard canvas and safe browser animation APIs.",
                  },
                  {
                    id: "permissive",
                    label: "Permissive",
                    desc: "Full browser feature set for complex multi-page capstone projects.",
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSandboxMode(mode.id as typeof sandboxMode)}
                    className={cn(
                      "p-3.5 text-left rounded-xl border transition-all cursor-pointer",
                      sandboxMode === mode.id
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300",
                    )}
                  >
                    <p className="text-xs font-bold">{mode.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {mode.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Network Access Policy */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Block External Network Requests
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Prevents student scripts from making unmonitored external fetch or WebSocket
                  connections.
                </p>
              </div>
              <input
                type="checkbox"
                checked={blockExternalNetwork}
                onChange={(e) => setBlockExternalNetwork(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Code Approval Option */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Require Teacher Review for Submissions
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Flags project submissions for mandatory teacher manual review before awarding XP.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireCodeApproval}
                onChange={(e) => setRequireCodeApproval(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs shadow-indigo-600/20 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isSaving ? "Applying Guardrails..." : "Save Classroom Guardrails"}</span>
              </button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}
