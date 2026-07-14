"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Database, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { connectorStatusLabels } from "@/lib/labels";
import { api } from "@/lib/api";
import { useSystemStatus } from "@/hooks/use-admin-queries";
import type { ConnectorStatus } from "@/lib/types";

const statusVariant: Record<ConnectorStatus, "success" | "warning" | "danger"> = {
  OPERATIONAL: "success",
  DEGRADED: "warning",
  DOWN: "danger",
};

export default function AdminSystemPage() {
  const { data: status, isLoading } = useSystemStatus();
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  async function handleClearCache() {
    setClearing(true);
    try {
      await api.clearCache();
      queryClient.invalidateQueries({ queryKey: ["admin", "system"] });
      toast.success("Cache limpo com sucesso!");
    } finally {
      setClearing(false);
    }
  }

  const marketplaces = status?.connectors.filter((c) => c.kind === "marketplace") ?? [];
  const aiProviders = status?.connectors.filter((c) => c.kind === "ai") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sistema"
        description="Status dos conectores de marketplace, provedores de IA e infraestrutura"
        actions={
          <Button variant="outline" onClick={handleClearCache} disabled={clearing}>
            <RefreshCcw className="h-4 w-4" />
            {clearing ? "Limpando…" : "Limpar cache"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conectores de marketplace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading || !status
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : marketplaces.map((c) => <ConnectorRow key={c.name} connector={c} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provedores de IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading || !status
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : aiProviders.map((c) => <ConnectorRow key={c.name} connector={c} />)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" /> Cache Redis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !status ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="money text-xl font-semibold">{status.cache.keys.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">Chaves</p>
                </div>
                <div>
                  <p className="money text-xl font-semibold">{status.cache.hitRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Hit rate</p>
                </div>
                <div>
                  <p className="money text-xl font-semibold">{status.cache.sizeMb} MB</p>
                  <p className="text-xs text-muted-foreground">Tamanho</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filas (BullMQ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading || !status
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              : status.queues.map((q) => (
                  <div key={q.name} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{q.name}</span>
                    <span className="text-muted-foreground">
                      {q.waiting} na fila · {q.active} ativos ·{" "}
                      <span className={q.failed > 0 ? "text-red-600 dark:text-red-400" : ""}>
                        {q.failed} falhas
                      </span>
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConnectorRow({
  connector,
}: {
  connector: { name: string; status: ConnectorStatus; latencyMs: number; successRate: number };
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-4 py-2.5">
      <div>
        <p className="text-sm font-medium">{connector.name}</p>
        <p className="text-xs text-muted-foreground">
          {connector.latencyMs} ms · {connector.successRate.toFixed(1)}% sucesso
        </p>
      </div>
      <Badge variant={statusVariant[connector.status]}>{connectorStatusLabels[connector.status]}</Badge>
    </div>
  );
}
