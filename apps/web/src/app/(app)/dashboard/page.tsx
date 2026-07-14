"use client";

import { ClipboardCheck, PackageSearch, PiggyBank, Radar } from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EvaluationStatusBadge } from "@/components/evaluation-status-badge";
import { KpiCard, KpiCardSkeleton } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { PriceDisplay } from "@/components/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { alertTypeLabels } from "@/lib/labels";
import { formatBRL, formatRelative, formatShortDate } from "@/lib/format";
import { useAlerts, useDashboardActivity, useDashboardStats, useEvaluations } from "@/hooks/use-queries";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();
  const { data: evaluations, isLoading: evalLoading } = useEvaluations();
  const { data: alerts } = useAlerts();

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : "Dashboard"}
        description="Visão geral das suas avaliações e monitoramentos"
        actions={
          <Button asChild>
            <Link href="/evaluations/new">Nova avaliação</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="Avaliações realizadas" value={stats.evaluationsCount} icon={ClipboardCheck} />
            <KpiCard label="Produtos avaliados" value={stats.productsCount} icon={PackageSearch} />
            <KpiCard
              label="Economia gerada"
              value={stats.savingsTotal}
              icon={PiggyBank}
              format={(v) => formatBRL(v)}
              hint="Diferença entre preço máximo e venda rápida"
            />
            <KpiCard label="Produtos monitorados" value={stats.monitorsCount} icon={Radar} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividade — últimos 30 dias</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              {activityLoading || !activity ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={activity} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => formatShortDate(v)}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      labelFormatter={(v) => formatShortDate(v as string)}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                        background: "hsl(var(--popover))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="evaluations"
                      name="Avaliações"
                      stroke="hsl(221 83% 53%)"
                      strokeWidth={2}
                      fill="url(#activityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Alertas recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {!alerts ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState icon={Radar} title="Sem alertas recentes" />
              ) : (
                alerts.slice(0, 5).map((a) => (
                  <Link
                    key={a.id}
                    href="/monitors"
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.modelName}</p>
                      <p className="text-xs text-muted-foreground">{alertTypeLabels[a.type]}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="money text-sm font-semibold">{formatBRL(a.newPrice)}</p>
                      <p className="text-[11px] text-muted-foreground">{formatRelative(a.createdAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Últimas avaliações</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/evaluations">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {evalLoading || !evaluations ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nenhuma avaliação ainda"
              description="Comece avaliando seu primeiro produto e veja o preço justo em minutos."
              action={
                <Button asChild>
                  <Link href="/evaluations/new">Nova avaliação</Link>
                </Button>
              }
            />
          ) : (
            <Stagger className="divide-y">
              {evaluations.slice(0, 6).map((ev) => (
                <StaggerItem key={ev.id}>
                  <Link
                    href={`/evaluations/${ev.id}`}
                    className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {ev.brandName} {ev.modelName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ev.categoryName} · {formatRelative(ev.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <EvaluationStatusBadge status={ev.status} />
                      {ev.prices && (
                        <PriceDisplay value={ev.prices.recommended} size="sm" className="w-24 text-right" />
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
