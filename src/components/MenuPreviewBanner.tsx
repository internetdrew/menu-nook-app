import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FC } from "react";
import { toast } from "sonner";

interface MenuPreviewBannerProps {
  subscriptionIsActive: boolean;
  publicMenuDomain: string;
  menu: { id: string; slug?: string | null };
}

const MenuPreviewBanner: FC<MenuPreviewBannerProps> = ({
  subscriptionIsActive,
  publicMenuDomain,
  menu,
}) => {
  const [connecting, setConnecting] = useState(false);
  const stripeCheckoutMutation = useMutation(
    trpc.stripe.createCheckoutSession.mutationOptions(),
  );

  const handleSubscribe = async () => {
    setConnecting(true);
    await stripeCheckoutMutation.mutateAsync(
      { menuId: menu?.id ?? "" },
      {
        onSuccess: (data) => {
          window.location.assign(data.url);
        },
        onError: (error) => {
          console.error("Error creating checkout session:", error);
          toast.error("Error creating checkout session: " + error.message);
        },
      },
    );
  };

  return (
    <div className="sticky top-0 z-10 bg-neutral-500/5 py-4 text-center text-xs backdrop-blur-sm">
      <div className="space-x-2 text-center">
        {subscriptionIsActive ? (
          <p>
            This is a preview of your{" "}
            <a href={`${publicMenuDomain}/m/${menu.slug ?? menu.id}`}>
              live menu
            </a>
            .
          </p>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              key={connecting ? "connecting" : "subscribe"}
            >
              {connecting ? (
                <>Now connecting you to the checkout...</>
              ) : (
                <>
                  {"Your menu won't be visible to customers until you "}
                  <button
                    onClick={handleSubscribe}
                    className="cursor-pointer font-medium underline decoration-neutral-300 underline-offset-4 transition duration-200 hover:decoration-neutral-600"
                  >
                    subscribe
                  </button>
                  .
                </>
              )}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MenuPreviewBanner;
