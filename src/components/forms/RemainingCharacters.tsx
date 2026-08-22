import { cn } from "@/lib/utils";

type RemainingCharactersProps = {
  value: string | undefined;
  limit: number;
  warningThreshold: number;
  className?: string;
};

const RemainingCharacters = ({
  value,
  limit,
  warningThreshold,
  className = "",
}: RemainingCharactersProps) => {
  const remaining = Math.max(limit - (value?.length ?? 0), 0);
  const colorClassName =
    remaining <= 0
      ? "text-destructive"
      : remaining <= warningThreshold
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <span
      className={cn("shrink-0 text-xs tabular-nums", colorClassName, className)}
    >
      {remaining} left
    </span>
  );
};

export default RemainingCharacters;
