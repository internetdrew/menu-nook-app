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

describe("Category Items Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const items: Array<{
      id: number;
      name: string;
      description: string;
      price: number;
    }> = [];

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
      within(dialog).getByRole("button", {
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
        name: /delete item/i,
      }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText(/delete item to delete?/i),
    ).toBeInTheDocument();
  });
});
