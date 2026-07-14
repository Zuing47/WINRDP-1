"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Clock,
  MapPin,
  Radar,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConditionScoreBadge } from "@/components/condition-score-badge";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { EvaluationStatusBadge } from "@/components/evaluation-status-badge";
import { MarketListingCard } from "@/components/market-listing-card";
import { FadeIn } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { PriceBreakdownTimeline } from "@/components/price-breakdown-timeline";
import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL, formatDate } from "@/lib/format";
import { conditionLabels } from "@/lib/labels";
import { api } from "@/lib/api";
import { useEvaluation } from "@/hooks/use-queries";

export default function EvaluationResultPage() {
  const params = useParams<{ id: string }>();
  const { data: evaluation, isLoading } = useEvaluation(params.id, { poll: true });
  const [monitoring, setMonitoring] = useState(false);

  if (isLoading || !evaluation) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (evaluation.status !== "DONE" || !evaluation.prices || !evaluation.marketStats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${evaluation.brandName} ${evaluation.modelName}`}
          description="Sua avaliação ainda está sendo processada"
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <EvaluationStatusBadge status={evaluation.status} />
            <p className="max-w-sm text-sm text-muted-foreground">
              Atualizamos esta página automaticamente assim que o resultado ficar pronto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { prices, marketStats, conditionReport, listings, breakdown } = evaluation;
  const usedListings = listings.filter((l) => !l.excludedReason);
  const excludedListings = listings.filter((l) => l.excludedReason);

  async function handleMonitor() {
    if (!evaluation) return;
    setMonitoring(true);
    try {
      await api.createMonitor({
        modelId: evaluation.modelId,
        condition: evaluation.condition,
        targetPrice: evaluation.prices!.recommended,
        notifyOn: { rise: false, drop: true, opportunity: true, bigDiscount: true },
      });
      toast.success("Produto adicionado aos monitores!");
    } catch {
      toast.error("Não foi possível criar o monitor.");
    } finally {
      setMonitoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${evaluation.brandName} ${evaluation.modelName}`}
        description={`Avaliado em ${formatDate(evaluation.createdAt)} · ${evaluation.categoryName}`}
        actions={
          <Button onClick={handleMonitor} disabled={monitoring}>
            <Radar className="h-4 w-4" />
            {monitoring ? "Adicionando…" : "Monitorar este produto"}
          </Button>
        }
      />

      {/* Preço principal */}
      <FadeIn>
        <Card className="overflow-hidden">
          <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-sm text-muted-foreground">Preço recomendado</p>
              <PriceDisplay value={prices.recommended} size="xl" className="mt-1" />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ConditionScoreBadge score={evaluation.conditionScore ?? 0} />
                <Badge variant="outline">
                  <Calendar className="h-3 w-3" /> {evaluation.year}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3" /> {evaluation.location.city}, {evaluation.location.state}
                </Badge>
                <Badge variant="outline">{conditionLabels[evaluation.condition]}</Badge>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-md border p-4">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" /> Venda rápida
                  </p>
                  <PriceDisplay value={prices.quickSale} size="md" className="mt-1.5" />
                  <p className="mt-0.5 text-xs text-muted-foreground">~7 dias, −12%</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5" /> Preço máximo
                  </p>
                  <PriceDisplay value={prices.max} size="md" className="mt-1.5" />
                  <p className="mt-0.5 text-xs text-muted-foreground">Vendedor paciente, +9%</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-muted/40 p-6 sm:flex-row lg:flex-col">
              <div className="flex flex-col items-center gap-2">
                <ConfidenceGauge value={evaluation.confidence ?? 0} />
                <p className="text-xs text-muted-foreground">Confiança da avaliação</p>
              </div>
              <Separator orientation="vertical" className="hidden h-16 sm:block lg:hidden" />
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </span>
                <p className="money text-lg font-semibold">{evaluation.estimatedDaysToSell} dias</p>
                <p className="text-xs text-muted-foreground">Tempo estimado de venda</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Condição / relatório da IA */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Relatório de condição
                <ConditionScoreBadge score={evaluation.conditionScore ?? 0} size="sm" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {conditionReport?.summary}
              </p>
              <p className="text-xs text-muted-foreground">Analisado por {conditionReport?.provider}</p>
              {evaluation.photos.some((p) => p.findings.length > 0) && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Apontamentos por foto
                  </p>
                  {evaluation.photos
                    .filter((p) => p.findings.length > 0)
                    .map((p) => (
                      <div key={p.id} className="flex items-start gap-2.5 rounded-md border p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div className="text-sm">
                          <p className="font-medium">
                            Foto {p.order + 1} — {p.findings[0].type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Local: {p.findings[0].location} · severidade{" "}
                            {Math.round(p.findings[0].severity * 100)}% · confiança{" "}
                            {Math.round(p.findings[0].confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Estatísticas de mercado */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Estatísticas de mercado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Mínimo", value: marketStats.min },
                  { label: "Médio", value: marketStats.avg },
                  { label: "Mediano", value: marketStats.median },
                  { label: "Máximo", value: marketStats.max },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-md border p-3.5">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="money mt-1 text-lg font-semibold">{formatBRL(stat.value)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Baseado em {marketStats.sampleSize} anúncios válidos ·{" "}
                {marketStats.excludedCount} excluídos pelos filtros de qualidade
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Breakdown da engine */}
      <FadeIn delay={0.12}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como chegamos a este preço</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceBreakdownTimeline steps={breakdown} />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Anúncios */}
      <FadeIn delay={0.16}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anúncios analisados</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="used">
              <TabsList>
                <TabsTrigger value="used">Usados na base ({usedListings.length})</TabsTrigger>
                <TabsTrigger value="excluded">Excluídos ({excludedListings.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="used" className="space-y-2.5">
                {usedListings.map((l) => (
                  <MarketListingCard key={l.id} listing={l} />
                ))}
              </TabsContent>
              <TabsContent value="excluded" className="space-y-2.5">
                {excludedListings.map((l) => (
                  <MarketListingCard key={l.id} listing={l} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
