import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, type AuthContextType } from "@/contexts/auth";
import { routes } from "@/routes";
import { createTestQueryClient } from "./createTestQueryClient";

interface RenderAppOptions {
  initialEntries?: string[];
  authMock?: AuthContextType;
  queryClient?: ReturnType<typeof createTestQueryClient>;
}

export function renderApp({
  initialEntries = ["/"],
  authMock,
  queryClient: providedQueryClient,
}: RenderAppOptions) {
  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  const queryClient = providedQueryClient ?? createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialMock={authMock}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}
