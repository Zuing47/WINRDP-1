import { cn } from "@/lib/utils";

/** Nota de condição 0–10 com cor semântica. */
export function ConditionScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const tone =
    score >= 8.5
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : score >= 7
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
        : score >= 5
          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  } as const;

  return (
    <span
      className={cn("money inline-flex items-center rounded-full font-semibold", tone, sizes[size])}
    >
      {score.toFixed(1).replace(".", ",")}/10
    </span>
  );
}
