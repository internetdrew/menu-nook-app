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

import { useState } from "react";
import { Spinner } from "./components/ui/spinner";
import { CreateBusinessForm } from "./components/forms/CreateBusinessForm";
import { UserFeedbackTrigger } from "./components/UserFeedbackTrigger";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import { CreateMenuForm } from "./components/forms/CreateMenuForm";
import EmptyStatePrompt from "./components/EmptyStatePrompt";

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: business, isLoading } = useQuery(
    trpc.business.getForUser.queryOptions(),
  );
  const { data: menus, isLoading: menusLoading } = useQuery(
    trpc.menu.getAllForBusiness.queryOptions(
      {
        businessId: business?.id || "",
      },
      {
        enabled: !!business,
      },
    ),
  );
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            {business && (
              <>
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/dashboard">{business?.name}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
            <UserFeedbackTrigger />
          </div>
        </header>
        <div className="p-4 pt-0">
          {isLoading || menusLoading ? (
            <Spinner className="mx-auto mt-36 size-6 text-pink-600" />
          ) : !business ? (
            <EmptyStatePrompt
              cardTitle="No Business Found"
              cardDescription="Add your business to start managing your menus."
              buttonText="Create Business"
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
              formComponent={CreateBusinessForm}
              formDialogTitle="Create Business"
              formDialogDescription="Add your business to start managing your menus."
            />
          ) : menus?.length === 0 ? (
            <EmptyStatePrompt
              cardTitle="No Menus Found"
              cardDescription="Add your first menu to get started."
              buttonText="Create Menu"
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
              formComponent={CreateMenuForm}
              formDialogTitle="Create Menu"
              formDialogDescription="Add your first menu to get started."
            />
          ) : (
            <Outlet />
          )}
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
