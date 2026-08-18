import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/auth";
import { signOut } from "@/lib/auth";
import { authedUserState } from "@/utils/test/userStates";
import { ProtectedRoute } from "./ProtectedRoute";

const authMockState = vi.hoisted(() => {
  type AuthEventCallback = (event: string) => void;

  return {
    user: null as typeof import("@/utils/test/userStates").authedUserState.user,
    callbacks: new Set<AuthEventCallback>(),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabaseBrowserClient: {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: authMockState.user },
        error: null,
      })),
      onAuthStateChange: vi.fn((callback: (event: string) => void) => {
        authMockState.callbacks.add(callback);

        return {
          data: {
            subscription: {
              unsubscribe: () => authMockState.callbacks.delete(callback),
            },
          },
        };
      }),
      signOut: vi.fn(async () => {
        authMockState.user = null;
        authMockState.callbacks.forEach((callback) => callback("SIGNED_OUT"));

        return { error: null };
      }),
    },
  },
}));

function ProtectedScreen() {
  return (
    <div>
      <p>Protected app content</p>
      <button type="button" onClick={() => void signOut()}>
        Log out
      </button>
    </div>
  );
}

function renderProtectedRoute() {
  const queryClient = new QueryClient();
  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [{ path: "/", element: <ProtectedScreen /> }],
      },
      {
        path: "/login",
        element: <button type="button">Continue with Google</button>,
      },
    ],
    { initialEntries: ["/"] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("ProtectedRoute", () => {
  afterEach(() => {
    authMockState.user = null;
    authMockState.callbacks.clear();
  });

  it("redirects to login after logout clears auth state", async () => {
    const user = userEvent.setup();
    authMockState.user = authedUserState.user;

    renderProtectedRoute();

    expect(await screen.findByText("Protected app content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Continue with Google" }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Protected app content")).not.toBeInTheDocument();
  });
});
