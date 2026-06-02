import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { createTestQueryClient } from "@/utils/test/createTestQueryClient";
import { renderApp } from "@/utils/test/renderApp";
import { queryClient } from "@/utils/trpc";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: vi.fn(() => null),
}));

const createPreviewItem = (
  id: number,
  name: string,
  categoryId: number,
  orderIndex: number,
) => ({
  id,
  name,
  tagline: null,
  description: null,
  price: 12,
  image_path: null,
  image_url: null,
  menu_id: "menu-123",
  menu_category_id: categoryId,
  created_at: "2026-05-20T00:00:00.000Z",
  updated_at: "2026-05-20T00:00:00.000Z",
  order_index: orderIndex,
  sort_index_id: id + 200,
});

const createPreviewCategory = (
  id: number,
  name: string,
  orderIndex: number,
  items: ReturnType<typeof createPreviewItem>[] = [],
) => ({
  id,
  name,
  description: null,
  menu_id: "menu-123",
  created_at: "2026-05-20T00:00:00.000Z",
  order_index: orderIndex,
  sort_index_id: id + 100,
  items,
});

const createPreviewMenu = (
  categories: ReturnType<typeof createPreviewCategory>[],
) => ({
  id: "menu-123",
  name: "Test Menu",
  business_id: "business-123",
  created_at: "2026-05-20T00:00:00.000Z",
  updated_at: "2026-05-20T00:00:00.000Z",
  menu_categories: categories,
  business: {
    id: "business-123",
    name: "Test Business",
    user_id: "user-123",
    image_path: null,
    image_url: null,
    created_at: "2026-05-20T00:00:00.000Z",
  },
});

const createActiveSubscription = () => ({
  id: "sub-123",
  menu_id: "menu-123",
  status: "active",
  current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
  stripe_customer_id: "cus_123",
  stripe_price_id: "price_123",
  stripe_subscription_id: "sub_stripe_123",
  created_at: "2026-05-20T00:00:00.000Z",
  updated_at: "2026-05-20T00:00:00.000Z",
});

