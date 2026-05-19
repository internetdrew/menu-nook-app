import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { useAuth } from "@/contexts/auth";
import { ScrollText } from "lucide-react";
import { NavLink } from "react-router";

export function NavMain() {
  const { user } = useAuth();
  const { activeMenu } = useMenuContext();
  const { setOpenMobile } = useSidebar();

  if (!user) {
    return null;
  }

  return (
    <>
      {activeMenu && (
        <SidebarGroup>
          <SidebarGroupLabel>View</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Menu Preview" asChild>
                  <NavLink
                    to={`/preview/menu/${activeMenu?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpenMobile(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <ScrollText />
                        <span className={isActive ? "font-semibold" : ""}>
                          Menu Preview
                        </span>
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
