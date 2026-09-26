import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/server/db/schema";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const client = postgres(
  process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
);
const db = drizzle(client);

async function seedTeacherData() {
  console.log("Seeding teacher data...");

  const teachers = await db.select().from(schema.user).where(eq(schema.user.role, "teacher"));

  if (teachers.length === 0) {
    console.log("No teachers found to seed data for. Please sign in as a teacher first!");
    process.exit(1);
  }

  let schoolsList = await db.select().from(schema.schools);
  if (schoolsList.length === 0) {
    const [insertedSchool] = await db
      .insert(schema.schools)
      .values({
        name: "Global Tech High",
        city: "San Francisco",
      })
      .returning();
    schoolsList = [insertedSchool!];
  }
  const school = schoolsList[0]!;

  let paths = await db.select().from(schema.learningPaths);
  if (paths.length === 0) {
    const [path] = await db
      .insert(schema.learningPaths)
      .values({
        title: "Python Web Mastery",
        description: "Learn python",
        difficulty: "beginner",
      })
      .returning();
    paths = [path!];
  }

  for (const teacher of teachers) {
    console.log(`Seeding data for teacher: ${teacher.email}`);

    await db.update(schema.user).set({ schoolId: school.id }).where(eq(schema.user.id, teacher.id));

    await db.delete(schema.classes).where(eq(schema.classes.teacherId, teacher.id));

    const classData = [
      {
        name: "Intro to Python - Section A",
        grade: "6",
        section: "A",
        teacherId: teacher.id,
        schoolId: school.id,
      },
      {
        name: "Web Dev Basics",
        grade: "8",
        section: "B",
        teacherId: teacher.id,
        schoolId: school.id,
      },
      { name: "Game Logic", grade: "9", section: "A", teacherId: teacher.id, schoolId: school.id },
    ];

    const insertedClasses = await db.insert(schema.classes).values(classData).returning();

    for (const cls of insertedClasses) {
      await db.insert(schema.assignments).values([
        {
          classId: cls.id,
          teacherId: teacher.id,
          title: "Build a Calculator",
          type: "PROJECT",
          status: "Active",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          classId: cls.id,
          teacherId: teacher.id,
          title: "Loops Practice",
          type: "PRACTICE",
          status: "Active",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      ]);
    }

    const assignments = await db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.teacherId, teacher.id));

    for (const cls of insertedClasses) {
      for (let i = 1; i <= 5; i++) {
        const studentId = randomUUID();
        await db.insert(schema.user).values({
          id: studentId,
          name: `Student ${i} (${cls.name})`,
          email: `student${i}_${cls.id}@example.com`,
          emailVerified: true,
          role: "student",
          schoolId: school.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db.insert(schema.studentProfiles).values({
          userId: studentId,
          classId: cls.id,
          xpTotal: Math.floor(Math.random() * 500),
        });

        const classAssignments = assignments.filter((a) => a.classId === cls.id);
        if (classAssignments.length > 0) {
          const [submission] = await db
            .insert(schema.submissions)
            .values({
              assignmentId: classAssignments[0].id,
              studentId: studentId,
              status: "SUBMITTED",
              code: "print('hello world')",
            })
            .returning();

          if (i % 2 === 0) {
            await db.insert(schema.reviews).values({
              submissionId: submission!.id,
              teacherId: teacher.id,
              status: "COMPLETED",
              score: 85,
              feedback: "Great job!",
            });

            await db
              .update(schema.submissions)
              .set({ status: "GRADED" })
              .where(eq(schema.submissions.id, submission!.id));
          }
        }

        if (i === 1) {
          await db.insert(schema.studentFlags).values({
            studentId: studentId,
            classId: cls.id,
            type: "LOW_ACTIVITY",
            severity: "HIGH",
            reason: "Has not logged in for 10 days",
          });
        }
      }
    }

    let skillsList = await db.select().from(schema.skills);
    if (skillsList.length === 0) {
      skillsList = await db
        .insert(schema.skills)
        .values([
          { name: "Variables", category: "Python" },
          { name: "Loops", category: "Python" },
          { name: "Functions", category: "Python" },
        ])
        .returning();
    }
  }

  console.log("Teacher Data seeding complete!");
  process.exit(0);
}

seedTeacherData().catch((err) => {
  console.error(err);
  process.exit(1);
});
