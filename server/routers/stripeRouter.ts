import { z } from "zod";
import { Request, Response } from "express";
import { createServerSupabaseClient } from "../supabase";
import { stripe } from "../utils/stripe";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

const APP_DOMAIN = process.env.APP_DOMAIN;

if (!APP_DOMAIN) {
  throw new Error("APP_DOMAIN must be defined");
}

const SUBSCRIPTION_PRICE_ID = process.env.SUBSCRIPTION_PRICE_ID;

if (!SUBSCRIPTION_PRICE_ID) {
  throw new Error("SUBSCRIPTION_PRICE_ID must be defined");
}

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        placeId: z.uuid(),
        baseUrl: z.url(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { placeId } = input;
      const supabase = createServerSupabaseClient(
        ctx.req as Request,
        ctx.res as Response,
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user?.email,
        payment_method_types: ["card"],
        line_items: [
          {
            price: SUBSCRIPTION_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${APP_DOMAIN}/dashboard?success=true`,
        cancel_url: `${APP_DOMAIN}/dashboard?canceled=true`,
        metadata: {
          placeId: placeId,
        },
        subscription_data: {
          metadata: {
            placeId: placeId,
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
