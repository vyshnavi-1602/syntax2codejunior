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
      // Disallow untrusted admin escalation in localStorage
      if (stored && ["student", "teacher", "school"].includes(stored)) {
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
      // For unauthenticated users, prevent local storage tampering from granting admin privileges
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(KEY);
        if (stored === "admin" || stored === "s2c") {
          window.localStorage.setItem(KEY, "student");
          setRole("student");
        }
      }
    }
  }, [realSession?.user]);

  const signIn = useCallback(
    (next: RoleId) => {
      // If user has a real session, do not allow switching to a role they do not have
      if (realSession?.user) {
        const actualRole = (realSession.user as { role?: string }).role || "student";
        const isAllowedAdmin = actualRole === "admin" || actualRole === "s2c";
        if ((next === "admin" || next === "s2c") && !isAllowedAdmin) {
          return;
        }
      } else if (next === "admin" || next === "s2c") {
        // Unauthenticated users cannot elevate to admin via client call
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, next);
      }
      setRole(next);
    },
    [realSession?.user],
  );

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
    }
    setRole("student");
  }, []);

  const value = useMemo<SessionValue>(() => {
    const defaultUser: DemoUser = demoUsers[0]!;
    let mockUser: DemoUser | null = role
      ? (demoUsers.find(
          (u) =>
            u.role === role ||
            (role === "s2c" && u.role === "admin") ||
            (role === "admin" && u.role === "s2c"),
        ) ?? defaultUser)
      : defaultUser;

    if (mockUser) {
      if (typeof window !== "undefined") {
        const savedSettings = window.localStorage.getItem("s2c-profile-settings");
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.name) mockUser.name = parsed.name;
            if (parsed.school) mockUser.school = parsed.school;
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
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              : mockUser.avatar,
          };
        }
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
