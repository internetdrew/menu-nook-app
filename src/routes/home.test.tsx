import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import "@/components/Onboarding";
import "@/pages/HomePage";
import "@/pages/HomeRoute";
import "@/pages/LoginPage";
import "@/pages/StorePage";

const store = {
  id: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-01-01T00:00:00Z",
  image_path: null,
  image_url: null,
  menu_seo_description: "Fresh lunch favorites.",
  menu_seo_title: "Sunny Deli Menu",
  menu_slug: "sunny-deli",
  name: "Sunny Deli",
  user_id: "user-1",
};

const sandwichCategory = {
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
    },
  ],
};

const createPreviewStore = (categories = [sandwichCategory]) => ({
  ...store,
  store_menu_categories: categories,
});

const useStoreHandlers = ({
  categories = [sandwichCategory],
}: {
  categories?: (typeof sandwichCategory)[];
} = {}) => {
  let currentCategories = categories;

  server.use(
    createTrpcQueryHandler({
      "store.getForUser": () => ({ result: { data: store } }),
      "store.getPreview": () => ({
        result: { data: createPreviewStore(currentCategories) },
      }),
      "subscription.getForStore": () => ({ result: { data: null } }),
      "storeCategory.create": (input) => {
        const values = input as { name: string; description?: string };
        const createdCategory = {
          id: currentCategories.length + 1,
          created_at: "2026-01-01T00:00:00Z",
          description: values.description ?? "",
          name: values.name,
          order_index: currentCategories.length,
          sort_index_id: (currentCategories.length + 1) * 10,
          store_id: store.id,
          items: [],
        };

        currentCategories = [...currentCategories, createdCategory];

        return { result: { data: createdCategory } };
      },
      "storeCategoryItem.create": (input) => {
        const values = input as {
          name: string;
          description?: string;
          price: number;
          storeCategoryId: number;
        };
        const createdItem = {
          id: 202,
          created_at: "2026-01-01T00:00:00Z",
          description: values.description ?? "",
          image_path: null,
          image_url: null,
          is_available: true,
          name: values.name,
          order_index: 0,
          price: values.price,
          sort_index_id: 2002,
          store_id: store.id,
          store_menu_category_id: values.storeCategoryId,
        };

        currentCategories = currentCategories.map((category) =>
          category.id === values.storeCategoryId
            ? {
                ...category,
                items: [...category.items, createdItem],
              }
            : category,
        );

        return { result: { data: createdItem } };
      },
    }),
  );
};

