import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
  useState,
} from "react";
import { type User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(initialMock?.user ?? null);
  const [isLoading, setIsLoading] = useState(initialMock?.isLoading ?? true);
  const [error, setError] = useState<Error | null>(initialMock?.error ?? null);

  useEffect(() => {
    if (initialMock) return;

    const loadUser = () => {
      supabaseBrowserClient.auth.getUser().then(({ data: { user }, error }) => {
        setUser(user);
        setIsLoading(false);

        if (error) {
          setError(error);
        } else {
          setError(null);
        }
      });
    };

    loadUser();

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setError(null);
        setIsLoading(false);
        queryClient.clear();
        return;
      }

      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialMock, queryClient]);

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
