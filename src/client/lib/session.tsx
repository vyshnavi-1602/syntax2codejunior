import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const demoUsers: any = [];
export type DemoUser = any;
export type RoleId = any;

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
  const [role, setRole] = useState<RoleId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    if (stored && ["student", "teacher", "school", "s2c"].includes(stored)) {
      setRole(stored as RoleId);
    }
    setReady(true);
  }, []);

  const signIn = useCallback((next: RoleId) => {
    window.localStorage.setItem(KEY, next);
    setRole(next);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(KEY);
    setRole(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      role,
      user: role ? (demoUsers.find((u) => u.role === role) ?? null) : null,
      signIn,
      signOut,
      ready,
    }),
    [role, signIn, signOut, ready],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
