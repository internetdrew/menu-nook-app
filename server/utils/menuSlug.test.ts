import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types";
import {
  checkMenuSlugAvailability,
  resolveUniqueMenuSlug,
} from "./menuSlug";

type TableName = "menus" | "menu_slug_redirects";
type TableRow = {
  id?: string;
  menu_id?: string;
  slug: string;
};

const createSupabaseMock = (tables: Record<TableName, TableRow[]>) =>
  ({
    from: (tableName: TableName) => {
      const filters: Array<{
        column: keyof TableRow;
        operator: "eq" | "neq";
        value: string;
      }> = [];

      const query = {
        select: () => query,
        eq: (column: keyof TableRow, value: string) => {
          filters.push({ column, operator: "eq", value });
          return query;
        },
        neq: (column: keyof TableRow, value: string) => {
          filters.push({ column, operator: "neq", value });
          return query;
        },
        maybeSingle: async () => {
          const row =
            tables[tableName].find((candidate) =>
              filters.every((filter) =>
                filter.operator === "eq"
                  ? candidate[filter.column] === filter.value
                  : candidate[filter.column] !== filter.value,
              ),
            ) ?? null;

          return { data: row, error: null };
        },
      };

      return query;
    },
  }) as unknown as SupabaseClient<Database>;

describe("menu slugs", () => {
  it("treats historical aliases from other menus as unavailable", async () => {
    const supabase = createSupabaseMock({
      menus: [],
      menu_slug_redirects: [
        { menu_id: "menu-1", slug: "brunch" },
      ],
    });

    await expect(
      checkMenuSlugAvailability(supabase, "brunch", {
        excludeMenuId: "menu-2",
      }),
    ).resolves.toEqual({
      available: false,
      slug: "brunch",
      message: "That link is already taken.",
    });
  });

  it("allows a menu to reclaim one of its own historical aliases", async () => {
    const supabase = createSupabaseMock({
      menus: [],
      menu_slug_redirects: [
        { menu_id: "menu-1", slug: "brunch" },
      ],
    });

    await expect(
      checkMenuSlugAvailability(supabase, "brunch", {
        excludeMenuId: "menu-1",
      }),
    ).resolves.toEqual({
      available: true,
      slug: "brunch",
    });
  });

  it("skips historical aliases when resolving a new unique slug", async () => {
    const supabase = createSupabaseMock({
      menus: [],
      menu_slug_redirects: [
        { menu_id: "menu-1", slug: "brunch" },
      ],
    });

    await expect(resolveUniqueMenuSlug(supabase, "Brunch")).resolves.toBe(
      "brunch-2",
    );
  });
});
