import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithGoogle } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  signInWithGoogle: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseBrowserClient: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the sign in prompt to guests", () => {
    renderApp({ initialEntries: ["/login"], authMock: noUserState });

    expect(
      screen.getByRole("heading", { name: /menunook/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /sign in to give your menu a clean, simple home of its own/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("shows a loading indicator while auth is resolving", () => {
    renderApp({
      initialEntries: ["/login"],
      authMock: {
        user: null,
        isLoading: true,
        error: null,
      },
    });

    expect(
      screen.getByRole("status", { name: /loading/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
  });

  it("takes signed in users to the dashboard instead of showing sign in", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: null,
          },
        }),
        "subscription.getForMenu": () => ({
          result: {
            data: null,
          },
        }),
      }),
    );

    renderApp({ initialEntries: ["/login"], authMock: authedUserState });

    expect(
      await screen.findByRole("button", { name: /create business/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
  });

  it("shows that Google sign in is connecting after the user clicks", async () => {
    vi.mocked(signInWithGoogle).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    renderApp({ initialEntries: ["/login"], authMock: noUserState });

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    const button = await screen.findByRole("button", {
      name: /connecting to google/i,
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("status", { name: /loading/i }),
    ).toBeInTheDocument();
  });
});
