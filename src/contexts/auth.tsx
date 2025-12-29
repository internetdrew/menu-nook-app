import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
  useState,
} from "react";
import { type User } from "@supabase/supabase-js";
import { supabaseBrowserClient } from "@/lib/supabase";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialMock,
}: {
  children: ReactNode;
  initialMock?: AuthContextType;
}) {
  const [user, setUser] = useState<User | null>(initialMock?.user ?? null);
  const [isLoading, setIsLoading] = useState(initialMock?.isLoading ?? true);
  const [error, setError] = useState<Error | null>(initialMock?.error ?? null);

  useEffect(() => {
    if (initialMock) return;

    supabaseBrowserClient.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (error) {
          setError(error);
        }
      });

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session) {
        setUser(session.user);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialMock]);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
