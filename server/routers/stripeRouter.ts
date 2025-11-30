import { z } from "zod";
import { Request, Response } from "express";
import { createServerSupabaseClient } from "../supabase";
import { stripe } from "../utils/stripe";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

const APP_DOMAIN = process.env.APP_DOMAIN;

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
            price: "price_1SXpnbEqDWCByv0PhUOFR3V7",
            quantity: 1,
          },
        ],
        success_url: `${APP_DOMAIN}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_DOMAIN}/dashboard?canceled=true`,

        metadata: {
          placeId: placeId,
          userId: user!.id,
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
