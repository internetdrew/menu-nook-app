import { supabaseBrowserClient } from "@/lib/supabase";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";
import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { http, HttpResponse } from "msw";

vi.mock("@/lib/supabase", () => {
  return {
    supabaseBrowserClient: {
      auth: {
        signOut: vi.fn(),
      },
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: vi.fn(() => null),
}));

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

  it("allows business creation when user has no business", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({ result: { data: null } }),
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({ result: { data: null } }),
      }),

      http.post("/trpc/business.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json([
          {
            result: {
              data: {
                id: "business-123",
                name: body.name,
                user_id: "user-123",
              },
            },
          },
        ]);
      }),
    );

    const user = userEvent.setup();
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
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(
      within(dialog).getByText(/Create Your Business/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Add your business to start managing your menus./i,
      ),
    ).toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText(/Name/i);
    await user.type(nameInput, "Test Business");
    const submitButton = within(dialog).getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

    expect(dialog).not.toBeInTheDocument();
  });

  it("renders an error message when user tries to create a business without text entry", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({ result: { data: null } }),
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({ result: { data: null } }),
      }),

      http.post("/trpc/business.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json([
          {
            result: {
              data: {
                id: "business-123",
                name: body.name,
                user_id: "user-123",
              },
            },
          },
        ]);
      }),
    );

    const user = userEvent.setup();
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
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(
      within(dialog).getByText(/Create Your Business/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Add your business to start managing your menus./i,
      ),
    ).toBeInTheDocument();

    const submitButton = within(dialog).getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

    expect(
      screen.getByText(/Name must be at least 2 characters./i),
    ).toBeInTheDocument();
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
  it("allows menu creation once the user has a business", async () => {
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
      http.post("/trpc/menu.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json([
          {
            result: {
              data: {
                id: "menu-123",
                name: body.name,
                business_id: "business-123",
              },
            },
          },
        ]);
      }),
    );

    const user = userEvent.setup();
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
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(within(dialog).getByText(/Create New Menu/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Fill in the details below to create a new menu./i,
      ),
    ).toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText(/Menu Name/i);
    await user.type(nameInput, "Test Menu");
    const submitButton = within(dialog).getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

    expect(dialog).not.toBeInTheDocument();
  });

  it("renders an error message when user tries to create a menu without text entry", async () => {
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
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({ result: { data: [] } }),
      }),

      http.post("/trpc/business.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json([
          {
            result: {
              data: {
                id: "business-123",
                name: body.name,
                user_id: "user-123",
              },
            },
          },
        ]);
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/"], authMock: authedUserState });

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
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(within(dialog).getByText(/Create New Menu/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Fill in the details below to create a new menu./i,
      ),
    ).toBeInTheDocument();

    const submitButton = within(dialog).getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

    expect(dialog).toBeInTheDocument();

    expect(
      screen.getByText(/Menu name must have at least 2 characters./i),
    ).toBeInTheDocument();
  });

  it("renders full sidebar items when a business and menu are created", async () => {
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
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Test Menu",
                business_id: "business-123",
              },
            ],
          },
        }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(await screen.findByText(/Test Business/i)).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", { name: /app sidebar/i });
    expect(sidebar).toBeInTheDocument();

    expect(await within(sidebar).findByText(/Test Menu/i)).toBeInTheDocument();

    expect(within(sidebar).getByText(/Manage/i)).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: /categories/i }),
    ).toBeInTheDocument();

    expect(within(sidebar).getByText(/Menu Preview/i)).toBeInTheDocument();

    expect(within(sidebar).getByText(/Mock User/i)).toBeInTheDocument();
    expect(within(sidebar).getByText(/test@example.com/i)).toBeInTheDocument();
  });
  it("renders link to live menu when user has a valid subscription", async () => {
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
            data: {
              id: "sub-123",
              status: "active",
            },
          },
        }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Test Menu",
                business_id: "business-123",
              },
            ],
          },
        }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(await screen.findByText(/Test Business/i)).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", { name: /app sidebar/i });
    expect(sidebar).toBeInTheDocument();

    expect(
      within(sidebar).queryByText(/Menu Preview/i),
    ).not.toBeInTheDocument();

    expect(
      await within(sidebar).findByRole("link", { name: /live menu/i }),
    ).toBeInTheDocument();
  });

  it("renders home page overview when user has business and menus", async () => {
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
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Test Menu",
                business_id: "business-123",
              },
            ],
          },
        }),
        "menuCategory.getAllSortedByIndex": () => ({
          result: { data: [] },
        }),
        "menuCategory.getCountByMenuId": () => ({
          result: { data: 9 },
        }),
        "menuCategoryItem.getCountByMenuId": () => ({
          result: { data: 0 },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    renderApp({ initialEntries: ["/dashboard"], authMock: authedUserState });

    expect(await screen.findByText(/Test Menu Overview/i)).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /share menu/i }),
    ).toBeInTheDocument();

    const categoriesManagedTitle = screen.getByText(/categories managed/i);
    const categoriesCard = categoriesManagedTitle?.closest(
      '[data-slot="card"]',
    ) as HTMLElement;
    expect(screen.getByText(/categories managed/i)).toBeInTheDocument();
    expect(await within(categoriesCard).findByText("9")).toBeInTheDocument();

    const itemsManagedTitle = screen.getByText(/items managed/i);
    const itemsCard = itemsManagedTitle?.closest(
      '[data-slot="card"]',
    ) as HTMLElement;
    expect(screen.getByText(/items managed/i)).toBeInTheDocument();
    expect(await within(itemsCard).findByText("0")).toBeInTheDocument();
  });

  it("renders qr code share dialog when share menu button is clicked", async () => {
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
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Test Menu",
                business_id: "business-123",
              },
            ],
          },
        }),
        "menuCategory.getAllSortedByIndex": () => ({
          result: { data: [] },
        }),
        "menuCategory.getCountByMenuId": () => ({
          result: { data: 0 },
        }),
        "menuCategoryItem.getCountByMenuId": () => ({
          result: { data: 0 },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/dashboard"], authMock: authedUserState });

    const shareMenuButton = await screen.findByRole("button", {
      name: /share menu/i,
    });
    expect(shareMenuButton).toBeInTheDocument();
    await user.click(shareMenuButton);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(within(dialog).getByText(/Share Your Menu/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Put your camera over the QR code to open your menu or copy the link and paste into your browser./i,
      ),
    ).toBeInTheDocument();

    const qrCodeImage = within(dialog).getByAltText(/Menu QR Code/i);
    expect(qrCodeImage).toBeInTheDocument();
    expect(qrCodeImage).toHaveAttribute(
      "src",
      "https://example.com/qr-code.png",
    );
  });

  it("copies qr code link to clipboard when user clicks button", async () => {
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
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Test Menu",
                business_id: "business-123",
              },
            ],
          },
        }),
        "menuCategory.getAllSortedByIndex": () => ({
          result: { data: [] },
        }),
        "menuCategory.getCountByMenuId": () => ({
          result: { data: 0 },
        }),
        "menuCategoryItem.getCountByMenuId": () => ({
          result: { data: 0 },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    const user = userEvent.setup();

    const writeTextSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();

    renderApp({ initialEntries: ["/dashboard"], authMock: authedUserState });

    const shareMenuButton = await screen.findByRole("button", {
      name: /share menu/i,
    });
    expect(shareMenuButton).toBeInTheDocument();
    await user.click(shareMenuButton);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(
      within(dialog).getByRole("button", { name: /copy link/i }),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: /copy link/i }),
    );

    expect(writeTextSpy).toHaveBeenCalledWith(
      `${window.location.origin}/menu/menu-123`,
    );
  });
});
