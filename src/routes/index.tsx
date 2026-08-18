import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated";
import { Navigate, Outlet } from "react-router";
import { RouteFallback } from "@/components/RouteFallback";

export const routes = [
  {
    path: "/login",
    element: <RedirectIfAuthenticated />,
    children: [
      {
        index: true,
        HydrateFallback: RouteFallback,
        lazy: () => import("./Login"),
      },
    ],
  },
  {
    HydrateFallback: RouteFallback,
    lazy: () => import("./protected"),
    element: <Outlet />,
    children: [
      {
        index: true,
        HydrateFallback: RouteFallback,
        lazy: () => import("./home.tsx"),
      },
      {
        path: "preview",
        element: <Navigate to="/preview/store" replace />,
      },
      {
        path: "preview/store",
        HydrateFallback: RouteFallback,
        lazy: () => import("./storePreview"),
      },
      {
        path: "*",
        HydrateFallback: RouteFallback,
        lazy: () => import("./NotFound"),
      },
    ],
  },
];
