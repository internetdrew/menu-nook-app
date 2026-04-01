import { supabaseBrowserClient } from "@/lib/supabase";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";
import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, it, describe, vi, expect } from "vitest";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: vi.fn(() => null),
}));

type StorageBucketApi = ReturnType<typeof supabaseBrowserClient.storage.from>;

vi.mock("@/lib/supabase", () => {
  return {
    supabaseBrowserClient: {
      storage: {
        from: vi.fn(),
      },
    },
  };
});

describe("Category Items Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:item-preview"),
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    });

    const currentPublicUrl = "https://cdn.example.com/item-image.png";
    const storageBucket = {
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: currentPublicUrl },
      })),
      upload: vi.fn().mockResolvedValue({
        data: { path: "menu/menu-123/item/44/image_1.png" },
        error: null,
      }),
    } as unknown as StorageBucketApi;

    vi.mocked(supabaseBrowserClient.storage.from).mockReturnValue(
      storageBucket,
    );
  });

  it("renders empty state when no items are present in category", async () => {
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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: { id: 10, menu_id: "menu-123", name: "Test Category" },
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => ({
          result: { data: [] },
        }),
      }),
    );

    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      const testCategories = screen.getAllByText(/test category/i);
      expect(testCategories).toHaveLength(2);
    });
    const button = screen.getByRole("button", {
      name: /add item/i,
    });
    expect(button).toBeInTheDocument();
  });
  it("shows error message when category fails to load", async () => {
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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: null,
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => ({
          result: { data: [] },
        }),
      }),
    );

    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      const errorMessage = screen.getByText(/category not found/i);
      expect(errorMessage).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", {
        name: /view available categories/i,
      }),
    ).toBeInTheDocument();
  });
  it("allows users to add new items to the category", async () => {
    const items: unknown[] = [];

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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: { id: 10, menu_id: "menu-123", name: "Test Category" },
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => ({
          result: { data: items },
        }),
      }),
      http.post("/trpc/menuCategoryItem.create", async () => {
        return HttpResponse.json({
          result: { data: { id: 44 } },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      const addItemButton = screen.getByRole("button", {
        name: /add item/i,
      });
      expect(addItemButton).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /add item/i,
      }),
    );

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/item name/i);
    await user.type(nameInput, "a new item");

    const descriptionInput = within(dialog).getByLabelText(/item description/i);
    await user.type(descriptionInput, "a new description");

    const priceInput = within(dialog).getByLabelText(/price/i);
    await user.type(priceInput, "9.99");

    await user.click(
      within(dialog).getByRole("button", {
        name: /create/i,
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Item created successfully!");
    });
    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  });
  it("uploads an item image when creating a new item", async () => {
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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: { id: 10, menu_id: "menu-123", name: "Test Category" },
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => ({
          result: { data: [] },
        }),
      }),
      http.post("/trpc/menuCategoryItem.create", async () => {
        return HttpResponse.json({
          result: { data: { id: 44 } },
        });
      }),
      http.post("/trpc/menuCategoryItem.update", async ({ request }) => {
        const rawBody = await request.text();

        expect(rawBody).toContain(
          '"imageUrl":"https://cdn.example.com/item-image.png"',
        );
        expect(rawBody).toMatch(
          /"imagePath":"menu\/menu-123\/item\/44\/image_\d+\.png"/,
        );

        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await user.click(await screen.findByRole("button", { name: /add item/i }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/item name/i), "Orange Wine");
    await user.type(within(dialog).getByLabelText(/price/i), "18");

    const file = new File(["image"], "orange-wine.png", {
      type: "image/png",
    });
    const fileInput = within(dialog).getByLabelText(/item image/i, {
      selector: "input",
    });

    await user.upload(fileInput, file);
    await user.click(within(dialog).getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(supabaseBrowserClient.storage.from).toHaveBeenCalledWith(
        "menu_item_images",
      );
      expect(toast.success).toHaveBeenCalledWith("Item created successfully!");
    });
  });
  it("allows users to edit an existing item", async () => {
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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: { id: 10, menu_id: "menu-123", name: "Test Category" },
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => {
          return {
            result: {
              data: [
                {
                  id: 20,
                  item: {
                    id: 44,
                    name: "Existing Item",
                    description: "An existing description",
                    image_path: null,
                    image_url: null,
                    price: 12.5,
                  },
                },
              ],
            },
          };
        },
      }),
      http.post("/trpc/menuCategoryItem.update", async () => {
        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      const existingItem = screen.getByText(/existing item/i);
      expect(existingItem).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /item actions/i,
      }),
    );

    await user.click(
      await screen.findByRole("menuitem", {
        name: /edit item/i,
      }),
    );

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/item name/i);
    const updateButton = within(dialog).getByRole("button", {
      name: /update/i,
    });
    expect(updateButton).toBeDisabled();
    expect(nameInput).toHaveValue("Existing Item");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Item");

    await user.click(
      screen.getByRole("button", {
        name: /update/i,
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Item updated successfully!");
    });
    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  });
  it("allows users to remove an existing item image", async () => {
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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: { id: 10, menu_id: "menu-123", name: "Test Category" },
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => ({
          result: {
            data: [
              {
                id: 20,
                item: {
                  id: 44,
                  name: "Existing Item",
                  description: "An existing description",
                  image_path: "menu/menu-123/item/44/image_123.png",
                  image_url: "https://cdn.example.com/existing-item.png",
                  price: 12.5,
                },
              },
            ],
          },
        }),
      }),
      http.post("/trpc/menuCategoryItem.update", async ({ request }) => {
        const rawBody = await request.text();

        expect(rawBody).toContain('"imagePath":null');
        expect(rawBody).toContain('"imageUrl":null');

        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await user.click(
      await screen.findByRole("button", { name: /item actions/i }),
    );

    await user.click(
      await screen.findByRole("menuitem", {
        name: /edit item/i,
      }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /remove/i }));
    await user.click(within(dialog).getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Item updated successfully!");
    });
  });
  it("allows users to delete an item", async () => {
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
                businessId: "business-123",
                name: "Test Menu",
              },
            ],
          },
        }),
        "menuCategory.getById": () => ({
          result: {
            data: { id: 10, menu_id: "menu-123", name: "Test Category" },
          },
        }),
        "menuCategoryItem.getSortedForCategory": () => {
          return {
            result: {
              data: [
                {
                  id: 20,
                  item: {
                    id: 44,
                    name: "Item To Delete",
                    description: "An item to be deleted",
                    image_path: null,
                    image_url: null,
                    price: 15.0,
                  },
                },
              ],
            },
          };
        },
      }),
      http.post("/trpc/menuCategoryItem.delete", async () => {
        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({
      initialEntries: ["/categories/10"],
      authMock: authedUserState,
    });

    await waitFor(() => {
      const itemToDelete = screen.getByText(/item to delete/i);
      expect(itemToDelete).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /item actions/i,
      }),
    );

    await user.click(
      await screen.findByRole("menuitem", {
        name: /delete item/i,
      }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText(/delete item to delete?/i),
    ).toBeInTheDocument();

    await user.click(
      within(alertDialog).getByRole("button", {
        name: /continue/i,
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Item To Delete has been deleted.",
      );
    });
  });
});
