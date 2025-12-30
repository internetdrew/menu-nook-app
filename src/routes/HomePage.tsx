import { useEffect, useState } from "react";
import CategoriesCard from "@/components/home/CategoriesCard";
import ItemsCard from "@/components/home/ItemsCard";
import ShareQRButtonDialog from "@/components/home/ShareQRButtonDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useMenuContext } from "@/contexts/ActiveMenuContext";

export const HomePage = () => {
  const [params, setSearchParams] = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const { activeMenu } = useMenuContext();

  useEffect(() => {
    const successfulSubscription = params.get("success") === "true";

    if (successfulSubscription) {
      setShowToast(true);

      const newParams = new URLSearchParams(params);
      newParams.delete("success");
      setSearchParams(newParams, { replace: true });
    }
  }, [params, setSearchParams]);

  useEffect(() => {
    if (!showToast) return;

    toast("Your menu is live!", {
      position: "top-center",
      duration: 5000,
      action: (
        <Link
          className="ml-auto text-pink-600 underline underline-offset-4"
          to={`/menu/${activeMenu?.id}`}
        >
          View Menu
        </Link>
      ),
    });
  }, [showToast, activeMenu?.id]);

  return (
    <div>
      <main>
        <div className="my-4 flex items-center">
          <h1 className="font-medium">
            {activeMenu?.name && `${activeMenu.name} `}Overview
          </h1>
          <Popover>
            <PopoverTrigger>
              <Info className="ml-1 size-3" />
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              Everything you need to know about your menu, at a glance.
            </PopoverContent>
          </Popover>
          {activeMenu && (
            <ShareQRButtonDialog
              activeMenuId={activeMenu.id}
              activeMenuName={activeMenu.name}
            />
          )}
        </div>

        <div className="my-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3">
          {activeMenu && (
            <>
              <CategoriesCard activeMenuId={activeMenu.id} />
              <ItemsCard activeMenuId={activeMenu.id} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};
