import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "../ui/form";
import { Button } from "../ui/button";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "../ui/spinner";

interface FeedbackFormProps {
  onSuccess: () => void;
}

const formSchema = z.object({
  feedback: z
    .string()
    .min(1, {
      message: "Please add feedback to submit.",
    })
    .max(500, {
      message: "Feedback must be less than 500 characters long.",
    }),
});

export const UserFeedbackForm = ({ onSuccess }: FeedbackFormProps) => {
  const submitFeedbackMutation = useMutation(
    trpc.userFeedback.submit.mutationOptions(),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await submitFeedbackMutation.mutateAsync(values, {
      onError: (error) => {
        console.error("Failed to submit feedback:", error);
        toast.error("Failed to submit feedback. Please try again.");
      },
      onSuccess: () => {
        toast.success("Feedback submitted successfully!");
        onSuccess();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea
                  className="field-sizing-content resize-none"
                  placeholder="Let me know how I can improve your experience here..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner className="mr-2" />}
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
