import { ExternalLink, Star, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatRelative } from "@/lib/format";
import { marketplaceNames } from "@/lib/labels";
import type { MarketListing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MarketListingCard({ listing }: { listing: MarketListing }) {
  const excluded = Boolean(listing.excludedReason);
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border p-4 transition-colors",
        excluded ? "bg-muted/40" : "hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium", excluded && "text-muted-foreground line-through decoration-border")}>
            {listing.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{marketplaceNames[listing.marketplace]}</span>
            <span aria-hidden>·</span>
            <span>{listing.conditionLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {listing.sellerRating.toFixed(1).replace(".", ",")}
            </span>
            <span aria-hidden>·</span>
            <span>{formatRelative(listing.collectedAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("money text-sm font-semibold", excluded && "text-muted-foreground")}>
            {formatBRL(listing.price)}
          </span>
          {!excluded && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60" />}
        </div>
      </div>
      {excluded && (
        <Badge variant="warning" className="w-fit">
          <XCircle className="h-3 w-3" />
          {listing.excludedReason}
        </Badge>
      )}
    </div>
  );
}
