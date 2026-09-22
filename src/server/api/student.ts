import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { auth } from "../auth/auth";
import { authMiddleware, roleMiddleware } from "../middleware/auth";

export const getPathContent = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c", "admin"])])
  .validator((pathId: number) => pathId)
  .handler(async ({ data: pathId, context }) => {
    const pathData = await db
      .select()
      .from(schema.learningPaths)
      .where(eq(schema.learningPaths.id, pathId))
      .limit(1);
    if (!pathData.length) throw new Error("Path not found");

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

    const profileData = await db
      .select()
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.userId, userId))
      .limit(1);

    const classes = await db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.id, profileData[0]?.classId ?? -1));

    const recommendedLesson = await db.select().from(schema.lessons).limit(1);

    return {
      profile: profileData[0] || { xpTotal: 0, currentStreak: 0, level: 1 },
      activeClasses: classes,
      recommendedLesson: recommendedLesson[0],
    };
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

    const { lessonId, answers } = data;
    const quizzesData = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.lessonId, lessonId));

    let isCorrect = true;
    for (const quiz of quizzesData) {
      if (answers[quiz.id] !== quiz.correctAnswer) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      const lessonData = await db
        .select()
        .from(schema.lessons)
        .where(eq(schema.lessons.id, lessonId))
        .limit(1);
      const xp = lessonData[0]?.xpReward || 10;

      await db.transaction(async (tx) => {
        await tx.insert(schema.completedLessons).values({
          studentId: userId,
          lessonId,
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
  });

export const submitProject = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator((data: { lessonId: number; title: string; submittedUrl: string }) => data)
  .handler(async ({ data, context }) => {
    const userId = context.user.id;

    await db.insert(schema.projects).values({
      studentId: userId,
      lessonId: data.lessonId,
      title: data.title,
      submittedUrl: data.submittedUrl,
      status: "pending",
    });

    return { success: true };
  });

export const getPracticeItemsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    // For MVP, we'll fetch real quizzes and mock the visual/metadata fields
    // that don't exist in the schema yet (like difficulty, topic, xp)
    const quizzes = await db.select().from(schema.quizzes);

    return quizzes.map((q, i) => ({
      id: q.id.toString(),
      type: i % 2 === 0 ? "Quiz" : "Logic",
      difficulty: i % 3 === 0 ? "Hard" : "Medium",
      title: `Practice ${i + 1}`,
      topic: "General",
      minutes: 5,
      xp: 20,
      prompt: q.questionText,
      options: q.options,
      answer: q.options.indexOf(q.correctAnswer) !== -1 ? q.options.indexOf(q.correctAnswer) : 0,
      explain: "This is the correct answer based on the lesson material.",
      solved: false, // Could join with completed_lessons in the future
    }));
  });

export const getStudentProjectsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const userProjects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.studentId, userId));

    return userProjects.map((p) => ({
      id: p.id.toString(),
      status:
        p.status === "pending"
          ? "Submitted"
          : p.status === "approved"
            ? "Approved"
            : "Needs Changes",
      xp: 150,
      title: p.title,
      brief: "Build an interactive web application based on this week's lesson.", // faked
      skills: ["React", "CSS", "Logic"], // faked
      track: "Frontend",
      difficulty: "Medium",
      updated: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "Recently",
      featured: p.status === "approved",
      student: "You",
      className: "Your Class",
    }));
  });

export const getStudentBadgesFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const badges = await db
      .select()
      .from(schema.earnedBadges)
      .where(eq(schema.earnedBadges.studentId, userId));

    // Map real earned badges and provide some mocked locked ones
    const earned = badges.map((b, i) => ({
      id: b.id.toString(),
      title: b.badgeId, // Let's use badgeId as title for now
      desc: "Achievement unlocked!",
      issued: new Date(b.earnedAt).toLocaleDateString(),
      credential: `S2C-B-${b.id}-10421`,
      grade: "8A",
      issuer: "Syntax2Code",
      skills: ["Logic", "Syntax"],
      earned: true,
    }));

    return [
      ...earned,
      {
        id: "locked-1",
        title: "Code Master",
        desc: "Complete all paths.",
        issued: "Locked",
        credential: "Locked",
        grade: "N/A",
        issuer: "Syntax2Code",
        skills: ["Mastery"],
        earned: false,
      },
    ];
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
        rounds: [
          { name: "Round 1", date: "Oct 15", score: "80/100", state: "Completed" },
          { name: "Round 2", date: "Oct 26", score: "--", state: "Live" },
        ],
      })),
      leaderboard: [
        { rank: 1, name: "Alice", school: "Springfield", score: 2500 },
        { rank: 2, name: "Aarav Sharma", school: "Greenfield", score: 2100 },
        { rank: 3, name: "Bob", school: "Central High", score: 1950 },
      ],
    };
  });

export const getStudentProfileFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const profileData = await db
      .select()
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.userId, userId))
      .limit(1);

    const user = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);

    const badges = await db
      .select()
      .from(schema.earnedBadges)
      .where(eq(schema.earnedBadges.studentId, userId));

    const p = profileData[0];
    return {
      currentStudent: {
        name: user[0]?.name || "Student",
        email: user[0]?.email || "",
        score: p?.xpTotal || 0,
        level: p?.level || 1,
        tag: "Rising Star",
        attendance: 98,
        badges: badges.length,
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
    return {
      Class: [
        { rank: 1, name: "Aarav Sharma", detail: "8A", xp: 5400 },
        { rank: 2, name: "Priya Patel", detail: "8A", xp: 4800 },
        { rank: 3, name: "Rohan Kumar", detail: "8A", xp: 4650 },
      ],
      Grade: [
        { rank: 1, name: "Zara Ali", detail: "8C", xp: 6100 },
        { rank: 2, name: "Aarav Sharma", detail: "8A", xp: 5400 },
        { rank: 3, name: "Kabir Singh", detail: "8B", xp: 5200 },
      ],
      School: [
        { rank: 1, name: "Meera Reddy", detail: "10B", xp: 12400 },
        { rank: 2, name: "Arjun Nair", detail: "9A", xp: 9800 },
        { rank: 3, name: "Zara Ali", detail: "8C", xp: 6100 },
        { rank: 4, name: "Aarav Sharma", detail: "8A", xp: 5400 },
      ],
      "Inter-school": [
        { rank: 1, name: "Aditi S.", detail: "Oakridge", xp: 24500 },
        { rank: 2, name: "Vikram C.", detail: "DPS", xp: 21200 },
        { rank: 3, name: "Sneha M.", detail: "Greenfield", xp: 19800 },
      ],
    };
  });

export const getLearningPathsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const pathsData = await db.select().from(schema.learningPaths);

    const completed = await db
      .select()
      .from(schema.completedLessons)
      .where(eq(schema.completedLessons.studentId, userId));
    const completedLessonIds = new Set(completed.map((c) => c.lessonId));

    const allLessons = await db.select().from(schema.lessons);

    return pathsData.map((p) => {
      const pathLessons = allLessons.filter((l) => l.pathId === p.id);
      const totalLessons = pathLessons.length;
      const completedCount = pathLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const progress = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

      return {
        id: p.id,
        title: p.title,
        tagline: p.description,
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
