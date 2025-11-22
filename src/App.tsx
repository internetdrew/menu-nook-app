import { Link, Outlet } from "react-router";
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
} from "./components/ui/breadcrumb";
import { Toaster } from "./components/ui/sonner";
import { usePlaceContext } from "./contexts/ActivePlaceContext";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { useState } from "react";
import { Spinner } from "./components/ui/spinner";
import FormDialog from "./components/dialogs/FormDialog";
import CreatePlaceForm from "./components/forms/CreatePlaceForm";

function App() {
  const { places, activePlace, loading } = usePlaceContext();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 pr-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            {activePlace && (
              <>
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/dashboard">{activePlace?.name}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
          </div>
        </header>
        <div className="p-4 pt-0">
          {loading ? (
            <Spinner className="mx-auto mt-36 size-6 text-pink-600" />
          ) : places.length > 0 ? (
            <Outlet />
          ) : (
            <CreatePlaceCard />
          )}
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;

const CreatePlaceCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="mx-auto mt-28 max-w-sm text-center">
        <CardHeader className="text-center">
          <CardTitle>No Places Found</CardTitle>
          <CardDescription>
            Get started by creating your first place to create a menu for.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
            Create a Place
          </Button>
        </CardFooter>
      </Card>
      <FormDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        title="Create Place"
        description="Fill out the form below to create a new place."
        formComponent={
          <CreatePlaceForm onSuccess={() => setIsDialogOpen(false)} />
        }
      />
    </>
  );
};
