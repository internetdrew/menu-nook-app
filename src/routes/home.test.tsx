import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import "./home";
import "./Login";

describe("home route", () => {
  it("redirects signed-out visitors to login", async () => {
    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: null } }),
      }),
    );

    renderApp({
      initialEntries: ["/"],
      authMock: noUserState,
    });

    expect(
      await screen.findByText("Let's get your menu online."),
    ).toBeInTheDocument();
  });

  it("lets a signed-in owner begin store setup when they have no store", async () => {
    const user = userEvent.setup();

    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: null } }),
      }),
    );

    renderApp({
      initialEntries: ["/"],
      authMock: authedUserState,
    });

    await user.click(
      await screen.findByRole("button", { name: /set up your store/i }),
    );

    expect(
      await screen.findByRole("heading", { name: "Set up your store" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Store name")).toBeInTheDocument();
    expect(screen.getByLabelText("Public store link")).toBeInTheDocument();
  });
});
