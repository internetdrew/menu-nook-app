import { BusinessDetails } from "@/components/settings/BusinessDetails";
import { MenuDetails } from "@/components/settings/MenuDetails";
import { Separator } from "@/components/ui/separator";

export const SettingsPage = () => {
  return (
    <div className="mx-auto mt-12 max-w-lg px-2">
      <header className="flex items-center">
        <h1 className="text-lg font-medium">Settings</h1>
      </header>

      <section className="mt-6 space-y-6">
        <BusinessDetails />
        <Separator />
        <MenuDetails />
      </section>
    </div>
  );
};
