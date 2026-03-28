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

export const routes = [
  {
    path: "/menu/:menuId",
    element: <Menu />,
  },
  {
    path: "/",
    element: (
      <MenuProvider>
        <App />
      </MenuProvider>
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
        element: <ProtectedRoute redirectTo="/" />,
        children: [
          {
            path: "preview",
            element: <Navigate to="/" replace />,
          },
          {
            path: "preview/menu/:menuId",
            element: <Menu />,
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
