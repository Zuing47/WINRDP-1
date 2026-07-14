import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceDisplay({
  value,
  size = "md",
  muted = false,
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  muted?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "text-sm font-medium",
    md: "text-lg font-semibold",
    lg: "text-3xl font-semibold",
    xl: "text-5xl font-semibold sm:text-6xl",
  } as const;
  return (
    <span
      className={cn(
        "money tracking-tight",
        sizes[size],
        muted && "text-muted-foreground",
        className
      )}
    >
      {formatBRL(value)}
    </span>
  );
}
