import { createServerFn } from "@tanstack/react-start";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "../server/db";
import * as schema from "../server/db/schema";
import { roleMiddleware } from "./auth.server";
import { randomUUID } from "crypto";

// Helper to determine the target school ID and ensure default school exists
async function getEffectiveSchool(context: {
  user?: Record<string, unknown>;
}): Promise<typeof schema.schools.$inferSelect> {
  const user = context.user || {};
  const schoolId = user["schoolId"] as number | undefined;

  if (schoolId) {
    const existing = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.id, schoolId))
      .limit(1);
    if (existing[0]) return existing[0];
  }

  // Fallback to the first existing school
  const allSchools = await db.select().from(schema.schools).limit(1);
  if (allSchools[0]) return allSchools[0];

  // If no school exists at all, initialize the default school
  const created = await db
    .insert(schema.schools)
    .values({
      name: "Global Tech High",
      city: "San Francisco",
      planType: "pro",
      status: "active",
    })
    .returning();
  if (created[0]) return created[0];

  throw new Error("Unable to locate or initialize school");
}

// Ensure default baseline data for a school if it has no classes or teachers
async function ensureSchoolSeedData(schoolId: number) {
  const existingClasses = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(eq(schema.classes.schoolId, schoolId))
    .limit(1);

  if (existingClasses.length > 0) return;

  // 1. Create default teachers if none
  const existingTeachers = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.schoolId, schoolId), eq(schema.user.role, "teacher")))
    .limit(1);

  let teacher1Id = existingTeachers[0]?.id;
  let teacher2Id = "";

  if (!teacher1Id) {
    const t1 = await db
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: "Priya Raman",
        email: "priya.raman@school.edu",
        role: "teacher",
        schoolId,
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const t2 = await db
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: "Marcus Vance",
        email: "marcus.v@school.edu",
        role: "teacher",
        schoolId,
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    teacher1Id = t1[0]?.id || randomUUID();
    teacher2Id = t2[0]?.id || randomUUID();
  }

  // 2. Create sample classes
  const createdClasses = await db
    .insert(schema.classes)
    .values([
      {
        schoolId,
        name: "Grade 6A - Python Explorers",
        grade: "6",
        section: "A",
        teacherId: teacher1Id,
      },
      {
        schoolId,
        name: "Grade 7B - Web Foundations",
        grade: "7",
        section: "B",
        teacherId: teacher2Id || teacher1Id,
      },
      {
        schoolId,
        name: "Grade 8A - Algorithms & Logic",
        grade: "8",
        section: "A",
        teacherId: teacher1Id,
      },
    ])
    .returning();

  const c1Id = createdClasses[0]?.id || 1;
  const c2Id = createdClasses[1]?.id || 2;
  const c3Id = createdClasses[2]?.id || 3;

  // 3. Create sample students
  const sampleStudents = [
    { name: "Aarav Gupta", email: "aarav.g@school.edu", classId: c1Id, xp: 840, streak: 9 },
    { name: "Maya Patel", email: "maya.p@school.edu", classId: c1Id, xp: 710, streak: 6 },
    { name: "Ethan Walker", email: "ethan.w@school.edu", classId: c2Id, xp: 520, streak: 4 },
    { name: "Zoe Chen", email: "zoe.c@school.edu", classId: c2Id, xp: 950, streak: 12 },
    { name: "Liam O'Connor", email: "liam.oc@school.edu", classId: c3Id, xp: 620, streak: 3 },
    { name: "Ananya Roy", email: "ananya.r@school.edu", classId: c3Id, xp: 780, streak: 7 },
  ];

  for (const s of sampleStudents) {
    const createdUsers = await db
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: s.name,
        email: s.email,
        role: "student",
        schoolId,
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const u = createdUsers[0];
    if (u) {
      await db.insert(schema.studentProfiles).values({
        userId: u.id,
        classId: s.classId,
        xpTotal: s.xp,
        currentStreak: s.streak,
        level: Math.max(1, Math.floor(s.xp / 200)),
      });
    }
  }

  // 4. Create sample announcement
  await db.insert(schema.announcements).values({
    authorId: teacher1Id,
    title: "Welcome to Syntax2Code Academic Year 2026-2027",
    body: "All computer science classes will begin their Python and Web modules this week. Teachers, please review roster assignments.",
    targetAudience: "All",
    createdAt: new Date(),
  });
}

