"use client";

import { ClipboardList, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/empty-state";
import { EvaluationStatusBadge } from "@/components/evaluation-status-badge";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { PriceDisplay } from "@/components/price-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatDate } from "@/lib/format";
import { statusLabels } from "@/lib/labels";
import { useCategories, useEvaluations } from "@/hooks/use-queries";
import type { EvaluationFilters, EvaluationStatus } from "@/lib/types";

const periods: { value: NonNullable<EvaluationFilters["period"]>; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "all", label: "Todo período" },
];

export default function EvaluationsHistoryPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [period, setPeriod] = useState<NonNullable<EvaluationFilters["period"]>>("all");

  const { data: categories } = useCategories();
  const { data: evaluations, isLoading } = useEvaluations({
    search: search || undefined,
    categoryId: categoryId === "all" ? undefined : categoryId,
    status: status === "all" ? undefined : (status as EvaluationStatus),
    period,
  });

  const comparisonSeries = useMemo(() => {
    if (!evaluations) return [];
    const groups = new Map<string, { date: string; price: number }[]>();
    for (const ev of evaluations) {
      if (!ev.prices) continue;
      const list = groups.get(ev.modelName) ?? [];
      list.push({ date: ev.createdAt, price: ev.prices.recommended });
      groups.set(ev.modelName, list);
    }
    return Array.from(groups.entries())
      .filter(([, points]) => points.length > 1)
      .map(([name, points]) => ({
        name,
        points: points.sort((a, b) => a.date.localeCompare(b.date)),
      }));
  }, [evaluations]);

  const chartData = useMemo(() => {
    if (comparisonSeries.length === 0) return [];
    const dates = Array.from(
      new Set(comparisonSeries.flatMap((s) => s.points.map((p) => p.date)))
    ).sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (const s of comparisonSeries) {
        const point = s.points.find((p) => p.date === date);
        if (point) row[s.name] = point.price;
      }
      return row;
    });
  }, [comparisonSeries]);

  return (
    <div className="space-y-6">
      <PageHeader title="Histórico de avaliações" description="Todas as suas avaliações, com filtros e comparações" />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca ou modelo…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução de preço — modelos avaliados mais de uma vez</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v)}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(v: number) => formatBRL(v)}
                    labelFormatter={(v) => formatDate(v as string)}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                      background: "hsl(var(--popover))",
                    }}
                  />
                  {comparisonSeries.map((s, i) => (
                    <Line
                      key={s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={i % 2 === 0 ? "hsl(221 83% 53%)" : "hsl(24 90% 55%)"}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading || !evaluations ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ClipboardList} title="Nenhuma avaliação encontrada" description="Tente ajustar os filtros." />
            </div>
          ) : (
            <Stagger className="divide-y">
              {evaluations.map((ev) => (
                <StaggerItem key={ev.id}>
                  <Link
                    href={`/evaluations/${ev.id}`}
                    className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {ev.brandName} {ev.modelName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ev.categoryName} · {formatDate(ev.createdAt)} · {ev.location.city}/{ev.location.state}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <EvaluationStatusBadge status={ev.status} />
                      {ev.prices && <PriceDisplay value={ev.prices.recommended} size="sm" className="w-24 text-right" />}
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
