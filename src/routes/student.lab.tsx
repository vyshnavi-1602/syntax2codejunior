import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, RotateCcw, Save, Sparkles, TerminalSquare } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/student/lab")({
  head: () => ({
    meta: [
      { title: "Coding Lab · Syntax2Code" },
      {
        name: "description",
        content:
          "In-browser coding lab with multi-language editor, test cases, terminal output and AI hints.",
      },
      { property: "og:title", content: "Coding Lab · Syntax2Code" },
      { property: "og:description", content: "Write, run and test code with guided AI hints." },
    ],
  }),
  component: LabPage,
});

const languages = ["Python", "JavaScript", "HTML/CSS", "Java"] as const;

const starter: Record<(typeof languages)[number], string> = {
  Python: `# Challenge: print the 3x table\nfor i in range(1, 11):\n    print(3, "x", i, "=", 3 * i)\n`,
  JavaScript: `// Challenge: print the 3x table\nfor (let i = 1; i <= 10; i++) {\n  console.log(\`3 x \${i} = \${3 * i}\`);\n}\n`,
  "HTML/CSS": `<section class="card">\n  <h1>3x Table</h1>\n  <p>Built by Aarav Sharma</p>\n</section>\n`,
  Java: `public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i <= 10; i++) {\n      System.out.println("3 x " + i + " = " + (3 * i));\n    }\n  }\n}\n`,
};

const testCases = [
  { name: "Prints 10 lines", expected: "10 lines" },
  { name: "First line is 3 x 1 = 3", expected: "3 x 1 = 3" },
  { name: "Last line is 3 x 10 = 30", expected: "3 x 10 = 30" },
];

function LabPage() {
  const [lang, setLang] = useState<(typeof languages)[number]>("Python");
  const [code, setCode] = useState(starter.Python);
  const [output, setOutput] = useState<string[]>([
    "S2C Lab ready. Press Run to execute your code.",
  ]);
  const [results, setResults] = useState<boolean[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setOutput((o) => [...o, `$ run ${lang.toLowerCase()} main`]);
    setTimeout(() => {
      const lines = Array.from({ length: 10 }, (_, i) => `3 x ${i + 1} = ${3 * (i + 1)}`);
      const passes = code.includes("3") && (code.includes("for") || code.includes("while"));
      setOutput((o) => [
        ...o,
        ...lines,
        passes ? "Process finished with exit code 0" : "Warning: no loop detected",
      ]);
      setResults(testCases.map(() => passes));
      setRunning(false);
      if (passes) toast.success("All 3 test cases passed! +50 XP");
      else
        toast("Tests failed", { description: "Your code needs a loop that prints all ten lines." });
    }, 700);
  };

  return (
    <>
      <PageHeader
        title="Coding Lab"
        subtitle="Write, run and test code right in the browser — no installs needed."
        actions={
          <>
            <button
              onClick={() => {
                setCode(starter[lang]);
                setOutput(["Editor reset to starter code."]);
                setResults(null);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={() => toast.success("Snapshot saved to your workspace")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Save className="h-4 w-4" /> Save
            </button>
            <button
              onClick={run}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Play className="h-4 w-4" /> {running ? "Running…" : "Run code"}
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <div className="space-y-6">
          <Panel title="Instructions" description="Challenge 12 · Loops">
            <p className="text-sm leading-relaxed text-slate-700">
              Print the 3 times table from 1 to 10, one line per row, in the format{" "}
              <code className="rounded bg-slate-100 px-1">3 x 1 = 3</code>.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
              <li>• Use a loop — no copy-paste lines.</li>
              <li>• Exactly 10 output lines.</li>
              <li>• Spacing must match the example.</li>
            </ul>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" /> AI hint
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Loop a counter from 1 to 10 and multiply it by 3 inside the loop body.
              </p>
              <button
                onClick={() =>
                  toast("Deeper hint unlocked", {
                    description:
                      "range(1, 11) gives you 1 through 10 — the stop value is not included.",
                  })
                }
                className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Need a stronger hint?
              </button>
            </div>
          </Panel>

          <Panel title="Test cases">
            <div className="space-y-2">
              {testCases.map((t, i) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <span className="text-xs text-slate-700">{t.name}</span>
                  {results === null ? (
                    <Pill>Not run</Pill>
                  ) : results[i] ? (
                    <Pill tone="emerald">Passed</Pill>
                  ) : (
                    <Pill tone="amber">Failed</Pill>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Editor"
            description={`main.${lang === "Python" ? "py" : lang === "Java" ? "java" : lang === "JavaScript" ? "js" : "html"}`}
            bodyClassName="p-0"
            action={
              <div className="flex gap-1">
                {languages.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setCode(starter[l]);
                      setResults(null);
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      lang === l
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              rows={16}
              className="w-full resize-none rounded-b-2xl bg-slate-50 p-5 font-mono text-[13px] leading-relaxed text-slate-800 outline-none"
            />
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <TerminalSquare className="h-4 w-4" /> Console output
              </span>
            }
            bodyClassName="p-0"
          >
            <div className="max-h-64 overflow-y-auto rounded-b-2xl bg-slate-900 p-4 font-mono text-[12.5px] leading-relaxed text-slate-100">
              {output.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("$")
                      ? "text-teal-300"
                      : line.startsWith("Warning")
                        ? "text-amber-300"
                        : ""
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
