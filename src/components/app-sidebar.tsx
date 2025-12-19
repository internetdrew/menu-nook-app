import * as React from "react";
import { ScrollText } from "lucide-react";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();
  const { data: business } = useQuery(trpc.business.getForUser.queryOptions());

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton asChild tooltip={"Home"}>
          <Link
            to="/"
            className="flex items-center"
            onClick={() => setOpenMobile(false)}
          >
            <ScrollText className="size-4 text-pink-600" />
            <span className="font-semibold">{title}</span>
          </Link>
        </SidebarMenuButton>
        {business && <MenuSwitcher />}
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
