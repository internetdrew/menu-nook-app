import { describe, expect, it } from "vitest";
import {
  buildShareMenuPublicUrl,
  buildStableMenuPublicUrl,
} from "./menuPublicUrl";

describe("menu public URLs", () => {
  it("builds stable QR URLs from menu ids", () => {
    expect(
      buildStableMenuPublicUrl({
        id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("https://menunook.com/m/11111111-1111-4111-8111-111111111111");
  });

  it("keeps share URLs slug-based when a slug exists", () => {
    expect(
      buildShareMenuPublicUrl({
        id: "11111111-1111-4111-8111-111111111111",
        slug: "marys-bakery",
      }),
    ).toBe("https://menunook.com/m/marys-bakery");
  });
});
