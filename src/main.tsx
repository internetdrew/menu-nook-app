import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { queryClient } from "./utils/trpc.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import Login from "./routes/Login.tsx";
import { AuthProvider } from "./contexts/auth.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { PlaceProvider } from "./contexts/ActivePlaceContext.tsx";
import ItemsPage from "./routes/ItemsPage.tsx";
import Menu from "./routes/Menu.tsx";
import PublicMenu from "./routes/PublicMenu.tsx";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/menu/:placeId",
    element: <PublicMenu />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <QueryClientProvider client={queryClient}>
          <PlaceProvider>
            <App />
          </PlaceProvider>
        </QueryClientProvider>
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
            element: <h1>Dashboard Home</h1>,
          },
          {
            path: "items",
            element: <ItemsPage />,
          },
          {
            path: "menu",
            element: <Menu />,
          },
          {
            path: "settings",
            element: <h1>Settings</h1>,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
