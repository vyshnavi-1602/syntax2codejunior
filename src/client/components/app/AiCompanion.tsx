import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/client/lib/utils";

import { useSession } from "@/client/lib/auth-client";

export interface IdeAiContext {
  problemTitle?: string | undefined;
  directive?: string | undefined;
  language?: string | undefined;
  verdict?: string | undefined;
  testCasesPassed?: number | undefined;
  testCasesTotal?: number | undefined;
  code?: string | undefined;
  examples?: { input: string; output: string; explanation?: string | undefined }[] | undefined;
}

const defaultStarters = [
  "Explain loops like I'm in Grade 6",
  "Give me a hint",
  "Why is my code wrong?",
  "Quiz me on AI basics",
];

const answers: { match: string; reply: string }[] = [
  {
    match: "loop",
    reply:
      'Think of a loop like brushing your teeth: you repeat the same small action many times. In Python, `for i in range(3):` says "do this 3 times". The loop keeps a counter for you, so you never copy-paste the same line again.',
  },
  {
    match: "hint",
    reply:
      "Here's a nudge, not the answer: check what value your counter has on the very last run of the loop. Print it just before the line that breaks — most bugs like this are one step too far.",
  },
  {
    match: "wrong",
    reply:
      "Your logic looks close! Two things to check: (1) is your comparison using `==` instead of `=`, and (2) does the indented block actually sit inside the loop? Fix those and re-run the test cases.",
  },
  {
    match: "ai",
    reply:
      "Quick check: an AI model learns patterns from examples. If I only show it pictures of red apples, what happens when it sees a green one? Try answering in one line — then I'll explain bias.",
  },
];

function replyFor(q: string, context?: IdeAiContext) {
  const lower = q.toLowerCase();

  if (context) {
    if (lower.includes("wrong") || lower.includes("fail") || lower.includes("verdict")) {
      const lang = context.language || "Java";
      const ex = context.examples?.[0];
      return `Looking at ${context.problemTitle || "this problem"} in ${lang}:
1. Check your output formatting — ensure you aren't printing extra spaces or text when only the result is expected.
2. For Example 1 (Input: ${ex?.input || "test input"} -> Expected: ${ex?.output || "expected"}), trace what your current code actually prints.
3. Watch out for off-by-one errors in your loop bounds and edge cases (empty inputs or zero).`;
    }

    if (lower.includes("hint")) {
      return `Here is a hint for ${context.problemTitle || "this challenge"}:
• Break down the goal: ${context.directive ? context.directive.slice(0, 120) : "Follow standard input/output"}.
• Try storing elements or tracking the running state in a variable before printing.
• Avoid hardcoding outputs — your logic should work for any valid test input!`;
    }

    if (lower.includes("example") || lower.includes("test")) {
      const ex = context.examples?.[0];
      if (ex) {
        return `Let's break down Example 1:
• Input: \`${ex.input}\`
• Expected Output: \`${ex.output}\`
Your algorithm needs to read this input, process the logic, and produce exactly \`${ex.output}\`.`;
      }
    }

    if (lower.includes("complexity") || lower.includes("time") || lower.includes("constraint")) {
      return `For competitive coding constraints:
• An O(N) or O(N log N) algorithm will comfortably pass all tests within standard runtime limits.
• If you are using nested loops (O(N^2)), consider using a single pass with a HashMap or tracking pointers.`;
    }
  }

  const found = answers.find((a) => lower.includes(a.match));
  return (
    found?.reply ??
    "Great question! Let's break it into smaller steps: first describe what you want to happen in plain words, then write one line of code for each step. Tell me your first step and we'll build it together."
  );
}

export function CompanionPanel({
  compact = false,
  theme = "light",
  context,
}: {
  compact?: boolean | undefined;
  theme?: ("light" | "dark") | undefined;
  context?: IdeAiContext | undefined;
}) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Student";
  const isDark = theme === "dark";

  const initialGreeting = context?.problemTitle
    ? `Hi ${userName}! I'm your S2C Companion. I see you're working on "${context.problemTitle}". Ask me for hints, edge cases, or to help debug your code!`
    : `Hi ${userName}! I'm your S2C Companion. Ask me anything about your lessons, code or projects — I explain, I never just hand over answers.`;

  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([
    {
      from: "ai",
      text: initialGreeting,
    },
  ]);
  const [input, setInput] = useState("");

  const starters =
    context?.verdict === "WRONG_ANSWER"
      ? [
          "Why is my verdict WRONG_ANSWER?",
          "Give me a hint for this problem",
          "Check my loop logic",
          "Explain Example 1",
        ]
      : context?.problemTitle
        ? [
            "Give me a hint for this problem",
            "Explain the directive",
            "What edge cases to watch for?",
            "Explain time complexity",
          ]
        : defaultStarters;

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { from: "me", text: q }, { from: "ai", text: replyFor(q, context) }]);
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isDark ? "bg-[#16181f] text-white" : "bg-white text-slate-900",
      )}
    >
      <div
        className={cn(
          "flex-1 space-y-3 overflow-y-auto px-4 py-4 no-scrollbar",
          compact ? "max-h-72" : "max-h-[26rem]",
        )}
      >
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line",
                m.from === "me"
                  ? isDark
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-indigo-600 text-white"
                  : isDark
                    ? "border border-slate-800 bg-[#1f222d] text-slate-200"
                    : "border border-slate-200 bg-slate-50 text-slate-700",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "border-t px-4 py-3",
          isDark ? "border-slate-800 bg-[#12141a]" : "border-slate-100 bg-white",
        )}
      >
        <div className="mb-2 flex flex-wrap gap-1.5">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                isDark
                  ? "border-slate-800 bg-[#181b22] text-slate-300 hover:border-indigo-500/60 hover:bg-indigo-950/30 hover:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your companion…"
            className={cn(
              "h-10 flex-1 rounded-xl border px-3 text-xs sm:text-sm outline-none transition-all",
              isDark
                ? "border-slate-800 bg-[#0e1015] text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100",
            )}
          />
          <button
            type="submit"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer",
              isDark
                ? "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                : "bg-indigo-600 hover:bg-indigo-700 text-white",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function FloatingCompanion() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="fixed right-5 bottom-24 z-50 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-teal-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-900">S2C AI Companion</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <CompanionPanel compact />
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-5 bottom-5 z-50 inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.03]"
      >
        <Bot className="h-4 w-4" />
        Ask S2C
      </button>
    </>
  );
}

export function IdeFloatingCompanion({ context }: { context?: IdeAiContext | undefined }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="fixed right-6 bottom-20 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-800 bg-[#16181f] shadow-2xl shadow-black/80 flex flex-col h-[32rem] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#12141a] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    S2C AI Companion
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                    LIVE TUTOR
                  </span>
                </div>
                {context?.problemTitle && (
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    Context: {context.problemTitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <CompanionPanel compact theme="dark" context={context} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-xl shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <Bot className="h-4 w-4 fill-white text-white" />
        <span>Ask S2C</span>
      </button>
    </>
  );
}
