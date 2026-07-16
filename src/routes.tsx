import ProtectedRoute from "./components/ProtectedRoute.tsx";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated.tsx";
import { Navigate } from "react-router";
import { RouteFallback } from "./components/RouteFallback.tsx";

export const routes = [
  {
    path: "/menu/:menuId",
    HydrateFallback: RouteFallback,
    lazy: async () => {
      const { Menu } = await import("./routes/Menu.tsx");
      return { Component: Menu };
    },
  },
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
    element: <ProtectedRoute redirectTo="/login" />,
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
        path: "/preview",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/preview/menu/:menuId",
        HydrateFallback: RouteFallback,
        lazy: async () => {
          const { Menu } = await import("./routes/Menu.tsx");
          return { Component: Menu };
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
