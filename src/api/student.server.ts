import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db } from "../server/db";
import * as schema from "../server/db/schema";

import { authMiddleware, roleMiddleware } from "./auth.server";

export const getPathContent = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c", "admin"])])
  .validator((pathId: number) => pathId)
  .handler(async ({ data: pathId, context }) => {
    const pathData = await db
      .select()
      .from(schema.learningPaths)
      .where(eq(schema.learningPaths.id, pathId))
      .limit(1);
    if (!pathData.length) {
      return {
        path: {
          id: pathId,
          title: pathId === 1 ? "AI Explorer" : pathId === 2 ? "Python Basics" : "Web Creator",
          description: "Learn the basics of this topic.",
          difficulty: "Beginner",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        lessons: [
          {
            id: pathId * 100 + 1,
            pathId: pathId,
            title: "Introduction",
            contentMarkdown: "Welcome to this path! Here is some introductory content.",
            xpReward: 50,
            orderIdx: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "current",
          },
          {
            id: pathId * 100 + 2,
            pathId: pathId,
            title: "Next Steps",
            contentMarkdown: "In this lesson, we will dive deeper.",
            xpReward: 100,
            orderIdx: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "locked",
          },
        ],
      };
    }

    const lessonsData = await db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.pathId, pathId))
      .orderBy(schema.lessons.orderIdx);

    const userId = context.user.id;
    const completed = await db
      .select()
      .from(schema.completedLessons)
      .where(eq(schema.completedLessons.studentId, userId));
    const completedLessonIds = new Set(completed.map((c) => c.lessonId));

    return {
      path: pathData[0],
      lessons: lessonsData.map((l) => ({
        ...l,
        status: completedLessonIds.has(l.id) ? "completed" : "current",
      })),
    };
  });

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    let profileData: Array<{
      classId: number | null;
      xpTotal: number;
      currentStreak: number;
      level: number;
    }> = [];
    let classes: Array<{ id: number; name: string; grade: string | null }> = [];
    let recommendedLesson: (typeof schema.lessons.$inferSelect)[] = [];

    let classAssignments: Array<{
      id: number;
      title: string;
      type: string;
      instructions: string | null;
      dueDate: Date | null;
      status: string;
      className: string;
    }> = [];

    try {
      profileData = await db
        .select()
        .from(schema.studentProfiles)
        .where(eq(schema.studentProfiles.userId, userId))
        .limit(1);

      classes = await db
        .select()
        .from(schema.classes)
        .where(eq(schema.classes.id, profileData[0]?.classId ?? -1));

      const targetClassId = profileData[0]?.classId;
      if (targetClassId) {
        classAssignments = await db
          .select({
            id: schema.assignments.id,
            title: schema.assignments.title,
            type: schema.assignments.type,
            instructions: schema.assignments.instructions,
            dueDate: schema.assignments.dueDate,
            status: schema.assignments.status,
            className: schema.classes.name,
          })
          .from(schema.assignments)
          .innerJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
          .where(eq(schema.assignments.classId, targetClassId))
          .orderBy(desc(schema.assignments.createdAt));
      }

      if (classAssignments.length === 0) {
        classAssignments = await db
          .select({
            id: schema.assignments.id,
            title: schema.assignments.title,
            type: schema.assignments.type,
            instructions: schema.assignments.instructions,
            dueDate: schema.assignments.dueDate,
            status: schema.assignments.status,
            className: schema.classes.name,
          })
          .from(schema.assignments)
          .innerJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
          .orderBy(desc(schema.assignments.createdAt))
          .limit(5);
      }

      recommendedLesson = await db.select().from(schema.lessons).limit(1);
    } catch (e) {
      console.error("Failed to fetch student dashboard:", e);
    }

    const assignedClassName = classes[0]?.name || "Java Coding Class";
    const assignedGrade = classes[0]?.grade || "Grade 8A";

    return {
      profile: profileData[0] || { xpTotal: 0, currentStreak: 0, level: 1 },
      activeClasses: classes,
      recommendedLesson: recommendedLesson[0],
      classAssignments,
      assignedTeacher: {
        name: "Priya Raman",
        title: "Lead Computer Science Faculty",
        email: "priya@school.edu",
        room: "Lab 102",
        className: `${assignedClassName} (${assignedGrade})`,
        subject: "Computer Science & Programming",
        officeHours: "Mon - Fri, 2:30 PM - 4:00 PM",
      },
    };
  });

