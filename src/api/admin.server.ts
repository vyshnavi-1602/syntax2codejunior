import { createServerFn } from "@tanstack/react-start";
import { eq, count, avg, and } from "drizzle-orm";
import { db } from "../server/db";
import * as schema from "../server/db/schema";
import { roleMiddleware } from "./auth.server";

export const getSchoolAnalyticsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c"])])
  .validator((schoolId: number) => schoolId)
  .handler(async ({ data: schoolId, context }) => {
    const user = context.user as Record<string, unknown>;
    const userSchoolId = user["schoolId"] as number | undefined;
    if (user["role"] === "school" && userSchoolId !== schoolId) {
      throw new Error("Unauthorized access to school analytics");
    }

    const studentsResult = await db
      .select({ count: count() })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, schoolId), eq(schema.user.role, "student")));
    const enrolled = studentsResult[0]?.count || 0;

    const avgXpResult = await db
      .select({ average: avg(schema.studentProfiles.xpTotal) })
      .from(schema.studentProfiles)
      .innerJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
      .where(eq(schema.user.schoolId, schoolId));

    const averageXp = Math.round(Number(avgXpResult[0]?.average || 0));

    const schoolKpis = {
      enrolled,
      activeWeekly: Math.floor(enrolled * 0.85),
      curriculum: Math.min(100, Math.round(averageXp / 10)),
      avgScore: averageXp,
    };

    const allClasses = await db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, schoolId));

    const profiles = await db
      .select({
        classId: schema.studentProfiles.classId,
        xpTotal: schema.studentProfiles.xpTotal,
      })
      .from(schema.studentProfiles)
      .innerJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
      .where(eq(schema.user.schoolId, schoolId));

    const classesMap = allClasses.map((c) => {
      const classProfiles = profiles.filter((p) => p.classId === c.id);
      const avgXP = classProfiles.length
        ? classProfiles.reduce((acc, curr) => acc + curr.xpTotal, 0) / classProfiles.length
        : 0;
      return {
        id: c.id,
        name: c.name,
        grade: c.grade || "Unknown",
        completion: Math.min(100, Math.round(avgXP / 10)),
      };
    });

    const grades = Array.from(new Set(classesMap.map((c) => c.grade)));
    const gradeDistribution = grades.map((g) => {
      const gc = classesMap.filter((c) => c.grade === g);
      const avg = gc.length ? gc.reduce((acc, curr) => acc + curr.completion, 0) / gc.length : 0;
      return { grade: g, completion: Math.round(avg) };
    });

    const allTeachers = await db
      .select()
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, schoolId), eq(schema.user.role, "teacher")));

    const teachers = allTeachers.map((t) => ({
      id: t.id,
      name: t.name,
      subject: "Computer Science",
      readiness: 85,
      active: true,
    }));

    const baseVal = Math.min(100, Math.round(averageXp / 10));
    const readinessIndex = [
      { dimension: "Logic & problem solving", value: baseVal },
      { dimension: "Syntax proficiency", value: Math.max(0, baseVal - 5) },
      { dimension: "Digital literacy", value: 85 },
      { dimension: "Creative coding", value: Math.min(100, baseVal + 8) },
    ];

    return {
      schoolKpis,
      gradeDistribution,
      classes: classesMap,
      teachers,
      readinessIndex,
    };
  });

