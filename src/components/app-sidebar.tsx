import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar
      aria-label="App sidebar"
      role="navigation"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenuButton asChild tooltip={"Home"}>
          <Link
            to="/"
            className="flex items-center"
            onClick={() => setOpenMobile(false)}
          >
            <span className="title text-lg font-bold">{title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