// -------------------------------------------------------------
// 1. EXECUTIVE OVERVIEW
// -------------------------------------------------------------
export const getSchoolOverviewFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const school = await getEffectiveSchool(context);
    await ensureSchoolSeedData(school.id);

    // Students count
    const students = await db
      .select({ id: schema.user.id, active: schema.user.active })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "student")));

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.active).length;

    // Profiles with XP
    const profiles = await db
      .select({
        classId: schema.studentProfiles.classId,
        xpTotal: schema.studentProfiles.xpTotal,
      })
      .from(schema.studentProfiles)
      .innerJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
      .where(eq(schema.user.schoolId, school.id));

    const avgXp = profiles.length
      ? Math.round(profiles.reduce((acc, p) => acc + (p.xpTotal || 0), 0) / profiles.length)
      : 0;

    // Classes
    const allClasses = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        grade: schema.classes.grade,
        section: schema.classes.section,
        teacherId: schema.classes.teacherId,
      })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));

    // Teachers
    const allTeachers = await db
      .select({ id: schema.user.id, name: schema.user.name })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "teacher")));

    const teacherMap = new Map(allTeachers.map((t) => [t.id, t.name]));

    const classesDetailed = allClasses.map((c) => {
      const classProfiles = profiles.filter((p) => p.classId === c.id);
      const studentCount = classProfiles.length;
      const classAvgXp = studentCount
        ? Math.round(classProfiles.reduce((acc, p) => acc + (p.xpTotal || 0), 0) / studentCount)
        : 0;
      const completion = Math.min(100, Math.round(classAvgXp / 10));

      return {
        id: c.id,
        name: c.name,
        grade: c.grade || "General",
        section: c.section || "A",
        teacherName: teacherMap.get(c.teacherId) || "Assigned Faculty",
        studentCount,
        avgScore: classAvgXp,
        completion,
      };
    });

    // Grade distribution
    const gradesSet = Array.from(new Set(classesDetailed.map((c) => c.grade)));
    const gradeDistribution = gradesSet.map((g) => {
      const inGrade = classesDetailed.filter((c) => c.grade === g);
      const avgComp = inGrade.length
        ? Math.round(inGrade.reduce((a, b) => a + b.completion, 0) / inGrade.length)
        : 0;
      const totalInGrade = inGrade.reduce((a, b) => a + b.studentCount, 0);
      return { grade: `Grade ${g}`, completion: avgComp, students: totalInGrade };
    });

    const completionRate = Math.min(100, Math.round(avgXp / 10));

    const schoolKpis = {
      enrolled: totalStudents,
      activeWeekly: activeStudents,
      curriculum: completionRate,
      avgScore: avgXp,
      licensedSeats: 1500,
    };

    const readinessIndex = [
      {
        dimension: "Logic & Problem Solving",
        value: Math.min(100, Math.max(60, completionRate + 5)),
      },
      { dimension: "Syntax Proficiency", value: Math.min(100, Math.max(55, completionRate)) },
      { dimension: "Digital Literacy", value: 88 },
      { dimension: "Creative Coding", value: Math.min(100, Math.max(70, completionRate + 12)) },
      { dimension: "AI Ethics & Safety", value: 84 },
    ];

    return {
      school,
      schoolKpis,
      gradeDistribution,
      classes: classesDetailed,
      teachersCount: allTeachers.length,
      readinessIndex,
    };
  });

// -------------------------------------------------------------
// 2. TEACHERS MANAGEMENT
// -------------------------------------------------------------
export const getSchoolTeachersFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const school = await getEffectiveSchool(context);
    await ensureSchoolSeedData(school.id);

    const teachers = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        active: schema.user.active,
        image: schema.user.image,
        createdAt: schema.user.createdAt,
      })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "teacher")));

    const classes = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        teacherId: schema.classes.teacherId,
      })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));

    const profiles = await db
      .select({ classId: schema.studentProfiles.classId })
      .from(schema.studentProfiles)
      .innerJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
      .where(eq(schema.user.schoolId, school.id));

    const trainings = await db.select().from(schema.teacherTrainings);

    const teachersFormatted = teachers.map((t) => {
      const assignedClasses = classes.filter((c) => c.teacherId === t.id);
      const classIds = new Set(assignedClasses.map((c) => c.id));
      const studentCount = profiles.filter((p) => p.classId && classIds.has(p.classId)).length;
      const myTrainings = trainings.filter((tr) => tr.teacherId === t.id);

      return {
        id: t.id,
        name: t.name,
        email: t.email,
        active: t.active,
        subject: "Computer Science & AI",
        classes: assignedClasses.map((c) => c.name),
        students: studentCount,
        readiness: assignedClasses.length > 0 ? 88 : 72,
        trainings: myTrainings,
      };
    });

    const activeCount = teachersFormatted.filter((t) => t.active).length;
    const avgReadiness = teachersFormatted.length
      ? Math.round(
          teachersFormatted.reduce((a, b) => a + b.readiness, 0) / teachersFormatted.length,
        )
      : 80;

    return {
      teachers: teachersFormatted,
      stats: {
        total: teachersFormatted.length,
        active: activeCount,
        avgReadiness,
        classesCovered: classes.length,
      },
    };
  });

export const assignTeacherTrainingFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { teacherId: string; trackId: string; trackName: string }) => data)
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(schema.teacherTrainings)
      .where(
        and(
          eq(schema.teacherTrainings.teacherId, data.teacherId),
          eq(schema.teacherTrainings.trackId, data.trackId),
        ),
      );

    if (existing.length > 0) {
      return { success: true, alreadyAssigned: true };
    }

    await db.insert(schema.teacherTrainings).values({
      teacherId: data.teacherId,
      trackId: data.trackId,
      trackName: data.trackName,
      status: "in_progress",
      progressPercent: 40,
      assignedAt: new Date(),
    });

    return { success: true };
  });

export const createTeacherFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { name: string; email: string; subject?: string }) => data)
  .handler(async ({ data, context }) => {
    const school = await getEffectiveSchool(context);

    const [teacher] = await db
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        role: "teacher",
        schoolId: school.id,
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, teacher };
  });

export const toggleTeacherStatusFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { teacherId: string; active: boolean }) => data)
  .handler(async ({ data }) => {
    await db
      .update(schema.user)
      .set({ active: data.active, updatedAt: new Date() })
      .where(eq(schema.user.id, data.teacherId));
    return { success: true };
  });

