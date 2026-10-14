import React, { useState } from "react";
import { Play, RotateCcw, Copy, Check, Terminal, Loader2, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { runCustomCodeFn } from "@/api/student.server";
import { cn } from "@/client/lib/utils";

interface InteractiveCodeRunnerProps {
  initialCode: string;
  language?: string;
  className?: string;
}

export function InteractiveCodeRunner({
  initialCode,
  language = "python",
  className,
}: InteractiveCodeRunnerProps) {
  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  const [output, setOutput] = useState<{
    stdout: string;
    stderr: string;
    status: string;
    executionTimeMs: number;
    exitCode: number;
  } | null>(null);

  const cleanLang = (language || "python").toLowerCase().trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput(null);
    toast.info("Code restored to original lesson snippet.");
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runCustomCodeFn({
        data: {
          code,
          language: cleanLang,
          stdin,
        },
      });

      setOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        status: res.status,
        executionTimeMs: res.executionTimeMs,
        exitCode: res.exitCode,
      });

      if (res.status === "SUCCESS") {
        toast.success(`Executed successfully in ${res.executionTimeMs}ms!`);
      } else {
        toast.error(`Execution finished with errors (${res.status})`);
      }
    } catch (err: unknown) {
      setOutput({
        stdout: "",
        stderr: err instanceof Error ? err.message : "Failed to execute code",
        status: "RUNTIME_ERROR",
        executionTimeMs: 0,
        exitCode: 1,
      });
      toast.error("Execution failed. Check your code syntax.");
    } finally {
      setIsRunning(false);
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div
      className={cn(
        "my-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-[#13141f] shadow-xl not-prose",
        className,
      )}
    >
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#1a1b2b] px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-1 inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 font-mono border border-indigo-500/20 uppercase">
            {cleanLang}
          </span>
          <span className="text-xs text-slate-400 font-sans hidden sm:inline">
            Interactive Playground
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowStdin((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              showStdin
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
            )}
            title="Provide Custom Input (stdin)"
          >
            <CornerDownLeft className="h-3 w-3" />
            <span>Stdin</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Reset to Original Code"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3 fill-current" />
            )}
            <span>{isRunning ? "Running..." : "Run Code"}</span>
          </button>
        </div>
      </div>

      {/* Custom Stdin Drawer */}
      {showStdin && (
        <div className="border-b border-slate-800 bg-[#161726] px-4 py-2 text-xs">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Custom Standard Input (stdin):
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter standard input values here..."
            rows={2}
            className="w-full rounded-md border border-slate-700 bg-[#0f101a] p-2 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Code Textarea & Line Numbers */}
      <div className="relative flex bg-[#13141f] text-slate-200">
        <div className="select-none py-3 pl-3 pr-2 text-right font-mono text-xs text-slate-600 border-r border-slate-800/80 bg-[#11121d]">
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const nextVal = code.substring(0, start) + "  " + code.substring(end);
              setCode(nextVal);
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              }, 0);
            }
          }}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-6 text-slate-100 outline-none overflow-x-auto whitespace-pre font-normal"
          rows={Math.max(lineCount, 4)}
        />
      </div>

      {/* Output Console */}
      {output && (
        <div className="border-t border-slate-800 bg-[#0d0e17] p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-300 font-sans">Execution Output</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-mono font-medium",
                  output.status === "SUCCESS"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                )}
              >
                {output.status === "SUCCESS"
                  ? `✓ Success (${output.executionTimeMs}ms)`
                  : `✕ ${output.status}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOutput(null)}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>

          <div className="rounded-lg bg-[#08080f] p-3 font-mono text-xs text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {output.stdout && <div className="text-emerald-300">{output.stdout}</div>}
            {output.stderr && <div className="text-rose-400 mt-1">{output.stderr}</div>}
            {!output.stdout && !output.stderr && (
              <span className="italic text-slate-500">(Program finished with no output)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
