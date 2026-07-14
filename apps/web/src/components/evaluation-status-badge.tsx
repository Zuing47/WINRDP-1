import { Badge } from "@/components/ui/badge";
import { statusLabels } from "@/lib/labels";
import type { EvaluationStatus } from "@/lib/types";

const variants: Record<EvaluationStatus, "success" | "info" | "warning" | "danger" | "muted"> = {
  PENDING: "muted",
  ANALYZING: "info",
  SEARCHING: "info",
  PRICING: "info",
  DONE: "success",
  FAILED: "danger",
};

export function EvaluationStatusBadge({ status }: { status: EvaluationStatus }) {
  const inProgress = ["ANALYZING", "SEARCHING", "PRICING"].includes(status);
  return (
    <Badge variant={variants[status]}>
      {inProgress && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {statusLabels[status]}
    </Badge>
  );
}
