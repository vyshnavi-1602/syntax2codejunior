import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../auth/auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  if (!request) {
    throw new Error("No web request available");
  }

  const session = await auth.api.getSession({
    headers: request.headers as unknown as Headers,
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return next({
    context: {
      user: session.user,
      session: session.session,
    },
  });
});

export const roleMiddleware = (allowedRoles: string[]) => {
  return createMiddleware().server(async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session) throw new Error("Unauthorized");

    const user = session.user as Record<string, unknown>;
    const userRole = (user["role"] as string) || "student";

    if (!allowedRoles.includes(userRole)) {
      throw new Error("Forbidden: Insufficient role");
    }

    return next({
      context: {
        user: session.user,
        session: session.session,
      },
    });
  });
};
