import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { MenuPreviewCategory } from "@/types/menu";
import HomeHeader from "@/components/home/HomeHeader";
import CategoriesSection from "@/components/home/CategoriesSection";

export type MenuCategory = MenuPreviewCategory;

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
    <div className="pb-10">
      <HomeHeader />
      <CategoriesSection />
    </div>
  );
};
