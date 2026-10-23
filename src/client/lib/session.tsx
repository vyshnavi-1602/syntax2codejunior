/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authClient, useSession as useRealSession } from "@/client/lib/auth-client";

export const demoUsers: DemoUser[] = [
  {
    id: "1",
    role: "student",
    name: "Aarav Gupta",
    email: "student@syntax2code.com",
    avatar: "AG",
    school: "Global Tech High",
    subtitle: "Grade 8",
  },
  {
    id: "2",
    role: "teacher",
    name: "Teacher",
    email: "teacher@syntax2code.com",
    avatar: "T",
    school: "Global Tech High",
    subtitle: "Computer Science",
  },
  {
    id: "3",
    role: "school",
    name: "Principal Sharma",
    email: "school@syntax2code.com",
    avatar: "PS",
    school: "Global Tech High",
    subtitle: "School Administrator",
  },
  {
    id: "4",
    role: "admin",
    name: "Platform Admin",
    email: "admin@syntax2code.com",
    avatar: "PA",
    school: "Syntax2Code",
    subtitle: "Super Admin",
  },
  {
    id: "5",
    role: "s2c",
    name: "Platform Admin",
    email: "admin@syntax2code.com",
    avatar: "PA",
    school: "Syntax2Code",
    subtitle: "Super Admin",
  },
];
export interface DemoUser {
  id: string;
  role: RoleId;
  name: string;
  email: string;
  avatar: string;
  school: string;
  subtitle?: string;
  isRealAuth?: boolean;
}
export type RoleId = "student" | "teacher" | "school" | "admin" | "s2c";

export const roleHome: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  school: "/school",
  admin: "/admin",
  s2c: "/admin",
};

const KEY = "s2c-demo-role";

interface SessionValue {
  user: DemoUser | null;
  role: RoleId | null;
  signIn: (role: RoleId) => void;
  signOut: () => void;
  ready: boolean;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  role: null,
  signIn: () => {},
  signOut: () => {},
  ready: false,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: realSession, isPending } = useRealSession();
  const [role, setRole] = useState<RoleId | null>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(KEY);
      if (
        stored &&
        (["student", "teacher", "school", "admin", "s2c"] as string[]).includes(stored)
      ) {
        return stored as RoleId;
      }
    }
    return "student";
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (realSession?.user) {
      let realRole = (realSession.user as { role?: string }).role || "student";
      if (realRole === "user") realRole = "student";

      // Server session is the single source of truth for authenticated users
      setRole(realRole as RoleId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, realRole);
      }
    } else {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(KEY);
        if (stored && ["student", "teacher", "school", "admin", "s2c"].includes(stored)) {
          setRole(stored as RoleId);
        }
      }
    }
  }, [realSession?.user]);

  const signIn = useCallback((next: RoleId) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, next);
      document.cookie = `s2c_role=${next}; path=/; max-age=31536000; SameSite=Lax`;
      const matched = demoUsers.find((u) => u.role === next) || demoUsers[0]!;
      document.cookie = `s2c_name=${encodeURIComponent(matched.name)}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `s2c_email=${encodeURIComponent(matched.email)}; path=/; max-age=31536000; SameSite=Lax`;
      const savedSettings = window.localStorage.getItem("s2c-profile-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.role && parsed.role !== next) {
            window.localStorage.removeItem("s2c-profile-settings");
          } else if (next === "student" && parsed.name === "Platform Admin") {
            window.localStorage.removeItem("s2c-profile-settings");
          }
        } catch {
          window.localStorage.removeItem("s2c-profile-settings");
        }
      }
    }
    setRole(next);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch (_e) {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem("s2c-profile-settings");
      window.localStorage.clear();
      document.cookie = "s2c_role=; path=/; max-age=0";
      document.cookie = "s2c-demo-role=; path=/; max-age=0";
      document.cookie = "s2c_name=; path=/; max-age=0";
      document.cookie = "s2c_email=; path=/; max-age=0";
    }
    setRole("student");
  }, []);

  const value = useMemo<SessionValue>(() => {
    const defaultUser: DemoUser = demoUsers[0]!;
    const matchedUser = role
      ? (demoUsers.find(
          (u) =>
            u.role === role ||
            (role === "s2c" && u.role === "admin") ||
            (role === "admin" && u.role === "s2c"),
        ) ?? defaultUser)
      : defaultUser;

    let mockUser: DemoUser = { ...matchedUser };

    if (typeof window !== "undefined") {
      const savedSettings = window.localStorage.getItem("s2c-profile-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          const roleMatches = !parsed.role || parsed.role === role;
          const isAdminContaminatingStudent =
            role === "student" &&
            (parsed.name === "Platform Admin" || parsed.role === "admin" || parsed.role === "s2c");
          if (roleMatches && !isAdminContaminatingStudent) {
            if (parsed.name) mockUser.name = parsed.name;
            if (parsed.email) mockUser.email = parsed.email;
            if (parsed.school) mockUser.school = parsed.school;
            if (parsed.name) {
              mockUser.avatar = parsed.name
                .split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
            }
          }
        } catch (_err) {
          // ignore corrupted JSON
        }
      }
    }

    if (realSession?.user) {
      const sessionRole = (realSession.user as { role?: string }).role || "student";
      const isRoleMatch =
        sessionRole === role ||
        ((role === "admin" || role === "s2c") &&
          (sessionRole === "admin" || sessionRole === "s2c"));

      if (isRoleMatch) {
        mockUser = {
          ...mockUser,
          name: realSession.user.name || mockUser.name,
          email: realSession.user.email || mockUser.email,
          isRealAuth: true,
          avatar: realSession.user.name
            ? realSession.user.name
                .split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()
            : mockUser.avatar,
        };
      }
    }

    return {
      role,
      user: mockUser,
      signIn,
      signOut,
      ready: ready && !isPending,
    };
  }, [role, signIn, signOut, ready, realSession, isPending]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
