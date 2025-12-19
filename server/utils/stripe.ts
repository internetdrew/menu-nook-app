import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { Request, Response } from "express";
import { supabaseAdminClient } from "../supabase";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.STRIPE_SECRET_KEY)
  throw new Error("STRIPE_SECRET_KEY must be defined");
if (!process.env.STRIPE_WEBHOOK_SECRET)
  throw new Error("STRIPE_WEBHOOK_SECRET must be defined");

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  if (!sig) {
    res.status(400).send("Missing Stripe signature");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    console.error("Webhook signature verification failed:", err);
    res.status(400).send("Webhook Error: unknown");
    return;
  }

  res.sendStatus(200);

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;

      if (!subscription.id || !subscription.customer || !userId) {
        console.error("Invalid subscription event", {
          subscriptionId: subscription.id,
          customer: subscription.customer,
          userId,
        });
        return;
      }

      const { status, customer: customerId, items } = subscription;

      const priceItem = items.data[0];
      if (!priceItem) {
        console.error("Subscription missing price/item data", subscription.id);
        return;
      }

      const periodStart = new Date(
        priceItem.current_period_start * 1000,
      ).toISOString();
      const periodEnd = new Date(
        priceItem.current_period_end * 1000,
      ).toISOString();

      const { data: existing, error: fetchError } = await supabaseAdminClient
        .from("subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (fetchError) {
        console.error(
          "Error fetching existing subscription:",
          fetchError.message,
        );
        return;
      }

      if (!existing) {
        const { error: insertError } = await supabaseAdminClient
          .from("subscriptions")
          .insert({
            current_period_start: periodStart,
            current_period_end: periodEnd,
            user_id: userId,
            stripe_customer_id: customerId as string,
            stripe_price_id: priceItem.price.id,
            stripe_subscription_id: subscription.id,
            status,
          });

        if (insertError) {
          console.error("Error inserting subscription:", insertError.message);
        } else {
          console.log("Inserted new subscription:", subscription.id);
        }
      } else {
        const { error: updateError } = await supabaseAdminClient
          .from("subscriptions")
          .update({
            current_period_start: periodStart,
            current_period_end: periodEnd,
            stripe_price_id: priceItem.price.id,
            status,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError.message);
        } else {
          console.log("Updated existing subscription:", subscription.id);
        }
      }
    } else {
      console.log("Ignoring non-subscription event:", event.type);
    }
  } catch (err) {
    console.error("Error processing webhook:", err, "eventId:", event.id);
  }
};
