import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../server/auth/auth";
import { createServerFn } from "@tanstack/react-start";
import { db } from "../server/db";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";
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

    const user = session.user;

    // Fetch fresh role from DB to bypass better-auth session caching
    const freshUser = await db
      .select({ role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.id, user.id))
      .limit(1);
    let userRole = freshUser[0]?.role || "student";

    // better-auth defaults to "user", map it to "student"
    if (userRole === "user") {
      userRole = "student";
    }

    if (!allowedRoles.includes(userRole)) {
      throw new Error(
        `Forbidden: Insufficient role (found ${userRole}, expected ${allowedRoles.join(", ")})`,
      );
    }

    return next({
      context: {
        user: session.user,
        session: session.session,
      },
    });
  });
};

export const syncUserRoleFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((role: string) => role)
  .handler(async ({ data: role, context }) => {
    if (!["student", "teacher", "school", "admin", "s2c"].includes(role)) {
      throw new Error("Invalid role");
    }
    await db.update(schema.user).set({ role }).where(eq(schema.user.id, context.user.id));
    return { success: true, role };
  });
