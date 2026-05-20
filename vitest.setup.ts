import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./src/mocks/node.ts";
import "@testing-library/jest-dom/vitest";

// Mock window.matchMedia for tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "warn",
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
