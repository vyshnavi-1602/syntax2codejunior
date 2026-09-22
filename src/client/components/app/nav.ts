import type { RoleId } from "@/client/data/mock";

export interface NavItem {
  label: string;
  to: string;
  icon: string;
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
        { label: "Learn", to: "/student/learn", icon: "BookOpen" },
        { label: "Practice", to: "/student/practice", icon: "Target" },
        { label: "Build", to: "/student/build", icon: "Hammer" },
        { label: "Coding Lab", to: "/student/lab", icon: "Terminal" },
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
        { label: "My Classes", to: "/teacher/classes", icon: "Users" },
        { label: "Assignments", to: "/teacher/assignments", icon: "ClipboardList" },
        { label: "Project Reviews", to: "/teacher/reviews", icon: "CheckCircle2" },
      ],
    },
    {
      group: "Insights",
      items: [
        { label: "Analytics & Reports", to: "/teacher/analytics", icon: "BarChart3" },
        { label: "Announcements", to: "/teacher/announcements", icon: "Megaphone" },
      ],
    },
  ],
  school: [
    {
      group: "Institution",
      items: [
        { label: "Executive Overview", to: "/school", icon: "Home" },
        { label: "Students", to: "/school/students", icon: "GraduationCap" },
        { label: "Teachers", to: "/school/teachers", icon: "Users" },
        { label: "Classes", to: "/school/classes", icon: "LayoutGrid" },
      ],
    },
    {
      group: "Strategy",
      items: [
        { label: "AI & Coding Readiness", to: "/school/readiness", icon: "Gauge" },
        { label: "Reports & Announcements", to: "/school/reports", icon: "FileText" },
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
      items: [{ label: "Settings & Analytics", to: "/admin/analytics", icon: "Gauge" }],
    },
  ],
};
