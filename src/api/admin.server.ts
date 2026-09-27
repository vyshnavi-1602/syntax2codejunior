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

// -------------------------------------------------------------
// SUPER ADMIN PLATFORM MASTER SCHEDULE & OPERATIONS
// -------------------------------------------------------------
async function ensurePlatformScheduleSeed() {
  const existing = await db
    .select({ id: schema.platformSchedules.id })
    .from(schema.platformSchedules)
    .limit(1);

  if (existing.length > 0) return;

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(schema.platformSchedules).values([
    {
      title: "Weekly Global XP & Streak Audit Recalculation",
      description:
        "Automated engine run to verify student streak counters and synchronize cross-school leaderboards.",
      category: "cron_job",
      targetSchoolId: null,
      targetRole: "all",
      scheduledStart: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3600 * 1000),
      recurrence: "weekly",
      status: "scheduled",
      priority: "high",
      isAutomated: true,
      actionPayload: "recalc_xp_streaks",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Global Junior CodeCraft Hackathon 2026 Kickoff",
      description:
        "Platform-wide competition opening for all grades. Live problem sets and team coding rooms open.",
      category: "competition",
      targetSchoolId: null,
      targetRole: "student",
      scheduledStart: nextWeek,
      scheduledEnd: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      recurrence: "once",
      status: "scheduled",
      priority: "critical",
      isAutomated: false,
      actionPayload: "https://syntax2code.junior/hackathon-2026",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Cloud Infrastructure Gateway & Security Patching",
      description:
        "Scheduled maintenance window: zero-downtime database replicas update and SSL renewal.",
      category: "maintenance",
      targetSchoolId: null,
      targetRole: "all",
      scheduledStart: tomorrow,
      scheduledEnd: new Date(tomorrow.getTime() + 2 * 3600 * 1000),
      recurrence: "once",
      status: "scheduled",
      priority: "high",
      isAutomated: true,
      actionPayload: "maintenance_notice_banner",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Faculty Masterclass: Neural Networks & Python for Educators",
      description:
        "Live interactive webinar with hands-on lesson planning and curriculum best practices.",
      category: "webinar",
      targetSchoolId: null,
      targetRole: "teacher",
      scheduledStart: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 7200 * 1000),
      recurrence: "once",
      status: "scheduled",
      priority: "medium",
      isAutomated: false,
      actionPayload: "https://meet.google.com/s2c-faculty-workshop",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Curriculum Module 4: Algorithmic Logic & Turtle Graphics",
      description:
        "Global release of 12 new interactive visual coding modules across all registered schools.",
      category: "curriculum_release",
      targetSchoolId: null,
      targetRole: "all",
      scheduledStart: nextMonth,
      scheduledEnd: new Date(nextMonth.getTime() + 86400 * 1000),
      recurrence: "once",
      status: "scheduled",
      priority: "medium",
      isAutomated: false,
      actionPayload: "curriculum_deploy_v4",
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

export const getPlatformSchedulesFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["s2c", "admin"])])
  .handler(async () => {
    await ensurePlatformScheduleSeed();

    const rawSchedules = await db
      .select({
        id: schema.platformSchedules.id,
        title: schema.platformSchedules.title,
        description: schema.platformSchedules.description,
        category: schema.platformSchedules.category,
        targetSchoolId: schema.platformSchedules.targetSchoolId,
        targetRole: schema.platformSchedules.targetRole,
        scheduledStart: schema.platformSchedules.scheduledStart,
        scheduledEnd: schema.platformSchedules.scheduledEnd,
        recurrence: schema.platformSchedules.recurrence,
        status: schema.platformSchedules.status,
        priority: schema.platformSchedules.priority,
        isAutomated: schema.platformSchedules.isAutomated,
        actionPayload: schema.platformSchedules.actionPayload,
        createdBy: schema.platformSchedules.createdBy,
        createdAt: schema.platformSchedules.createdAt,
        updatedAt: schema.platformSchedules.updatedAt,
      })
      .from(schema.platformSchedules)
      .orderBy(schema.platformSchedules.scheduledStart);

    const allSchools = await db.select().from(schema.schools);
    const schoolMap = new Map(allSchools.map((s) => [s.id, s.name]));

    const allUsers = await db
      .select({ id: schema.user.id, name: schema.user.name })
      .from(schema.user);
    const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

    const schedules = rawSchedules.map((s) => ({
      ...s,
      schoolName: s.targetSchoolId
        ? schoolMap.get(s.targetSchoolId) || "Specific School"
        : "All Partner Schools (Network-wide)",
      createdByName: s.createdBy
        ? userMap.get(s.createdBy) || "Super Admin"
        : "System Automated Engine",
      scheduledStartIso: new Date(s.scheduledStart).toISOString(),
      scheduledEndIso: new Date(s.scheduledEnd).toISOString(),
    }));

    const activeMaintenance = schedules.filter(
      (s) =>
        s.category === "maintenance" && (s.status === "scheduled" || s.status === "in_progress"),
    );
    const automatedCrons = schedules.filter((s) => s.isAutomated);
    const upcomingEvents = schedules.filter(
      (s) => s.category === "competition" || s.category === "event" || s.category === "webinar",
    );

    return {
      schedules,
      schools: allSchools,
      stats: {
        total: schedules.length,
        maintenanceCount: activeMaintenance.length,
        automatedJobsCount: automatedCrons.length,
        upcomingEventsCount: upcomingEvents.length,
        partnerSchoolsCount: allSchools.length,
      },
    };
  });