export const getStudentAssignmentsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c", "admin"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;

    const profileData = await db
      .select({ classId: schema.studentProfiles.classId })
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.userId, userId))
      .limit(1);

    const classId = profileData[0]?.classId;

    let classAssignments: Array<{
      id: number;
      title: string;
      type: string;
      instructions: string | null;
      dueDate: Date | null;
      status: string;
      className: string;
    }> = [];
    if (classId) {
      classAssignments = await db
        .select({
          id: schema.assignments.id,
          title: schema.assignments.title,
          type: schema.assignments.type,
          instructions: schema.assignments.instructions,
          dueDate: schema.assignments.dueDate,
          status: schema.assignments.status,
          className: schema.classes.name,
        })
        .from(schema.assignments)
        .innerJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
        .where(eq(schema.assignments.classId, classId))
        .orderBy(desc(schema.assignments.createdAt));
    }

    if (classAssignments.length === 0) {
      classAssignments = await db
        .select({
          id: schema.assignments.id,
          title: schema.assignments.title,
          type: schema.assignments.type,
          instructions: schema.assignments.instructions,
          dueDate: schema.assignments.dueDate,
          status: schema.assignments.status,
          className: schema.classes.name,
        })
        .from(schema.assignments)
        .innerJoin(schema.classes, eq(schema.assignments.classId, schema.classes.id))
        .orderBy(desc(schema.assignments.createdAt))
        .limit(5);
    }

    return classAssignments;
  });

export const getLessonContent = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((lessonId: number) => lessonId)
  .handler(async ({ data: lessonId, context }) => {
    const lessonData = await db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lessonData.length) throw new Error("Lesson not found");

    const quizzesData = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.lessonId, lessonId));

    return {
      lesson: lessonData[0],
      quizzes: quizzesData,
    };
  });

export const submitQuizAnswer = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator((data: { lessonId: number; answers: Record<number, string> }) => data)
  .handler(async ({ data, context }) => {
    const userId = context.user.id;

    try {
      const quizzesData = await db
        .select()
        .from(schema.quizzes)
        .where(eq(schema.quizzes.lessonId, data.lessonId));

      let isCorrect = true;
      if (quizzesData.length > 0) {
        for (const quiz of quizzesData) {
          if (data.answers[quiz.id as unknown as number] !== quiz.correctAnswer) {
            isCorrect = false;
            break;
          }
        }
      }

      if (isCorrect) {
        const lessonData = await db
          .select()
          .from(schema.lessons)
          .where(eq(schema.lessons.id, data.lessonId))
          .limit(1);
        const xp = lessonData[0]?.xpReward || 10;

        if (!lessonData.length) {
          return { success: true, xpEarned: xp };
        }

        await db.transaction(async (tx) => {
          await tx.insert(schema.completedLessons).values({
            studentId: userId,
            lessonId: data.lessonId,
            score: 100,
          });

          const existingProfile = await tx
            .select()
            .from(schema.studentProfiles)
            .where(eq(schema.studentProfiles.userId, userId));
          if (existingProfile.length > 0) {
            await tx
              .update(schema.studentProfiles)
              .set({ xpTotal: existingProfile[0]!.xpTotal + xp })
              .where(eq(schema.studentProfiles.userId, userId));
          } else {
            await tx.insert(schema.studentProfiles).values({
              userId,
              xpTotal: xp,
              currentStreak: 1,
              level: 1,
            });
          }
        });
        return { success: true, xpEarned: xp };
      }

      return { success: false, xpEarned: 0 };
    } catch (e) {
      console.error("Quiz submission error:", e);
      return { success: true, xpEarned: 10 };
    }
  });

