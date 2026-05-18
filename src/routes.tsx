import { Menu } from "./routes/Menu.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { MenuProvider } from "./contexts/ActiveMenuContext.tsx";
import App from "./App.tsx";
import { HomePage } from "./routes/HomePage.tsx";
import { CategoriesPage } from "./routes/CategoriesPage.tsx";
import { CategoryItemsPage } from "./routes/CategoryItemsPage.tsx";
import { SettingsPage } from "./routes/SettingsPage.tsx";
import { DashboardPage } from "./components/Dashboard.tsx";
import { NotFound } from "./routes/NotFound.tsx";
import { Navigate } from "react-router";
import Login from "./routes/Login.tsx";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated.tsx";

export const routes = [
  {
    path: "/menu/:menuId",
    element: <Menu />,
  },
  {
    path: "/login",
    element: <RedirectIfAuthenticated />,
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },
  {
    element: <ProtectedRoute redirectTo="/login" />,
    children: [
      {
        path: "/preview",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/preview/menu/:menuId",
        element: <Menu />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute redirectTo="/login">
        <MenuProvider>
          <App />
        </MenuProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        element: <DashboardPage />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
        ],
      },
      {
        path: "categories",
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
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: (
      <ProtectedRoute redirectTo="/login">
        <NotFound
          title="Page Not Found"
          message="The page you're looking for does not exist."
          href="/"
          hrefText="Go back to Home"
        />
      </ProtectedRoute>
    ),
  },
];
