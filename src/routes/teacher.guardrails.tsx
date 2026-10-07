import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Lock, Cpu, Globe, Sliders, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { Button } from "@/client/components/ui/button";

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

function TeacherGuardrailsPage() {
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([
    "Python",
    "JavaScript",
    "HTML/CSS",
  ]);
  const [maxLoopTimeoutMs, setMaxLoopTimeoutMs] = useState(2500);
  const [blockExternalNetwork, setBlockExternalNetwork] = useState(true);
  const [sandboxMode, setSandboxMode] = useState<"strict" | "moderate" | "permissive">("strict");
  const [isSaving, setIsSaving] = useState(false);

  const toggleLanguage = (lang: string) => {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Class guardrails successfully saved!", {
        description: `Applied ${sandboxMode} sandbox with ${maxLoopTimeoutMs}ms loop timeout across active classes.`,
      });
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Class Execution Guardrails"
        subtitle="Manage student code execution security, execution limits, and runtime safety policies across your classroom."
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sandbox Mode
              </p>
              <p className="text-lg font-bold text-slate-900 capitalize">{sandboxMode}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Loop Execution Limit
              </p>
              <p className="text-lg font-bold text-slate-900">{maxLoopTimeoutMs} ms</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Network Policy
              </p>
              <p className="text-lg font-bold text-slate-900">
                {blockExternalNetwork ? "Isolated Offline" : "External Permitted"}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Panel
          title="Sandbox Security & Language Policies"
          description="Configure strict rules enforced inside students' browser and server code execution runs"
          className="p-6 bg-white border border-slate-200"
        >
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Allowed Languages in Classroom
              </label>
              <div className="flex flex-wrap gap-2">
                {["Python", "JavaScript", "HTML/CSS", "Java", "SQL"].map((lang) => {
                  const isChecked = allowedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        isChecked
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Infinite Loop & Execution Timeout: {maxLoopTimeoutMs}ms
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Terminates code execution automatically if student code runs longer than this limit.
              </p>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={maxLoopTimeoutMs}
                onChange={(e) => setMaxLoopTimeoutMs(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>500ms (Fast)</span>
                <span>2500ms (Recommended)</span>
                <span>5000ms (Permissive)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Sandbox Enforcement Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "strict",
                    label: "Strict Sandbox",
                    desc: "Blocks all DOM and system access",
                  },
                  {
                    id: "moderate",
                    label: "Moderate",
                    desc: "Allows verified browser APIs",
                  },
                  {
                    id: "permissive",
                    label: "Permissive",
                    desc: "Relaxed limits for advanced projects",
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSandboxMode(mode.id as typeof sandboxMode)}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      sandboxMode === mode.id
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{mode.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-900 block">
                  Block External Network Requests
                </label>
                <p className="text-xs text-slate-500">
                  Prevents student scripts from making unmonitored HTTP/fetch calls outside the lab.
                </p>
              </div>
              <input
                type="checkbox"
                checked={blockExternalNetwork}
                onChange={(e) => setBlockExternalNetwork(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? "Applying Guardrails..." : "Save Classroom Guardrails"}
              </Button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}
