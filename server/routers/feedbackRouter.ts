import z from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { supabaseAdminClient } from "../supabase";

export const feedbackRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        feedback: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { feedback } = input;

      const { data: newFeedback, error: feedbackError } =
        await supabaseAdminClient
          .from("feedback")
          .insert({
            user_id: ctx.user.id,
            feedback,
          })
          .select()
          .single();

      if (feedbackError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to submit feedback: ${feedbackError.message}`,
        });
      }

      return newFeedback;
    }),
});
