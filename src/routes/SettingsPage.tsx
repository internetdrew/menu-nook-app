import { BusinessDetails } from "@/components/settings/BusinessDetails";
import { MenuDetails } from "@/components/settings/MenuDetails";
import { Separator } from "@/components/ui/separator";
import { useMenuContext } from "@/contexts/ActiveMenuContext";

export const SettingsPage = () => {
  const { activeMenu } = useMenuContext();

  return (
    <div className="mx-auto mt-12 max-w-lg px-2">
      <header className="flex items-center">
        <h1 className="text-lg font-medium">Settings</h1>
      </header>

      <section className="mt-6 space-y-6">
        <BusinessDetails />
        {activeMenu && (
          <>
            <Separator />
            <MenuDetails />
          </>
        )}
      </section>
    </div>
  );
};