export const submitProject = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator(
    (data: {
      projectId?: string | number;
      lessonId?: number;
      title: string;
      submittedUrl?: string;
      briefName?: string;
      track?: string;
      difficulty?: string;
      xp?: number;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const userId = context.user.id;

    try {
      if (data.projectId) {
        await db
          .update(schema.projects)
          .set({
            submittedUrl: data.submittedUrl || "",
            status: data.submittedUrl ? "submitted" : "pending",
            updatedAt: new Date(),
          })
          .where(eq(schema.projects.id, Number(data.projectId)));
      } else {
        const metadata = JSON.stringify({
          briefName: data.briefName || "Python Text Adventure",
          track: data.track || "Python Backend",
          difficulty: data.difficulty || "Beginner",
          xp: data.xp || 150,
        });

        await db.insert(schema.projects).values({
          studentId: userId,
          lessonId: data.lessonId || null,
          title: data.title,
          submittedUrl: data.submittedUrl || "",
          status: data.submittedUrl ? "submitted" : "pending",
          feedback: metadata,
        });
      }
    } catch (e) {
      console.warn("Demo mode: Insert/update project:", e);
    }

    return { success: true };
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student", "teacher", "s2c"])])
  .validator((data: { projectId: string | number }) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(schema.projects).where(eq(schema.projects.id, Number(data.projectId)));
    } catch (e) {
      console.warn("Delete project error:", e);
    }
    return { success: true };
  });

export const getPracticeItemsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    let items: Array<{
      id: string;
      type: string;
      difficulty: string;
      title: string;
      topic: string;
      minutes: number;
      xp: number;
      prompt: string;
      options?: string[];
      answer?: number;
      explain?: string;
      solved: boolean;
      starterCode?: string;
      testCases?: Array<{ input: string; expected: string }>;
    }> = [];
    let xpTotal = 0;
    let weeklyXP = 0;
    let accuracy = "0%";

    try {
      const [quizzes, profile, completed] = await Promise.all([
        db.select().from(schema.quizzes),
        db
          .select()
          .from(schema.studentProfiles)
          .where(eq(schema.studentProfiles.userId, userId))
          .limit(1),
        db
          .select()
          .from(schema.completedLessons)
          .where(eq(schema.completedLessons.studentId, userId)),
      ]);

      if (profile.length > 0 && profile[0]) {
        xpTotal = profile[0].xpTotal || 0;
      }

      if (completed.length > 0) {
        let sumScore = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        for (const c of completed) {
          sumScore += c.score || 0;
          if (new Date(c.completedAt) > oneWeekAgo) {
            weeklyXP += c.score || 0;
          }
        }
        accuracy = Math.round(sumScore / completed.length) + "%";
      }

      if (quizzes.length > 0) {
        items = quizzes.map((q, i) => ({
          id: q.id.toString(),
          type: i % 2 === 0 ? "Quiz" : "Logic",
          difficulty: i % 3 === 0 ? "Hard" : "Medium",
          title: `Practice ${i + 1}`,
          topic: "General",
          minutes: 5,
          xp: 20,
          prompt: q.questionText,
          options: q.options,
          answer:
            q.options.indexOf(q.correctAnswer) !== -1 ? q.options.indexOf(q.correctAnswer) : 0,
          explain: "This is the correct answer based on the lesson material.",
          solved: false,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch quizzes, using instant fallback:", error);
    }

    if (items.length === 0) {
      items = [
        {
          id: "p-1",
          type: "Coding",
          difficulty: "Easy",
          title: "Sum of Two Numbers",
          topic: "Functions & Math",
          minutes: 5,
          xp: 25,
          prompt: "Write a function sum(a, b) that returns the sum of two integers.",
          starterCode: "function sum(a, b) {\n  // Return the sum\n  return a + b;\n}",
          testCases: [
            { input: "sum(2, 3)", expected: "5" },
            { input: "sum(-1, 5)", expected: "4" },
          ],
          solved: false,
        },
        {
          id: "p-2",
          type: "Debugging",
          difficulty: "Medium",
          title: "Fix the Loop Counter",
          topic: "Loops & Iteration",
          minutes: 8,
          xp: 35,
          prompt:
            "The function countEven(arr) should return how many even numbers are in the array. Fix the off-by-one or condition bug.",
          starterCode:
            "function countEven(arr) {\n  let count = 0;\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] % 2 === 0) count++;\n  }\n  return count;\n}",
          testCases: [{ input: "countEven([1, 2, 3, 4, 6])", expected: "3" }],
          solved: false,
        },
        {
          id: "p-3",
          type: "Logic",
          difficulty: "Easy",
          title: "Boolean Conditions",
          topic: "Logic Gates",
          minutes: 4,
          xp: 20,
          prompt: "What will (true && !false) || false evaluate to?",
          options: ["true", "false", "undefined", "error"],
          answer: 0,
          explain: "true && true evaluates to true. true || false evaluates to true.",
          solved: false,
        },
        {
          id: "p-4",
          type: "Quiz",
          difficulty: "Easy",
          title: "Variable Scoping",
          topic: "Variables",
          minutes: 3,
          xp: 15,
          prompt: "Which keyword introduces a block-scoped variable in modern JavaScript?",
          options: ["var", "let", "global", "function"],
          answer: 1,
          explain: "let and const provide block scoping.",
          solved: false,
        },
      ];
    }

    return {
      items,
      stats: {
        xpTotal: xpTotal || 1240,
        accuracy: accuracy !== "0%" ? accuracy : "86%",
        avgTime: "4m 12s",
        weeklyXP: weeklyXP || 180,
      },
    };
  });

const projectCatalog: Record<
  string,
  {
    brief: string;
    track: string;
    difficulty: string;
    xp: number;
    skills: string[];
    milestones: Array<{ title: string; done: boolean }>;
  }
> = {
  "Python Text Adventure": {
    brief:
      "Design an interactive branching text RPG in Python using conditional branches, functions, and state dictionaries.",
    track: "Python Backend",
    difficulty: "Beginner",
    xp: 150,
    skills: ["Python", "Logic", "State Dictionaries"],
    milestones: [
      { title: "Understand requirements & player stats", done: true },
      { title: "Implement combat and inventory loop", done: false },
      { title: "Add victory and game over conditions", done: false },
    ],
  },
  "HTML/CSS Portfolio": {
    brief:
      "Build a responsive personal web portfolio showcasing your projects, coding accomplishments, and clean responsive CSS.",
    track: "Web Design",
    difficulty: "Easy",
    xp: 120,
    skills: ["HTML5", "CSS3", "Flexbox & Grid"],
    milestones: [
      { title: "Draft semantic hero & about layout", done: true },
      { title: "Design responsive project card grid", done: false },
      { title: "Add contact form and hover animations", done: false },
    ],
  },
  "JavaScript Calculator": {
    brief:
      "Develop an interactive web calculator supporting standard arithmetic, decimal formatting, and error handling.",
    track: "Frontend",
    difficulty: "Medium",
    xp: 140,
    skills: ["JavaScript", "DOM Events", "UI Logic"],
    milestones: [
      { title: "Design calculator button layout", done: true },
      { title: "Implement operator precedence engine", done: false },
      { title: "Handle edge cases like divide by zero", done: false },
    ],
  },
  "AI Prompt Chatbot": {
    brief:
      "Construct a responsive coding tutor assistant that takes user questions and returns structured debugging suggestions.",
    track: "AI & ML",
    difficulty: "Advanced",
    xp: 200,
    skills: ["AI Prompting", "REST APIs", "Prompt Engineering"],
    milestones: [
      { title: "Define tutor persona & system prompt", done: true },
      { title: "Connect API endpoint & handle responses", done: false },
      { title: "Add conversation memory and safety checks", done: false },
    ],
  },
  "Canvas Arcade Game": {
    brief:
      "Program a 2D interactive arcade game featuring smooth sprite animations, keyboard controls, and collision detection.",
    track: "Game Dev",
    difficulty: "Medium",
    xp: 180,
    skills: ["JavaScript", "HTML5 Canvas", "Game Physics"],
    milestones: [
      { title: "Setup 60fps render loop & player sprite", done: true },
      { title: "Implement keyboard controls and velocity", done: false },
      { title: "Spawn obstacles and calculate score", done: false },
    ],
  },
};

export const getStudentProjectsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "teacher", "s2c"])])
  .validator((studentId: string | undefined) => studentId)
  .handler(async ({ data, context }) => {
    const studentId = data as string | undefined;
    const userId = studentId || context.user.id;

    try {
      const userProjects = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.studentId, userId));

      if (userProjects.length > 0) {
        return userProjects.map((p, idx) => {
          let meta: { briefName?: string; track?: string; difficulty?: string; xp?: number } = {};
          if (p.feedback && p.feedback.startsWith("{")) {
            try {
              meta = JSON.parse(p.feedback);
            } catch {}
          }

          const catalogKeys = Object.keys(projectCatalog);
          let matchedKey =
            meta.briefName ||
            catalogKeys.find((k) =>
              p.title.toLowerCase().includes(k.toLowerCase().split(" ")[0] || ""),
            ) ||
            catalogKeys[idx % catalogKeys.length] ||
            "Python Text Adventure";

          if (!projectCatalog[matchedKey]) {
            matchedKey = "Python Text Adventure";
          }

          const config = projectCatalog[matchedKey]!;

          return {
            id: p.id.toString(),
            status:
              p.status === "pending"
                ? p.submittedUrl
                  ? "Submitted"
                  : "In Progress"
                : p.status === "approved"
                  ? "Approved"
                  : "Needs Changes",
            xp: meta.xp || config.xp,
            title: p.title,
            brief: config.brief,
            skills: config.skills,
            track: meta.track || config.track,
            difficulty: meta.difficulty || config.difficulty,
            milestones: config.milestones,
            updated: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "Recently",
            featured: p.status === "approved",
            student: "You",
            className: "Java Coding Class",
          };
        });
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }

    return [];
  });

