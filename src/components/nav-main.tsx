import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Settings, List } from "lucide-react";
import { Link, NavLink } from "react-router";
import { Skeleton } from "./ui/skeleton";

export function NavMain() {
  const { menus, activeMenu } = useMenuContext();
  const { setOpenMobile } = useSidebar();

  const { data: indexedCategories, isLoading: isLoadingCategories } = useQuery(
    trpc.menuCategory.getAllSortedByIndex.queryOptions(
      {
        menuId: activeMenu?.id ?? "",
      },
      {
        enabled: !!activeMenu,
      },
    ),
  );

  if (!menus.length) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Manage</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                title={"Categories"}
                tooltip={"Categories"}
                asChild
              >
                <NavLink
                  to={`/categories`}
                  end
                  onClick={() => setOpenMobile(false)}
                >
                  {({ isActive }) => (
                    <span className={isActive ? "font-semibold" : ""}>
                      Categories
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {isLoadingCategories
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-8" />
                    ))
                  : indexedCategories?.map((index) => (
                      <SidebarMenuSubItem key={index?.category?.name}>
                        <SidebarMenuButton
                          title={index?.category?.name}
                          tooltip={index?.category?.name}
                          asChild
                        >
                          <NavLink
                            to={`/categories/${index.category?.id}`}
                            onClick={() => setOpenMobile(false)}
                          >
                            {({ isActive }) => (
                              <span className={isActive ? "font-semibold" : ""}>
                                {index.category?.name}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>View</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Menu Preview" asChild>
                <Link
                  to={`/preview/menu/${activeMenu?.id}`}
                  onClick={() => setOpenMobile(false)}
                >
                  <List />
                  <span>Menu Preview</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="General Settings" asChild>
                <Link to={`/settings`} onClick={() => setOpenMobile(false)}>
                  <Settings />
                  <span>General</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
