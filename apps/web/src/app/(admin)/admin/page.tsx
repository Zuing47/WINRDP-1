"use client";

import { ClipboardCheck, DollarSign, Radar, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard, KpiCardSkeleton } from "@/components/kpi-card";
import { FadeIn } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRLCents, formatShortDate } from "@/lib/format";
import { useAdminStats } from "@/hooks/use-admin-queries";

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="space-y-8">
      <PageHeader title="Visão geral" description="Estatísticas da plataforma PriceAI" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Usuários totais"
              value={stats.usersTotal}
              icon={Users}
              hint={`+${stats.usersGrowth.toFixed(1)}% este mês`}
            />
            <KpiCard
              label="MRR"
              value={stats.mrrCents}
              icon={DollarSign}
              format={(v) => formatBRLCents(v)}
              hint={`+${stats.mrrGrowth.toFixed(1)}% este mês`}
            />
            <KpiCard
              label="Avaliações totais"
              value={stats.evaluationsTotal}
              icon={ClipboardCheck}
              hint={`+${stats.evaluationsGrowth.toFixed(1)}% este mês`}
            />
            <KpiCard label="Monitores ativos" value={stats.activeMonitors} icon={Radar} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Novos usuários — 30 dias</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              {!stats ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.signups} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => formatShortDate(v)}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      labelFormatter={(v) => formatShortDate(v as string)}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12, background: "hsl(var(--popover))" }}
                    />
                    <Bar dataKey="count" name="Cadastros" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receita — 30 dias</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              {!stats ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats.revenue} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => formatShortDate(v)}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      formatter={(v: number) => formatBRLCents(v)}
                      labelFormatter={(v) => formatShortDate(v as string)}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12, background: "hsl(var(--popover))" }}
                    />
                    <Line type="monotone" dataKey="cents" name="Receita" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
