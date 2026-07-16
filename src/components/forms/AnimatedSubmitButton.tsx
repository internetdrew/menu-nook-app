import { AnimatedButtonContent } from "@/components/ui/animated-button-content";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AnimatedSubmitButton({
  isSubmitting,
  disabled = false,
  idleLabel,
  submittingLabel = "Sending...",
}: {
  isSubmitting: boolean;
  disabled?: boolean;
  idleLabel: string;
  submittingLabel?: string;
}) {
  const state = isSubmitting ? "submitting" : "idle";

  return (
    <Button
      type="submit"
      size="sm"
      disabled={isSubmitting || disabled}
      className="min-w-24 overflow-hidden"
      aria-busy={isSubmitting}
    >
      <AnimatedButtonContent
        state={state}
        labels={{ idle: idleLabel, submitting: submittingLabel }}
        iconSize={16}
        renderIcon={(currentState) =>
          currentState === "submitting" ? (
            <Spinner aria-hidden="true" className="size-4" />
          ) : null
        }
      />
    </Button>
  );
}
