import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-theme");
      if (saved === "dark") {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = (targetTheme: "light" | "dark") => {
    setTheme(targetTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("s2c-theme", targetTheme);
      if (targetTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1 shadow-sm backdrop-blur-sm z-50 ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => toggleTheme("light")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
          theme === "light"
            ? "bg-amber-500/15 text-amber-700 font-semibold shadow-xs dark:bg-amber-400/20 dark:text-amber-300"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Switch to Light Theme"
        aria-label="Light theme"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => toggleTheme("dark")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-indigo-600 text-white font-semibold shadow-xs"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="Switch to Dark Theme"
        aria-label="Dark theme"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span>Dark</span>
      </button>
    </div>
  );
}
