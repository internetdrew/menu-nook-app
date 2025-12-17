import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import cors from "cors";
import { router, createContext } from "./trpc";
import dotenv from "dotenv";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServerSupabaseClient } from "./supabase";
import { placeRouter } from "./routers/placeRouter";
import { qrCodeRouter } from "./routers/qrRouter";
import { categoryRouter } from "./routers/categoryRouter";
import { itemRouter } from "./routers/itemRouter";
import { menuRouter } from "./routers/menuRouter";
import { stripeRouter } from "./routers/stripeRouter";
import { subscriptionRouter } from "./routers/subscriptionRouter";
import { stripeWebhookHandler } from "./utils/stripe";
import { feedbackRouter } from "./routers/feedbackRouter";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const appRouter = router({
  place: placeRouter,
  qr: qrCodeRouter,
  category: categoryRouter,
  item: itemRouter,
  menu: menuRouter,
  stripe: stripeRouter,
  feedback: feedbackRouter,
  subscription: subscriptionRouter,
});

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

const app = express();

app.use(compression());
app.use(helmet());
app.use(cors(corsOptions));
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());

app.post("/api/stripe/webhook", stripeWebhookHandler);

app.get("/auth/callback", async function (req, res) {
  const code = req.query.code;
  const next = req.query.next ?? "/";

  if (code) {
    const supabase = createServerSupabaseClient(req, res);
    await supabase.auth.exchangeCodeForSession(code as string);
  }
  res.redirect(303, `/${(next as string)?.slice(1)}`);
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

export type AppRouter = typeof appRouter;
