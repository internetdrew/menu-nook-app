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
import PublicMenu from "./routes/PublicMenu.tsx";
import { MenuPage } from "./routes/MenuPage.tsx";

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
            element: <h1>Dashboard Home</h1>,
          },
          {
            path: "menu",
            element: <MenuPage />,
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
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
