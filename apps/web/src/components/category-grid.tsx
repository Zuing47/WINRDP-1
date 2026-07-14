"use client";

import { CategoryIcon } from "@/components/category-icon";
import { Stagger, StaggerItem } from "@/components/motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryGrid({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
}) {
  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" gap={0.03}>
      {categories.map((category) => {
        const active = category.id === selectedId;
        return (
          <StaggerItem key={category.id}>
            <button
              type="button"
              onClick={() => onSelect(category)}
              className={cn(
                "flex w-full flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:border-zinc-300 hover:shadow-subtle dark:hover:border-zinc-700",
                active && "border-primary ring-1 ring-primary hover:border-primary dark:hover:border-primary"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors",
                  active && "bg-primary/10 text-primary"
                )}
              >
                <CategoryIcon name={category.icon} className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-[104px] rounded-lg" />
      ))}
    </div>
  );
}
