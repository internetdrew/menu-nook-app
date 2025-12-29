// test/utils/renderApp.tsx
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth";
import { MenuProvider } from "@/contexts/ActiveMenuContext";
import { routes } from "@/routes";
import { createTestQueryClient } from "./createTestQueryClient";

export function renderApp(initialEntries: string[] = ["/"]) {
  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  const queryClient = createTestQueryClient();

  return render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <MenuProvider>
          <RouterProvider router={router} />
        </MenuProvider>
      </QueryClientProvider>
    </AuthProvider>,
  );
}
