import { describe, expect, it } from "vitest";
import { buildStorePublicUrl } from "./storePublicUrl";

describe("store public URLs", () => {
  it("uses the store menu_slug on the public /m route", () => {
    expect(buildStorePublicUrl({ menu_slug: "sunny-deli" })).toBe(
      "https://menunook.com/m/sunny-deli",
    );
  });
});
