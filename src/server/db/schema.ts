import { pgTable, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core";

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  planType: text("plan_type").default("free").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),

  role: text("role").default("student").notNull(),
  active: boolean("active").default(true).notNull(),
  schoolId: integer("school_id").references(() => schools.id),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .references(() => schools.id)
    .notNull(),
  name: text("name").notNull(),
  grade: text("grade"),
  section: text("section"),
  teacherId: text("teacher_id")
    .references(() => user.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").default("beginner").notNull(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  pathId: integer("path_id")
    .references(() => learningPaths.id)
    .notNull(),
  title: text("title").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  xpReward: integer("xp_reward").default(10).notNull(),
  orderIdx: integer("order_idx").default(0).notNull(),
});

// Quiz table definition
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id)
    .notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswer: text("correct_answer").notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  userId: text("user_id")
    .references(() => user.id)
    .primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  xpTotal: integer("xp_total").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  level: integer("level").default(1).notNull(),
});

export const completedLessons = pgTable("completed_lessons", {
  id: serial("id").primaryKey(),
  studentId: text("student_id")
    .references(() => user.id)
    .notNull(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id)
    .notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  score: integer("score"),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  studentId: text("student_id")
    .references(() => user.id)
    .notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  status: text("status").default("pending").notNull(),
  submittedUrl: text("submitted_url"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const earnedBadges = pgTable("earned_badges", {
  id: serial("id").primaryKey(),
  studentId: text("student_id")
    .references(() => user.id)
    .notNull(),
  badgeId: text("badge_id").notNull(),
  fileUrl: text("file_url"),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  authorId: text("author_id")
    .references(() => user.id)
    .notNull(),
  targetAudience: text("target_audience").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .references(() => classes.id)
    .notNull(),
  teacherId: text("teacher_id")
    .references(() => user.id)
    .notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  instructions: text("instructions"),
  dueDate: timestamp("due_date"),
  status: text("status").default("Active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  meetingTime: text("meeting_time"),
  teacherId: text("teacher_id")
    .references(() => user.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(), // e.g., "Hackathon", "Coding Challenge"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