export const updateTeacherFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { teacherId: string; name: string; email: string }) => data)
  .handler(async ({ data }) => {
    await db
      .update(schema.user)
      .set({ name: data.name, email: data.email, updatedAt: new Date() })
      .where(eq(schema.user.id, data.teacherId));
    return { success: true };
  });

export const deleteTeacherFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((teacherId: string) => teacherId)
  .handler(async ({ data: teacherId, context }) => {
    const school = await getEffectiveSchool(context);
    const otherTeachers = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.schoolId, school.id),
          eq(schema.user.role, "teacher"),
          sql`${schema.user.id} != ${teacherId}`,
        ),
      )
      .limit(1);

    const replacementId = otherTeachers[0]?.id;

    if (replacementId) {
      await db
        .update(schema.classes)
        .set({ teacherId: replacementId })
        .where(eq(schema.classes.teacherId, teacherId));
      await db
        .update(schema.schoolSchedules)
        .set({ teacherId: replacementId })
        .where(eq(schema.schoolSchedules.teacherId, teacherId));
      await db
        .update(schema.assignments)
        .set({ teacherId: replacementId })
        .where(eq(schema.assignments.teacherId, teacherId));
      await db
        .update(schema.clubs)
        .set({ teacherId: replacementId })
        .where(eq(schema.clubs.teacherId, teacherId));
      await db
        .update(schema.attendanceSessions)
        .set({ teacherId: replacementId })
        .where(eq(schema.attendanceSessions.teacherId, teacherId));
      await db
        .update(schema.reviews)
        .set({ teacherId: replacementId })
        .where(eq(schema.reviews.teacherId, teacherId));
    } else {
      await db
        .delete(schema.schoolSchedules)
        .where(eq(schema.schoolSchedules.teacherId, teacherId));
      await db
        .delete(schema.reviews)
        .where(eq(schema.reviews.teacherId, teacherId));

      const teacherAssignments = await db
        .select({ id: schema.assignments.id })
        .from(schema.assignments)
        .where(eq(schema.assignments.teacherId, teacherId));

      if (teacherAssignments.length > 0) {
        const assignmentIds = teacherAssignments.map((a) => a.id);
        const subs = await db
          .select({ id: schema.submissions.id })
          .from(schema.submissions)
          .where(inArray(schema.submissions.assignmentId, assignmentIds));

        if (subs.length > 0) {
          const subIds = subs.map((s) => s.id);
          await db
            .delete(schema.reviews)
            .where(inArray(schema.reviews.submissionId, subIds));
          await db
            .delete(schema.submissions)
            .where(inArray(schema.submissions.id, subIds));
        }

        await db
          .delete(schema.assignments)
          .where(inArray(schema.assignments.id, assignmentIds));
      }

      const sessions = await db
        .select({ id: schema.attendanceSessions.id })
        .from(schema.attendanceSessions)
        .where(eq(schema.attendanceSessions.teacherId, teacherId));

      if (sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        await db
          .delete(schema.attendanceRecords)
          .where(inArray(schema.attendanceRecords.sessionId, sessionIds));
        await db
          .delete(schema.attendanceSessions)
          .where(inArray(schema.attendanceSessions.id, sessionIds));
      }

      await db.delete(schema.clubs).where(eq(schema.clubs.teacherId, teacherId));
      await db.delete(schema.classes).where(eq(schema.classes.teacherId, teacherId));
    }

    await db.delete(schema.session).where(eq(schema.session.userId, teacherId));
    await db.delete(schema.account).where(eq(schema.account.userId, teacherId));
    await db.delete(schema.user).where(eq(schema.user.id, teacherId));
    return { success: true };
  });

// -------------------------------------------------------------
// 3. STUDENTS MANAGEMENT
// -------------------------------------------------------------
export const getSchoolStudentsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const school = await getEffectiveSchool(context);
    await ensureSchoolSeedData(school.id);

    const students = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        active: schema.user.active,
        createdAt: schema.user.createdAt,
        classId: schema.studentProfiles.classId,
        xpTotal: schema.studentProfiles.xpTotal,
        level: schema.studentProfiles.level,
        currentStreak: schema.studentProfiles.currentStreak,
      })
      .from(schema.user)
      .leftJoin(schema.studentProfiles, eq(schema.user.id, schema.studentProfiles.userId))
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "student")));

    const classes = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
      })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));

    const classMap = new Map(classes.map((c) => [c.id, c.name]));

    const formattedStudents = students.map((s) => {
      const xp = s.xpTotal || 0;
      const streak = s.currentStreak || 0;
      const active = s.active !== false;

      let tag = "On track";
      if (!active) {
        tag = "Low activity";
      } else if (xp > 650 || streak >= 7) {
        tag = "Accelerated";
      } else if (xp < 100 && streak === 0) {
        tag = "Needs support";
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        classId: s.classId || null,
        className: (s.classId && classMap.get(s.classId)) || "Unassigned",
        tag,
        score: xp,
        completion: Math.min(100, Math.round(xp / 10)),
        level: s.level || 1,
        streak,
        enrolledDate: s.createdAt
          ? new Date(s.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Active",
        active,
        lastActive: "Today",
      };
    });

    const onTrackCount = formattedStudents.filter((s) => s.tag === "On track").length;
    const acceleratedCount = formattedStudents.filter((s) => s.tag === "Accelerated").length;
    const needsSupportCount = formattedStudents.filter((s) => s.tag === "Needs support").length;

    return {
      students: formattedStudents,
      classes: classes.map((c) => ({ id: String(c.id), name: c.name })),
      stats: {
        total: formattedStudents.length,
        onTrack: onTrackCount,
        accelerated: acceleratedCount,
        needsSupport: needsSupportCount,
      },
    };
  });

