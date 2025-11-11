import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
  useState,
} from "react";
import { type User, type Session } from "@supabase/supabase-js";
import { supabaseBrowserClient } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    supabaseBrowserClient.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        setSession(session);
        setIsLoading(false);
        if (error) setError(error);
      });

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
      } else if (session) {
        setSession(session);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user: session?.user ?? null,
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
