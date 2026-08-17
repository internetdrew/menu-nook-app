import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";
import "./storePreview";

const store = {
  id: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-01-01T00:00:00Z",
  image_path: null,
  image_url: null,
  menu_seo_description: null,
  menu_seo_title: null,
  menu_slug: "sunny-deli",
  name: "Sunny Deli",
  user_id: "user-1",
};

const previewStore = {
  ...store,
  store_menu_categories: [
    {
      id: 1,
      created_at: "2026-01-01T00:00:00Z",
      description: "Fresh lunch favorites.",
      name: "Sandwiches",
      order_index: 0,
      sort_index_id: 10,
      store_id: store.id,
      items: [
        {
          id: 101,
          created_at: "2026-01-01T00:00:00Z",
          description: "Turkey, lettuce, tomato, and house aioli.",
          image_path: null,
          image_url: null,
          is_available: true,
          name: "Turkey Club",
          order_index: 0,
          price: 12.5,
          sort_index_id: 1001,
          store_id: store.id,
          store_menu_category_id: 1,
          tagline: "A classic stacked high.",
        },
      ],
    },
  ],
};

describe("store preview route", () => {
  const usePreviewHandlers = () => {
    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: store } }),
        "store.getPreview": () => ({ result: { data: previewStore } }),
        "subscription.getForStore": () => ({ result: { data: null } }),
      }),
    );
  };

  it("shows the owner's preview with categories and items", async () => {
    usePreviewHandlers();

    renderApp({
      initialEntries: ["/preview/store"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("heading", { name: "Sunny Deli" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sandwiches" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Turkey Club")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "subscribe" }),
    ).toBeInTheDocument();
  });

  it("redirects the old preview path to the store preview", async () => {
    usePreviewHandlers();

    renderApp({
      initialEntries: ["/preview"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("heading", { name: "Sunny Deli" }),
    ).toBeInTheDocument();
  });
});