const menuManagerBaseResolvers = (
  getCategories: () => ReturnType<typeof createPreviewCategory>[],
) => ({
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
          created_at: "2026-05-20T00:00:00.000Z",
          updated_at: "2026-05-20T00:00:00.000Z",
        },
      ],
    },
  }),
  "menu.getPreview": () => ({
    result: {
      data: createPreviewMenu(getCategories()),
    },
  }),
  "menuQRCode.getPublicUrlForMenu": () => ({
    result: { data: { public_url: "https://example.com/qr-code.png" } },
  }),
});

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

    expect(await screen.findByText(/MenuNook/i)).toBeInTheDocument();
    expect(await screen.findByText(/Get Started/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 2 Completed/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Name your business/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Name your first menu/i }),
    ).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Create/i })).not.toBeInTheDocument();
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

  it("shows the app loading spinner while menus are loading", async () => {
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
    expect(
      screen.getByRole("status", { name: /loading menu setup/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/1 of 2 Completed/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Name your first menu/i }),
    ).toBeEnabled();
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

  it("shows the onboarding checklist when user has no business", async () => {
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
      expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/0 of 2 Completed/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Name your business/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Name your first menu/i }),
    ).toBeDisabled();
  });

  it("allows business creation when user has no business", async () => {
    let businessCreated = false;

    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: businessCreated
              ? {
                  id: "business-123",
                  name: "Test Business",
                  user_id: "user-123",
                }
              : null,
          },
        }),
        "subscription.getForMenu": () => ({ result: { data: null } }),
        "menu.getAllForBusiness": () => ({ result: { data: [] } }),
      }),

      http.post("/trpc/business.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        businessCreated = true;
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
    queryClient.clear();
    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
      queryClient,
    });

    await waitFor(() => {
      expect(screen.getByText(/0 of 2 Completed/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Name your business/i }),
    );
    const nameInput = screen.getByLabelText(/^Name$/i);
    await user.type(nameInput, "Test Business");
    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/1 of 2 Completed/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Name your first menu/i }),
    ).toBeEnabled();
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
      expect(screen.getByText(/0 of 2 Completed/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Name your business/i }),
    );
    const submitButton = screen.getByRole("button", {
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
      expect(screen.getByText(/1 of 2 Completed/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Name your business/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Name your first menu/i }),
    ).toBeEnabled();
  });
  it("allows menu creation once the user has a business", async () => {
    let menusCreated = false;

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
            data: menusCreated
              ? [
                  {
                    id: "menu-123",
                    name: "Test Menu",
                    business_id: "business-123",
                  },
                ]
              : [],
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
      http.post("/trpc/menu.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        menusCreated = true;
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
      expect(screen.getByText(/1 of 2 Completed/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Name your first menu/i }),
    );
    const nameInput = screen.getByLabelText(/Menu Name/i);
    await user.type(nameInput, "Test Menu");
    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You're all set!/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/No categories yet/i)).toBeInTheDocument();
    });
  });

  it("walks a new user through onboarding before entering the dashboard", async () => {
    let createdBusiness:
      | { id: string; name: string; user_id: string }
      | null = null;
    let createdMenu:
      | { id: string; name: string; business_id: string }
      | null = null;
    let finishBusinessCreate: (() => void) | undefined;
    let finishMenuCreate: (() => void) | undefined;
    let finishMenuPreview: (() => void) | undefined;

    server.use(
      createTrpcQueryHandler({
        "business.getForUser": () => ({
          result: {
            data: createdBusiness,
          },
        }),
        "subscription.getForMenu": () => ({
          result: {
            data: null,
          },
        }),
        "menu.getAllForBusiness": () => ({
          result: {
            data: createdMenu ? [createdMenu] : [],
          },
        }),
        "menu.getPreview": async () => {
          if (createdMenu) {
            await new Promise<void>((resolve) => {
              finishMenuPreview = resolve;
            });
          }

          return {
            result: {
              data: createdMenu
                ? {
                    id: createdMenu.id,
                    name: createdMenu.name,
                    business_id: createdMenu.business_id,
                    menu_categories: [],
                    business: {
                      id: "business-123",
                      image_url: null,
                      name: createdBusiness?.name ?? "Test Business",
                    },
                  }
                : null,
            },
          };
        },
        "menuQRCode.getPublicUrlForMenu": () => ({
          result: { data: { public_url: "https://example.com/qr-code.png" } },
        }),
      }),
      http.post("/trpc/business.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        createdBusiness = {
          id: "business-123",
          name: body.name,
          user_id: "user-123",
        };
        await new Promise<void>((resolve) => {
          finishBusinessCreate = resolve;
        });

        return HttpResponse.json([
          {
            result: {
              data: createdBusiness,
            },
          },
        ]);
      }),
      http.post("/trpc/menu.create", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        createdMenu = {
          id: "menu-123",
          name: body.name,
          business_id: "business-123",
        };
        await new Promise<void>((resolve) => {
          finishMenuCreate = resolve;
        });

        return HttpResponse.json([
          {
            result: {
              data: createdMenu,
            },
          },
        ]);
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    expect(await screen.findByText(/0 of 2 Completed/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Name your first menu/i }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: /Name your business/i }),
    );
    await user.type(screen.getByLabelText(/^Name$/i), "Test Business");
    await user.click(screen.getByRole("button", { name: /Create/i }));

    const sendingBusinessButton = await screen.findByRole("button", {
      name: /Sending/i,
    });
    expect(sendingBusinessButton).toBeDisabled();
    finishBusinessCreate?.();

    await waitFor(() => {
      expect(screen.getByText(/1 of 2 Completed/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Name your first menu/i }),
    );
    const menuNameInput = screen.getByLabelText(/Menu Name/i);
    await user.type(menuNameInput, "Dinner");
    const menuForm = menuNameInput.closest("form");
    expect(menuForm).not.toBeNull();
    await user.click(
      within(menuForm as HTMLFormElement).getByRole("button", {
        name: /Create/i,
      }),
    );

    const sendingMenuButton = await screen.findByRole("button", {
      name: /Sending/i,
    });
    expect(sendingMenuButton).toBeDisabled();
    finishMenuCreate?.();

    expect(await screen.findByText(/You're all set!/i)).toBeInTheDocument();
    expect(screen.getByText(/Everything is set up and ready/i)).toBeInTheDocument();
    expect(screen.queryByText(/No categories yet/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Continue/i }));

    expect(
      await screen.findByRole("status", {
        name: /loading menu categories/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/MenuNook/i)).toBeInTheDocument();
    expect(screen.queryByText(/No categories yet/i)).not.toBeInTheDocument();

    finishMenuPreview?.();

    await waitFor(() => {
      expect(screen.getByText(/No categories yet/i)).toBeInTheDocument();
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
      expect(screen.getByText(/1 of 2 Completed/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Name your first menu/i }),
    );
    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);

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

    const previewLink = await screen.findByRole("link", { name: /^preview$/i });
    expect(previewLink).toHaveAttribute("href", "/preview/menu/menu-123");
    expect(
      screen.queryByRole("button", { name: /^share$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /test menu/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^new category$/i }),
    ).toBeInTheDocument();
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
            data: createActiveSubscription(),
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

    expect(
      await screen.findByRole("button", { name: /^new category$/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /^preview$/i }),
    ).toHaveAttribute("href", "/preview/menu/menu-123");
    expect(screen.queryByText(/categories managed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/items managed/i)).not.toBeInTheDocument();
  });

  it("removes a deleted item from the menu manager without refreshing", async () => {
    const burger = createPreviewItem(10, "Burger", 1, 0);
    const fries = createPreviewItem(11, "Fries", 1, 1);
    let deletedItemId: number | null = null;
    let finishDelete: (() => void) | undefined;

    server.use(
      createTrpcQueryHandler(
        menuManagerBaseResolvers(() => [
          createPreviewCategory(
            1,
            "Mains",
            0,
            [burger, fries].filter((item) => item.id !== deletedItemId),
          ),
        ]),
      ),
      http.post("/trpc/menuCategoryItem.delete", async ({ request }) => {
        await request.json();
        await new Promise<void>((resolve) => {
          finishDelete = resolve;
        });
        deletedItemId = burger.id;

        return HttpResponse.json([
          {
            result: {
              data: burger,
            },
          },
        ]);
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/"], authMock: authedUserState });

    await user.click(
      await screen.findByRole("button", { name: /expand mains/i }),
    );
    expect(screen.getAllByText("Burger").length).toBeGreaterThan(0);
    expect(screen.getByText("Fries")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /open actions for burger/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /delete item/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("Burger")).toBeInTheDocument();
    await waitFor(() => {
      expect(finishDelete).toBeDefined();
    });
    finishDelete?.();
    await waitFor(() => {
      expect(deletedItemId).toBe(burger.id);
    });

    await waitFor(() => {
      expect(screen.queryByText("Burger")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Fries")).toBeInTheDocument();
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
        "subscription.getForMenu": () => ({
          result: { data: createActiveSubscription() },
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
        "subscription.getForMenu": () => ({
          result: { data: createActiveSubscription() },
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

  it("keeps the open category open when fetched category order changes", async () => {
    const drinks = createPreviewCategory(1, "Drinks", 0);
    const mains = createPreviewCategory(2, "Mains", 1);
    const desserts = createPreviewCategory(3, "Desserts", 2);
    let categories = [drinks, mains, desserts];

    server.use(
      createTrpcQueryHandler(menuManagerBaseResolvers(() => categories)),
    );

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
      queryClient,
    });

    await user.click(
      await screen.findByRole("button", { name: /expand mains/i }),
    );

    expect(
      screen.getByRole("button", { name: /collapse mains/i }),
    ).toBeInTheDocument();

    categories = [desserts, mains, drinks];
    await act(async () => {
      await queryClient.invalidateQueries();
    });

    await waitFor(() => {
      expect(
        screen
          .getAllByRole("heading", { level: 2 })
          .map((heading) => heading.textContent),
      ).toEqual(["Desserts", "Mains", "Drinks"]);
    });
    expect(
      screen.getByRole("button", { name: /collapse mains/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand desserts/i }),
    ).toBeInTheDocument();
  });

  it("keeps every category closed when fetched category order changes with none open", async () => {
    const drinks = createPreviewCategory(1, "Drinks", 0);
    const mains = createPreviewCategory(2, "Mains", 1);
    const desserts = createPreviewCategory(3, "Desserts", 2);
    let categories = [drinks, mains, desserts];

    server.use(
      createTrpcQueryHandler(menuManagerBaseResolvers(() => categories)),
    );

    const queryClient = createTestQueryClient();
    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
      queryClient,
    });

    expect(
      await screen.findByRole("button", { name: /expand drinks/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand mains/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand desserts/i }),
    ).toBeInTheDocument();

    categories = [desserts, mains, drinks];
    await act(async () => {
      await queryClient.invalidateQueries();
    });

    await waitFor(() => {
      expect(
        screen
          .getAllByRole("heading", { level: 2 })
          .map((heading) => heading.textContent),
      ).toEqual(["Desserts", "Mains", "Drinks"]);
    });
    expect(screen.queryByRole("button", { name: /collapse/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /expand desserts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand mains/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand drinks/i }),
    ).toBeInTheDocument();
  });

  it("keeps the home shell visible while menu categories load", async () => {
    const drinks = createPreviewCategory(1, "Drinks", 0);
    let resolvePreview: (() => void) | undefined;
    const previewRequest = new Promise<void>((resolve) => {
      resolvePreview = resolve;
    });

    server.use(
      createTrpcQueryHandler({
        ...menuManagerBaseResolvers(() => [drinks]),
        "menu.getPreview": async () => {
          await previewRequest;

          return {
            result: {
              data: createPreviewMenu([drinks]),
            },
          };
        },
      }),
    );

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("status", {
        name: /loading menu categories/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/MenuNook/i)).toBeInTheDocument();
    expect(await screen.findByText(/Test Menu/i)).toBeInTheDocument();
    expect(screen.queryByText(/No categories yet/i)).not.toBeInTheDocument();

    resolvePreview?.();

    expect(
      await screen.findByRole("button", { name: /expand drinks/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: /loading menu categories/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the category form from the bottom new category button", async () => {
    const drinks = createPreviewCategory(1, "Drinks", 0);

    server.use(
      createTrpcQueryHandler(menuManagerBaseResolvers(() => [drinks])),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("button", { name: /expand drinks/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /^new category$/i }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/create new category/i),
    ).toBeInTheDocument();
  });

  it("uses an embedded new category trigger for the empty category state", async () => {
    server.use(createTrpcQueryHandler(menuManagerBaseResolvers(() => [])));

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(await screen.findByText(/No categories yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Create a category like Appetizers, Entrees, or Drinks/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new category/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /new category/i }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: /^add category$/i }),
    ).not.toBeInTheDocument();
  });

});
