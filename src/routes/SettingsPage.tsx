import { Skeleton } from "@/components/ui/skeleton";
import { useMenuContext } from "@/contexts/ActiveMenuContext";

export const SettingsPage = () => {
  const { activeMenu, loading } = useMenuContext();

  if (loading) {
    return <Skeleton className="h-6 w-sm" />;
  }

  if (!activeMenu) {
    return <div>No menu selected.</div>;
  }

  return (
    <div className="my-4">
      {loading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <h1 className="font-medium">{activeMenu?.name} Settings</h1>
      )}
    </div>
  );
};
