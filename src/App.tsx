import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/Dashboard";
import ShareQRButtonDialog from "@/components/home/ShareQRButtonDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useMenuContext } from "@/contexts/ActiveMenuContext";

function AppMenuSwitcher() {
  const navigate = useNavigate();
  const { menus, activeMenu, setActiveMenu, loading } = useMenuContext();

  if (loading) {
    return <Skeleton className="h-9 w-40 rounded-md" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-64 justify-start px-2">
          <span className="truncate">
            {activeMenu?.name ?? "No menu selected"}
          </span>
          <ChevronDown className="text-muted-foreground ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Menus
        </DropdownMenuLabel>
        {menus.map((menu) => (
          <DropdownMenuItem
            key={menu.id}
            onClick={() => {
              setActiveMenu(menu);
              navigate("/");
            }}
          >
            {menu.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function App() {
  const { activeMenu } = useMenuContext();

  return (
    <>
      <nav className="sticky top-0 z-40 m-4 mx-auto max-w-xl border-b border-neutral-100 pb-3">
        <p className="text-center font-black">MenuNook</p>
        <div className="mt-4 flex items-center justify-between">
          <AppMenuSwitcher />
          <div className="flex items-center gap-1">
            {activeMenu && (
              <ShareQRButtonDialog
                activeMenuId={activeMenu.id}
                activeMenuName={activeMenu.name}
              />
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto mt-6 max-w-xl px-4">
        <DashboardPage />
      </main>
      <Toaster />
    </>
  );
}

export default App;
