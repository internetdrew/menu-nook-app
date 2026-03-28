import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { MenuSwitcher } from "@/components/MenuSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import { title } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@/contexts/auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();
  const { user, isLoading: authLoading } = useAuth();
  const { data: business } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  return (
    <Sidebar
      aria-label="App sidebar"
      role="navigation"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="bg-neutral-300/20">
        <SidebarMenuButton asChild tooltip={"Home"}>
          <Link
            to="/"
            className="flex items-center"
            onClick={() => setOpenMobile(false)}
          >
            <span className="title text-lg font-bold">{title}</span>
          </Link>
        </SidebarMenuButton>
        {business && <MenuSwitcher />}
      </SidebarHeader>
      <SidebarContent className="bg-neutral-300/20">
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="bg-neutral-300/20">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