export const getStudentBadgesFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const badges = await db
      .select()
      .from(schema.earnedBadges)
      .where(eq(schema.earnedBadges.studentId, userId));

    const earned = badges.map((b, i) => ({
      id: b.id.toString(),
      title: b.badgeId,
      desc: "Achievement unlocked!",
      issued: new Date(b.earnedAt).toLocaleDateString(),
      credential: `S2C-B-${b.id}-10421`,
      grade: "8A",
      issuer: "Syntax2Code",
      skills: ["Logic", "Syntax"],
      earned: true,
      fileUrl: b.fileUrl,
    }));

    return earned;
  });

export const addCertificateFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator((data: { title: string; issuer: string; fileUrl?: string }) => data)
  .handler(async ({ data, context }) => {
    const userId = context.user.id;
    await db.insert(schema.earnedBadges).values({
      studentId: userId,
      badgeId: data.title,
      fileUrl: data.fileUrl,
      earnedAt: new Date(),
    });
    return { success: true };
  });

export const getStudentAnnouncementsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const announcements = await db.select().from(schema.announcements);

    return {
      competitions: announcements.map((a) => ({
        id: a.id.toString(),
        name: a.title,
        status: "Registration open",
        date: new Date(a.createdAt).toLocaleDateString(),
        level: "National",
        participants: 1200,
        registered: true,
        rounds: [] as { name: string; date: string; score?: number; state: string }[],
      })),
      leaderboard: [] as { rank: number; name: string; school: string; score: number }[],
    };
  });

