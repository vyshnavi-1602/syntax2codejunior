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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/client/components/ui/tabs";

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

  // Use the search role or default to student
  const role = searchRole || "student";
  const ready = !isPending;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (ready && session?.user) {
      navigate({ to: roleHome[role] || "/dashboard" });
    }
  }, [ready, session, role, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    // Remember the chosen portal role before leaving for Google auth
    fakeSignIn(role as "student" | "teacher" | "school" | "admin" | "s2c");
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: roleHome[role] || "/dashboard",
      });

      if (error) {
        console.error("Google Auth Error:", error);
        toast.error(error.message || "Failed to sign in with Google");
        setLoading(false);
      }
      // If successful, better-auth will handle the redirect to Google
    } catch (err) {
      console.error("Unexpected error during Google Sign In:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    // For demo purposes, we bypass better-auth and just log them in
    fakeSignIn(role as "student" | "teacher" | "school" | "admin" | "s2c");
    navigate({ to: roleHome[role] || "/dashboard" });
    setLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    // For demo purposes, we bypass better-auth and just log them in
    fakeSignIn(role as "student" | "teacher" | "school" | "admin" | "s2c");
    navigate({ to: roleHome[role] || "/dashboard" });
    setLoading(false);
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
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
