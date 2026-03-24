import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";
import { screen, waitFor } from "@testing-library/dom";
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

  it("renders a preview banner for the public menu preview route", async () => {
    server.use(
      createTrpcQueryHandler({
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
      initialEntries: ["/preview/123"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/This is a preview of your public menu./i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /view public menu/i })).toBeInTheDocument();

    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Test Menu")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Category 1" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Category 2" }),
    ).toBeInTheDocument();
  });
});

describe("Live Menu Route (/menu/:id)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the public menu when the route is visited directly", async () => {
    server.use(
      createTrpcQueryHandler({
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

    expect(screen.getByText("Test Menu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Category 2" })).toBeInTheDocument();
    expect(screen.queryByText("Menu Not Available")).not.toBeInTheDocument();
  });
});
