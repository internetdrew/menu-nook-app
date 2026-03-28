import { Outlet } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth";
import { trpc } from "../utils/trpc";
import EmptyStatePrompt from "./EmptyStatePrompt";
import { CreateBusinessForm } from "./forms/CreateBusinessForm";
import { CreateMenuForm } from "./forms/CreateMenuForm";
import { useState } from "react";
import { SignInPrompt } from "./SignInPrompt";
import { DashboardSkeleton } from "./DashboardSkeleton";

export function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  const { data: business, isLoading: businessLoading } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  const { data: menus, isLoading: menusLoading } = useQuery(
    trpc.menu.getAllForBusiness.queryOptions(
      {
        businessId: business?.id || "",
      },
      { enabled: !!business && !!user && !authLoading },
    ),
  );

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <SignInPrompt />;
  }

  if (businessLoading) {
    return <DashboardSkeleton />;
  }

  if (!business) {
    return (
      <EmptyStatePrompt
        cardTitle="No Business Found"
        cardDescription="Add your business to start managing your menus."
        buttonText="Create Business"
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        formComponent={CreateBusinessForm}
        formDialogTitle="Create Your Business"
        formDialogDescription="Add your business to start managing your menus."
      />
    );
  }

  if (menusLoading) {
    return <DashboardSkeleton />;
  }

  if (menus?.length === 0) {
    return (
      <EmptyStatePrompt
        cardTitle="No Menus Found"
        cardDescription="Add your first menu to get started."
        buttonText="Add Menu"
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        formComponent={CreateMenuForm}
        formDialogTitle="Create New Menu"
        formDialogDescription="Fill in the details below to create a new menu."
      />
    );
  }

  return <Outlet />;
}