export const getStudentProfileFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "teacher", "s2c"])])
  .validator((studentId: string | undefined) => studentId)
  .handler(async ({ data, context }) => {
    const studentId = data as string | undefined;
    const userId = studentId || context.user.id;
    const [profileData, user, badges] = await Promise.all([
      db
        .select()
        .from(schema.studentProfiles)
        .where(eq(schema.studentProfiles.userId, userId))
        .limit(1),
      db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1),
      db.select().from(schema.earnedBadges).where(eq(schema.earnedBadges.studentId, userId)),
    ]);

    const p = profileData[0];

    let schoolName = "Unassigned School";
    let className = "Unassigned Class";
    let gradeName = "";

    if (user[0]?.schoolId) {
      const schoolResult = await db
        .select()
        .from(schema.schools)
        .where(eq(schema.schools.id, user[0].schoolId))
        .limit(1);
      if (schoolResult[0]) schoolName = schoolResult[0].name;
    }

    if (p?.classId) {
      const classResult = await db
        .select()
        .from(schema.classes)
        .where(eq(schema.classes.id, p.classId))
        .limit(1);
      if (classResult[0]) {
        className = classResult[0].name;
        gradeName = classResult[0].grade || "";
      }
    }

    return {
      currentStudent: {
        id: userId,
        name: user[0]?.name || "Student",
        email: user[0]?.email || "",
        className: className,
        gradeName: gradeName,
        schoolName: schoolName,
        lastActive: "Today", // Mock
        skills: [
          { skill: "Logic", value: 85 },
          { skill: "Syntax", value: 70 },
          { skill: "Debugging", value: 60 },
          { skill: "Creativity", value: 90 },
        ],
        classId: p?.classId,
        score: p?.xpTotal || 0,
        xp: p?.xpTotal || 0,
        level: p?.level || 1,
        tag: "Accelerated" as string,
        streak: p?.currentStreak || 0,
        attendance: 98,
        completion: 75,
        badges: badges.length,
        parent: {
          guardianName:
            "Sunita & Rajesh " + (user[0]?.name ? user[0].name.split(" ").slice(-1)[0] : "Sharma"),
          email: `parent.${(user[0]?.name || "student").toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          phone: "+1 (555) 381-9042",
          relation: "Parents / Primary Guardians",
          emergencyContact: "+1 (555) 381-9049",
        },
      },
      achievements: badges.map((b) => ({
        id: b.id.toString(),
        title: b.badgeId,
        desc: "Achievement unlocked",
        earned: true,
      })),
      preferences: {
        reminders: true,
        weeklyReport: true,
        companion: true,
        publicProfile: false,
      },
    };
  });

export const getStudentClubsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    return [
      {
        id: "c-1",
        name: "AI Mavericks",
        blurb: "Building real machine learning models to solve school problems.",
        meets: "Wednesdays, 4 PM",
        members: 32,
        mentor: "Ms. Sarah Jenkins",
        joined: true,
        feed: [
          { who: "Aarav Sharma", what: "Shared a new model accuracy of 92%!", when: "2 hours ago" },
          {
            who: "Ms. Sarah Jenkins",
            what: "Uploaded the dataset for next week.",
            when: "Yesterday",
          },
        ],
      },
      {
        id: "c-2",
        name: "Game Dev Guild",
        blurb: "Designing 2D and 3D games from scratch using Unity and Godot.",
        meets: "Fridays, 3:30 PM",
        members: 45,
        mentor: "Mr. Dave Russo",
        joined: false,
        feed: [
          { who: "Priya Patel", what: "Check out the new character sprites!", when: "5 hours ago" },
          {
            who: "Mr. Dave Russo",
            what: "Reminder: Game jam starts this weekend.",
            when: "2 days ago",
          },
        ],
      },
      {
        id: "c-3",
        name: "Robotics Core",
        blurb: "Programming hardware, from Arduino basics to autonomous bots.",
        meets: "Tuesdays, 4 PM",
        members: 28,
        mentor: "Dr. Alan Grant",
        joined: false,
        feed: [{ who: "Dr. Alan Grant", what: "New sensors arrived in the lab.", when: "Today" }],
      },
      {
        id: "c-4",
        name: "Web Wizards",
        blurb: "Full-stack web development. React, APIs, databases.",
        meets: "Mondays, 3:30 PM",
        members: 56,
        mentor: "Ms. Linda Smith",
        joined: true,
        feed: [
          { who: "Aarav Sharma", what: "Deployed my portfolio site!", when: "Yesterday" },
          {
            who: "Kabir Singh",
            what: "Having trouble with flexbox, any help?",
            when: "2 days ago",
          },
        ],
      },
    ];
  });

export const getStudentLeaderboardFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    let schoolLeaderboard: Array<{
      rank: number;
      name: string;
      detail: string;
      xp: number;
      isCurrentUser: boolean;
    }> = [];
    try {
      const allProfiles = await db
        .select({
          xp: schema.studentProfiles.xpTotal,
          userId: schema.studentProfiles.userId,
          name: schema.user.name,
        })
        .from(schema.studentProfiles)
        .leftJoin(schema.user, eq(schema.studentProfiles.userId, schema.user.id))
        .orderBy(desc(schema.studentProfiles.xpTotal));

      schoolLeaderboard = allProfiles.map((p, i) => ({
        rank: i + 1,
        name: p.name || "Student",
        detail: "Greenfield",
        xp: p.xp,
        isCurrentUser: p.userId === context.user.id,
      }));
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    }

    if (schoolLeaderboard.length === 0) {
      return {
        School: [],
        Class: [],
        Grade: [],
        "Inter-school": [],
      };
    }

    return {
      School: schoolLeaderboard,
      Class: schoolLeaderboard,
      Grade: schoolLeaderboard,
      "Inter-school": schoolLeaderboard,
    };
  });

export const getLearningPathsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    let pathsData: Array<{ id: number; title: string; description: string | null }> = [];
    let allLessons: Array<{ id: number; pathId: number }> = [];
    let completedLessonIds = new Set<number>();

    try {
      const [paths, completed, lessonsList] = await Promise.all([
        db.select().from(schema.learningPaths),
        db
          .select()
          .from(schema.completedLessons)
          .where(eq(schema.completedLessons.studentId, userId)),
        db.select().from(schema.lessons),
      ]);
      pathsData = paths;
      completedLessonIds = new Set(completed.map((c) => c.lessonId));
      allLessons = lessonsList;
    } catch (error) {
      console.error("Failed to fetch learning paths, falling back to mock data:", error);
    }

    if (pathsData.length === 0) {
      return [];
    }

    return pathsData.map((p) => {
      const pathLessons = allLessons.filter((l) => l.pathId === p.id);
      const totalLessons = pathLessons.length;
      const completedCount = pathLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const progress = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

      return {
        id: p.id,
        title: p.title,
        tagline: p.description || "",
        icon: "BookOpen",
        progress,
        level: "Beginner",
        modules: [
          {
            lessons: pathLessons.map((l) => ({
              status: completedLessonIds.has(l.id) ? "completed" : "current",
            })),
          },
        ],
      };
    });
  });

export const askAiTutorFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const lowercaseQuery = query.toLowerCase();

    if (lowercaseQuery.includes("loop")) {
      return "Loops let you repeat code! In JavaScript, you can use a `for` loop like this: `for (let i = 0; i < 10; i++) { ... }`. What language are you trying to write a loop in?";
    } else if (lowercaseQuery.includes("hint")) {
      return "Here is a hint: check the variables you are passing to the function. Are they the correct types?";
    } else if (lowercaseQuery.includes("error")) {
      return "Don't panic! Syntax errors usually mean a missing bracket or typo. Look closely at the line number mentioned in the console.";
    }

    return "That's a great question! Could you be a bit more specific so I can give you the best coding advice?";
  });
