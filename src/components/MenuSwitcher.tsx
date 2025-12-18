import { useState } from "react";
import { ChevronsUpDown, MapPin, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMenuContext } from "@/contexts/ActiveMenuContext";
import FormDialog from "./dialogs/FormDialog";
import { CreateMenuForm } from "./forms/CreateMenuForm";

export function MenuSwitcher() {
  const { isMobile } = useSidebar();
  const [renderDropdown, setRenderDropdown] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { menus, activeMenu, setActiveMenu } = useMenuContext();

  const triggerDialog = () => {
    setRenderDropdown(false);
    setIsDialogOpen(true);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={renderDropdown} onOpenChange={setRenderDropdown}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <MapPin className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeMenu?.name ?? "No menu selected"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Menus
            </DropdownMenuLabel>
            {menus.map((menu) => (
              <DropdownMenuItem
                key={menu.id}
                onClick={() => setActiveMenu(menu)}
                className="gap-2 p-2"
              >
                {menu.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={triggerDialog}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Create Menu
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <FormDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        title="Create Menu"
        description="Add a new menu to your business."
        formComponent={
          <CreateMenuForm onSuccess={() => setIsDialogOpen(false)} />
        }
      />
    </SidebarMenu>
  );
}
