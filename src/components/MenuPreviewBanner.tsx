import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FC } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

interface MenuPreviewBannerProps {
  subscriptionIsActive: boolean;
  liveSiteUrl: string;
  menu: { id: string };
}

const MenuPreviewBanner: FC<MenuPreviewBannerProps> = ({
  subscriptionIsActive,
  liveSiteUrl,
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
    <div className="sticky top-0 z-10 rounded-lg bg-pink-600/5 py-4 text-center text-sm backdrop-blur-sm">
      <div className="space-x-2 text-center">
        {subscriptionIsActive ? (
          <p>
            This is a preview of your{" "}
            <Link to={`${liveSiteUrl}/menu/${menu.id}`}>live menu</Link>.
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
