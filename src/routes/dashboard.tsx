import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/client/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
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
    } else {
      throw redirect({
        to: "/login",
      });
    }
  },
});
