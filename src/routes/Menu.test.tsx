import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Preview Route (/preview/:id)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users away from preview routes", async () => {
    renderApp({
      initialEntries: ["/preview/menu/123"],
      authMock: noUserState,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/let's get your menu online./i),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/this is a preview of your live menu/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /your menu is not live because your subscription is inactive/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("renders a preview banner when user has no subscription", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForMenu": () => ({ result: { data: null } }),
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "123",
              name: "Test Menu",
              menu_categories: [
                {
                  id: "cat1",
                  name: "Category 1",
                  items: [],
                  menu_id: "menu_123",
                },
                {
                  id: "cat2",
                  name: "Category 2",
                  items: [
                    {
                      id: "item1",
                      name: "Item 1",
                      tagline: "Fast favorite",
                      description: "Delicious item",
                      image_url: "https://cdn.example.com/item-1.png",
                      price: 12.65,
                      sort_index: 0,
                    },
                    {
                      id: "item2",
                      name: "Item 2",
                      tagline: "Scrumptious teaser",
                      description: "Scrumptious item",
                      image_url: null,
                      price: 15.99,
                      sort_index: 1,
                    },
                  ],
                  menu_id: "menu_123",
                },
              ],
              business: {
                id: "business_123",
                image_url: "https://cdn.example.com/business-logo.png",
                name: "Test Business",
              },
            },
          },
        }),
      }),
    );

    renderApp({
      initialEntries: ["/preview/menu/123"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Your menu won't be visible to customers until you/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "subscribe" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Test Menu")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Test Business logo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Category 1" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Category 2" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Item 1" })).toBeInTheDocument();
    expect(screen.getByText("Fast favorite")).toBeInTheDocument();
    expect(screen.getAllByText(/view details/i)).toHaveLength(2);
  });

  it("renders a live preview banner when the current menu is subscribed", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForMenu": () => ({
          result: {
            data: {
              id: "sub_123",
              menu_id: "123",
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 86_400_000,
              ).toISOString(),
              stripe_customer_id: "cus_123",
              stripe_price_id: "price_123",
              stripe_subscription_id: "sub_stripe_123",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        }),
        "menu.getPreview": () => ({
          result: {
            data: {
              id: "123",
              name: "Test Menu",
              menu_categories: [],
              business: {
                id: "business_123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
      }),
    );

    renderApp({
      initialEntries: ["/preview/menu/123"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/This is a preview of your/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "live menu" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Subscribe to publish" }),
    ).not.toBeInTheDocument();
  });
});

describe("Live Menu Route (/menu/:id)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders menu unavailable message when no subscription is found", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForMenu": () => ({
          result: { data: null },
        }),
        "menu.getPublic": () => ({
          result: {
            data: {
              id: "123",
              name: "Test Menu",
              menu_categories: [
                {
                  id: "cat1",
                  name: "Category 1",
                  items: [],
                  menu_id: "menu_123",
                },
                {
                  id: "cat2",
                  name: "Category 2",
                  items: [
                    {
                      id: "item1",
                      name: "Item 1",
                      tagline: "Fast favorite",
                      description: "Delicious item",
                      price: 12.65,
                      sort_index: 0,
                    },
                    {
                      id: "item2",
                      name: "Item 2",
                      tagline: "Scrumptious teaser",
                      description: "Scrumptious item",
                      price: 15.99,
                      sort_index: 1,
                    },
                  ],
                  menu_id: "menu_123",
                },
              ],
              business: {
                id: "business_123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
      }),
    );

    renderApp({
      initialEntries: ["/menu/123"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(screen.getByText("Menu Not Available")).toBeInTheDocument();
    });

    expect(screen.getByText(/Are you the account owner?/i)).toBeInTheDocument();
  });

  it("shows tagline in the menu list and longer description in the dialog", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForMenu": () => ({
          result: {
            data: {
              id: "sub_123",
              menu_id: "123",
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 86_400_000,
              ).toISOString(),
              stripe_customer_id: "cus_123",
              stripe_price_id: "price_123",
              stripe_subscription_id: "sub_stripe_123",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        }),
        "menu.getPublic": () => ({
          result: {
            data: {
              id: "123",
              name: "Test Menu",
              menu_categories: [
                {
                  id: "cat2",
                  name: "Category 2",
                  items: [
                    {
                      id: "item1",
                      name: "Item 1",
                      tagline: "Fast favorite",
                      description: "A fuller item description for the dialog.",
                      price: 12.65,
                      sort_index: 0,
                    },
                  ],
                  menu_id: "menu_123",
                },
              ],
              business: {
                id: "business_123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
      }),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/menu/123"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(screen.getByText("Fast favorite")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("A fuller item description for the dialog."),
    ).not.toBeInTheDocument();

    const div = screen.getByText("Fast favorite").closest("div");
    expect(within(div!).getByText(/View details/i)).toBeInTheDocument();

    await user.click(div!);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByText("A fuller item description for the dialog."),
      ).toBeInTheDocument();
    });
  });
  it("does not open item details when only a tagline exists", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForMenu": () => ({
          result: {
            data: {
              id: "sub_123",
              menu_id: "123",
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 86_400_000,
              ).toISOString(),
              stripe_customer_id: "cus_123",
              stripe_price_id: "price_123",
              stripe_subscription_id: "sub_stripe_123",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        }),
        "menu.getPublic": () => ({
          result: {
            data: {
              id: "123",
              name: "Test Menu",
              menu_categories: [
                {
                  id: "cat2",
                  name: "Category 2",
                  items: [
                    {
                      id: "item1",
                      name: "Item 1",
                      tagline: "Fast favorite",
                      description: null,
                      image_url: null,
                      price: 12.65,
                      sort_index: 0,
                    },
                  ],
                  menu_id: "menu_123",
                },
              ],
              business: {
                id: "business_123",
                image_url: null,
                name: "Test Business",
              },
            },
          },
        }),
      }),
    );

    renderApp({
      initialEntries: ["/menu/123"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(screen.getByText("Fast favorite")).toBeInTheDocument();
    });

    const div = screen.getByText("Fast favorite").closest("div");
    expect(within(div!).queryByText(/View details/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
