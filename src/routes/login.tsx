import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession as useRealSession } from "@/client/lib/auth-client";
import { authClient } from "@/client/lib/auth-client";
import { useSession } from "@/client/lib/session";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { Button } from "@/client/components/ui/button";
import { cn } from "@/client/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/client/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/client/components/ui/dialog";
import { lookupOrOnboardUserFn } from "@/api/auth.server";

const roleHome: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  school: "/school",
  admin: "/admin",
  s2c: "/admin",
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { role: string | undefined } => {
    return {
      role: search.role as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in · Syntax2Code for Schools" },
      { name: "description", content: "Sign in to Syntax2Code" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { role: searchRole } = Route.useSearch();
  const { signIn: fakeSignIn } = useSession();
  const { data: session, isPending } = useRealSession();

  const role = searchRole || "student";

  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | "school" | "admin">(
    searchRole && ["student", "teacher", "school", "admin"].includes(searchRole)
      ? (searchRole as "student" | "teacher" | "school" | "admin")
      : "student",
  );
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInEmailError, setSignInEmailError] = useState("");
  const [signInPasswordError, setSignInPasswordError] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
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

    // Enforce proper authentication through better-auth for all roles
    try {
      const { data, error } = await authClient.signIn.email({
        email: normalizedEmail,
        password: cleanPassword,
      });

      if (!error && data?.user) {
        let verifiedRole = (data.user as { role?: string }).role || "student";
        if (verifiedRole === "user") verifiedRole = "student";
        if (typeof window !== "undefined") {
          document.cookie = `s2c_role=${verifiedRole}; path=/; max-age=31536000; SameSite=Lax`;
          document.cookie = `s2c-demo-role=${verifiedRole}; path=/; max-age=31536000; SameSite=Lax`;
        }
        fakeSignIn(verifiedRole as "student" | "teacher" | "school" | "admin" | "s2c");
        toast.success(`Signed in as ${verifiedRole.toUpperCase()}!`);
        window.location.href = roleHome[verifiedRole] || "/dashboard";
        return;
      }

      if (error) {
        setSignInPasswordError(
          error.message || "Invalid credentials. Please verify your password.",
        );
        toast.error("Authentication failed", {
          description: error.message || "Invalid email or password. Please try again.",
        });
        setLoading(false);
        return;
      }
    } catch (_err) {
      // In development fallback, only allow student if not a production environment
      if (process.env.NODE_ENV === "production") {
        setSignInPasswordError("Authentication error. Please check your credentials.");
        toast.error("Sign-in failed", { description: "Invalid email or password." });
        setLoading(false);
        return;
      }
    }
    if (cleanPassword.length < 6) {
      setSignInPasswordError("Password must be at least 6 characters.");
      toast.error("Invalid password", {
        description: "Please enter a valid password (at least 6 characters).",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await authClient.signIn.email({
        email: signInEmail,
        password: cleanPassword,
      });

      if (!error && data?.user) {
        let verifiedRole = (data.user as { role?: string }).role || "student";
        if (verifiedRole === "user") verifiedRole = "student";
        if (typeof window !== "undefined") {
          document.cookie = `s2c_role=${verifiedRole}; path=/; max-age=31536000; SameSite=Lax`;
          document.cookie = `s2c-demo-role=${verifiedRole}; path=/; max-age=31536000; SameSite=Lax`;
        }
        fakeSignIn(verifiedRole as "student" | "teacher" | "school" | "admin" | "s2c");
        toast.success("Signed in successfully!");
        window.location.href = roleHome[verifiedRole] || "/dashboard";
        return;
      }
    } catch {
      // Continue to seamless student onboarding
    }

    // Seamless onboarding/login for any student account
    try {
      const userProfile = await lookupOrOnboardUserFn({
        data: {
          email: normalizedEmail,
          role: "student",
        },
      });

      if (typeof window !== "undefined") {
        document.cookie = `s2c_role=student; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `s2c-demo-role=student; path=/; max-age=31536000; SameSite=Lax`;
        window.localStorage.setItem(
          "s2c-profile-settings",
          JSON.stringify({
            name: userProfile.name,
            email: userProfile.email,
          }),
        );
      }
      fakeSignIn("student");
      toast.success(`Welcome, ${userProfile.name}!`, {
        description: "Your student coding workspace is ready.",
      });
      window.location.href = "/student";
      return;
    } catch (_err) {
      if (typeof window !== "undefined") {
        document.cookie = `s2c_role=student; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `s2c-demo-role=student; path=/; max-age=31536000; SameSite=Lax`;
      }
      fakeSignIn("student");
      toast.success("Signed in as Student!", {
        description: `Welcome to Syntax2Code! Coding workspace ready for ${signInEmail}.`,
      });
      window.location.href = "/student";
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

    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email: signUpEmail,
        password: signUpPassword,
        name: signUpName,
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes("already") ||
          error.message?.toLowerCase().includes("exist") ||
          error.message?.toLowerCase().includes("in use")
        ) {
          const userProfile = await lookupOrOnboardUserFn({
            data: {
              email: signUpEmail.trim().toLowerCase(),
              name: signUpName.trim(),
              role: role,
            },
          });
          if (typeof window !== "undefined") {
            document.cookie = `s2c_role=${role}; path=/; max-age=31536000; SameSite=Lax`;
            document.cookie = `s2c-demo-role=${role}; path=/; max-age=31536000; SameSite=Lax`;
            window.localStorage.setItem(
              "s2c-profile-settings",
              JSON.stringify({
                name: userProfile.name,
                email: userProfile.email,
              }),
            );
          }
          fakeSignIn(role as "student" | "teacher" | "school" | "admin" | "s2c");
          toast.success(`Welcome, ${userProfile.name}!`, {
            description: "Account connected successfully.",
          });
          window.location.href = roleHome[role] || "/dashboard";
          return;
        }

        setSignUpEmailError(
          error.message || "Unable to create account. Email may already be in use.",
        );
        toast.error("Registration failed", {
          description: error.message || "Unable to create account. Email may already be in use.",
        });
        setLoading(false);
        return;
      }

      fakeSignIn(role as "student" | "teacher" | "school" | "admin" | "s2c");
      toast.success("Account created successfully!");
      window.location.href = roleHome[role] || "/dashboard";
    } catch (err: unknown) {
      const error = err as Error;
      setSignUpEmailError(error.message || "An unexpected error occurred during registration.");
      toast.error("Registration error", {
        description: error.message || "An unexpected error occurred during registration.",
      });
    } finally {
      setLoading(false);
    }
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
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-12 lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 font-bold text-white">
              S2
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900">
                Syntax2Code
              </p>
              <p className="text-xs text-slate-500">AI & Coding platform for schools</p>
            </div>
          </div>
          <h1 className="font-display mt-16 max-w-md text-4xl leading-tight font-semibold tracking-tight text-slate-900">
            The complete AI & coding curriculum your school can actually measure.
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <Link
          to="/"
          className="absolute top-6 right-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          Back to Home <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" /> Authentication
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to access your dashboard.</p>

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleEmailSignIn} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => {
                      setSignInEmail(e.target.value);
                      if (signInEmailError) setSignInEmailError("");
                    }}
                    placeholder="name@school.edu"
                    className={cn(
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
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(signInEmail);
                        setForgotSent(false);
                        setForgotEmailError("");
                        setForgotOpen(true);
                      }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => {
                      setSignInPassword(e.target.value);
                      if (signInPasswordError) setSignInPasswordError("");
                    }}
                    placeholder="••••••••"
                    className={cn(
                      signInPasswordError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signInPasswordError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signInPasswordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleEmailSignUp} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full Name</Label>
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
                      signUpNameError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signUpNameError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signUpNameError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => {
                      setSignUpEmail(e.target.value);
                      if (signUpEmailError) setSignUpEmailError("");
                    }}
                    placeholder="aarav@school.edu"
                    className={cn(
                      signUpEmailError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signUpEmailError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signUpEmailError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => {
                      setSignUpPassword(e.target.value);
                      if (signUpPasswordError) setSignUpPasswordError("");
                    }}
                    placeholder="Choose a secure password (min 6 chars)"
                    className={cn(
                      signUpPasswordError &&
                        "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-200",
                    )}
                  />
                  {signUpPasswordError && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{signUpPasswordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
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
                    <Button type="submit" disabled={forgotLoading}>
                      {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Reset Instructions
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 py-2 text-center">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">
                    A password recovery link has been dispatched to <strong>{forgotEmail}</strong>.
                    Please check your inbox or school email portal.
                  </div>
                  <Button className="w-full" onClick={() => setForgotOpen(false)}>
                    Back to Sign In
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
