import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePlaceContext } from "@/contexts/ActivePlaceContext";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Link, NavLink } from "react-router";
import { Skeleton } from "./ui/skeleton";

export function NavMain() {
  const { places } = usePlaceContext();
  const { setOpenMobile } = useSidebar();
  const { activePlace } = usePlaceContext();

  const { data: indexedCategories, isLoading: isLoadingCategories } = useQuery(
    trpc.category.getAllSortedByIndex.queryOptions(
      {
        placeId: activePlace?.id ?? "",
      },
      {
        enabled: !!activePlace,
      },
    ),
  );

  const viewItems = [
    {
      title: "Menu Preview",
      url: `/preview/menu/${activePlace?.id}`,
      icon: Eye,
    },
  ];

  if (!places.length) {
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
                  to={`/dashboard/categories`}
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
            </SidebarMenuItem>
            {isLoadingCategories
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-8" />
                ))
              : indexedCategories?.map((index) => (
                  <SidebarMenuItem key={index.category.name}>
                    <SidebarMenuButton
                      title={index.category.name}
                      tooltip={index.category.name}
                      asChild
                    >
                      <NavLink
                        to={`/dashboard/categories/${index.category.id}`}
                        onClick={() => setOpenMobile(false)}
                      >
                        {({ isActive }) => (
                          <span className={isActive ? "font-semibold" : ""}>
                            {index.category.name}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>View</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {viewItems?.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link to={item.url} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
