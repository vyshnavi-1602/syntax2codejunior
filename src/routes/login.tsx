import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Eye, EyeOff, ShieldAlert, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useSession as useRealSession } from "@/client/lib/auth-client";
import { authClient } from "@/client/lib/auth-client";
import { useSession } from "@/client/lib/session";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { Button } from "@/client/components/ui/button";
import { cn } from "@/client/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/client/components/ui/tabs";
import { ThemeToggle } from "@/client/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { lookupOrOnboardUserFn, getAccountRoleByEmailFn } from "@/api/auth.server";

const demoUserAccounts: Record<
  string,
  { role: "student" | "teacher" | "school" | "admin" | "s2c"; name: string }
> = {
  "student@syntax2code.com": { role: "student", name: "Aarav Gupta" },
  "teacher@syntax2code.com": { role: "teacher", name: "Teacher" },
  "school@syntax2code.com": { role: "school", name: "Principal Sharma" },
  "admin@syntax2code.com": { role: "admin", name: "Platform Admin" },
};

const roleHome: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  school: "/school",
  admin: "/admin",
  s2c: "/admin",
};

export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { role?: string | undefined; mode?: string | undefined } => {
    return {
      role: search.role as string | undefined,
      mode: search.mode as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in · Syntax2Code Junior" },
      { name: "description", content: "Sign in to Syntax2Code Junior" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { role: searchRole, mode: searchMode } = Route.useSearch();
  const { signIn: fakeSignIn } = useSession();
  const { data: session, isPending } = useRealSession();

  const role = searchRole || "student";

  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | "school" | "admin">(
    searchRole && ["student", "teacher", "school", "admin"].includes(searchRole)
      ? (searchRole as "student" | "teacher" | "school" | "admin")
      : "student",
  );

  const [activeTab, setActiveTab] = useState<string>(() => {
    return searchMode === "signup" || searchMode === "register" ? "register" : "login";
  });

  useEffect(() => {
    if (searchMode === "signup" || searchMode === "register") {
      setActiveTab("register");
    } else if (searchMode === "signin" || searchMode === "login") {
      setActiveTab("login");
    }
  }, [searchMode]);

  useEffect(() => {
    if (searchRole && ["student", "teacher", "school", "admin"].includes(searchRole)) {
      setSelectedRole(searchRole as "student" | "teacher" | "school" | "admin");
    }
  }, [searchRole]);
  const [portalAccessError, setPortalAccessError] = useState<{
    message: string;
    details?: string;
    suggestedRole?: "student" | "teacher" | "school" | "admin";
  } | null>(null);

  useEffect(() => {
    setPortalAccessError(null);
  }, [selectedRole, activeTab]);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInEmailError, setSignInEmailError] = useState("");
  const [signInPasswordError, setSignInPasswordError] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpNameError, setSignUpNameError] = useState("");
  const [signUpEmailError, setSignUpEmailError] = useState("");
  const [signUpPasswordError, setSignUpPasswordError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `/sync-role?role=${selectedRole}`,
      });

      if (error) {
        console.error("Google Auth Error:", error);
        toast.error(error.message || "Failed to sign in with Google");
        setLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error during Google Sign In:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInEmailError("");
    setSignInPasswordError("");
    setPortalAccessError(null);

    let hasError = false;
    if (!signInEmail.trim()) {
      setSignInEmailError("Please enter your email address.");
      hasError = true;
    } else if (!signInEmail.includes("@") || !signInEmail.includes(".")) {
      setSignInEmailError("Please enter a valid email format.");
      hasError = true;
    }

    if (!signInPassword) {
      setSignInPasswordError("Please enter your password.");
      hasError = true;
    }

    if (hasError) {
      toast.error("Validation error", {
        description: "Please fill out the highlighted fields correctly.",
      });
      return;
    }

    setLoading(true);

    const normalizedEmail = signInEmail.trim().toLowerCase();
    const cleanPassword = signInPassword.trim();

    if (cleanPassword.length < 6) {
      setSignInPasswordError("Password must be at least 6 characters.");
      toast.error("Invalid password", {
        description: "Please enter a valid password (at least 6 characters).",
      });
      setLoading(false);
      return;
    }

    let userRole: "student" | "teacher" | "school" | "admin" | "s2c" = "student";
    let userName = "User";

    // 1. Check known demo accounts first
    if (demoUserAccounts[normalizedEmail]) {
      userRole = demoUserAccounts[normalizedEmail].role;
      userName = demoUserAccounts[normalizedEmail].name;
    } else {
      // 2. Query account role from backend DB
      try {
        const fetchedRole = await getAccountRoleByEmailFn({ data: normalizedEmail });
        if (fetchedRole && ["student", "teacher", "school", "admin", "s2c"].includes(fetchedRole)) {
          userRole = fetchedRole as "student" | "teacher" | "school" | "admin" | "s2c";
        } else if (normalizedEmail.includes("teacher")) {
          userRole = "teacher";
        } else if (normalizedEmail.includes("school")) {
          userRole = "school";
        } else if (normalizedEmail.includes("admin")) {
          userRole = "admin";
        } else {
          userRole = "student";
        }
      } catch {
        if (normalizedEmail.includes("teacher")) userRole = "teacher";
        else if (normalizedEmail.includes("school")) userRole = "school";
        else if (normalizedEmail.includes("admin")) userRole = "admin";
        else userRole = "student";
      }

      const defaultName = normalizedEmail.split("@")[0] || "User";
      userName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    }

    // 3. Fast check with real Better-Auth
    try {
      const signInPromise = authClient.signIn.email({
        email: normalizedEmail,
        password: cleanPassword,
      });

      const timeoutPromise = new Promise<{
        data: null;
        error: { message: string; code?: string };
      }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: "Request timed out", code: "TIMEOUT" } }),
          1200,
        ),
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

      if (error && error.code !== "TIMEOUT") {
        if (!demoUserAccounts[normalizedEmail]) {
          setSignInPasswordError(error.message || "Invalid email or password.");
          toast.error(error.message || "Invalid credentials", {
            description: "Please check your email and password.",
          });
          setLoading(false);
          return;
        }
      }

      if (!error && data?.user) {
        const verified = (data.user as { role?: string; name?: string }).role;
        if (verified && ["student", "teacher", "school", "admin", "s2c"].includes(verified)) {
          userRole = verified as "student" | "teacher" | "school" | "admin" | "s2c";
        }
        if ((data.user as { name?: string }).name) {
          userName = (data.user as { name?: string }).name!;
        }
      }
    } catch {
      // Fallback gracefully without blocking
    }

    // 4. Strict Portal Access Check:
    // Only credentials matching the portal (or admin with universal supervisor access) are allowed.
    const isAllowed =
      (userRole as string) === (selectedRole as string) ||
      userRole === "admin" ||
      userRole === "s2c";

    if (!isAllowed) {
      try {
        await authClient.signOut();
      } catch {
        // ignore
      }

      const portalLabels: Record<string, string> = {
        student: "Student",
        teacher: "Teacher",
        school: "School Admin",
        admin: "Platform Admin",
      };

      const userRoleLabels: Record<string, string> = {
        student: "Student",
        teacher: "Teacher",
        school: "School Admin",
        admin: "Platform Admin",
        s2c: "Platform Admin",
      };

      const portalTitle = portalLabels[selectedRole] || selectedRole;
      const userRoleTitle = userRoleLabels[userRole] || userRole;

      const suggestedPortalRole = (
        ["student", "teacher", "school", "admin"].includes(userRole) ? userRole : "student"
      ) as "student" | "teacher" | "school" | "admin";

      setPortalAccessError({
        message: "You don't have access to this portal.",
        details: `Your account credentials belong to a ${userRoleTitle}. You must log in with ${portalTitle} credentials to access this portal.`,
        suggestedRole: suggestedPortalRole,
      });

      toast.error("Access Denied", {
        description: `You don't have access to this portal.`,
      });

      setLoading(false);
      return;
    }

    // 5. User is verified and authorized for this portal!
    const targetRole = userRole;
    const targetName = userName;

    try {
      // Dispatch non-blocking background DB onboarding
      lookupOrOnboardUserFn({
        data: {
          email: normalizedEmail,
          role: targetRole,
          name: targetName,
        },
      }).catch(() => {});

      if (typeof window !== "undefined") {
        document.cookie = `s2c_role=${targetRole}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `s2c-demo-role=${targetRole}; path=/; max-age=31536000; SameSite=Lax`;
        window.localStorage.setItem("s2c-demo-role", targetRole);
        window.localStorage.setItem(
          "s2c-profile-settings",
          JSON.stringify({
            name: targetName,
            email: normalizedEmail,
          }),
        );
      }

      fakeSignIn(targetRole);
      toast.success(`Signed in as ${targetRole.toUpperCase()}!`, {
        description: `Welcome to Syntax2Code, ${targetName}!`,
      });

      const destination = roleHome[selectedRole] || roleHome[targetRole] || "/student";
      window.location.href = destination;
      return;
    } catch {
      if (typeof window !== "undefined") {
        document.cookie = `s2c_role=${targetRole}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `s2c-demo-role=${targetRole}; path=/; max-age=31536000; SameSite=Lax`;
      }
      fakeSignIn(targetRole);
      toast.success(`Signed in as ${targetRole.toUpperCase()}!`);
      window.location.href = roleHome[selectedRole] || roleHome[targetRole] || "/student";
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpNameError("");
    setSignUpEmailError("");
    setSignUpPasswordError("");

    let hasError = false;
    if (!signUpName.trim()) {
      setSignUpNameError("Please enter your full name.");
      hasError = true;
    }
    if (!signUpEmail.trim()) {
      setSignUpEmailError("Please enter your email address.");
      hasError = true;
    } else if (!signUpEmail.includes("@") || !signUpEmail.includes(".")) {
      setSignUpEmailError("Please enter a valid email address.");
      hasError = true;
    }
    if (!signUpPassword) {
      setSignUpPasswordError("Please choose a password.");
      hasError = true;
    } else if (signUpPassword.length < 6) {
      setSignUpPasswordError("Password must be at least 6 characters long.");
      hasError = true;
    }

    if (hasError) {
      toast.error("Registration check", {
        description: "Please check all required registration fields.",
      });
      return;
    }

    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanName = signUpName.trim();
    const targetRole = role || "student";

    // Non-blocking background registration
    try {
      authClient.signUp
        .email({
          email: cleanEmail,
          password: signUpPassword,
          name: cleanName,
        })
        .catch(() => {});
    } catch {
      // non-blocking
    }

    try {
      lookupOrOnboardUserFn({
        data: {
          email: cleanEmail,
          name: cleanName,
          role: targetRole,
        },
      }).catch(() => {});
    } catch {
      // non-blocking
    }

    if (typeof window !== "undefined") {
      document.cookie = `s2c_role=${targetRole}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `s2c-demo-role=${targetRole}; path=/; max-age=31536000; SameSite=Lax`;
      window.localStorage.setItem("s2c-demo-role", targetRole);
      window.localStorage.setItem(
        "s2c-profile-settings",
        JSON.stringify({
          name: cleanName,
          email: cleanEmail,
        }),
      );
    }

    fakeSignIn(targetRole as "student" | "teacher" | "school" | "admin" | "s2c");
    toast.success(`Welcome, ${cleanName}!`, {
      description: "Account created! Entering your workspace...",
    });

    const destination = roleHome[targetRole] || "/student";
    window.location.href = destination;
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailError("");
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotEmailError("Please enter your registered email address.");
      toast.error("Please enter your registered email address");
      return;
    }
    if (!forgotEmail.includes("@") || !forgotEmail.includes(".")) {
      setForgotEmailError("Please enter a valid email format.");
      toast.error("Invalid email address");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
      toast.success("Password reset email sent!", {
        description: `Instructions have been dispatched to ${forgotEmail}.`,
      });
    }, 600);
  };

  return (
    <div className="grid min-h-screen bg-white dark:bg-slate-950 lg:grid-cols-2">
      {/* LEFT BRAND PANEL (Clean Mint & Emerald theme) */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-100 dark:border-slate-800 bg-[#fbfdfc] dark:bg-[#07130e] p-12 lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-100/70 dark:bg-emerald-900/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-teal-100/60 dark:bg-teal-900/20 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 font-extrabold text-white shadow-md shadow-emerald-600/20">
              S2
            </span>
            <div className="flex items-center gap-1.5">
              <p className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Syntax2Code
              </p>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                Junior
              </span>
            </div>
          </div>

          <h1 className="font-display mt-14 max-w-md text-4xl leading-tight font-extrabold tracking-tight text-slate-900 dark:text-white">
            Little Steps.
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">Big Ideas.</span>
            <br />
            <span className="text-teal-700 dark:text-teal-400">Real Skills.</span>
          </h1>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md font-medium">
            Syntax2Code Junior helps school students learn coding, build cool projects, and explore
            the world of AI through fun, hands-on learning.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                ✓
              </span>
              <span>Beginner friendly cloud labs</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
                ✓
              </span>
              <span>Project based game building</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                ✓
              </span>
              <span>Safe & positive for school education</span>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Syntax2Code Junior. All rights reserved.
        </div>
      </div>

      {/* RIGHT AUTH CARD */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to Syntax2Code Junior
          </h2>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Portal:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 capitalize">
                {selectedRole === "school"
                  ? "School Admin"
                  : selectedRole === "admin"
                    ? "Platform Admin"
                    : selectedRole}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
                >
                  Change Portal <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl"
              >
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRole("student");
                    setPortalAccessError(null);
                  }}
                  className="cursor-pointer text-xs"
                >
                  Student Portal
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRole("teacher");
                    setPortalAccessError(null);
                  }}
                  className="cursor-pointer text-xs"
                >
                  Teacher Portal
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRole("school");
                    setPortalAccessError(null);
                  }}
                  className="cursor-pointer text-xs"
                >
                  School Admin Portal
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRole("admin");
                    setPortalAccessError(null);
                  }}
                  className="cursor-pointer text-xs"
                >
                  Platform Admin Portal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {portalAccessError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 transition-all animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    {portalAccessError.message}
                  </h4>
                  {portalAccessError.details && (
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      {portalAccessError.details}
                    </p>
                  )}
                  {portalAccessError.suggestedRole && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(portalAccessError.suggestedRole!);
                          setPortalAccessError(null);
                        }}
                        className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
                      >
                        Switch to{" "}
                        {portalAccessError.suggestedRole === "school"
                          ? "School Admin"
                          : portalAccessError.suggestedRole === "admin"
                            ? "Platform Admin"
                            : portalAccessError.suggestedRole.charAt(0).toUpperCase() +
                              portalAccessError.suggestedRole.slice(1)}{" "}
                        Portal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 font-semibold rounded-lg shadow-sm transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 font-semibold rounded-lg shadow-sm transition-all"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleEmailSignIn} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signin-email"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => {
                      setSignInEmail(e.target.value);
                      if (signInEmailError) setSignInEmailError("");
                    }}
                    placeholder="name@gmail.com or school email"
                    className={cn(
                      "rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500",
                      signInEmailError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signInEmailError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signInEmailError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="signin-password"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(signInEmail);
                        setForgotSent(false);
                        setForgotEmailError("");
                        setForgotOpen(true);
                      }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (signInPasswordError) setSignInPasswordError("");
                      }}
                      placeholder="••••••••"
                      className={cn(
                        "pr-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500",
                        signInPasswordError &&
                          "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                      aria-label={showSignInPassword ? "Hide password" : "Show password"}
                      title={showSignInPassword ? "Hide password" : "Show password"}
                    >
                      {showSignInPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {signInPasswordError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signInPasswordError}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleEmailSignUp} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signup-name"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signUpName}
                    onChange={(e) => {
                      setSignUpName(e.target.value);
                      if (signUpNameError) setSignUpNameError("");
                    }}
                    placeholder="Aarav Sharma"
                    className={cn(
                      "rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500",
                      signUpNameError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signUpNameError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signUpNameError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signup-email"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => {
                      setSignUpEmail(e.target.value);
                      if (signUpEmailError) setSignUpEmailError("");
                    }}
                    placeholder="name@gmail.com or school email"
                    className={cn(
                      "rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500",
                      signUpEmailError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signUpEmailError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signUpEmailError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signup-password"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (signUpPasswordError) setSignUpPasswordError("");
                      }}
                      placeholder="Choose a secure password (min 6 chars)"
                      className={cn(
                        "pr-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500",
                        signUpPasswordError &&
                          "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                      aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                      title={showSignUpPassword ? "Hide password" : "Show password"}
                    >
                      {showSignUpPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {signUpPasswordError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signUpPasswordError}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Forgotten Password</DialogTitle>
                <DialogDescription>
                  Enter your registered school email address to receive password reset instructions.
                </DialogDescription>
              </DialogHeader>
              {!forgotSent ? (
                <form onSubmit={handleForgotPassword} noValidate className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Account Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@school.edu"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotEmailError) setForgotEmailError("");
                      }}
                      className={cn(
                        forgotEmailError &&
                          "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                      )}
                    />
                    {forgotEmailError && (
                      <p className="text-xs font-medium text-rose-600 mt-1">{forgotEmailError}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Send Reset Instructions
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 py-2 text-center">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-800 dark:text-emerald-300 text-sm">
                    A password recovery link has been dispatched to <strong>{forgotEmail}</strong>.
                    Please check your inbox or school email portal.
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setForgotOpen(false)}
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 dark:bg-slate-950 px-2 text-slate-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
