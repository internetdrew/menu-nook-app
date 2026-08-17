import { render } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthProvider, type AuthContextType } from "@/contexts/auth";
import { routes } from "@/routes";
import { queryClient } from "@/utils/trpc";
import { setLoaderAuthMockForTest } from "@/utils/loaderAuth";

interface RenderAppOptions {
  initialEntries?: string[];
  authMock?: AuthContextType;
}

export function renderApp({
  initialEntries = ["/"],
  authMock,
}: RenderAppOptions = {}) {
  queryClient.clear();
  setLoaderAuthMockForTest(authMock);

  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialMock={authMock}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}
