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

const initialNotifications: Record<string, any[]> = {
  student: [{ title: "New Assignment", body: "Check your python lab.", when: "1h ago" }],
  teacher: [{ title: "New Submission", body: "Aarav submitted project.", when: "2h ago" }],
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

  const [notes, setNotes] = useState(initialNotifications[allow] || []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setNotes(initialNotifications[allow] || []);
  }, [allow]);

  useEffect(() => {
    if (!ready) return;
    if (!role) navigate({ to: "/login", search: { role: allow } });
    else if (role !== allow) navigate({ to: roleHome[role] || "/dashboard" });
  }, [ready, role, allow, navigate]);

  if (!ready || !user || role !== allow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-sm text-slate-500 gap-4">
        <div>Loading your workspace…</div>
        <div className="text-xs opacity-50">
          Debug: ready={ready ? "true" : "false"}, role={role || "null"}, allow={allow}, user=
          {user ? "true" : "null"}
        </div>
        <button
          onClick={() => {
            window.localStorage.clear();
            window.location.href = "/login";
          }}
          className="rounded bg-indigo-100 px-4 py-2 text-indigo-700 hover:bg-indigo-200"
        >
          Reset Session
        </button>
      </div>
    );
  }

  const groups = navByRole[allow];
  const crumbs = pathname.split("/").filter(Boolean);

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
                {/* Demo Role Switcher Removed */}

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
                            setNotes([]);
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
                      <span className="block text-[11px] text-slate-500">{roleLabels[role || allow]}</span>
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
                          setSettingsOpen(true);
                        }}
                      >
                        <Icons.Settings className="h-4 w-4" /> Account settings
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setMenuOpen(false);
                          setHelpOpen(true);
                        }}
                      >
                        <Icons.LifeBuoy className="h-4 w-4" /> Help & support
                      </button>
                      <button
                        className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/60"
                        onClick={async () => {
                          try {
                            await authClient.signOut();
                          } catch (error) {
                            console.error("Sign out error", error);
                          } finally {
                            signOut();
                            navigate({ to: "/login", search: { role: allow } });
                          }
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
              <Link to={roleHome[allow] || "/dashboard"} className="hover:text-indigo-600">
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

      {/* Account Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>Manage your preferences and profile details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">School</p>
              <p className="text-sm text-slate-500">{user.school}</p>
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium">Theme Preference</p>
              <p className="text-xs text-slate-500">Currently locked to System Default in demo.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSettingsOpen(false)}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>Need assistance? We're here to help.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <a href="#" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50">
              <Icons.BookOpen className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">Documentation</p>
                <p className="text-xs text-slate-500">Read guides and tutorials.</p>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50">
              <Icons.MessageCircle className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">Contact Support</p>
                <p className="text-xs text-slate-500">Chat with our technical team.</p>
              </div>
            </a>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setHelpOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