export const createStudentFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { name: string; email: string; classId?: number | null }) => data)
  .handler(async ({ data, context }) => {
    const school = await getEffectiveSchool(context);

    const createdUsers = await db
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        role: "student",
        schoolId: school.id,
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const user = createdUsers[0];
    if (!user) throw new Error("Failed to create student record");

    await db.insert(schema.studentProfiles).values({
      userId: user.id,
      classId: data.classId || null,
      xpTotal: 0,
      currentStreak: 1,
      level: 1,
    });

    return { success: true, user };
  });

export const bulkImportStudentsFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (
      data: Array<{
        name: string;
        email: string;
        className?: string | undefined;
        grade?: string | undefined;
        section?: string | undefined;
      }>,
    ) => data,
  )
  .handler(async ({ data, context }) => {
    const school = await getEffectiveSchool(context);

    const allClasses = await db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));

    let importedCount = 0;

    for (const item of data) {
      if (!item.name || !item.email) continue;

      const matchedClass = allClasses.find(
        (c) =>
          (item.className && c.name.toLowerCase() === item.className.toLowerCase()) ||
          (item.grade && c.grade === item.grade && (!item.section || c.section === item.section)),
      );

      const createdUsers = await db
        .insert(schema.user)
        .values({
          id: randomUUID(),
          name: item.name,
          email: item.email,
          role: "student",
          schoolId: school.id,
          active: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const u = createdUsers[0];
      if (u) {
        await db.insert(schema.studentProfiles).values({
          userId: u.id,
          classId: matchedClass?.id || null,
          xpTotal: 0,
          currentStreak: 1,
          level: 1,
        });
        importedCount++;
      }
    }

    return { success: true, count: importedCount };
  });

export const toggleStudentStatusFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { studentId: string; active: boolean }) => data)
  .handler(async ({ data }) => {
    await db
      .update(schema.user)
      .set({ active: data.active, updatedAt: new Date() })
      .where(eq(schema.user.id, data.studentId));
    return { success: true };
  });

export const assignStudentClassFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { studentId: string; classId: number | null }) => data)
  .handler(async ({ data }) => {
    await db
      .update(schema.studentProfiles)
      .set({ classId: data.classId })
      .where(eq(schema.studentProfiles.userId, data.studentId));
    return { success: true };
  });

export const updateStudentFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (data: { studentId: string; name: string; email: string; classId: number | null }) => data,
  )
  .handler(async ({ data }) => {
    await db
      .update(schema.user)
      .set({ name: data.name, email: data.email, updatedAt: new Date() })
      .where(eq(schema.user.id, data.studentId));

    await db
      .update(schema.studentProfiles)
      .set({ classId: data.classId })
      .where(eq(schema.studentProfiles.userId, data.studentId));

    return { success: true };
  });

export const deleteStudentFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((studentId: string) => studentId)
  .handler(async ({ data: studentId }) => {
    // 1. Delete reviews on student's submissions, and then student's submissions
    const studentSubs = await db
      .select({ id: schema.submissions.id })
      .from(schema.submissions)
      .where(eq(schema.submissions.studentId, studentId));

    if (studentSubs.length > 0) {
      const subIds = studentSubs.map((s) => s.id);
      await db
        .delete(schema.reviews)
        .where(inArray(schema.reviews.submissionId, subIds));
      await db
        .delete(schema.submissions)
        .where(eq(schema.submissions.studentId, studentId));
    }

    // 2. Delete student flags
    await db
      .delete(schema.studentFlags)
      .where(eq(schema.studentFlags.studentId, studentId));

    // 3. Delete attendance records
    await db
      .delete(schema.attendanceRecords)
      .where(eq(schema.attendanceRecords.studentId, studentId));

    // 4. Delete skill mastery
    await db
      .delete(schema.studentSkillMastery)
      .where(eq(schema.studentSkillMastery.studentId, studentId));

    // 5. Delete completed lessons
    await db
      .delete(schema.completedLessons)
      .where(eq(schema.completedLessons.studentId, studentId));

    // 6. Delete projects
    await db
      .delete(schema.projects)
      .where(eq(schema.projects.studentId, studentId));

    // 7. Delete earned badges
    await db
      .delete(schema.earnedBadges)
      .where(eq(schema.earnedBadges.studentId, studentId));

    // 8. Delete student profile
    await db
      .delete(schema.studentProfiles)
      .where(eq(schema.studentProfiles.userId, studentId));

    // 9. Delete session and account
    await db
      .delete(schema.session)
      .where(eq(schema.session.userId, studentId));
    await db
      .delete(schema.account)
      .where(eq(schema.account.userId, studentId));

    // 10. Delete user
    await db
      .delete(schema.user)
      .where(eq(schema.user.id, studentId));

    return { success: true };
  });

