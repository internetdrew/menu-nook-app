import { lazy, useEffect, useState } from "react";
import type { StorePreviewCategory } from "@/types/store";
import { useSearchParams } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CategoriesSection = lazy(
  () => import("@/components/home/CategoriesSection"),
);
const HomeQuickActions = lazy(
  () => import("@/components/home/HomeQuickActions"),
);

export type StoreCategory = StorePreviewCategory;

export const HomePage = () => {
  const [showLaunchSuccess, setShowLaunchSuccess] = useState(false);
  const [params, setSearchParams] = useSearchParams();

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
    <div className="pt-32 pb-10">
      <CategoriesSection />

      <HomeQuickActions />

      <AlertDialog open={showLaunchSuccess} onOpenChange={setShowLaunchSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Launch Successful</AlertDialogTitle>
            <AlertDialogDescription>
              Your store has been launched successfully!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
