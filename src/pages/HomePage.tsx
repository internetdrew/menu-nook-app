import { lazy, Suspense } from "react";
import type { StorePreviewCategory } from "@/types/store";
import StoreCategoriesSkeleton from "@/components/skeletons/StoreCategoriesSkeleton";

const CategoriesSection = lazy(
  () => import("@/components/home/CategoriesSection"),
);
const HomeQuickActions = lazy(
  () => import("@/components/home/HomeQuickActions"),
);

export type StoreCategory = StorePreviewCategory;

export const HomePage = () => {
  return (
    <div className="pt-32 pb-10">
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