// -------------------------------------------------------------
// 4. CLASSES MANAGEMENT
// -------------------------------------------------------------
export const getSchoolClassesFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const school = await getEffectiveSchool(context);
    await ensureSchoolSeedData(school.id);

    const classes = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        grade: schema.classes.grade,
        section: schema.classes.section,
        teacherId: schema.classes.teacherId,
        createdAt: schema.classes.createdAt,
      })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));

    const teachers = await db
      .select({ id: schema.user.id, name: schema.user.name })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "teacher")));

    const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

    const profiles = await db
      .select({
        classId: schema.studentProfiles.classId,
        xpTotal: schema.studentProfiles.xpTotal,
      })
      .from(schema.studentProfiles)
      .innerJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
      .where(eq(schema.user.schoolId, school.id));

    const formattedClasses = classes.map((c) => {
      const enrolled = profiles.filter((p) => p.classId === c.id);
      const studentCount = enrolled.length;
      const avgXp = studentCount
        ? Math.round(enrolled.reduce((a, b) => a + (b.xpTotal || 0), 0) / studentCount)
        : 0;

      return {
        id: String(c.id),
        name: c.name,
        grade: Number(c.grade) || 6,
        section: c.section || "A",
        teacher: teacherMap.get(c.teacherId) || "Assigned Faculty",
        teacherId: c.teacherId,
        students: studentCount,
        completion: Math.min(100, Math.round(avgXp / 10)),
        avgScore: avgXp,
        attendance: 94,
        room: `Lab ${c.section || "1"}`,
      };
    });

    return {
      classes: formattedClasses,
      teachers: teachers.map((t) => ({ id: t.id, name: t.name })),
    };
  });

export const createClassFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { name: string; grade: string; section: string; teacherId: string }) => data)
  .handler(async ({ data, context }) => {
    const school = await getEffectiveSchool(context);

    const created = await db
      .insert(schema.classes)
      .values({
        schoolId: school.id,
        name: data.name,
        grade: data.grade,
        section: data.section,
        teacherId: data.teacherId,
      })
      .returning();

    return { success: true, class: created[0] };
  });

export const updateClassFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (data: { classId: number; name: string; grade: string; section: string; teacherId: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(schema.classes)
      .set({
        name: data.name,
        grade: data.grade,
        section: data.section,
        teacherId: data.teacherId,
      })
      .where(eq(schema.classes.id, data.classId))
      .returning();

    return { success: true, class: updated };
  });

export const deleteClassFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((classId: number) => classId)
  .handler(async ({ data: classId }) => {
    // Unassign students from this class
    await db
      .update(schema.studentProfiles)
      .set({ classId: null })
      .where(eq(schema.studentProfiles.classId, classId));

    await db.delete(schema.classes).where(eq(schema.classes.id, classId));
    return { success: true };
  });

export const promoteClassRosterFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (data: {
      sourceClassId: number;
      targetClassId: number | null;
      mode: "transfer" | "graduate";
    }) => data,
  )
  .handler(async ({ data }) => {
    // Count students to promote
    const students = await db
      .select({ userId: schema.studentProfiles.userId })
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.classId, data.sourceClassId));

    if (data.mode === "transfer" && data.targetClassId) {
      await db
        .update(schema.studentProfiles)
        .set({ classId: data.targetClassId })
        .where(eq(schema.studentProfiles.classId, data.sourceClassId));
    } else if (data.mode === "graduate") {
      await db
        .update(schema.studentProfiles)
        .set({ classId: null })
        .where(eq(schema.studentProfiles.classId, data.sourceClassId));
    }

    return { success: true, count: students.length };
  });

