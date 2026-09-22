# Sprint Planning: Syntax2Code Junior Backend

**Stack**: TanStack Start (React), TypeScript, PostgreSQL, Auth (e.g., Better Auth), ORM (e.g., Prisma or Drizzle).
**Methodology**: Agile (1-2 week sprints)

---

## Sprint 1: Foundation & Authentication 🏗️

**Goal**: Set up the core database, ORM, and get Google OAuth working with role-based access.

### Technical Tasks

- `[ ]` **Setup Database & ORM (3 pts)**
  - Provision a PostgreSQL database (e.g., Neon, Supabase, or local Docker).
  - Install ORM (Prisma or Drizzle) and configure the connection string.
  - Define the initial schema for `Users` (id, email, role, name, school_id) and `Schools` (id, name, city, plan_type, status).
  - Create and run the first migration.
- `[ ]` **Authentication Integration (5 pts)**
  - Integrate an Auth provider (e.g., Better Auth or NextAuth/Auth.js if applicable for TanStack).
  - Configure Google OAuth credentials in Google Cloud Console.
  - Implement login/logout server functions and state management on the frontend.
- `[ ]` **Role-Based Access Control (RBAC) Setup (3 pts)**
  - Ensure the auth callback maps the Google email to a `User` record in the database.
  - Create a middleware or wrapper function `withAuth(allowedRoles)` for protecting TanStack Start routes and server functions.
- `[ ]` **Basic UI Wiring (2 pts)**
  - Create a simple Login page with a "Sign in with Google" button.
  - Create a protected `/dashboard` redirect that checks the user's role and redirects them to `/student`, `/teacher`, or `/admin`.

---

## Sprint 2: The Student Portal & Gamification 🎓

**Goal**: Enable students to view their dashboard, take lessons, and track their progress (XP, streaks).

### Technical Tasks

- `[ ]` **Curriculum Database Schema (3 pts)**
  - Define schemas for `LearningPaths`, `Lessons`, and `Quizzes/Questions`.
  - Define schemas for Gamification: `StudentProfiles`, `CompletedLessons`, `Projects`, `EarnedBadges`.
  - Run migrations and write a seed script with basic curriculum data so we can test the UI.
- `[ ]` **Student Dashboard Server Functions (5 pts)**
  - Build `getStudentDashboard(studentId)`: Needs an optimized SQL query (or ORM relation) to fetch `StudentProfile`, active `Classes`, and calculate the `next recommended lesson`.
  - Wire this API to the `/student` frontend route, replacing `mock.ts` data.
- `[ ]` **Lesson & Quiz Execution flow (5 pts)**
  - Build `getLessonContent(lessonId)` to render the Markdown content on the frontend.
  - Build `submitQuizAnswer(lessonId, answer)`:
    - Validate the answer against the DB.
    - If correct, use a transaction to: Create a `CompletedLessons` record AND increment `xp_total` in `StudentProfile`.
- `[ ]` **Project Submission (3 pts)**
  - Build `submitProject(projectData)`: Create a `Projects` record with status `Pending`.
  - Build the frontend form for students to submit links/code.

---

## Sprint 3: The Teacher Portal 👨‍🏫

**Goal**: Enable teachers to view their rosters, grade pending projects, and post announcements.

### Technical Tasks

- `[ ]` **Teacher Classes & Roster APIs (3 pts)**
  - Build `getTeacherClasses(teacherId)`: Fetch all `Classes` where `teacher_id` matches, including a count of students.
  - Build `getClassRoster(classId)`: Fetch all `Users` (role=student) belonging to that class.
- `[ ]` **Grading System & Project Review (5 pts)**
  - Build `getPendingProjects(classId)`: Fetch all projects with `status='Pending'`.
  - Build `gradeProject(projectId, grade, feedback)`:
    - Use a transaction to: Update `Projects` status (e.g., 'Approved'), add feedback, AND award XP to the student's `StudentProfile` based on the grade.
  - Wire up the Teacher dashboard UI to consume these endpoints.
- `[ ]` **Announcements System (3 pts)**
  - Define `Announcements` schema (id, author_id, target_audience, title, body).
  - Build `createAnnouncement()` and `getAnnouncementsForClass()`.
  - Implement a rich-text or simple text area on the frontend for teachers to broadcast messages.

---

## Sprint 4: Admin Portals, Analytics & Launch 🏫

**Goal**: Provide oversight tools for School Admins, remove all mock data, and deploy to production.

### Technical Tasks

- `[ ]` **School Admin Server Functions (5 pts)**
  - Build `getSchoolAnalytics(schoolId)`: Write aggregation queries to calculate average XP per class, total active students, and completion rates. (Might require complex SQL `GROUP BY` depending on ORM).
  - Build `manageUserRole(userId, newRole)`: API to promote a teacher or remove a student.
- `[ ]` **Super Admin (s2c) Tools (3 pts)**
  - Build global overview APIs (total schools, total revenue/plans).
  - Build UI for managing global curriculum (adding new Learning Paths).
- `[ ]` **Security & Refactoring (3 pts)**
  - Audit all server functions to ensure `withAuth()` is strictly enforcing roles (e.g., a student can't call `gradeProject`).
  - Completely remove `src/data/mock.ts` and ensure the app doesn't break.
- `[ ]` **Deployment & CI/CD (4 pts)**
  - Set up a CI/CD pipeline (e.g., GitHub Actions, Vercel, or Railway).
  - Configure environment variables for production (Database URI, Auth Secrets).
  - Final QA testing on the staging environment before pointing the live domain.
