/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/client/lib/utils";
import { authClient } from "@/client/lib/auth-client";
import { useSession, demoUsers, roleHome, type RoleId } from "@/client/lib/session";
import { navByRole } from "./nav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import { Button } from "@/client/components/ui/button";
import { syncUserRoleFn } from "@/api/auth.server";

const initialNotifications: Record<string, any[]> = {
  student: [],
  teacher: [],
  school: [],
  admin: [],
  s2c: [],
};
const roleLabels: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  school: "School Admin",
  admin: "Platform Admin",
  s2c: "Platform Admin",
};
import { Avatar } from "./primitives";
import { FloatingCompanion } from "./AiCompanion";

function Icon({ name, className }: { name: string; className?: string }) {
  const C =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string | undefined }>>)[
      name
    ] ?? Icons.Circle;
  return <C className={className} />;
}

const labelFor: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  school: "School",
  admin: "S2C Admin",
  learn: "Learn",
  practice: "Practice",
  build: "Build",
  lab: "Coding",
  compete: "Compete",
  clubs: "Clubs",
  leaderboard: "Leaderboard",
  portfolio: "Portfolio",
  certificates: "Certificates",
  profile: "My Profile",
  classes: "Classes",
  assignments: "Assignments",
  reviews: "Project Reviews",
  analytics: "Analytics",
  announcements: "Announcements",
  students: "Students",
  teachers: "Teachers",
  readiness: "Readiness Index",
  reports: "Reports",
  schools: "Schools",
  curriculum: "Curriculum",
  questions: "Question Bank",
  competitions: "Competitions",
  gamification: "Gamification",
  moderation: "Moderation",
  schedule: "Schedule",
};

