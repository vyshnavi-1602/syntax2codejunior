export type RoleId = "student" | "teacher" | "school" | "s2c";

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  activeColor?: "purple" | "emerald" | "indigo";
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const navByRole: Record<RoleId, NavGroup[]> = {
  student: [
    {
      group: "Learn",
      items: [
        { label: "My World", to: "/student", icon: "Home" },
        { label: "Assignments", to: "/student/assignments", icon: "ClipboardList" },
        { label: "MCQ Assessment", to: "/student/mcq", icon: "ClipboardCheck" },
        { label: "Learn", to: "/student/learn", icon: "BookOpen" },
        { label: "Practice", to: "/student/practice", icon: "Target" },
        { label: "Build", to: "/student/build", icon: "Hammer" },
        { label: "Coding", to: "/student/lab", icon: "Terminal" },
      ],
    },
    {
      group: "Community",
      items: [
        { label: "Compete", to: "/student/compete", icon: "Trophy" },
        { label: "Clubs", to: "/student/clubs", icon: "Users" },
        { label: "Leaderboard", to: "/student/leaderboard", icon: "BarChart3" },
      ],
    },
    {
      group: "Me",
      items: [
        { label: "Portfolio", to: "/student/portfolio", icon: "Layers" },
        { label: "Certificates", to: "/student/certificates", icon: "Award" },
        { label: "My Profile", to: "/student/profile", icon: "UserRound" },
      ],
    },
  ],
  teacher: [
    {
      group: "Teach",
      items: [
        { label: "Dashboard", to: "/teacher", icon: "Home" },
        { label: "Student Directory", to: "/teacher/students", icon: "GraduationCap" },
        { label: "Project Reviews", to: "/teacher/reviews", icon: "CheckCircle2" },
      ],
    },
    {
      group: "Content",
      items: [
        { label: "Courses", to: "/teacher/courses", icon: "GraduationCap", activeColor: "purple" },
        { label: "Questions", to: "/teacher/questions", icon: "BookOpen" },
        { label: "Assignments", to: "/teacher/assignments", icon: "ClipboardList" },
        { label: "MCQ Assessment", to: "/teacher/questions", icon: "ClipboardCheck" },
        { label: "Meetings", to: "/teacher/classes", icon: "Video", activeColor: "emerald" },
        { label: "Groups", to: "/teacher/classes", icon: "Layers" },
      ],
    },
    {
      group: "Insights & Guardrails",
      items: [
        { label: "Analytics & Reports", to: "/teacher/analytics", icon: "BarChart3" },
        { label: "Announcements", to: "/teacher/announcements", icon: "Megaphone" },
        { label: "Student Support", to: "/teacher/support", icon: "LifeBuoy" },
        { label: "Class Guardrails", to: "/teacher/guardrails", icon: "ShieldCheck" },
      ],
    },
  ],
  school: [
    {
      group: "Institution",
      items: [
        { label: "Executive Overview", to: "/school", icon: "Home" },
        { label: "Courses", to: "/school/courses", icon: "BookOpen" },
        { label: "Students", to: "/school/students", icon: "GraduationCap" },
        { label: "Teachers", to: "/school/teachers", icon: "Users" },
        { label: "Classes", to: "/school/classes", icon: "LayoutGrid" },
        { label: "Timetable & Schedule", to: "/school/schedule", icon: "Calendar" },
      ],
    },
    {
      group: "Strategy",
      items: [
        { label: "AI & Coding Readiness", to: "/school/readiness", icon: "Gauge" },
        { label: "Reports & Announcements", to: "/school/reports", icon: "FileText" },
        { label: "Parent Dispatches", to: "/school/dispatches", icon: "Mail" },
      ],
    },
  ],
  s2c: [
    {
      group: "Platform",
      items: [
        { label: "Global Overview", to: "/admin", icon: "Home" },
        { label: "Schools & Licenses", to: "/admin/schools", icon: "Building2" },
        { label: "Users", to: "/admin/users", icon: "Users" },
        { label: "Moderation Center", to: "/admin/moderation", icon: "ShieldCheck" },
      ],
    },
    {
      group: "Content",
      items: [
        { label: "Curriculum CMS", to: "/admin/curriculum", icon: "BookOpen" },
        { label: "Assessments", to: "/admin/questions", icon: "ClipboardList" },
        { label: "Competitions", to: "/admin/competitions", icon: "Trophy" },
        { label: "Certificates", to: "/admin/certificates", icon: "Award" },
        { label: "Gamification Rules", to: "/admin/gamification", icon: "Sparkles" },
      ],
    },
    {
      group: "Operations",
      items: [
        { label: "Settings & Analytics", to: "/admin/analytics", icon: "Gauge" },
        { label: "Master Schedule & Operations", to: "/admin/schedule", icon: "CalendarClock" },
      ],
    },
  ],
};
