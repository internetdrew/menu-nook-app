import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router";
import { queryClient } from "./utils/trpc.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import Login from "./routes/Login.tsx";
import { AuthProvider } from "./contexts/auth.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { PlaceProvider } from "./contexts/ActivePlaceContext.tsx";
import { Menu } from "./routes/Menu.tsx";
import { CategoriesPage } from "./routes/CategoriesPage.tsx";
import { CategoryItemsPage } from "./routes/CategoryItemsPage.tsx";
import { SettingsPage } from "./routes/SettingsPage.tsx";
import { HomePage } from "./routes/HomePage.tsx";
import NotFound from "./routes/NotFound.tsx";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/preview/menu",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/preview/menu/:placeId",
    element: <Menu isPreview={true} />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <PlaceProvider>
          <App />
        </PlaceProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "categories",
            element: <Outlet />,
            children: [
              {
                index: true,
                element: <CategoriesPage />,
              },
              {
                path: ":categoryId",
                element: <CategoryItemsPage />,
              },
            ],
          },
          {
            path: "settings",
            element: <Outlet />,
            children: [
              {
                index: true,
                element: <Navigate to="general" replace />,
              },
              {
                path: "general",
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
