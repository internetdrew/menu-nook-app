import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated.tsx";
import { Navigate, Outlet } from "react-router";
import { RouteFallback } from "./components/RouteFallback.tsx";

export const routes = [
  {
    path: "/login",
    element: <RedirectIfAuthenticated />,
    children: [
      {
        index: true,
        HydrateFallback: RouteFallback,
        lazy: async () => {
          const { default: Login } = await import("./routes/Login.tsx");
          return { Component: Login };
        },
      },
    ],
  },
  {
    HydrateFallback: RouteFallback,
    loader: async () => {
      const { protectedLoader } = await import("./routes/protectedLoader.ts");
      return protectedLoader();
    },
    element: <Outlet />,
    children: [
      {
        index: true,
        HydrateFallback: RouteFallback,
        loader: async () => {
          const { homeLoader } = await import("./routes/homeLoader.ts");
          return homeLoader();
        },
        lazy: async () => {
          const { default: HomeRoute } = await import("./routes/HomeRoute.tsx");
          return { Component: HomeRoute };
        },
      },
      {
        path: "preview",
        element: <Navigate to="/preview/store" replace />,
      },
      {
        path: "preview/store",
        HydrateFallback: RouteFallback,
        lazy: async () => {
          const { Store } = await import("./routes/Store.tsx");
          return { Component: Store };
        },
      },
      {
        path: "*",
        HydrateFallback: RouteFallback,
        lazy: async () => {
          const { NotFound } = await import("./routes/NotFound.tsx");

          function NotFoundRoute() {
            return (
              <NotFound
                title="Page Not Found"
                message="The page you're looking for does not exist."
                href="/"
                hrefText="Go back to Home"
              />
            );
          }

          return { Component: NotFoundRoute };
        },
      },
    ],
  },
];
