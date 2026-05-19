import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { createTestQueryClient } from "@/utils/test/createTestQueryClient";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: vi.fn(() => null),
}));

describe("Dashboard Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders dashboard layout", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({ result: { data: null } }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(screen.getByText(/MenuNook/i)).toBeInTheDocument();
    expect(await screen.findByText(/No Business Found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Business/i }),
    ).toBeInTheDocument();
  });

  it("redirects guests to the login screen", async () => {
    renderApp({ initialEntries: ["/"], authMock: noUserState });

    expect(
      screen.getByText(
        /Sign in to give your menu a clean, simple home of its own./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue with Google/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/MenuNook/i)).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: /Feedback/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock User/i)).not.toBeInTheDocument();
  });

  it("redirects guests from unknown app routes to the login screen", async () => {
    renderApp({ initialEntries: ["/unknown-route"], authMock: noUserState });

    expect(
      screen.getByRole("button", { name: /Continue with Google/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Page Not Found/i)).not.toBeInTheDocument();
  });

  it("shows the not found route to authenticated users", async () => {
    renderApp({
      initialEntries: ["/unknown-route"],
      authMock: authedUserState,
    });

    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it("shows a route loading spinner while auth is resolving", async () => {
    renderApp({
      initialEntries: ["/"],
      authMock: {
        user: null,
        isLoading: true,
        error: null,
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: /loading/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /Continue with Google/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the menu manager skeleton while menus are loading", async () => {
    server.use(
      http.get("/trpc/*", async ({ request }) => {
        const url = new URL(request.url);
        const procedure = url.pathname.replace("/trpc/", "");

        if (procedure === "business.getForUser") {
          return HttpResponse.json({
            result: {
              data: {
                id: "business-123",
                name: "Test Bistro",
                user_id: "user-123",
              },
            },
          });
        }

        if (procedure === "menu.getAllForBusiness") {
          await new Promise((resolve) => setTimeout(resolve, 100));

          return HttpResponse.json({
            result: {
              data: [],
            },
          });
        }

        if (procedure === "subscription.getForMenu") {
          return HttpResponse.json({
            result: {
              data: null,
            },
          });
        }

        return HttpResponse.json({
          result: {
            data: null,
          },
        });
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(screen.queryByText(/No menu selected/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("menu-manager-skeleton")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/No menus found/i)).toBeInTheDocument();
    });
  });

  it("does not show cached business and menu UI to signed out users", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: {
              id: "business-123",
              name: "Test Bistro",
              user_id: "user-123",
            },
          },
        }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Dinner",
                business_id: "business-123",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        }),
        "subscription.getForMenu": () => ({
          result: {
            data: null,
          },
        }),
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Dinner",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Bistro",
              },
            },
          },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    const queryClient = createTestQueryClient();
    const { unmount } = renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
      queryClient,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Dinner/i }),
      ).toBeInTheDocument();
    });

    unmount();

    renderApp({
      initialEntries: ["/"],
      authMock: noUserState,
      queryClient,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Continue with Google/i }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
  });

  it("keeps the last selected menu after reload", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: {
              id: "business-123",
              name: "Test Bistro",
              user_id: "user-123",
            },
          },
        }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: [
              {
                id: "menu-123",
                name: "Dinner",
                business_id: "business-123",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: "menu-456",
                name: "Lunch",
                business_id: "business-123",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        }),
        "subscription.getForMenu": () => ({
          result: {
            data: null,
          },
        }),
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Dinner",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Bistro",
              },
            },
          },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    const user = userEvent.setup();
    const firstRender = renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Dinner/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /dinner/i,
      }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Lunch" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Lunch/i }),
      ).toBeInTheDocument();
    });

    firstRender.unmount();

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Lunch/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows no business message card when user has no business", async () => {
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
        "subscription.getForMenu": () => ({ result: { data: null } }),
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

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  });

  it("renders an error message when user tries to create a business without text entry", async () => {
    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({ result: { data: null } }),
        "subscription.getForMenu": () => ({ result: { data: null } }),
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
        "subscription.getForMenu": () => ({
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

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    await waitFor(() => {
      expect(screen.getByText(/no menus found/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/add your first menu to get started./i),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /add menu/i,
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
        "subscription.getForMenu": () => ({
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
    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    await waitFor(() => {
      expect(screen.getByText(/no menus found/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/add your first menu to get started./i),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /add menu/i,
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

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
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
        "subscription.getForMenu": () => ({ result: { data: null } }),
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

    expect(
      screen.getByText(/add your first menu to get started./i),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /add menu/i,
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

  it("renders the active menu controls when a business and menu are created", async () => {
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
        "subscription.getForMenu": () => ({ result: { data: null } }),
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
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Test Menu",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(
      await screen.findByRole("button", { name: /^share$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /test menu/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/No categories yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /settings/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /categories/i })).toBeNull();
  });

  it("renders a share button when user has a live menu", async () => {
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
        "subscription.getForMenu": () => ({
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
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Test Menu",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(
      await screen.findByRole("button", { name: /^share$/i }),
    ).toBeInTheDocument();
  });

  it("renders the menu manager when user has business and menus", async () => {
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
        "subscription.getForMenu": () => ({ result: { data: null } }),
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
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Test Menu",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(await screen.findByText(/No categories yet/i)).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /^share$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/categories managed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/items managed/i)).not.toBeInTheDocument();
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
        "subscription.getForMenu": () => ({ result: { data: null } }),
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
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Test Menu",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    const shareMenuButton = await screen.findByRole("button", {
      name: /^share$/i,
    });
    expect(shareMenuButton).toBeInTheDocument();
    await user.click(shareMenuButton);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(within(dialog).getByText(/Share menu/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Scan the QR code or copy the menu link./i),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("button", { name: /copy link/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /download qr code/i }),
    ).toBeInTheDocument();
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
        "subscription.getForMenu": () => ({ result: { data: null } }),
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
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "menu-123",
              name: "Test Menu",
              business_id: "business-123",
              menu_categories: [],
              business: {
                id: "business-123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
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

    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    const shareMenuButton = await screen.findByRole("button", {
      name: /^share$/i,
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
