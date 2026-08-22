import { isStoreSubscriptionActive } from "@/utils/subscription";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import ShareQRButtonDialog from "./ShareQRButtonDialog";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { ScrollText } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface StoreViewerOptionsProps {
  storeId: string;
  storeMenuSlug: string;
  storeName: string;
}

const StoreViewerOptions = ({
  storeId,
  storeMenuSlug,
  storeName,
}: StoreViewerOptionsProps) => {
  const { data: subscription, isLoading: loadingSubscription } = useQuery(
    trpc.subscription.getForStore.queryOptions(
      { storeId: storeId ?? "" },
      {
        enabled: !!storeId,
      },
    ),
  );
  const subscriptionIsActive = isStoreSubscriptionActive(subscription);

  if (loadingSubscription) return <Skeleton className="h-8 w-24" />;

  return (
    <div className="flex w-24 items-center justify-end">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={subscriptionIsActive ? "share-button" : "preview-link"}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          {subscriptionIsActive ? (
            <ShareQRButtonDialog
              storeId={storeId}
              storeSlug={storeMenuSlug}
              storeName={storeName}
            />
          ) : (
            <Button
              asChild
              variant="ghost"
              size={"sm"}
              className="hover:bg-stone-200 focus-visible:bg-stone-200"
            >
              <Link to="/preview/store">
                <ScrollText />
                Preview
              </Link>
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StoreViewerOptions;
