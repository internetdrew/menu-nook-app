import { z } from "zod";
import { stripe } from "../utils/stripe";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

const APP_DOMAIN = process.env.VITE_APP_DOMAIN;

if (!APP_DOMAIN) {
  throw new Error("APP_DOMAIN must be defined");
}

const SUBSCRIPTION_PRICE_ID = process.env.SUBSCRIPTION_PRICE_ID;

if (!SUBSCRIPTION_PRICE_ID) {
  throw new Error("SUBSCRIPTION_PRICE_ID must be defined");
}

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({ businessId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: ctx.user.email,
        payment_method_types: ["card"],
        line_items: [
          {
            price: SUBSCRIPTION_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${APP_DOMAIN}/?success=true`,
        cancel_url: `${APP_DOMAIN}/?canceled=true`,
        metadata: {
          businessId: input.businessId,
        },
        subscription_data: {
          metadata: {
            businessId: input.businessId,
          },
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create Stripe checkout session`,
        });
      }

      return { url: session.url };
    }),
});
