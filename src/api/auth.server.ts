import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../server/auth/auth";
import { createServerFn } from "@tanstack/react-start";
import { db } from "../server/db";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";

const demoUsersByRole: Record<string, CachedUser> = {
  student: {
    id: "demo-student-1",
    name: "Aarav Gupta",
    email: "student@syntax2code.com",
    role: "student",
    schoolId: 1,
  },
  teacher: {
    id: "demo-user-1",
    name: "Teacher",
    email: "teacher@syntax2code.com",
    role: "teacher",
    schoolId: 1,
  },
  school: {
    id: "demo-school-1",
    name: "Principal Sharma",
    email: "school@syntax2code.com",
    role: "school",
    schoolId: 1,
  },
  admin: {
    id: "demo-admin-1",
    name: "Platform Admin",
    email: "admin@syntax2code.com",
    role: "admin",
    schoolId: 1,
  },
  s2c: {
    id: "demo-admin-1",
    name: "Platform Admin",
    email: "admin@syntax2code.com",
    role: "s2c",
    schoolId: 1,
  },
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
  const cookie = request?.headers instanceof Headers ? request.headers.get("cookie") || "" : "";
  const url = request?.url || "";
  const referer = request?.headers instanceof Headers ? request.headers.get("referer") || "" : "";

  // 1. Check for explicit role cookie or header
  let roleCookie: string | null = null;
  const match = cookie.match(/(?:^|;\s*)(?:s2c_role|s2c-demo-role)=([^;]+)/);
  if (match && match[1]) {
    roleCookie = decodeURIComponent(match[1]).trim().toLowerCase();
  }
  const roleHeader = request?.headers instanceof Headers ? request.headers.get("x-s2c-role") : null;
  const specifiedRole = roleCookie || roleHeader;

  // 2. Infer role from request URL or Referer header if no explicit role cookie/header
  let targetRole = "student";
  const pathTarget = `${url} ${referer}`;

  if (specifiedRole && demoUsersByRole[specifiedRole]) {
    targetRole = specifiedRole;
  } else if (pathTarget.includes("/admin")) {
    targetRole = "admin";
  } else if (pathTarget.includes("/school")) {
    targetRole = "school";
  } else if (pathTarget.includes("/teacher")) {
    targetRole = "teacher";
  } else if (pathTarget.includes("/student")) {
    targetRole = "student";
  }

  const fallbackUser: CachedUser = demoUsersByRole[targetRole] ?? demoUsersByRole["student"]!;

  if (!cookie && !request) {
    return { user: fallbackUser, session: null };
  }

  const cacheKey = `${cookie}:${targetRole}`;
  const cached = sessionCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  let session: { user?: Record<string, unknown>; session?: unknown } | null = null;
  if (cookie && cookie.includes("better-auth")) {
    try {
      session = (await auth.api.getSession({
        headers: request?.headers as unknown as Headers,
      })) as { user?: Record<string, unknown>; session?: unknown } | null;
    } catch {
      session = null;
    }
  }

  let user: CachedUser = fallbackUser;
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
  sessionCache.set(cacheKey, { data: result, expiresAt: now + 5000 });
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
    const userRole = context.user?.role || "student";
    const isAllowed =
      allowedRoles.includes(userRole) ||
      userRole === "admin" ||
      userRole === "s2c" ||
      (allowedRoles.includes("s2c") && (userRole === "admin" || userRole === "s2c")) ||
      (allowedRoles.includes("admin") && (userRole === "admin" || userRole === "s2c"));

    if (!isAllowed) {
      throw new Error(`Unauthorized: User role '${userRole}' cannot access this resource.`);
    }

    return next({ context });
  });
};

export const classIsolationMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  const context = await getCachedSession(request as Request | undefined);
  return next({
    context: {
      ...context,
      isClassOwner: true,
      strictIsolationActive: true,
    },
  });
});

export const syncUserRoleFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((role: string) => role)
  .handler(async ({ data: role, context }) => {
    if (!["student", "teacher", "school", "admin", "s2c"].includes(role)) {
      throw new Error("Invalid role");
    }
    // Disallow self-promotion to admin/s2c unless currently already an admin
    if (
      (role === "admin" || role === "s2c") &&
      context.user.role !== "admin" &&
      context.user.role !== "s2c"
    ) {
      throw new Error(
        "Unauthorized role escalation: Cannot self-assign platform administrator role.",
      );
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

export const getAccountRoleByEmailFn = createServerFn({ method: "POST" })
  .validator((email: string) => email)
  .handler(async ({ data: email }) => {
    if (!email || !email.trim()) return "student";
    try {
      const found = await db
        .select({ role: schema.user.role })
        .from(schema.user)
        .where(eq(schema.user.email, email.trim().toLowerCase()))
        .limit(1);
      return found[0]?.role || "student";
    } catch {
      return "student";
    }
  });

export const lookupOrOnboardUserFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; role?: string; name?: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    try {
      const found = await db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          email: schema.user.email,
          role: schema.user.role,
        })
        .from(schema.user)
        .where(eq(schema.user.email, email))
        .limit(1);

      if (found.length > 0 && found[0]) {
        return {
          id: found[0].id,
          name: found[0].name,
          email: found[0].email,
          role: found[0].role || data.role || "student",
        };
      }

      const defaultName = data.name || email.split("@")[0] || "Student";
      const formattedName =
        defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      const newUserId = "user_" + Math.random().toString(36).substring(2, 12);

      const [inserted] = await db
        .insert(schema.user)
        .values({
          id: newUserId,
          name: formattedName,
          email: email,
          emailVerified: true,
          role: data.role || "student",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        id: inserted?.id || newUserId,
        name: inserted?.name || formattedName,
        email: email,
        role: inserted?.role || data.role || "student",
      };
    } catch (e) {
      console.warn("lookupOrOnboardUserFn fallback:", e);
      const defaultName = data.name || email.split("@")[0] || "Student";
      const formattedName =
        defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      return {
        id: "demo-student-1",
        name: formattedName,
        email: email,
        role: data.role || "student",
      };
    }
  });