// -------------------------------------------------------------
// 5. ANNOUNCEMENTS & REPORTS
// -------------------------------------------------------------
export const getSchoolReportsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const school = await getEffectiveSchool(context);
    await ensureSchoolSeedData(school.id);

    const announcements = await db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        body: schema.announcements.body,
        targetAudience: schema.announcements.targetAudience,
        createdAt: schema.announcements.createdAt,
        authorName: schema.user.name,
      })
      .from(schema.announcements)
      .leftJoin(schema.user, eq(schema.announcements.authorId, schema.user.id))
      .orderBy(sql`${schema.announcements.createdAt} DESC`);

    const formattedAnnouncements = announcements.map((a) => ({
      id: String(a.id),
      title: a.title,
      body: a.body,
      audience: a.targetAudience || "All",
      when: new Date(a.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      author: a.authorName || "School Leadership",
    }));

    // Comprehensive metrics for real PDF/CSV generation
    const students = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        active: schema.user.active,
        classId: schema.studentProfiles.classId,
        xpTotal: schema.studentProfiles.xpTotal,
        level: schema.studentProfiles.level,
        streak: schema.studentProfiles.currentStreak,
      })
      .from(schema.user)
      .leftJoin(schema.studentProfiles, eq(schema.user.id, schema.studentProfiles.userId))
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "student")));

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.active).length;
    const avgXp = totalStudents
      ? Math.round(students.reduce((acc, s) => acc + (s.xpTotal || 0), 0) / totalStudents)
      : 0;

    const allClasses = await db
      .select({
        id: schema.classes.id,
        name: schema.classes.name,
        grade: schema.classes.grade,
        section: schema.classes.section,
        teacherId: schema.classes.teacherId,
      })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));

    const allTeachers = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        active: schema.user.active,
      })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "teacher")));

    const teacherMap = new Map(allTeachers.map((t) => [t.id, t.name]));

    const classSummaries = allClasses.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id);
      const studentCount = classStudents.length;
      const classAvgXp = studentCount
        ? Math.round(classStudents.reduce((a, b) => a + (b.xpTotal || 0), 0) / studentCount)
        : 0;
      return {
        id: c.id,
        name: c.name,
        grade: c.grade || "6",
        section: c.section || "A",
        teacherName: teacherMap.get(c.teacherId) || "Assigned Faculty",
        studentCount,
        avgXp: classAvgXp,
        completion: Math.min(100, Math.round(classAvgXp / 10)),
      };
    });

    const completionRate = Math.min(100, Math.round(avgXp / 10));

    const schoolKpis = {
      enrolled: totalStudents,
      activeWeekly: activeStudents,
      curriculum: completionRate,
      avgScore: avgXp,
      licensedSeats: 1500,
    };

    const readinessIndex = [
      {
        dimension: "Logic & Problem Solving",
        value: Math.min(100, Math.max(60, completionRate + 5)),
      },
      { dimension: "Syntax Proficiency", value: Math.min(100, Math.max(55, completionRate)) },
      { dimension: "Digital Literacy", value: 88 },
      {
        dimension: "Creative Coding",
        value: Math.min(100, Math.max(70, completionRate + 12)),
      },
      { dimension: "AI Ethics & Safety", value: 84 },
    ];

    const parentLogs = await db
      .select()
      .from(schema.parentReportLogs)
      .where(eq(schema.parentReportLogs.schoolId, school.id))
      .orderBy(sql`${schema.parentReportLogs.sentAt} DESC`);

    return {
      school,
      announcements: formattedAnnouncements,
      parentReportLogs: parentLogs.map((p) => ({
        id: p.id,
        reportType: p.reportType,
        subject: p.subject,
        recipientCount: p.recipientCount,
        status: p.status,
        sentAt: new Date(p.sentAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
      schoolKpis,
      classes: classSummaries,
      teachers: allTeachers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        active: t.active,
        classes: allClasses.filter((c) => c.teacherId === t.id).map((c) => c.name),
        readiness: 88,
      })),
      students: students.map((s) => ({
        name: s.name,
        email: s.email,
        className: allClasses.find((c) => c.id === s.classId)?.name || "Unassigned",
        score: s.xpTotal || 0,
        level: s.level || 1,
        streak: s.streak || 0,
        active: s.active,
      })),
      readinessIndex,
    };
  });

export const dispatchParentReportsFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (data: {
      reportType: string;
      subject: string;
      customNote?: string | undefined;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const school = await getEffectiveSchool(context);

    const students = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.schoolId, school.id),
          eq(schema.user.role, "student"),
          eq(schema.user.active, true),
        ),
      );

    const recipientCount = Math.max(students.length, 1);

    const [log] = await db
      .insert(schema.parentReportLogs)
      .values({
        schoolId: school.id,
        recipientCount,
        reportType: data.reportType,
        subject: data.subject,
        status: "delivered",
        sentAt: new Date(),
      })
      .returning();

    return {
      success: true,
      recipientCount,
      log,
    };
  });

export const createSchoolAnnouncementFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { title: string; body: string; targetAudience: string }) => data)
  .handler(async ({ data, context }) => {
    const authorId = context.user.id;

    const [created] = await db
      .insert(schema.announcements)
      .values({
        authorId,
        title: data.title,
        body: data.body,
        targetAudience: data.targetAudience,
        createdAt: new Date(),
      })
      .returning();

    return { success: true, announcement: created };
  });

export const deleteSchoolAnnouncementFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
    return { success: true };
  });

