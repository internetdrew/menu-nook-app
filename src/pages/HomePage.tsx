import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { StorePreviewCategory } from "@/types/store";
import HomeHeader from "@/components/home/HomeHeader";
import StoreCategoriesSkeleton from "@/components/skeletons/StoreCategoriesSkeleton";

const CategoriesSection = lazy(
  () => import("@/components/home/CategoriesSection"),
);
const HomeQuickActions = lazy(
  () => import("@/components/home/HomeQuickActions"),
);

export type StoreCategory = StorePreviewCategory;

export const HomePage = () => {
  const [params, setSearchParams] = useSearchParams();
  const [showLaunchSuccess, setShowLaunchSuccess] = useState(false);

  useEffect(() => {
    const successfulSubscription = params.get("success") === "true";

    if (successfulSubscription) {
      setShowLaunchSuccess(true);

      const newParams = new URLSearchParams(params);
      newParams.delete("success");
      setSearchParams(newParams, { replace: true });
    }
  }, [params, setSearchParams]);

  return (
    <div className="pb-10">
      <HomeHeader
        showLaunchSuccess={showLaunchSuccess}
        onLaunchSuccessComplete={() => setShowLaunchSuccess(false)}
      />
      <Suspense
        fallback={
          <div className="mt-12">
            <StoreCategoriesSkeleton />
          </div>
        }
      >
        <CategoriesSection />
      </Suspense>
      <Suspense fallback={null}>
        <HomeQuickActions />
      </Suspense>
    </div>
  );
};
