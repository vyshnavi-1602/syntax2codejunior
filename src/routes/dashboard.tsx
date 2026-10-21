import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/client/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    try {
      const { data: session } = await authClient.getSession();

      if (session?.user) {
        const user = session.user as Record<string, unknown>;
        const role = (user["role"] as string) || "student";
        const targetRoute =
          role === "teacher"
            ? "/teacher"
            : role === "school"
              ? "/school"
              : role === "admin"
                ? "/admin"
                : "/student";
        throw redirect({
          to: targetRoute,
        });
      }
    } catch (err) {
      if ((err as { to?: string })?.to) throw err;
    }

    if (typeof window !== "undefined") {
      const storedRole = window.localStorage.getItem("s2c-demo-role");
      if (storedRole && ["student", "teacher", "school", "admin"].includes(storedRole)) {
        const targetRoute =
          storedRole === "teacher"
            ? "/teacher"
            : storedRole === "school"
              ? "/school"
              : storedRole === "admin"
                ? "/admin"
                : "/student";
        throw redirect({
          to: targetRoute,
        });
      }
    }

    throw redirect({
      to: "/login",
      search: { role: undefined },
    });
  },
});
