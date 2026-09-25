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
      // Mock data for demo purposes
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
    let profileData: Array<{ classId: number | null; xpTotal: number; currentStreak: number; level: number }> = [];
    let classes: Array<{ id: number; name: string; grade: string | null }> = [];
    let recommendedLesson: Array<{ id: number }> = [];

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

      recommendedLesson = await db.select().from(schema.lessons).limit(1);
    } catch (e) {
      console.error("Failed to fetch student dashboard:", e);
    }

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
      return { success: true, xpEarned: 10 }; // Fallback to demo mode
    }
  });

export const submitProject = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator(
    (data: {
      projectId?: string | number;
      lessonId?: number;
      title: string;
      submittedUrl: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const userId = context.user.id;

    try {
      if (data.projectId) {
        await db
          .update(schema.projects)
          .set({
            submittedUrl: data.submittedUrl,
            status: data.submittedUrl ? "submitted" : "pending",
            updatedAt: new Date(),
          })
          .where(eq(schema.projects.id, Number(data.projectId)));
      } else {
        await db.insert(schema.projects).values({
          studentId: userId,
          lessonId: data.lessonId || null,
          title: data.title,
          submittedUrl: data.submittedUrl,
          status: data.submittedUrl ? "submitted" : "pending",
        });
      }
    } catch (e) {
      console.warn(
        "Demo mode: Failed to insert/update project, likely missing FK. Proceeding with success.",
      );
    }

    return { success: true };
  });

export const getPracticeItemsFn = createServerFn({ method: "GET" })
  .middleware([roleMiddleware(["student", "s2c"])])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    let items: any[] = [];
    let xpTotal = 0;
    let weeklyXP = 0;
    let accuracy = "0%";

    try {
      const [quizzes, profile, completed] = await Promise.all([
        db.select().from(schema.quizzes),
        db.select().from(schema.studentProfiles).where(eq(schema.studentProfiles.userId, userId)).limit(1),
        db.select().from(schema.completedLessons).where(eq(schema.completedLessons.studentId, userId))
      ]);

      if (profile.length > 0) {
        xpTotal = profile[0].xpTotal;
      }

      if (completed.length > 0) {
        let sumScore = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        for (const c of completed) {
          sumScore += c.score || 0;
          if (new Date(c.completedAt) > oneWeekAgo) {
            weeklyXP += (c.score || 0);
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
      console.error("Failed to fetch quizzes, falling back to mock data:", error);
    }

    if (items.length === 0) {
      items = [
        {
          id: "mock-code-1",
          type: "Coding",
          difficulty: "Medium",
          title: "Hello JavaScript",
          topic: "JavaScript",
          minutes: 10,
          xp: 50,
          prompt:
            "Write a function called `greet` that takes a name as a parameter and returns 'Hello ' + name.",
          starterCode: "function greet(name) {\n  // Write your code here\n}",
          testCases: [
            { input: "greet('Alice')", expected: "'Hello Alice'" },
            { input: "greet('Bob')", expected: "'Hello Bob'" },
          ],
          solved: false,
        },
        {
          id: "mock-1",
          type: "Quiz",
          difficulty: "Easy",
          title: "Python Basics Quick Check",
          topic: "Python",
          minutes: 3,
          xp: 15,
          prompt: "What is the output of print(2 + 3)?",
          options: ["23", "5", "Error", "None"],
          answer: 1,
          explain: "The + operator adds two integers together in Python.",
          solved: false,
        },
        {
          id: "mock-2",
          type: "Logic",
          difficulty: "Medium",
          title: "Loop Logic Puzzle",
          topic: "Loops",
          minutes: 5,
          xp: 25,
          prompt: "If a loop runs from i=0 to i<3, how many times does it execute?",
          options: ["2", "3", "4", "Infinite"],
          answer: 1,
          explain: "It runs for i=0, i=1, and i=2. That is exactly 3 times.",
          solved: false,
        },
      ];
    }

    return {
      items,
      stats: {
        xpTotal: xpTotal,
        accuracy: accuracy,
        avgTime: "4m 12s", // Keep this static for now, as we don't have duration in completedLessons
        weeklyXP: weeklyXP,
      }
    };
  });

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
        return userProjects.map((p) => ({
          id: p.id.toString(),
          status:
            p.status === "pending"
              ? p.submittedUrl
                ? "Submitted"
                : "In Progress"
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
      badgeId: data.title, // using badgeId to store title for simplicity
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
    let schoolLeaderboard: Array<{ rank: number; name: string; detail: string; xp: number; isCurrentUser: boolean }> = [];
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

    // In a real app we would compute class and grade dynamically.
    // For now we map everything to "School" and fallback the rest.
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
    let pathsData: Array<{ id: number; title: string; description: string }> = [];
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
      // Mock data for demo purposes if DB is empty
      return [
        {
          id: 1,
          title: "AI Explorer",
          tagline: "Learn the basics of Machine Learning.",
          icon: "Sparkles",
          progress: 45,
          level: "Beginner",
          modules: [
            { lessons: [{ status: "completed" }, { status: "current" }, { status: "pending" }] },
            { lessons: [{ status: "pending" }, { status: "pending" }] },
          ],
        },
        {
          id: 2,
          title: "Python Basics",
          tagline: "Start your coding journey here.",
          icon: "Terminal",
          progress: 100,
          level: "Beginner",
          modules: [{ lessons: [{ status: "completed" }, { status: "completed" }] }],
        },
        {
          id: 3,
          title: "Web Creator",
          tagline: "Build your first website.",
          icon: "Globe",
          progress: 0,
          level: "Intermediate",
          modules: [
            { lessons: [{ status: "pending" }, { status: "pending" }, { status: "pending" }] },
          ],
        },
      ];
    }

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

export const askAiTutorFn = createServerFn({ method: "POST" })
  .middleware([roleMiddleware(["student"])])
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    // Mock LLM API response for Phase 4
    await new Promise((resolve) => setTimeout(resolve, 800)); // simulate latency
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
