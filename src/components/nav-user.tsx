import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";
import { supabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, isLoading } = useAuth();

  const signOut = async () => {
    try {
      await supabaseBrowserClient.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-full bg-neutral-200" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-24 bg-neutral-200" />
              <Skeleton className="h-3 w-32 bg-neutral-200" />
            </div>
            <Skeleton className="h-4 w-4 rounded-sm bg-neutral-200" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={user?.user_metadata?.name}
                />
                <AvatarFallback className="rounded-full">
                  {user?.user_metadata?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user?.user_metadata?.name}
                </span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.name}
                  />
                  <AvatarFallback className="rounded-full">
                    {user?.user_metadata?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.user_metadata?.name}
                  </span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuGroup>
              <DropdownMenuItem>
              <Sparkles />
              Upgrade to Pro
              </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
              <DropdownMenuItem>
              <BadgeCheck />
              Account
              </DropdownMenuItem>
              <DropdownMenuItem>
              <CreditCard />
              Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
              <Bell />
              Notifications
              </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator /> */}
            <DropdownMenuItem>
              <SidebarMenuButton onClick={signOut}>
                <LogOut />
                Log out
              </SidebarMenuButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
