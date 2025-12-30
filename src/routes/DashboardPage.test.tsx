import { supabaseBrowserClient } from "@/lib/supabase";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => {
  return {
    supabaseBrowserClient: {
      auth: {
        signOut: vi.fn(),
      },
    },
  };
});

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard layout", async () => {
    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(screen.getByText(/MenuNook/i)).toBeInTheDocument();

    const button = screen.getByRole("button", {
      name: /feedback/i,
    });
    expect(button).toBeInTheDocument();

    expect(screen.getByText(/Mock User/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it("allows user to log out", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: null,
          },
        }),
        "subscription.getForUser": () => ({
          result: {
            data: null,
          },
        }),
      }),
    );

    const user = userEvent.setup();

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(screen.getByText(/Mock User/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();

    const userMenuButton = screen.getByRole("button", {
      name: /mock user/i,
    });
    await user.click(userMenuButton);
    const logoutButton = await screen.findByRole("button", {
      name: /log out/i,
    });
    expect(logoutButton).toBeInTheDocument();
    await user.click(logoutButton);

    expect(supabaseBrowserClient.auth.signOut).toHaveBeenCalled();
  });

  it("shows no business message card when user has no business", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: null,
          },
        }),
        "subscription.getForUser": () => ({
          result: {
            data: null,
          },
        }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    await waitFor(() => {
      expect(screen.getByText(/No business found/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Add your business to start managing your menus./i),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /create business/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("renders the menu creation card when the user has a business", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: {
              id: "business-123",
              name: "Test Business",
              user_id: "user-123",
            },
          },
        }),
        "subscription.getForUser": () => ({
          result: {
            data: null,
          },
        }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [],
          },
        }),
      }),
    );

    renderApp({ initialEntries: ["/dashboard"], authMock: authedUserState });

    await waitFor(() => {
      expect(screen.getByText(/no menus found/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Test Business/i)).toBeInTheDocument();
    expect(
      screen.getByText(/add your first menu to get started./i),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /create menu/i,
    });
    expect(button).toBeInTheDocument();
  });
});
