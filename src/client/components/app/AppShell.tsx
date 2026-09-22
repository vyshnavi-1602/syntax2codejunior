import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/client/lib/utils";
import { useSession } from "@/client/lib/session";
import { navByRole } from "./nav";

const demoUsers: any = [];
const notifications: any = [];
const roleHome: any = [];
const roleLabels: any = [];
export type RoleId = any;
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
  lab: "Coding Lab",
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

  useEffect(() => {
    if (!ready) return;
    if (!role) navigate({ to: "/login" });
    else if (role !== allow) navigate({ to: roleHome[role] });
  }, [ready, role, allow, navigate]);

  if (!ready || !user || role !== allow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading your workspace…
      </div>
    );
  }

  const groups = navByRole[allow];
  const crumbs = pathname.split("/").filter(Boolean);
  const notes = notifications[allow];

  const closeAll = () => {
    setNotifOpen(false);
    setMenuOpen(false);
    setRoleOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800">
      <div className="flex">
        {}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
            mobileNav ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-sm font-bold text-white">
              S2
            </span>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight text-slate-900">
                Syntax2Code
              </p>
              <p className="text-[11px] text-slate-500">Schools Platform</p>
            </div>
          </div>
          <nav className="h-[calc(100vh-4rem)] space-y-6 overflow-y-auto px-3 py-5">
            {groups?.map((g) => (
              <div key={g.group}>
                <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {g.group}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((item) => {
                    const active =
                      pathname === item.to ||
                      (item.to !== roleHome[allow] && pathname.startsWith(item.to));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileNav(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <Icon name={item.icon} className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-teal-50 p-4">
              <p className="text-xs font-semibold text-slate-900">Demo environment</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                All data shown is realistic sample data for {user.school}.
              </p>
            </div>
          </nav>
        </aside>

        {}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                onClick={() => setMobileNav((m) => !m)}
              >
                <Icons.Menu className="h-5 w-5" />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(`Searching for "${search || "everything"}"`, {
                    description: "12 lessons, 4 projects and 3 students matched.",
                  });
                }}
                className="relative hidden max-w-sm flex-1 md:block"
              >
                <Icons.Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search lessons, students, projects…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </form>

              <div className="ml-auto flex items-center gap-2">
                {}
                <div className="relative">
                  <button
                    onClick={() => {
                      closeAll();
                      setRoleOpen((o) => !o);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Icons.Repeat className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Switch Demo Role ·</span> {roleLabels[allow]}
                    <Icons.ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {roleOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <p className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                        Demo personas
                      </p>
                      {demoUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            signIn(u.role);
                            setRoleOpen(false);
                            navigate({ to: roleHome[u.role] });
                            toast.success(`Now viewing as ${u.name}`, {
                              description: roleLabels[u.role],
                            });
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                            u.role === allow && "bg-indigo-50/60",
                          )}
                        >
                          <Avatar initials={u.avatar} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-900">
                              {u.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {u.subtitle}
                            </span>
                          </span>
                          {u.role === allow && (
                            <Icons.Check className="ml-auto h-4 w-4 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {}
                <div className="relative">
                  <button
                    onClick={() => {
                      closeAll();
                      setNotifOpen((o) => !o);
                    }}
                    className="relative rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    <Icons.Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500" />
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                        <p className="text-xs font-semibold text-slate-900">Notifications</p>
                        <button
                          className="text-[11px] font-medium text-indigo-600 hover:underline"
                          onClick={() => {
                            setNotifOpen(false);
                            toast.success("All notifications marked as read");
                          }}
                        >
                          Mark all read
                        </button>
                      </div>
                      {notes.map((n) => (
                        <div
                          key={n.title}
                          className="border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"
                        >
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.body}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{n.when}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {}
                <div className="relative">
                  <button
                    onClick={() => {
                      closeAll();
                      setMenuOpen((o) => !o);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pr-2.5 pl-1.5 transition-colors hover:bg-slate-50"
                  >
                    <Avatar initials={user.avatar} size="sm" />
                    <span className="hidden text-left sm:block">
                      <span className="block text-xs font-semibold text-slate-900">
                        {user.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">{roleLabels[allow]}</span>
                    </span>
                    <Icons.ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setMenuOpen(false);
                          toast("Account settings", {
                            description: "Profile preferences opened in demo mode.",
                          });
                        }}
                      >
                        <Icons.Settings className="h-4 w-4" /> Account settings
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setMenuOpen(false);
                          toast("Help center", {
                            description: "Guides, onboarding videos and support chat.",
                          });
                        }}
                      >
                        <Icons.LifeBuoy className="h-4 w-4" /> Help & support
                      </button>
                      <button
                        className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/60"
                        onClick={() => {
                          signOut();
                          navigate({ to: "/login" });
                        }}
                      >
                        <Icons.LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 lg:px-8">
              <Link to={roleHome[allow]} className="hover:text-indigo-600">
                {user.school}
              </Link>
              {crumbs.map((c, i) => (
                <span key={`${c}-${i}`} className="flex items-center gap-1.5">
                  <Icons.ChevronRight className="h-3 w-3 text-slate-300" />
                  <span className={cn(i === crumbs.length - 1 && "font-medium text-slate-700")}>
                    {labelFor[c] ?? c.replace(/-/g, " ")}
                  </span>
                </span>
              ))}
            </div>
          </header>

          <main className="space-y-6 px-4 py-6 lg:px-8 lg:py-8" onClick={closeAll}>
            {children}
          </main>
        </div>
      </div>
      {allow === "student" && <FloatingCompanion />}
    </div>
  );
}
