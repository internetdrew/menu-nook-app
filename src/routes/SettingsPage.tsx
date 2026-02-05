import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { BusinessDetails } from "@/components/settings/BusinessDetails";
import { MenuDetails } from "@/components/settings/MenuDetails";

export const SettingsPage = () => {
  const { user, isLoading: authLoading } = useAuth();

  const { data: business } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  return (
    <div className="my-4">
      <header className="flex items-center">
        <h1 className="font-medium">Settings</h1>
        <Popover>
          <PopoverTrigger>
            <Info className="ml-1 size-3" />
          </PopoverTrigger>
          <PopoverContent className="text-sm">
            This is where you can manage your settings and preferences for{" "}
            <span className="font-semibold">{business?.name}</span> and its
            menus.
          </PopoverContent>
        </Popover>
      </header>

      <section className="mt-8">
        <div className="grid max-w-xl gap-4">
          <BusinessDetails />
          <MenuDetails />
        </div>
      </section>
    </div>
  );
};