// -------------------------------------------------------------
// 6. SCHOOL TIMETABLE & SCHEDULE MANAGEMENT
// -------------------------------------------------------------
async function ensureSchoolScheduleSeed(schoolId: number) {
  const existing = await db
    .select({ id: schema.schoolSchedules.id })
    .from(schema.schoolSchedules)
    .where(eq(schema.schoolSchedules.schoolId, schoolId))
    .limit(1);

  if (existing.length > 0) return;

  const schoolClasses = await db
    .select({
      id: schema.classes.id,
      name: schema.classes.name,
      teacherId: schema.classes.teacherId,
    })
    .from(schema.classes)
    .where(eq(schema.classes.schoolId, schoolId));

  const schoolTeachers = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.schoolId, schoolId), eq(schema.user.role, "teacher")));

  const t1 = schoolTeachers[0]?.id;
  if (!t1) return;
  const teacher1: string = t1;
  const teacher2: string = schoolTeachers[1]?.id || teacher1;

  const c1 = schoolClasses[0]?.id ?? null;
  const c2 = schoolClasses[1]?.id ?? c1;
  const c3 = schoolClasses[2]?.id ?? c1;

  await db.insert(schema.schoolSchedules).values([
    {
      schoolId,
      classId: c1,
      teacherId: teacher1,
      title: "Python Explorers: Loops & Sequences",
      subject: "Python Programming",
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:15",
      room: "Computer Lab 1",
      scheduleType: "regular_class",
      recurrence: "weekly",
      status: "active",
      notes: "Bring laptops and completed Module 3 practice sheets.",
    },
    {
      schoolId,
      classId: c2,
      teacherId: teacher2,
      title: "Web Foundations: Modern Layouts & CSS Grid",
      subject: "Web Development",
      dayOfWeek: "Monday",
      startTime: "11:00",
      endTime: "12:15",
      room: "Computer Lab 2",
      scheduleType: "lab_session",
      recurrence: "weekly",
      status: "active",
      notes: "Hands-on UI sprint in the browser editor.",
    },
    {
      schoolId,
      classId: c3,
      teacherId: teacher1,
      title: "Algorithms & Logic: Binary Search & Trees",
      subject: "Computer Science Principles",
      dayOfWeek: "Tuesday",
      startTime: "09:30",
      endTime: "10:45",
      room: "Computer Lab 1",
      scheduleType: "regular_class",
      recurrence: "weekly",
      status: "active",
      notes: "Algorithmic thinking and puzzle-solving session.",
    },
    {
      schoolId,
      classId: c1,
      teacherId: teacher2,
      title: "Creative Game Dev Sprint",
      subject: "Game Development",
      dayOfWeek: "Wednesday",
      startTime: "10:00",
      endTime: "11:30",
      room: "Innovation Studio",
      scheduleType: "workshop",
      recurrence: "weekly",
      status: "active",
      notes: "Sprite animations and score tracking mechanics.",
    },
    {
      schoolId,
      classId: c2,
      teacherId: teacher2,
      title: "Interactive Web Project Submissions",
      subject: "Web Development",
      dayOfWeek: "Thursday",
      startTime: "13:00",
      endTime: "14:15",
      room: "Computer Lab 2",
      scheduleType: "lab_session",
      recurrence: "weekly",
      status: "active",
      notes: "Project showcase and peer code reviews.",
    },
    {
      schoolId,
      classId: c3,
      teacherId: teacher1,
      title: "AI Ethics & Machine Learning Intro",
      subject: "Artificial Intelligence",
      dayOfWeek: "Friday",
      startTime: "09:00",
      endTime: "10:15",
      room: "Innovation Studio",
      scheduleType: "regular_class",
      recurrence: "weekly",
      status: "active",
      notes: "Prompt engineering and neural network concepts for youth.",
    },
    {
      schoolId,
      classId: null,
      teacherId: teacher1,
      title: "Inter-School Hackathon & Coding Club",
      subject: "Competitive Coding",
      dayOfWeek: "Friday",
      startTime: "14:30",
      endTime: "16:00",
      room: "Computer Lab 1",
      scheduleType: "hackathon_prep",
      recurrence: "weekly",
      status: "active",
      notes: "Open to all enrolled students for team coding challenges.",
    },
  ]);
}

export const getSchoolScheduleFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const school = await getEffectiveSchool(context);
    await ensureSchoolSeedData(school.id);
    await ensureSchoolScheduleSeed(school.id);

    const rawSchedules = await db
      .select({
        id: schema.schoolSchedules.id,
        schoolId: schema.schoolSchedules.schoolId,
        classId: schema.schoolSchedules.classId,
        teacherId: schema.schoolSchedules.teacherId,
        title: schema.schoolSchedules.title,
        subject: schema.schoolSchedules.subject,
        dayOfWeek: schema.schoolSchedules.dayOfWeek,
        startTime: schema.schoolSchedules.startTime,
        endTime: schema.schoolSchedules.endTime,
        room: schema.schoolSchedules.room,
        scheduleType: schema.schoolSchedules.scheduleType,
        recurrence: schema.schoolSchedules.recurrence,
        status: schema.schoolSchedules.status,
        notes: schema.schoolSchedules.notes,
        createdAt: schema.schoolSchedules.createdAt,
      })
      .from(schema.schoolSchedules)
      .where(eq(schema.schoolSchedules.schoolId, school.id))
      .orderBy(schema.schoolSchedules.startTime);

    const allClasses = await db
      .select({ id: schema.classes.id, name: schema.classes.name })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, school.id));
    const classMap = new Map(allClasses.map((c) => [c.id, c.name]));

    const allTeachers = await db
      .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
      .from(schema.user)
      .where(and(eq(schema.user.schoolId, school.id), eq(schema.user.role, "teacher")));
    const teacherMap = new Map(allTeachers.map((t) => [t.id, t.name]));

    const schedules = rawSchedules.map((s) => ({
      ...s,
      className: s.classId
        ? classMap.get(s.classId) || "General Session"
        : "All Classes / Open Lab",
      teacherName: teacherMap.get(s.teacherId) || "Assigned Faculty",
    }));

    // Conflict detection algorithm
    const conflicts: Array<{
      id: string;
      dayOfWeek: string;
      reason: string;
      slotA: string;
      slotB: string;
    }> = [];

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];
        if (!a || !b) continue;
        if (
          a.status === "active" &&
          b.status === "active" &&
          a.dayOfWeek.toLowerCase() === b.dayOfWeek.toLowerCase()
        ) {
          // Check overlap
          const overlap = a.startTime < b.endTime && b.startTime < a.endTime;
          if (overlap) {
            if (a.room.toLowerCase() === b.room.toLowerCase()) {
              conflicts.push({
                id: `room-${a.id}-${b.id}`,
                dayOfWeek: a.dayOfWeek,
                reason: `Room Double-Booking: "${a.room}" is booked simultaneously for "${a.title}" and "${b.title}".`,
                slotA: a.title,
                slotB: b.title,
              });
            }
            if (a.teacherId === b.teacherId) {
              conflicts.push({
                id: `teacher-${a.id}-${b.id}`,
                dayOfWeek: a.dayOfWeek,
                reason: `Faculty Double-Booking: ${a.teacherName} is scheduled for both "${a.title}" and "${b.title}" at overlapping times.`,
                slotA: a.title,
                slotB: b.title,
              });
            }
          }
        }
      }
    }

    // Stats
    const activeSlots = schedules.filter((s) => s.status === "active");
    const uniqueRooms = Array.from(new Set(schedules.map((s) => s.room)));
    const uniqueTeachers = Array.from(new Set(schedules.map((s) => s.teacherId)));

    // Day of the week for today
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ] as const;
    const todayName = dayNames[new Date().getDay()] ?? "Monday";
    const todaySessions = schedules.filter(
      (s) => s.status === "active" && s.dayOfWeek.toLowerCase() === todayName.toLowerCase(),
    );

    return {
      school,
      schedules,
      classes: allClasses,
      teachers: allTeachers,
      conflicts,
      rooms: uniqueRooms,
      stats: {
        totalWeeklySlots: activeSlots.length,
        totalRooms: uniqueRooms.length,
        facultyAllocated: uniqueTeachers.length,
        conflictsCount: conflicts.length,
        todaySlotsCount: todaySessions.length,
        todayName,
      },
    };
  });

