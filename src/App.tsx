import { Link, Outlet, useLocation } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { Separator } from "./components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import { Toaster } from "./components/ui/sonner";
import { useRestaurantContext } from "./contexts/ActiveRestaurantContext";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import CreateRestaurantDialog from "./components/dialogs/CreateRestaurantDialog";
import { useState } from "react";
import { Spinner } from "./components/ui/spinner";

function App() {
  const { restaurants, activeRestaurant, loading } = useRestaurantContext();

  const location = useLocation();

  const getRouteName = () => {
    const path = location.pathname.split("/").filter(Boolean);
    if (path.length === 0) return "Dashboard";
    const lastSegment = path[path.length - 1];
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">
                      {activeRestaurant?.name || "No Restaurant"}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{getRouteName()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-4 pt-0">
          {loading ? (
            <Spinner className="mx-auto mt-36 size-6 text-pink-600" />
          ) : restaurants.length > 0 ? (
            <Outlet />
          ) : (
            <CreateRestaurantCard />
          )}
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;

const CreateRestaurantCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="mx-auto mt-28 max-w-sm text-center">
        <CardHeader className="text-center">
          <CardTitle>No Restaurants Found</CardTitle>
          <CardDescription>
            Get started by creating your first restaurant.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
            Create Restaurant
          </Button>
        </CardFooter>
      </Card>
      <CreateRestaurantDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
};
