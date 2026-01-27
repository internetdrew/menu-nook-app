import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { UserFeedbackTrigger } from "./UserFeedbackTrigger";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { useAuth } from "../contexts/auth";

export function Header() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: business } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  return (
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
                    <Link to="/">{business?.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
        <UserFeedbackTrigger />
      </div>
    </header>
  );
}
