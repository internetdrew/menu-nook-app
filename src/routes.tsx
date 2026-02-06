import Login from "./routes/Login.tsx";
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
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated.tsx";

export const routes = [
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
  {
    path: "/menu/:menuId",
    element: <Menu />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MenuProvider>
          <App />
        </MenuProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "preview",
        element: <Navigate to="/" replace />,
      },
      {
        path: "preview/:menuId",
        element: <Menu />,
      },
      {
        element: <DashboardPage />,
        children: [
          {
            index: true,
            element: <HomePage />,
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
    ],
  },
  {
    path: "*",
    element: (
      <NotFound
        title="Page Not Found"
        message="The page you're looking for does not exist."
        href="/"
        hrefText="Go back to Home"
      />
    ),
  },
];
