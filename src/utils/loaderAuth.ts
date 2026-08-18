import type { AuthContextType } from "@/contexts/auth";
import { supabaseBrowserClient } from "@/lib/supabase";

let testAuthMock: AuthContextType | undefined;

export const setLoaderAuthMockForTest = (
  authMock: AuthContextType | undefined,
) => {
  if (import.meta.env.MODE === "test") {
    testAuthMock = authMock;
  }
};

export const getLoaderUser = async () => {
  if (import.meta.env.MODE === "test" && testAuthMock) {
    return testAuthMock.isLoading ? null : testAuthMock.user;
  }

  const {
    data: { user },
  } = await supabaseBrowserClient.auth.getUser();

  return user;
};
