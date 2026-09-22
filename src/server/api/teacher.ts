import { createServerFn } from "@tanstack/react-start";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { roleMiddleware } from "../middleware/auth";

export const getTeacherClassesFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["teacher", "s2c"])])
  .handler(async ({ context }) => {
    const teacherId = context.user.id;
    const teacherClasses = await db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.teacherId, teacherId));
    return teacherClasses;
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

    return roster;
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