export const createSchoolScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (data: {
      classId: number | null;
      teacherId: string;
      title: string;
      subject: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      scheduleType: string;
      recurrence: string;
      notes?: string | undefined;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const school = await getEffectiveSchool(context);

    // Pre-flight conflict check: Check if room or teacher is already occupied at overlapping times
    const existingSlots = await db
      .select({
        id: schema.schoolSchedules.id,
        title: schema.schoolSchedules.title,
        room: schema.schoolSchedules.room,
        teacherId: schema.schoolSchedules.teacherId,
        startTime: schema.schoolSchedules.startTime,
        endTime: schema.schoolSchedules.endTime,
      })
      .from(schema.schoolSchedules)
      .where(
        and(
          eq(schema.schoolSchedules.schoolId, school.id),
          eq(schema.schoolSchedules.dayOfWeek, data.dayOfWeek),
          eq(schema.schoolSchedules.status, "active"),
        ),
      );

    for (const slot of existingSlots) {
      const overlap = data.startTime < slot.endTime && slot.startTime < data.endTime;
      if (overlap) {
        if (slot.room.toLowerCase().trim() === data.room.toLowerCase().trim()) {
          throw new Error(
            `Room Collision: "${data.room}" is already booked for "${slot.title}" between ${slot.startTime} and ${slot.endTime}.`,
          );
        }
        if (slot.teacherId === data.teacherId) {
          throw new Error(
            `Teacher Double-Booking: This faculty member is already scheduled for "${slot.title}" between ${slot.startTime} and ${slot.endTime}.`,
          );
        }
      }
    }

    const [created] = await db
      .insert(schema.schoolSchedules)
      .values({
        schoolId: school.id,
        classId: data.classId,
        teacherId: data.teacherId,
        title: data.title,
        subject: data.subject || "Computer Science",
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        scheduleType: data.scheduleType || "regular_class",
        recurrence: data.recurrence || "weekly",
        status: "active",
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, schedule: created };
  });

export const updateSchoolScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator(
    (data: {
      id: number;
      classId: number | null;
      teacherId: string;
      title: string;
      subject: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      scheduleType: string;
      recurrence: string;
      status: string;
      notes?: string | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    // Check conflicts if active
    if (data.status === "active") {
      const existingSlots = await db
        .select({
          id: schema.schoolSchedules.id,
          title: schema.schoolSchedules.title,
          room: schema.schoolSchedules.room,
          teacherId: schema.schoolSchedules.teacherId,
          startTime: schema.schoolSchedules.startTime,
          endTime: schema.schoolSchedules.endTime,
        })
        .from(schema.schoolSchedules)
        .where(
          and(
            eq(schema.schoolSchedules.dayOfWeek, data.dayOfWeek),
            eq(schema.schoolSchedules.status, "active"),
            sql`${schema.schoolSchedules.id} != ${data.id}`,
          ),
        );

      for (const slot of existingSlots) {
        const overlap = data.startTime < slot.endTime && slot.startTime < data.endTime;
        if (overlap) {
          if (slot.room.toLowerCase().trim() === data.room.toLowerCase().trim()) {
            throw new Error(
              `Room Collision: "${data.room}" is already booked for "${slot.title}" between ${slot.startTime} and ${slot.endTime}.`,
            );
          }
          if (slot.teacherId === data.teacherId) {
            throw new Error(
              `Teacher Double-Booking: This faculty member is already scheduled for "${slot.title}" between ${slot.startTime} and ${slot.endTime}.`,
            );
          }
        }
      }
    }

    const [updated] = await db
      .update(schema.schoolSchedules)
      .set({
        classId: data.classId,
        teacherId: data.teacherId,
        title: data.title,
        subject: data.subject,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        scheduleType: data.scheduleType,
        recurrence: data.recurrence,
        status: data.status,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.schoolSchedules.id, data.id))
      .returning();

    return { success: true, schedule: updated };
  });

export const deleteSchoolScheduleFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(schema.schoolSchedules).where(eq(schema.schoolSchedules.id, id));
    return { success: true };
  });

export const toggleSchoolScheduleStatusFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["school", "s2c", "admin"])])
  .validator((data: { id: number; status: string }) => data)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(schema.schoolSchedules)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(schema.schoolSchedules.id, data.id))
      .returning();
    return { success: true, schedule: updated };
  });