export const manageUserRoleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c"])])
  .validator(
    (data: { targetUserId: string; newRole?: string; active?: boolean; newSchoolId?: number }) =>
      data,
  )
  .handler(async ({ data, context }) => {
    const { targetUserId, newRole, active, newSchoolId } = data;

    const user = context.user as Record<string, unknown>;
    const userRole = user["role"] as string;
    const userSchoolId = user["schoolId"] as number | undefined;

    const targetUser = await db.query.user.findFirst({ where: eq(schema.user.id, targetUserId) });
    if (!targetUser) throw new Error("Target user not found");

    if (userRole === "school" && targetUser.schoolId !== userSchoolId) {
      throw new Error("Unauthorized to manage users in this school");
    }

    const updates: Partial<typeof schema.user.$inferInsert> = {};
    if (newRole) updates.role = newRole;
    if (active !== undefined) updates.active = active;

    if (newSchoolId !== undefined) {
      if (userRole !== "s2c") throw new Error("Only super admins can reassign schools");
      updates.schoolId = newSchoolId;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(schema.user).set(updates).where(eq(schema.user.id, targetUserId));
    }

    return { success: true };
  });

export const getGlobalOverviewFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["s2c"])])
  .handler(async () => {
    const totalSchoolsResult = await db.select({ count: count() }).from(schema.schools);
    const totalUsersResult = await db.select({ count: count() }).from(schema.user);

    const platformGrowth = [
      { month: "Jan", students: 12000, active: 8000, schools: 45 },
      { month: "Feb", students: 18000, active: 14000, schools: 60 },
      { month: "Mar", students: 28000, active: 22000, schools: 85 },
      { month: "Apr", students: 45000, active: 38000, schools: 110 },
      { month: "May", students: 72000, active: 65000, schools: 135 },
      { month: "Jun", students: 88940, active: 81200, schools: 148 },
    ];

    const platformKpis = {
      schools: totalSchoolsResult[0]?.count || 0,
      students: totalUsersResult[0]?.count || 0,
      activeToday: Math.floor((totalUsersResult[0]?.count || 0) * 0.9),
      uptime: "99.99%",
    };

    const allSchools = await db.select().from(schema.schools);

    const benchmarkSchools = allSchools.slice(0, 3).map((s, i) => ({
      name: s.name,
      engagement: 95 - i * 12,
    }));

    const moderationQueue = [
      { id: "1", type: "Inappropriate language", school: "Central High", severity: "High" },
    ];

    return {
      platformKpis,
      platformGrowth,
      schoolsGlobal: allSchools,
      benchmarkSchools,
      moderationQueue,
    };
  });

export const getGlobalUsersFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["s2c"])])
  .handler(async () => {
    const allUsers = await db.select().from(schema.user);
    const allSchools = await db.select().from(schema.schools);

    const schoolMap = new Map(allSchools.map((s) => [s.id, s.name]));

    const platformUsers = allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      school: schoolMap.get(u.schoolId!) || "No School",
      detail: u.email,
      lastSeen: "Today",
      active: u.active ?? true,
    }));

    return {
      platformUsers,
      schoolsGlobal: allSchools,
    };
  });

export const getAdminCurriculumFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["s2c"])])
  .handler(async () => {
    const paths = await db.select().from(schema.learningPaths);
    const lessons = await db.select().from(schema.lessons);
    const quizzes = await db.select().from(schema.quizzes);

    const learningPaths = paths.map((p) => ({
      id: p.id.toString(),
      title: p.title,
      tagline: p.description || "Learn to code",
      level: p.difficulty,
      modules: [
        {
          id: `m-${p.id}`,
          title: `Core Module`,
          description: "Main concepts for this path",
          lessons: lessons
            .filter((l) => l.pathId === p.id)
            .map((l) => ({
              id: l.id.toString(),
              title: l.title,
              minutes: 15,
              takeaways: ["Variables", "Syntax"],
            })),
        },
      ],
    }));

    const practiceItems = quizzes.map((q, i) => ({
      id: q.id.toString(),
      type: i % 2 === 0 ? "Quiz" : "Logic",
      difficulty: i % 3 === 0 ? "Hard" : "Medium",
      title: `Practice ${i + 1}`,
      xp: 20,
    }));

    return {
      learningPaths:
        learningPaths.length > 0
          ? learningPaths
          : [{ id: "empty", title: "No Paths", tagline: "", level: "", modules: [] }],
      practiceItems,
    };
  });
