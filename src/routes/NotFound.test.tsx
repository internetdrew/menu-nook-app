import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState } from "@/utils/test/userStates";

describe("not found route", () => {
  it("shows a useful not-found message for unknown protected paths", async () => {
    renderApp({
      initialEntries: ["/does-not-exist"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("heading", { name: "Page Not Found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go back to Home" }),
    ).toHaveAttribute("href", "/");
  });
});
