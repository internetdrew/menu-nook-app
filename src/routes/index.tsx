import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RouteFallback } from "@/components/RouteFallback";
import { Navigate } from "react-router";
import { protectedLoader } from "@/loaders/protectedLoader";
import { NotFound } from "@/pages/NotFoundPage";

const notFoundElement = (
  <NotFound
    title="Page Not Found"
    message="The page you're looking for does not exist."
    href="/"
    hrefText="Go back to Home"
  />
);

export const routes = [
  {
    path: "/login",
    HydrateFallback: RouteFallback,
    element: <RedirectIfAuthenticated />,
    children: [
      {
        index: true,
        lazy: () =>
          import("@/pages/LoginPage").then((module) => ({
            Component: module.default,
          })),
      },
    ],
  },
  {
    HydrateFallback: RouteFallback,
    loader: protectedLoader,
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        lazy: () =>
          import("@/pages/HomeRoute").then((module) => ({
            Component: module.default,
          })),
      },
      {
        path: "preview",
        element: <Navigate to="/preview/store" replace />,
      },
      {
        path: "preview/store",
        lazy: () =>
          import("@/pages/StorePage").then((module) => ({
            Component: module.Store,
          })),
      },
      {
        path: "*",
        element: notFoundElement,
      },
    ],
  },
];
