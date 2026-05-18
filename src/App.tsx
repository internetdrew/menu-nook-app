import { ChevronDown, QrCode } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
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
  return (
    <>
      <nav className="sticky top-0 z-40 mx-auto max-w-xl p-4">
        <p className="text-center text-sm font-black">MenuNook</p>
        <div className="mt-4 flex items-center justify-between">
          <AppMenuSwitcher />
          <Button variant={"ghost"}>
            <QrCode />
            Share
          </Button>
        </div>
      </nav>
      <main className="px-4">
        <Outlet />
      </main>
    </>
  );
}

export default App;
