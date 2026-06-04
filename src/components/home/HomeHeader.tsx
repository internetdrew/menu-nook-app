import { useMenuContext } from "@/contexts/ActiveMenuContext";
import { MenuSwitcher } from "../MenuSwitcher";
import { Skeleton } from "../ui/skeleton";
import { AnimatePresence, motion } from "motion/react";
import { MENU_SWITCHER_ENTER_TRANSITION } from "@/constants";
import ShareQRButtonDialog from "./ShareQRButtonDialog";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { isMenuSubscriptionActive } from "@/utils/subscription";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { ScrollText } from "lucide-react";

interface HomeHeaderProps {
  showLaunchSuccess?: boolean;
  onLaunchSuccessComplete?: () => void;
}

const HomeHeader = ({
  showLaunchSuccess = false,
  onLaunchSuccessComplete,
}: HomeHeaderProps) => {
  const { activeMenu, loading: loadingMenu } = useMenuContext();
  const { data: subscription, isLoading: loadingSubscription } = useQuery(
    trpc.subscription.getForMenu.queryOptions(
      { menuId: activeMenu?.id ?? "" },
      {
        enabled: !!activeMenu?.id,
        refetchInterval: showLaunchSuccess ? 2000 : false,
      },
    ),
  );
  const subscriptionIsActive = isMenuSubscriptionActive(subscription);
  const loadingHeaderAction =
    loadingMenu || (!!activeMenu && loadingSubscription);

  return (
    <div className="mx-auto max-w-xl bg-[#fff9ef]/95 pt-4 pb-3 backdrop-blur-sm after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-[90%] after:-translate-x-1/2 after:bg-neutral-200/60">
      <div className="mt-12 flex items-center justify-between">
        <MenuSwitcher />
        <div className="flex w-24 items-center justify-end">
          {loadingHeaderAction ? (
            <Skeleton className="h-9 w-full rounded-md" />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {activeMenu ? (
                <motion.div
                  key={subscriptionIsActive ? "share-button" : "preview-link"}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={MENU_SWITCHER_ENTER_TRANSITION}
                >
                  {subscriptionIsActive ? (
                    <ShareQRButtonDialog
                      activeMenuId={activeMenu.id}
                      activeMenuSlug={activeMenu.slug}
                      activeMenuName={activeMenu.name}
                      mode={showLaunchSuccess ? "launch-success" : "share"}
                      openOnMount={showLaunchSuccess}
                      onLaunchSuccessComplete={onLaunchSuccessComplete}
                    />
                  ) : (
                    <Button
                      asChild
                      variant="ghost"
                      className="hover:bg-[#eee7dc]/80 focus-visible:bg-[#eee7dc]/80"
                    >
                      <Link to={`/preview/menu/${activeMenu.id}`}>
                        <ScrollText />
                        Preview
                      </Link>
                    </Button>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