export function AppShell({ children, allow }: { children: ReactNode; allow: RoleId }) {
  const { user, role, signIn, signOut, ready } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("s2c-sidebar-collapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("s2c-sidebar-collapsed", String(next));
      }
      return next;
    });
  };

  const [notes, setNotes] = useState(initialNotifications[allow] || []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-theme");
      if (saved === "dark") return "dark";
      if (saved === "light") return "light";
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    }
    return "light";
  });
  const [profileName, setProfileName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-profile-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) return parsed.name;
        } catch (_err) {
          // ignore corrupted JSON
        }
      }
    }
    return user?.name || "Student User";
  });
  const [profileSchool, setProfileSchool] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-profile-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.school) return parsed.school;
        } catch (_err) {
          // ignore corrupted JSON
        }
      }
    }
    return user?.school || "Global Tech High";
  });
  const [profileEmail, setProfileEmail] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-profile-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.email) return parsed.email;
        } catch (_err) {
          // ignore corrupted JSON
        }
      }
    }
    return user?.email || "student@school.edu";
  });
  const [emailNotifs, setEmailNotifs] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-profile-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.emailNotifs === "boolean") return parsed.emailNotifs;
        } catch (_err) {
          // ignore corrupted JSON
        }
      }
    }
    return true;
  });

  const [supportMessage, setSupportMessage] = useState("");
  const [supportCategory, setSupportCategory] = useState("Technical Issue");
  const [supportSent, setSupportSent] = useState(false);

  useEffect(() => {
    if (settingsOpen && typeof window !== "undefined") {
      const saved = window.localStorage.getItem("s2c-profile-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) setProfileName(parsed.name);
          if (parsed.school) setProfileSchool(parsed.school);
          if (typeof parsed.emailNotifs === "boolean") setEmailNotifs(parsed.emailNotifs);
          return;
        } catch (_err) {
          // ignore corrupted JSON
        }
      }
      if (user?.name) setProfileName(user.name);
      if (user?.school) setProfileSchool(user.school);
    }
  }, [settingsOpen, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDark =
      themeMode === "dark" ||
      (themeMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [themeMode]);

  useEffect(() => {
    setNotes(initialNotifications[allow] || []);
  }, [allow]);

  useEffect(() => {
    if (!ready) return;

    const currentEffectiveRole: string = role || "student";
    const isAllowed =
      currentEffectiveRole === allow ||
      currentEffectiveRole === "admin" ||
      currentEffectiveRole === "s2c" ||
      (allow === "s2c" && currentEffectiveRole === "admin");

    if (!isAllowed) {
      toast.error("Access Restricted", {
        description: `You don't have access to this portal. Your account (${roleLabels[currentEffectiveRole] || currentEffectiveRole}) cannot access the ${roleLabels[allow] || allow} portal.`,
      });
      navigate({ to: roleHome[currentEffectiveRole] || "/login" });
    }
  }, [ready, role, allow, navigate]);

  const effectiveRole = allow || role || "student";
  const displayUser =
    user && (user.role === effectiveRole || (effectiveRole === "s2c" && user.role === "admin"))
      ? user
      : demoUsers.find((u) => u.role === effectiveRole) || demoUsers[0]!;

  const isLoading = !ready;

  const groups = navByRole[allow];
  const crumbs = pathname.split("/").filter(Boolean);

  const closeAll = () => {
    setNotifOpen(false);
    setMenuOpen(false);
    setRoleOpen(false);
    setSearchFocused(false);
  };

  const searchableItems = [
    { title: "Intro to Python & Variables", category: "Lesson", to: "/student/learn" },
    { title: "Loops, Logic & Conditions", category: "Lesson", to: "/student/learn" },
    { title: "Functions & Modular Code", category: "Lesson", to: "/student/learn" },
    { title: "Space Invaders Arcade Game", category: "Project", to: "/student/build" },
    { title: "Interactive AI Chatbot", category: "Project", to: "/student/build" },
    { title: "Aarav Sharma", category: "Student", to: "/teacher/students" },
    { title: "Diya Nair", category: "Student", to: "/teacher/students" },
    { title: "Rohan Verma", category: "Student", to: "/teacher/students" },
    { title: "Classroom Assignments", category: "Page", to: "/teacher/assignments" },
    { title: "Coding IDE", category: "Tool", to: "/student/lab" },
    { title: "Practice Challenges", category: "Practice", to: "/student/practice" },
    { title: "Tournaments & Hackathons", category: "Events", to: "/student/compete" },
    { title: "Partner Schools Directory", category: "Management", to: "/admin/schools" },
  ];

  const searchResults = search.trim()
    ? searchableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {mobileNav && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-md shadow-emerald-500/20">
              S2
            </span>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    Syntax2Code
                  </p>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Junior
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  AI & Coding for Schools
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            className={cn(
              "hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors",
              sidebarCollapsed && "mx-auto",
            )}
          >
            {sidebarCollapsed ? (
              <Icons.PanelLeftOpen className="h-4 w-4" />
            ) : (
              <Icons.PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav
          aria-label="Main Navigation"
          role="navigation"
          className="flex-1 space-y-6 overflow-y-auto px-2 py-4"
        >
          {groups?.map((g) => (
            <div key={g.group}>
              {!sidebarCollapsed && (
                <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {g.group}
                </p>
              )}
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const active =
                    pathname === item.to ||
                    (item.to !== roleHome[allow] && pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={sidebarCollapsed ? item.label : undefined}
                      onClick={() => setMobileNav(false)}
                      className={cn(
                        "flex items-center rounded-xl text-sm font-medium transition-colors",
                        sidebarCollapsed
                          ? "justify-center h-10 w-10 mx-auto px-0"
                          : "gap-2.5 px-3 py-2",
                        active
                          ? "bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-300 shadow-xs border-r-2 border-emerald-600"
                          : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300",
                      )}
                    >
                      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col min-w-0 transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setMobileNav((m) => !m)}
            >
              <Icons.Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden max-w-sm flex-1 md:block">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!search.trim()) return;
                  if (searchResults.length > 0) {
                    toast.success(`Search completed`, {
                      description: `Found ${searchResults.length} matching items for "${search}".`,
                    });
                  } else {
                    toast.info(`No results`, {
                      description: `No lessons, projects, or students matched "${search}".`,
                    });
                  }
                }}
              >
                <Icons.Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder="Search lessons, students, projects…"
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pr-3 pl-9 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-100"
                />
              </form>

              {searchFocused && search.trim() && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {searchResults.length} {searchResults.length === 1 ? "Result" : "Results"} Found
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {searchResults.length > 0 ? (
                      searchResults.map((item, idx) => (
                        <Link
                          key={idx}
                          to={item.to}
                          onClick={() => {
                            setSearch("");
                            setSearchFocused(false);
                          }}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <span className="font-medium">{item.title}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase">
                            {item.category}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No matches found for "{search}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {(notifOpen || menuOpen || roleOpen) && (
                <div className="fixed inset-0 z-30 bg-transparent" onClick={closeAll} />
              )}

              {/* QUICK DARK / LIGHT MODE TOGGLE */}
              <button
                type="button"
                onClick={() => {
                  const newMode = themeMode === "dark" ? "light" : "dark";
                  setThemeMode(newMode);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("s2c-theme", newMode);
                    document.documentElement.classList.toggle("dark", newMode === "dark");
                  }
                  toast.success(newMode === "dark" ? "Dark mode enabled" : "Light mode enabled");
                }}
                title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {themeMode === "dark" ? (
                  <Icons.Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Icons.Moon className="h-4 w-4 text-emerald-600" />
                )}
              </button>

              <div className="relative z-40">
                <button
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    setMenuOpen(false);
                    setRoleOpen(false);
                  }}
                  className="relative rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
                >
                  <Icons.Bell className="h-4 w-4" />
                  {notes.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-900">Notifications</p>
                      {notes.length > 0 && (
                        <button
                          className="text-[11px] font-medium text-emerald-600 hover:underline"
                          onClick={() => {
                            setNotifOpen(false);
                            setNotes([]);
                            toast.success("All notifications marked as read");
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notes.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        No new notifications
                      </div>
                    ) : (
                      notes.map((n, idx) => (
                        <div
                          key={idx}
                          className="border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"
                        >
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.body}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{n.when}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {displayUser ? (
                <div className="relative z-40">
                  <button
                    onClick={() => {
                      setMenuOpen((o) => !o);
                      setNotifOpen(false);
                      setRoleOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-1.5 pr-2.5 pl-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Avatar initials={displayUser.avatar} size="sm" />
                    <span className="hidden text-left sm:block">
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {displayUser.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {roleLabels[effectiveRole]}
                      </span>
                    </span>
                    <Icons.ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                      <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {displayUser.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {displayUser.email}
                        </p>
                        <span className="mt-1.5 inline-block rounded-md bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          {roleLabels[effectiveRole]}
                        </span>
                      </div>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                      >
                        <Icons.Settings className="h-4 w-4" /> Account settings
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          setHelpOpen(true);
                        }}
                      >
                        <Icons.LifeBuoy className="h-4 w-4" /> Help & support
                      </button>
                      <button
                        className="flex w-full items-center gap-2 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 cursor-pointer"
                        onClick={async () => {
                          try {
                            await authClient.signOut();
                          } catch (error) {
                            console.error("Sign out error", error);
                          } finally {
                            window.localStorage.clear();
                            signOut();
                            window.location.href = "/login";
                          }
                        }}
                      >
                        <Icons.LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 lg:px-8">
            <Link to={roleHome[allow] || "/dashboard"} className="hover:text-emerald-600">
              {user?.school || "Global Tech High"}
            </Link>
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              const path = `/${crumbs.slice(0, i + 1).join("/")}`;
              const content = labelFor[c] ?? c.replace(/-/g, " ");

              return (
                <span key={`${c}-${i}`} className="flex items-center gap-1.5">
                  <Icons.ChevronRight className="h-3 w-3 text-slate-300" />
                  {isLast ? (
                    <span className="font-medium text-slate-700">{content}</span>
                  ) : (
                    <Link to={path} className="hover:text-emerald-600 transition-colors">
                      {content}
                    </Link>
                  )}
                </span>
              );
            })}
          </div>
        </header>

        <main
          className="flex-1 space-y-6 px-4 py-6 lg:px-8 lg:py-8 bg-slate-50/60 dark:bg-slate-950/80 min-h-[calc(100vh-4rem)] transition-colors"
          onClick={closeAll}
        >
          {isLoading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className="font-medium">Loading workspace…</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      {allow === "student" && <FloatingCompanion />}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Settings & Preferences</DialogTitle>
            <DialogDescription>
              Manage your profile, theme mode, and platform notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Display Name</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Full name"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Account Email</label>
              <input
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">School / Institution</label>
              <input
                value={profileSchool}
                onChange={(e) => setProfileSchool(e.target.value)}
                placeholder="School name"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <label className="text-xs font-semibold text-slate-700">Theme Preference</label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setThemeMode(t)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold capitalize transition-all",
                      themeMode === t
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {t === "light" && <Icons.Sun className="h-3.5 w-3.5" />}
                    {t === "dark" && <Icons.Moon className="h-3.5 w-3.5" />}
                    {t === "system" && <Icons.Laptop className="h-3.5 w-3.5" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <p className="text-xs font-semibold text-slate-800">Email Notifications</p>
                <p className="text-[11px] text-slate-500">
                  Receive class assignments and project digests
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("s2c-theme", themeMode);
                  window.localStorage.setItem(
                    "s2c-profile-settings",
                    JSON.stringify({
                      name: profileName,
                      email: profileEmail,
                      school: profileSchool,
                      emailNotifs,
                    }),
                  );
                  document.cookie = `s2c_email=${encodeURIComponent(profileEmail)}; path=/; max-age=31536000; SameSite=Lax`;
                  document.cookie = `s2c_name=${encodeURIComponent(profileName)}; path=/; max-age=31536000; SameSite=Lax`;
                  const isDark =
                    themeMode === "dark" ||
                    (themeMode === "system" &&
                      window.matchMedia("(prefers-color-scheme: dark)").matches);
                  document.documentElement.classList.toggle("dark", isDark);
                }
                toast.success("Settings saved successfully", {
                  description: "Your theme and profile preferences have been updated.",
                });
                setSettingsOpen(false);
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Syntax2Code Help & Documentation</DialogTitle>
            <DialogDescription>
              Browse guides or contact our educational support team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!supportSent ? (
              <>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Icons.BookOpen className="h-4 w-4" />
                      <p className="text-xs font-semibold text-slate-900">Student Coding</p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                      Write, test, and run code in isolated browser sandboxes.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Icons.GraduationCap className="h-4 w-4" />
                      <p className="text-xs font-semibold text-slate-900">Teacher & Grading</p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                      Publish assignments, review submissions, and view student progress radar
                      charts.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800">Submit a Support Request</p>
                  <div className="mt-2 space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Issue Category
                      </label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="mt-0.5 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-emerald-400"
                      >
                        <option>Technical Issue / Bug</option>
                        <option>Curriculum / Coding Question</option>
                        <option>Account Access & Roles</option>
                        <option>School License & Seats</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Describe the problem
                      </label>
                      <textarea
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        rows={3}
                        placeholder="Explain what happened or what assistance you need…"
                        className="mt-0.5 w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <Icons.CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <h4 className="mt-2 text-sm font-semibold text-emerald-900">
                  Support Ticket Received
                </h4>
                <p className="mt-1 text-xs text-emerald-700">
                  Ticket <strong>#S2C-{Math.floor(1000 + Math.random() * 9000)}</strong> has been
                  registered. An educator support engineer will respond within 24 hours.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                setHelpOpen(false);
                setSupportSent(false);
                setSupportMessage("");
              }}
            >
              Close
            </Button>
            {!supportSent && (
              <Button
                onClick={() => {
                  if (!supportMessage.trim()) {
                    toast.error("Please provide a description of your request");
                    return;
                  }
                  setSupportSent(true);
                  toast.success("Support ticket submitted successfully!");
                }}
              >
                Submit Ticket
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
