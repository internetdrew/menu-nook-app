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

describe("Categories Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no categories are present", async () => {
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
        "menuCategory.getAllSortedByIndex": () => ({ result: { data: [] } }),
      }),
    );

    renderApp({ initialEntries: ["/categories"], authMock: authedUserState });

    await waitFor(() => {
      expect(screen.getByText(/No categories found/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Add your first category to your Test Menu/i),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /add category/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("allows users to add a new category", async () => {
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
        "menu.getAllForBusiness": () => {
          return {
            result: {
              data: [
                {
                  id: "menu-123",
                  businessId: "business-123",
                  name: "Test Menu",
                },
              ],
            },
          };
        },
        "menuCategory.getAllSortedByIndex": () => ({
          result: { data: [] },
        }),
      }),

      http.post("/trpc/menuCategory.create", async () => {
        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/categories"], authMock: authedUserState });

    await waitFor(() => {
      expect(screen.getByText(/no categories found/i)).toBeInTheDocument();
    });

    const button = screen.getByRole("button", {
      name: /add category/i,
    });

    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/Category Name/i);
    await user.type(nameInput, "Test Category");
    const submitButton = within(dialog).getByRole("button", {
      name: /create/i,
    });
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Category created successfully!",
    );
  });
  it("renders list of categories when present", async () => {
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
        "menuCategory.getAllSortedByIndex": () => ({
          result: {
            data: [
              {
                category: { id: "cat-1", name: "Appetizers" },
                order_index: 0,
              },
              {
                category: { id: "cat-2", name: "Main Courses" },
                order_index: 1,
              },
            ],
          },
        }),
      }),
    );

    renderApp({ initialEntries: ["/categories"], authMock: authedUserState });

    await waitFor(() => {
      const appetizers = screen.getAllByText("Appetizers");
      expect(appetizers).toHaveLength(2);

      const mainCourses = screen.getAllByText("Main Courses");
      expect(mainCourses).toHaveLength(2);
    });

    const list = screen.getByTestId("category-list");
    const items = Array.from(list.querySelectorAll("li")).map(
      (el) => el.textContent,
    );

    expect(items).toEqual(["Appetizers", "Main Courses"]);
  });
  it("allows users to edit a category", async () => {
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
        "menuCategory.getAllSortedByIndex": () => ({
          result: {
            data: [
              {
                id: "index-cat-1",
                category: { id: "cat-1", name: "Appetizers" },
                order_index: 0,
              },
            ],
          },
        }),
      }),

      http.post("/trpc/menuCategory.update", async () => {
        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/categories"], authMock: authedUserState });

    await waitFor(() => {
      const list = screen.getByTestId("category-list");
      const appetizers = within(list).getByText("Appetizers");
      expect(appetizers).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit category/i });
    await user.click(editButton);

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/Category Name/i);

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Appetizers");

    const submitButton = within(dialog).getByRole("button", {
      name: /update/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Category updated successfully!",
    );
  });

  it("keeps the update button disabled until the form data is dirty", async () => {
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
        "menuCategory.getAllSortedByIndex": () => ({
          result: {
            data: [
              {
                id: "index-cat-1",
                category: { id: "cat-1", name: "Appetizers" },
                order_index: 0,
              },
            ],
          },
        }),
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/categories"], authMock: authedUserState });

    await waitFor(() => {
      const list = screen.getByTestId("category-list");
      const appetizers = within(list).getByText("Appetizers");
      expect(appetizers).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit category/i });
    await user.click(editButton);

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/Category Name/i);

    const submitButton = within(dialog).getByRole("button", {
      name: /update/i,
    });

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // After changing input, button should be enabled
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Appetizers");
    expect(submitButton).toBeEnabled();
  });
  it("allows users to delete a category", async () => {
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
        "menuCategory.getAllSortedByIndex": () => ({
          result: {
            data: [
              {
                id: "index-cat-1",
                category: { id: "cat-1", name: "Appetizers" },
                order_index: 0,
              },
            ],
          },
        }),
      }),

      http.post("/trpc/menuCategory.delete", async () => {
        return HttpResponse.json({
          result: { data: {} },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ["/categories"], authMock: authedUserState });

    await waitFor(() => {
      const list = screen.getByTestId("category-list");
      const appetizers = within(list).getByText("Appetizers");
      expect(appetizers).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", {
      name: /delete category/i,
    });
    await user.click(deleteButton);

    const alertDialog = await screen.findByRole("alertdialog");
    const confirmButton = within(alertDialog).getByRole("button", {
      name: /delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith(
      "The Appetizers category has been deleted from your menu.",
    );
  });
});
