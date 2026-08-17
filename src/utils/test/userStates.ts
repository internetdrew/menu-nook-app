import type { AuthContextType } from "@/contexts/auth";

export const noUserState: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
};

export const authedUserState: AuthContextType = {
  user: {
    id: "user-1",
    email: "owner@example.com",
    app_metadata: {},
    user_metadata: {
      name: "Test Owner",
    },
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
  },
  isLoading: false,
  error: null,
};
