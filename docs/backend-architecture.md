# Backend Architecture & Execution Document

This document outlines the complete roadmap for building the backend for Syntax2Code Junior. Currently, the app is a frontend shell using fake data (`mock.ts`). To make it production-ready, we must build a Database, an Authentication system, and an API layer.

## 1. Authentication & Roles (The Security Layer)

We need a secure login system so users see only their own data.

**Roles Needed:**

- **student**: Can access learning paths, submit projects, and view their own grades.
- **teacher**: Can manage their specific classes, grade assignments, and post announcements.
- **school (Admin)**: Can manage all teachers and students within their specific school.
- **s2c (Syntax2Code Super Admin)**: Can manage all schools, global curriculum, and competitions.

**What we will build:** We will integrate an auth provider (like Supabase Auth or Better Auth) to handle secure logins, password resets, and session management.

## 2. Database Schema (The Data Layer)

We need to create a real database (e.g., PostgreSQL) with the following core tables to replace the fake data.

### A. Organization Tables

- **Schools**: id, name, city, plan_type, status
- **Classes**: id, school_id, name, grade, section, teacher_id
- **Users**: id, email, role, name, school_id

### B. Core Curriculum Tables

- **LearningPaths**: id, title, description, difficulty
- **Lessons**: id, path_id, title, content_markdown, xp_reward
- **Quizzes/Questions**: id, lesson_id, question_text, options, correct_answer

### C. Student Progress & Gamification

- **StudentProfiles**: user_id, class_id, xp_total, current_streak, level
- **CompletedLessons**: student_id, lesson_id, completed_at, score
- **Projects**: id, student_id, title, status (Pending/Approved/Needs Changes)
- **EarnedBadges**: student_id, badge_id, earned_at

### D. Communication

- **Announcements**: id, author_id, target_audience (class/school), title, body, created_at

## 3. The API Layer (Server Functions)

Using TanStack Start, we don't need a separate backend server (like Express or Django). We can write Server Functions directly in our app that securely fetch data from the database and pass it to the React frontend.

We need to build API functions for each portal:

**🎓 Student Portal APIs**

- `getStudentDashboard(studentId)`: Fetches their XP, streak, current classes, and next recommended lesson.
- `submitQuizAnswer(lessonId, answer)`: Validates the answer, awards XP, and saves progress to the DB.
- `submitProject(projectData)`: Uploads a project for teacher review.

**👨‍🏫 Teacher Portal APIs**

- `getTeacherClasses(teacherId)`: Fetches the roster of students for the logged-in teacher.
- `gradeProject(projectId, grade, feedback)`: Updates a student's project status and awards XP.
- `createAnnouncement(messageData)`: Broadcasts a message to specific classes.

**🏫 School & Super Admin APIs**

- `getSchoolAnalytics(schoolId)`: Aggregates data to show overall school performance.
- `manageUserRole(userId, newRole)`: Promotes or demotes users.

## 4. Execution Plan (Agile Methodology)

We will follow an Agile approach, building and thoroughly testing the application portal-by-portal. We will not wait until the end to test; every feature will be tested immediately as it is built.

**Sprint 1: Foundation & Google OAuth**

- **Initialize Database**: Set up the database and create the core Users and Schools tables.
- **Setup Google OAuth**: Implement Google OAuth. We will use a lightweight auth library (like Better Auth) solely to manage the Google login flow and map the user's Google email to their specific role (Student, Teacher, or Admin) in our database.

**Sprint 2: The Student Portal**

- **Database & APIs**: Build the tables and server functions for Learning Paths, Projects, and Gamification.
- **UI Integration & Testing**: Wire up the `/student` routes to the real APIs. Test all student features (completing a lesson, viewing XP).

**Sprint 3: The Teacher Portal**

- **Database & APIs**: Build the tables and server functions for Class Rosters, Grading, and Announcements.
- **UI Integration & Testing**: Wire up the `/teacher` routes. Test the teacher workflows (grading a project submitted in Sprint 2, sending an announcement).

**Sprint 4: Admin Portals & Launch**

- **Database & APIs**: Build the analytics aggregation and school management functions.
- **UI Integration & Testing**: Wire up the `/school` and `/admin` routes. Test the admin workflows.
- **Cleanup & Deploy**: Delete `src/data/mock.ts` and deploy to production.
