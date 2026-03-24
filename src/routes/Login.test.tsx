import { expect, describe, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { supabaseBrowserClient } from "@/lib/supabase";
import "@testing-library/jest-dom";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";

vi.mock("@/lib/supabase", () => {
  return {
    supabaseBrowserClient: {
      auth: {
        signInWithOAuth: vi.fn(),
      },
    },
  };
});

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login page with title and description when no user is present", () => {
    renderApp({ initialEntries: ["/login"], authMock: noUserState });

    expect(screen.getByText(/Welcome to MenuNook/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sign in to manage menus, categories, items, and QR sharing./i,
      ),
    ).toBeInTheDocument();
  });

  it("redirects to home when user is present", () => {
    renderApp({
      initialEntries: ["/login"],
      authMock: authedUserState,
    });

    expect(screen.queryByText(/Welcome to MenuNook/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /Sign in to manage menus, categories, items, and QR sharing./i,
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue with Google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/MenuNook/i)).toBeInTheDocument();
  });

  it("renders Google sign-in button", () => {
    renderApp({ initialEntries: ["/login"], authMock: noUserState });

    const button = screen.getByRole("button", {
      name: /Continue with Google/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("calls signInWithOAuth when Google button is clicked", async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ["/login"], authMock: noUserState });

    const button = screen.getByRole("button", {
      name: /Continue with Google/i,
    });
    await user.click(button);

    expect(supabaseBrowserClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.stringContaining("/auth/callback"),
      },
    });
  });
});
