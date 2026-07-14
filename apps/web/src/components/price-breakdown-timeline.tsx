"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  ChartLine,
  Flag,
  MapPin,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { formatBRL } from "@/lib/format";
import { stageLabels } from "@/lib/labels";
import type { PriceAdjustment, PricingStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const stageIcons: Record<PricingStage, LucideIcon> = {
  BASE: Flag,
  AGE: Calendar,
  CONDITION: Sparkles,
  DEMAND: TrendingUp,
  REGION: MapPin,
  HISTORY: ChartLine,
};

/** Linha do tempo auditável da engine de preço: base → idade → condição → demanda → região → histórico. */
export function PriceBreakdownTimeline({ steps }: { steps: PriceAdjustment[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const Icon = stageIcons[step.stage];
        const delta = step.outputPrice - step.inputPrice;
        const isLast = i === steps.length - 1;
        const neutral = step.stage === "BASE" || delta === 0;
        return (
          <motion.li
            key={step.stage}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {!isLast && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-border" aria-hidden />
            )}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-medium">
                  {stageLabels[step.stage]}
                  <span className="money ml-2 text-xs text-muted-foreground">
                    × {step.factor.toFixed(3).replace(".", ",")}
                  </span>
                </p>
                <p className="money text-sm font-semibold">
                  {formatBRL(step.outputPrice)}
                  {!neutral && (
                    <span
                      className={cn(
                        "ml-2 text-xs font-medium",
                        delta > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {delta > 0 ? "+" : "−"}
                      {formatBRL(Math.abs(delta))}
                    </span>
                  )}
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.reason}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