describe("home route", () => {
  it("redirects signed-out visitors to login", async () => {
    renderApp({
      initialEntries: ["/"],
      authMock: noUserState,
    });

    expect(
      await screen.findByText("Let's get your menu out there."),
    ).toBeInTheDocument();
  });

  it("lets a signed-in owner begin store setup when they have no store", async () => {
    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: null } }),
      }),
    );

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("heading", { name: "Set up your store" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Store name")).toBeInTheDocument();
    expect(screen.getByLabelText("Public store link")).toBeInTheDocument();
    expect(screen.getByText("Permanent")).toBeInTheDocument();
    expect(
      screen.getByText("this public link cannot be changed after setup"),
    ).toBeInTheDocument();
  });

  it("lets a signed-in owner append a hyphenated suffix after a store link is taken", async () => {
    const user = userEvent.setup();
    let createdSlug = "";

    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: null } }),
        "store.checkSlugAvailability": (input) => {
          const values = input as { slug: string };

          if (values.slug === "sunny-deli") {
            return {
              result: {
                data: {
                  available: false,
                  slug: values.slug,
                  message: "That link is already taken.",
                },
              },
            };
          }

          return {
            result: {
              data: {
                available: true,
                slug: values.slug,
              },
            },
          };
        },
        "store.create": (input) => {
          const values = input as { name: string; slug: string };
          createdSlug = values.slug;

          return {
            result: {
              data: {
                ...store,
                name: values.name,
                menu_slug: values.slug,
              },
            },
          };
        },
      }),
    );

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await user.type(await screen.findByLabelText("Store name"), "Sunny Deli");

    expect(
      await screen.findByText("That link is already taken."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Public store link"), "-xyz");

    expect(screen.getByLabelText("Public store link")).toHaveValue(
      "sunny-deli-xyz",
    );
    expect(
      await screen.findByText(
        "Available: https://menunook.com/m/sunny-deli-xyz",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createdSlug).toBe("sunny-deli-xyz");
    expect(
      await screen.findByText("Sunny Deli created successfully."),
    ).toBeInTheDocument();
  });

  it("lets an owner preview the food page after creating a store", async () => {
    const user = userEvent.setup();
    useStoreHandlers();

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await user.click(await screen.findByRole("link", { name: /preview/i }));

    expect(await screen.findByText("Turkey Club")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sunny Deli" }),
    ).toBeInTheDocument();
  });

  it("shows the empty categories state when a store has no categories", async () => {
    useStoreHandlers({ categories: [] });

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByText("No categories created"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You haven't created any item categories yet/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand sandwiches/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Category" }),
    ).toBeInTheDocument();
  });

  it("keeps the menu loader visible until categories load", async () => {
    let resolvePreview: (
      storePreview: ReturnType<typeof createPreviewStore>,
    ) => void;
    const previewRequest = new Promise<ReturnType<typeof createPreviewStore>>(
      (resolve) => {
        resolvePreview = resolve;
      },
    );

    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: store } }),
        "store.getPreview": async () => ({
          result: { data: await previewRequest },
        }),
        "subscription.getForStore": () => ({ result: { data: null } }),
      }),
    );

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("status", { name: "Loading MenuNook" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sunny Deli" })).toBeNull();
    expect(screen.queryByText("No categories created")).not.toBeInTheDocument();

    resolvePreview!(createPreviewStore([]));

    expect(
      await screen.findByRole("heading", { name: "Sunny Deli" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No categories created"),
    ).toBeInTheDocument();
  });

  it("shows existing categories instead of the empty state", async () => {
    useStoreHandlers();

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("button", { name: /collapse sandwiches/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No categories created")).not.toBeInTheDocument();
  });

  it("lets an owner open store profile and search appearance settings", async () => {
    const user = userEvent.setup();
    useStoreHandlers();

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await user.click(
      await screen.findByRole("button", { name: "Open quick actions" }),
    );
    await user.click(screen.getByRole("button", { name: "Store profile" }));

    expect(
      await screen.findByRole("heading", { name: "Store profile" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Store Name")).toHaveValue("Sunny Deli");

    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("button", { name: "Open quick actions" }),
    );
    await user.click(screen.getByRole("button", { name: "Search Appearance" }));

    expect(
      await screen.findByRole("heading", { name: "Search Appearance" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search Result Title")).toHaveValue(
      "Sunny Deli Menu",
    );
  });

  it("lets an owner add a new category to an existing store", async () => {
    const user = userEvent.setup();
    useStoreHandlers({ categories: [] });

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await user.click(
      await screen.findByRole("button", { name: "Add Category" }),
    );
    await user.type(screen.getByLabelText("Category Name"), "Breakfast");
    await user.type(
      screen.getByLabelText("Category Description"),
      "Morning favorites.",
    );
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByRole("button", { name: /collapse breakfast/i }),
    ).toBeInTheDocument();
  });

  it("lets an owner add a new item to an existing category", async () => {
    const user = userEvent.setup();
    useStoreHandlers({ categories: [{ ...sandwichCategory, items: [] }] });

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await screen.findByRole("button", { name: /collapse sandwiches/i });
    await user.click(screen.getByRole("button", { name: "Add Item" }));

    expect(
      await screen.findByRole("heading", { name: "Add Item" }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Item Name"), "Breakfast Burrito");
    await user.type(
      screen.getByLabelText("Item Description"),
      "Eggs, cheddar, salsa, wrapped warm and ready to go.",
    );
    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "9.75");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Breakfast Burrito")).toBeInTheDocument();
    expect(screen.getByText("$9.75")).toBeInTheDocument();
  });
});
