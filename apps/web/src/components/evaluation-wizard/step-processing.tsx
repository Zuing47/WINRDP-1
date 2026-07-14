"use client";

import { motion } from "framer-motion";
import { Camera, Check, Loader2, Radar, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { useEvaluation } from "@/hooks/use-queries";
import type { EvaluationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGES: { label: string; icon: LucideIcon; statuses: EvaluationStatus[] }[] = [
  { label: "Analisando fotos", icon: Camera, statuses: ["PENDING", "ANALYZING"] },
  { label: "Buscando o mercado", icon: Radar, statuses: ["SEARCHING"] },
  { label: "Filtrando anúncios", icon: SlidersHorizontal, statuses: ["SEARCHING"] },
  { label: "Calculando preço", icon: Check, statuses: ["PRICING"] },
];

export function StepProcessing({
  evaluationId,
  onDone,
}: {
  evaluationId: string;
  onDone: () => void;
}) {
  const { data: evaluation } = useEvaluation(evaluationId, { poll: true });
  const status = evaluation?.status ?? "PENDING";

  const currentIndex = (() => {
    if (status === "DONE") return STAGES.length;
    if (status === "PRICING") return 3;
    if (status === "SEARCHING") return 1;
    return 0;
  })();

  useEffect(() => {
    if (status === "DONE") {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary/25"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </span>
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Processando sua avaliação</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Isso leva cerca de 10 segundos. Não feche esta página.
      </p>

      <div className="mt-10 w-full max-w-sm space-y-3 text-left">
        {STAGES.map((stage, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div
              key={stage.label}
              className={cn(
                "flex items-center gap-3 rounded-md border px-4 py-3 transition-colors",
                active && "border-primary/40 bg-primary/5",
                done && "border-transparent"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  done && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  active && "bg-primary/10 text-primary",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <stage.icon className="h-4 w-4" />
                )}
              </span>
              <span className={cn("text-sm font-medium", !done && !active && "text-muted-foreground")}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
