import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Menu Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a preview banner when user has no subscription", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForUser": () => ({ result: { data: null } }),
        "menu.getById": () => ({
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
                      description: "Delicious item",
                      price: 12.65,
                      sort_index: 0,
                    },
                    {
                      id: "item2",
                      name: "Item 2",
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
        screen.getByText(
          /This is a preview. To enable the live menu, please subscribe./i,
        ),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Subscribe" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Test Menu")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Category 1" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Category 2" }),
    ).toBeInTheDocument();
  });
  it("does not render a preview banner when the user has a subscription", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForUser": () => ({
          result: {
            data: {
              id: 1,
              current_period_start: "2026-01-27T11:24:17+00:00",
              current_period_end: "2026-02-27T11:24:17+00:00",
              stripe_customer_id: "cus_1234",
              stripe_price_id: "price_1234",
              stripe_subscription_id: "sub_1234",
              updated_at: "2026-01-27T11:24:21.761676+00:00",
              status: "active",
              user_id: "test_user_123",
            },
          },
        }),
        "menu.getById": () => ({
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
                      description: "Delicious item",
                      price: 12.65,
                      sort_index: 0,
                    },
                    {
                      id: "item2",
                      name: "Item 2",
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
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(
        /This is a preview. To enable the live menu, please subscribe./i,
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Subscribe" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Test Menu")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Category 1" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Category 2" }),
    ).toBeInTheDocument();
  });
  it("renders menu unavailable message when no subscription is found", async () => {
    server.use(
      createTrpcQueryHandler({
        "subscription.getForUser": () => ({
          result: { data: null },
        }),
        "menu.getById": () => ({
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
                      description: "Delicious item",
                      price: 12.65,
                      sort_index: 0,
                    },
                    {
                      id: "item2",
                      name: "Item 2",
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
});
