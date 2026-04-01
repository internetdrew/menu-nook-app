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

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: vi.fn(() => null),
}));

const defaultHandlers = {
  "business.getForUser": () => ({
    result: {
      data: {
        id: "business-123",
        image_path: null,
        image_url: null,
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
          business_id: "business-123",
          name: "Test Menu",
        },
        {
          id: "menu-456",
          business_id: "business-123",
          name: "Second Menu",
        },
      ],
    },
  }),
};

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:preview-url"),
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    });

    const currentPublicUrl = "https://cdn.example.com/business-logo.png";
    const storageBucket = {
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: currentPublicUrl },
      })),
      upload: vi.fn().mockResolvedValue({
        data: { path: "business/business-123/logo_1.png" },
        error: null,
      }),
    } as unknown as StorageBucketApi;

    vi.mocked(supabaseBrowserClient.storage.from).mockReturnValue(
      storageBucket,
    );
  });

  describe("Business Details", () => {
    it("renders the business details section with current business name", async () => {
      server.use(createTrpcQueryHandler(defaultHandlers));

      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(screen.getByText("Business Settings")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Eg. The Blonde Wolf/i)).toHaveValue(
          "Test Business",
        );
      });

      expect(
        screen.getByRole("button", { name: /upload logo/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /remove/i }),
      ).not.toBeInTheDocument();
    });

    it("allows users to update the business name", async () => {
      server.use(
        createTrpcQueryHandler(defaultHandlers),
        http.post("/trpc/business.update", async () => {
          return HttpResponse.json({
            result: { data: { id: "business-123", name: "Updated Business" } },
          });
        }),
      );

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Eg. The Blonde Wolf/i),
        ).toBeInTheDocument();
      });

      const businessNameInput =
        screen.getByPlaceholderText(/Eg. The Blonde Wolf/i);
      await user.clear(businessNameInput);
      await user.type(businessNameInput, "Updated Business");

      // Find submit button by form attribute
      const saveButton = document.querySelector(
        'button[form="business-name"][type="submit"]',
      ) as HTMLButtonElement;
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Business name updated successfully!",
        );
      });
    });

    it("uploads a business logo immediately after file selection", async () => {
      server.use(
        createTrpcQueryHandler(defaultHandlers),
        http.post("/trpc/business.update", async ({ request }) => {
          const rawBody = await request.text();

          expect(rawBody).toContain(
            '"imageUrl":"https://cdn.example.com/business-logo.png"',
          );
          expect(rawBody).toMatch(
            /"imagePath":"business\/business-123\/logo_\d+\.png"/,
          );

          return HttpResponse.json({
            result: {
              data: {
                id: "business-123",
                image_path: "business/business-123/logo_1.png",
                image_url: "https://cdn.example.com/business-logo.png",
                name: "Test Business",
              },
            },
          });
        }),
      );

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      const fileInput = await screen.findByLabelText(/business logo/i, {
        selector: "input",
      });
      const file = new File(["logo"], "logo.png", { type: "image/png" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(supabaseBrowserClient.storage.from).toHaveBeenCalledWith(
          "business_logos",
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Business logo updated successfully!",
        );
      });
    });

    it("removes an existing business logo immediately", async () => {
      server.use(
        createTrpcQueryHandler({
          ...defaultHandlers,
          "business.getForUser": () => ({
            result: {
              data: {
                id: "business-123",
                image_path: "business/business-123/logo_123.png",
                image_url: "https://cdn.example.com/existing-logo.png",
                name: "Test Business",
                user_id: "user-123",
              },
            },
          }),
        }),
        http.post("/trpc/business.update", async ({ request }) => {
          const rawBody = await request.text();

          expect(rawBody).toContain('"imagePath":null');
          expect(rawBody).toContain('"imageUrl":null');

          return HttpResponse.json({
            result: {
              data: {
                id: "business-123",
                image_path: null,
                image_url: null,
                name: "Test Business",
              },
            },
          });
        }),
      );

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      const removeButton = await screen.findByRole("button", {
        name: /remove/i,
      });
      await user.click(removeButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Business logo removed successfully!",
        );
      });
    });
  });

  describe("Menu Details", () => {
    it("renders the menu details section with current menu name", async () => {
      server.use(createTrpcQueryHandler(defaultHandlers));

      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(screen.getByText("Menu Settings")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Eg. Lunch Menu/i)).toHaveValue(
          "Test Menu",
        );
      });
    });

    it("allows users to update the menu name", async () => {
      server.use(
        createTrpcQueryHandler(defaultHandlers),
        http.post("/trpc/menu.update", async () => {
          return HttpResponse.json({
            result: { data: { id: "menu-123", name: "Updated Menu" } },
          });
        }),
      );

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Eg. Lunch Menu/i),
        ).toBeInTheDocument();
      });

      const menuNameInput = screen.getByPlaceholderText(/Eg. Lunch Menu/i);
      await user.clear(menuNameInput);
      await user.type(menuNameInput, "Updated Menu");

      // Find submit button by form attribute
      const saveButton = document.querySelector(
        'button[form="menu-name"][type="submit"]',
      ) as HTMLButtonElement;
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Menu name updated successfully!",
        );
      });
    });

    it("shows delete menu trigger", async () => {
      server.use(createTrpcQueryHandler(defaultHandlers));

      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete menu/i }),
        ).toBeInTheDocument();
      });
    });

    it("opens delete confirmation dialog when delete menu is clicked", async () => {
      server.use(createTrpcQueryHandler(defaultHandlers));

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete menu/i }),
        ).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete menu/i });
      await user.click(deleteButton);

      const alertDialog = await screen.findByRole("alertdialog");
      expect(alertDialog).toBeInTheDocument();
      expect(
        within(alertDialog).getByText(/Are you sure you want to delete/i),
      ).toBeInTheDocument();
    });

    it("allows users to delete a menu and shows success message", async () => {
      server.use(
        createTrpcQueryHandler(defaultHandlers),
        http.post("/trpc/menu.delete", async () => {
          return HttpResponse.json({
            result: { data: { id: "menu-123", name: "Test Menu" } },
          });
        }),
      );

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete menu/i }),
        ).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete menu/i });
      await user.click(deleteButton);

      const alertDialog = await screen.findByRole("alertdialog");
      const confirmButton = within(alertDialog).getByRole("button", {
        name: /delete/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "The Test Menu menu has been deleted.",
        );
      });
    });

    it("closes delete dialog when cancel is clicked", async () => {
      server.use(createTrpcQueryHandler(defaultHandlers));

      const user = userEvent.setup();
      renderApp({ initialEntries: ["/settings"], authMock: authedUserState });

      await waitFor(() => {
        expect(screen.getByText(/menu settings/i)).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete menu/i });
      await user.click(deleteButton);

      const alertDialog = await screen.findByRole("alertdialog");
      const cancelButton = within(alertDialog).getByRole("button", {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });
  });
});
