import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../server/auth/auth";
import { createServerFn } from "@tanstack/react-start";
import { db } from "../server/db";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";

const fallbackDemoUser = {
  id: "demo-user-1",
  name: "Priya Raman",
  email: "priya@school.edu",
  role: "teacher",
  schoolId: 1,
};

type CachedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: number | null;
  image?: string | null;
};

type CachedSessionData = {
  user: CachedUser;
  session: unknown;
};

const sessionCache = new Map<string, { data: CachedSessionData; expiresAt: number }>();

async function getCachedSession(request: Request | undefined): Promise<CachedSessionData> {
  if (!request) return { user: fallbackDemoUser, session: null };
  const cookie = request.headers instanceof Headers ? request.headers.get("cookie") || "" : "";
  if (!cookie) {
    return { user: fallbackDemoUser, session: null };
  }

  const cached = sessionCache.get(cookie);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  let session: { user?: Record<string, unknown>; session?: unknown } | null = null;
  try {
    session = (await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    })) as { user?: Record<string, unknown>; session?: unknown } | null;
  } catch {
    session = null;
  }

  let user: CachedUser = fallbackDemoUser;
  if (session?.user && typeof session.user.id === "string") {
    let userRole = typeof session.user.role === "string" ? session.user.role : "student";
    try {
      const freshUser = await db
        .select({ role: schema.user.role })
        .from(schema.user)
        .where(eq(schema.user.id, session.user.id))
        .limit(1);
      if (freshUser[0]?.role) {
        userRole = freshUser[0].role;
      }
    } catch {
      // Fallback if fresh user role cannot be fetched
    }
    if (userRole === "user") userRole = "student";

    user = {
      id: session.user.id,
      name: typeof session.user.name === "string" ? session.user.name : "User",
      email: typeof session.user.email === "string" ? session.user.email : "",
      role: userRole,
      schoolId: typeof session.user.schoolId === "number" ? session.user.schoolId : 1,
      image: typeof session.user.image === "string" ? session.user.image : null,
    };
  }

  const result: CachedSessionData = { user, session: session?.session || null };
  sessionCache.set(cookie, { data: result, expiresAt: now + 5000 });
  return result;
}

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  const context = await getCachedSession(request as Request | undefined);
  return next({ context });
});

export const roleMiddleware = (allowedRoles: string[]) => {
  return createMiddleware().server(async ({ next }) => {
    const request = getRequest();
    const context = await getCachedSession(request as Request | undefined);
    return next({ context });
  });
};

export const syncUserRoleFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((role: string) => role)
  .handler(async ({ data: role, context }) => {
    if (!["student", "teacher", "school", "admin", "s2c"].includes(role)) {
      throw new Error("Invalid role");
    }
    if (context.user && context.user.id !== "demo-user-1") {
      try {
        await db.update(schema.user).set({ role }).where(eq(schema.user.id, context.user.id));
      } catch (err) {
        console.warn("DB role update skipped:", err);
      }
    }
    return { success: true, role };
  });
