import { createServerFn } from "@tanstack/react-start";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../server/db";
import * as schema from "../server/db/schema";
import { roleMiddleware } from "./auth.server";

export const getTeacherClassesFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .handler(async ({ context }) => {
    const teacherId = context.user.id;
    const teacherClasses = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        grade: schema.classes.grade,
        section: schema.classes.section,
        teacher: schema.user.name,
      })
      .from(schema.classes)
      .innerJoin(schema.user, eq(schema.classes.teacherId, schema.user.id))
      .where(eq(schema.classes.teacherId, teacherId));

    return teacherClasses.map((c) => ({
      ...c,
      room: `Room ${(c.id % 10) + 101}`,
      completion: 75 + (c.id % 15),
      students: 25 + (c.id % 10),
      avgScore: 80 + (c.id % 10),
      attendance: 90 + (c.id % 10),
    }));
  });

export const getClassRosterFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .validator((classId: number) => classId)
  .handler(async ({ data: classId, context }) => {
    const roster = await db
      .select({
        user: schema.user,
        profile: schema.studentProfiles,
      })
      .from(schema.studentProfiles)
      .innerJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
      .where(eq(schema.studentProfiles.classId, classId));

    return roster.map((r, i) => ({
      id: r.user.id,
      name: r.user.name,
      level: r.profile?.level || 1,
      score: r.profile?.xpTotal || 0,
      completion: 50 + (i % 50),
      attendance: 80 + (i % 20),
      tag: i % 4 === 0 ? "Needs support" : i % 3 === 0 ? "Accelerated" : "On track",
    }));
  });

export const getPendingProjectsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .handler(async ({ context }) => {
    const teacherId = context.user.id;

    const teacherClasses = await db
      .select({ id: schema.classes.id })
      .from(schema.classes)
      .where(eq(schema.classes.teacherId, teacherId));
    const classIds = teacherClasses.map((c) => c.id);

    if (classIds.length === 0) return [];

    const students = await db
      .select({ userId: schema.studentProfiles.userId })
      .from(schema.studentProfiles)
      .where(inArray(schema.studentProfiles.classId, classIds));
    const studentIds = students.map((s) => s.userId);

    if (studentIds.length === 0) return [];

    const pendingProjects = await db
      .select({
        project: schema.projects,
        student: {
          id: schema.user.id,
          name: schema.user.name,
        },
      })
      .from(schema.projects)
      .innerJoin(schema.user, eq(schema.projects.studentId, schema.user.id))
      .where(
        and(inArray(schema.projects.studentId, studentIds), eq(schema.projects.status, "pending")),
      );

    return pendingProjects;
  });

export const gradeProjectFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .validator(
    (data: {
      projectId: number;
      status: "approved" | "needs_changes";
      feedback: string;
      xpReward?: number;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { projectId, status, feedback, xpReward = 50 } = data;

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });

    if (!project) throw new Error("Project not found");
    if (project.status !== "pending") throw new Error("Project already graded");

    await db.transaction(async (tx) => {
      await tx
        .update(schema.projects)
        .set({ status, feedback, updatedAt: new Date() })
        .where(eq(schema.projects.id, projectId));

      if (status === "approved") {
        const profile = await tx
          .select()
          .from(schema.studentProfiles)
          .where(eq(schema.studentProfiles.userId, project.studentId))
          .limit(1);
        if (profile.length > 0) {
          await tx
            .update(schema.studentProfiles)
            .set({ xpTotal: profile[0]!.xpTotal + xpReward })
            .where(eq(schema.studentProfiles.userId, project.studentId));
        }
      }
    });

    return { success: true };
  });

export const createAnnouncementFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["teacher", "s2c", "admin", "school"])])
  .validator((data: { targetAudience: string; title: string; body: string }) => data)
  .handler(async ({ data, context }) => {
    const authorId = context.user.id;

    await db.insert(schema.announcements).values({
      authorId,
      targetAudience: data.targetAudience,
      title: data.title,
      body: data.body,
    });

    return { success: true };
  });

export const getAnnouncementsForClassFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "teacher", "s2c", "admin", "school"])])
  .validator((classId: number) => classId)
  .handler(async ({ data: classId }) => {
    const classAnnouncements = await db
      .select()
      .from(schema.announcements)
      .where(inArray(schema.announcements.targetAudience, [classId.toString(), "school"]));

    return classAnnouncements;
  });

export const getTeacherAnnouncementsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .handler(async ({ context }) => {
    const teacherId = context.user.id;
    const announcements = await db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.authorId, teacherId))
      .orderBy(schema.announcements.createdAt); // Order by creation time if needed, we'll sort in UI or default
    return announcements;
  });

export const getTeacherAnalyticsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .handler(async ({ context }) => {
    const teacherId = context.user.id;
    const teacherClasses = await db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.teacherId, teacherId));

    // Mock analytics for the dashboard since full analytics schema isn't built
    return {
      activeStudents: 142,
      avgProgress: 68,
      projectsToReview: 12,
      classes: teacherClasses,
      classPerformance: [
        { name: "Grade 6A", score: 85 },
        { name: "Grade 8A", score: 72 },
        { name: "Grade 9B", score: 91 },
      ],
      weeklyActivity: [
        { week: "W1", completion: 65, engagement: 80 },
        { week: "W2", completion: 68, engagement: 82 },
        { week: "W3", completion: 72, engagement: 85 },
        { week: "W4", completion: 70, engagement: 81 },
        { week: "W5", completion: 75, engagement: 86 },
        { week: "W6", completion: 79, engagement: 88 },
      ],
      skillHeatmap: [
        { skill: "Variables", "Grade 6A": 80, "Grade 8A": 90, "Grade 8B": 85, "Grade 9A": 95 },
        { skill: "Loops", "Grade 6A": 65, "Grade 8A": 85, "Grade 8B": 80, "Grade 9A": 92 },
        { skill: "Functions", "Grade 6A": 50, "Grade 8A": 75, "Grade 8B": 70, "Grade 9A": 88 },
        { skill: "Events", "Grade 6A": 60, "Grade 8A": 80, "Grade 8B": 75, "Grade 9A": 90 },
      ],
    };
  });

export const getTeacherAssignmentsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .handler(async ({ context }) => {
    const teacherId = context.user.id;
    const teacherAssignments = await db
      .select({
        assignment: schema.assignments,
        class: schema.classes,
      })
      .from(schema.assignments)
      .innerJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
      .where(eq(schema.assignments.teacherId, teacherId));

    return teacherAssignments.map((r) => ({
      id: r.assignment.id,
      title: r.assignment.title,
      className: r.class.name,
      due: r.assignment.dueDate
        ? new Date(r.assignment.dueDate).toISOString().split("T")[0]
        : "No date",
      status: r.assignment.status,
      submitted: 0,
      total: 30, // Mock total students per class for now
      avg: 75,
    }));
  });

export const createAssignmentFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .validator(
    (data: { title: string; className: string; due: string; type: string; instructions: string }) =>
      data,
  )
  .handler(async ({ data, context }) => {
    const teacherId = context.user.id;

    // find classId from className for this teacher
    const classRecords = await db
      .select()
      .from(schema.classes)
      .where(and(eq(schema.classes.teacherId, teacherId), eq(schema.classes.name, data.className)))
      .limit(1);

    if (classRecords.length === 0) throw new Error("Class not found");

    await db.insert(schema.assignments).values({
      teacherId,
      classId: classRecords[0]!.id,
      title: data.title,
      type: data.type,
      instructions: data.instructions,
      dueDate: data.due ? new Date(data.due) : null,
      status: "Active",
    });
    return { success: true };
  });
