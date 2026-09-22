import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/client/lib/utils";

const starters = [
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

function replyFor(q: string) {
  const lower = q.toLowerCase();
  const found = answers.find((a) => lower.includes(a.match));
  return (
    found?.reply ??
    "Great question! Let's break it into smaller steps: first describe what you want to happen in plain words, then write one line of code for each step. Tell me your first step and we'll build it together."
  );
}

export function CompanionPanel({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([
    {
      from: "ai",
      text: "Hi Aarav! I'm your S2C Companion. Ask me anything about your lessons, code or projects — I explain, I never just hand over answers.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { from: "me", text: q }, { from: "ai", text: replyFor(q) }]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex-1 space-y-3 overflow-y-auto px-4 py-4",
          compact ? "max-h-72" : "max-h-[26rem]",
        )}
      >
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.from === "me"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {starters.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
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
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
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
        className="fixed right-5 bottom-5 z-50 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.03] hover:bg-indigo-700"
      >
        <Bot className="h-4 w-4" />
        Ask S2C
      </button>
    </>
  );
}
