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
import { useSession as useRealSession } from "@/client/lib/auth-client";

export const demoUsers: DemoUser[] = [
  {
    id: "1",
    role: "student",
    name: "Aarav Gupta",
    email: "aarav@school.edu",
    avatar: "AG",
    school: "Global Tech High",
    subtitle: "Grade 8",
  },
  {
    id: "2",
    role: "teacher",
    name: "Priya Raman",
    email: "priya@school.edu",
    avatar: "PR",
    school: "Global Tech High",
    subtitle: "Computer Science",
  },
  {
    id: "3",
    role: "school",
    name: "Principal Sharma",
    email: "admin@school.edu",
    avatar: "SS",
    school: "Global Tech High",
    subtitle: "Administrator",
  },
  {
    id: "4",
    role: "admin",
    name: "S2C Admin",
    email: "admin@syntax2code.com",
    avatar: "SA",
    school: "Syntax2Code",
    subtitle: "Platform Admin",
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
  const [role, setRole] = useState<RoleId | null>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(KEY);
      if (stored && ["student", "teacher", "school", "admin", "s2c"].includes(stored)) {
        return stored as RoleId;
      }
    }
    return null;
  });
  const [ready, setReady] = useState(false);
  const { data: realSession, isPending } = useRealSession();

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (realSession?.user) {
      let realRole = (realSession.user as { role?: string }).role || "student";
      if (realRole === "user") realRole = "student";

      if (!role) {
        setRole(realRole as RoleId);
        window.localStorage.setItem(KEY, realRole);
      }
    }
  }, [realSession?.user, role]);

  const signIn = useCallback((next: RoleId) => {
    window.localStorage.setItem(KEY, next);
    setRole(next);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(KEY);
    setRole(null);
  }, []);

  const value = useMemo<SessionValue>(() => {
    let mockUser = role ? (demoUsers.find((u) => u.role === role) ?? null) : null;

    // Merge real user data into the mock template so the UI shows the correct name
    if (mockUser && realSession?.user) {
      mockUser = {
        ...mockUser,
        name: realSession.user.name || mockUser.name,
        email: realSession.user.email || mockUser.email,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  return useContext(SessionContext);
}
