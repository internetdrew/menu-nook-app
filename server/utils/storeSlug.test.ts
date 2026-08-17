import { describe, expect, it } from "vitest";
import {
  checkStoreSlugAvailability,
  resolveUniqueStoreSlug,
} from "./storeSlug";

type StoreRow = { id: string; menu_slug: string };

const createFakeSupabase = (stores: StoreRow[]) => {
  const state = {
    menu_slug: "",
    excludedStoreId: undefined as string | undefined,
  };

  const query = {
    select: () => query,
    eq: (column: string, value: string) => {
      if (column === "menu_slug") {
        state.menu_slug = value;
      }

      return query;
    },
    neq: (column: string, value: string) => {
      if (column === "id") {
        state.excludedStoreId = value;
      }

      return query;
    },
    maybeSingle: async () => ({
      data:
        stores.find(
          (store) =>
            store.menu_slug === state.menu_slug &&
            store.id !== state.excludedStoreId,
        ) ?? null,
      error: null,
    }),
  };

  return {
    from: (table: string) => {
      expect(table).toBe("stores");
      state.menu_slug = "";
      state.excludedStoreId = undefined;
      return query;
    },
  };
};

describe("store slugs", () => {
  it("reports an existing store menu slug as unavailable", async () => {
    const result = await checkStoreSlugAvailability(
      createFakeSupabase([{ id: "store-1", menu_slug: "sunny-deli" }]) as never,
      "sunny-deli",
    );

    expect(result).toEqual({
      available: false,
      slug: "sunny-deli",
      message: "That link is already taken.",
    });
  });

  it("allows a store to keep its current menu slug", async () => {
    const result = await checkStoreSlugAvailability(
      createFakeSupabase([{ id: "store-1", menu_slug: "sunny-deli" }]) as never,
      "sunny-deli",
      { excludeStoreId: "store-1" },
    );

    expect(result).toEqual({
      available: true,
      slug: "sunny-deli",
    });
  });

  it("resolves a unique menu slug with a suffix", async () => {
    const menuSlug = await resolveUniqueStoreSlug(
      createFakeSupabase([
        { id: "store-1", menu_slug: "sunny-deli" },
        { id: "store-2", menu_slug: "sunny-deli-2" },
      ]) as never,
      "Sunny Deli",
    );

    expect(menuSlug).toBe("sunny-deli-3");
  });
});
