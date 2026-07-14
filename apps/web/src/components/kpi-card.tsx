"use client";

import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiCard({
  label,
  value,
  icon: Icon,
  format,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  format?: (v: number) => string;
  hint?: string;
}) {
  return (
    <Card className="p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/70" />
      </div>
      <p className="money mt-3 text-2xl font-semibold tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
    </Card>
  );
}
