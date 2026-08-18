import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { createTrpcQueryHandler } from "@/utils/test/createTrpcQueryHandler";
import { renderApp } from "@/utils/test/renderApp";
import { authedUserState, noUserState } from "@/utils/test/userStates";
import "@/components/OnboardingChecklist";
import "@/pages/HomePage";
import "@/pages/HomeRoute";
import "@/pages/LoginPage";

describe("login route", () => {
  it("shows unauthenticated visitors a Google sign-in call to action", async () => {
    renderApp({
      initialEntries: ["/login"],
      authMock: noUserState,
    });

    expect(
      await screen.findByText("Let's get your menu online."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("sends authenticated visitors to the home setup flow", async () => {
    server.use(
      createTrpcQueryHandler({
        "store.getForUser": () => ({ result: { data: null } }),
      }),
    );

    renderApp({
      initialEntries: ["/login"],
      authMock: authedUserState,
    });

    expect(
      await screen.findByRole("heading", { name: "Get Started" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
  });
});