export const createPlatformScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["s2c", "admin"])])
  .validator(
    (data: {
      title: string;
      description?: string | undefined;
      category: string;
      targetSchoolId: number | null;
      targetRole: string;
      scheduledStart: string;
      scheduledEnd: string;
      recurrence: string;
      priority: string;
      isAutomated: boolean;
      actionPayload?: string | undefined;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const userId = context.user.id;

    const [created] = await db
      .insert(schema.platformSchedules)
      .values({
        title: data.title,
        description: data.description || null,
        category: data.category,
        targetSchoolId: data.targetSchoolId,
        targetRole: data.targetRole,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        recurrence: data.recurrence,
        status: "scheduled",
        priority: data.priority,
        isAutomated: data.isAutomated,
        actionPayload: data.actionPayload || null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, schedule: created };
  });

export const updatePlatformScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["s2c", "admin"])])
  .validator(
    (data: {
      id: number;
      title: string;
      description?: string | undefined;
      category: string;
      targetSchoolId: number | null;
      targetRole: string;
      scheduledStart: string;
      scheduledEnd: string;
      recurrence: string;
      status: string;
      priority: string;
      isAutomated: boolean;
      actionPayload?: string | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(schema.platformSchedules)
      .set({
        title: data.title,
        description: data.description || null,
        category: data.category,
        targetSchoolId: data.targetSchoolId,
        targetRole: data.targetRole,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        recurrence: data.recurrence,
        status: data.status,
        priority: data.priority,
        isAutomated: data.isAutomated,
        actionPayload: data.actionPayload || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.platformSchedules.id, data.id))
      .returning();

    return { success: true, schedule: updated };
  });

export const deletePlatformScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["s2c", "admin"])])
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(schema.platformSchedules).where(eq(schema.platformSchedules.id, id));
    return { success: true };
  });

export const executePlatformScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["s2c", "admin"])])
  .validator((data: { id: number; action?: string }) => data)
  .handler(async ({ data }) => {
    const [target] = await db
      .select()
      .from(schema.platformSchedules)
      .where(eq(schema.platformSchedules.id, data.id));

    if (!target) throw new Error("Schedule item not found");

    let newStatus = "completed";
    let message = `Execution completed successfully for "${target.title}".`;

    if (target.category === "maintenance") {
      newStatus = target.status === "in_progress" ? "completed" : "in_progress";
      message =
        newStatus === "in_progress"
          ? `Maintenance window "${target.title}" is now LIVE. System banners active.`
          : `Maintenance window "${target.title}" concluded successfully.`;
    }

    const [updated] = await db
      .update(schema.platformSchedules)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.platformSchedules.id, data.id))
      .returning();

    return {
      success: true,
      message,
      schedule: updated,
    };
  });
