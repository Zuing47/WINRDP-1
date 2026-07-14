"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, MoreVertical, Pause, Play, Plus, Radar, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { PriceDisplay } from "@/components/price-display";
import { Sparkline } from "@/components/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { alertTypeLabels, conditionLabels } from "@/lib/labels";
import { formatBRL, formatRelative } from "@/lib/format";
import { api } from "@/lib/api";
import { useAlerts, useBrands, useCategories, useModels, useMonitors } from "@/hooks/use-queries";
import type { AlertType, Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

const alertVariants: Record<AlertType, "success" | "danger" | "info" | "warning"> = {
  PRICE_DROP: "success",
  PRICE_RISE: "danger",
  OPPORTUNITY: "info",
  BIG_DISCOUNT: "warning",
};

export default function MonitorsPage() {
  const queryClient = useQueryClient();
  const { data: monitors, isLoading } = useMonitors();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function toggleActive(id: string, active: boolean) {
    await api.updateMonitor(id, { active: !active });
    queryClient.invalidateQueries({ queryKey: ["monitors"] });
    toast.success(active ? "Monitor pausado" : "Monitor reativado");
  }

  async function remove(id: string) {
    await api.deleteMonitor(id);
    queryClient.invalidateQueries({ queryKey: ["monitors"] });
    toast.success("Monitor removido");
  }

  async function markAlertRead(id: string) {
    await api.markAlertRead(id);
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  }

  async function markAllRead() {
    await api.markAllAlertsRead();
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    toast.success("Alertas marcados como lidos");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitores"
        description="Acompanhe produtos e receba alertas de preço"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Novo monitor
              </Button>
            </DialogTrigger>
            <CreateMonitorDialog onCreated={() => setDialogOpen(false)} />
          </Dialog>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isLoading || !monitors ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : monitors.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="Nenhum monitor criado"
              description="Crie um monitor para acompanhar a variação de preço de um produto."
            />
          ) : (
            <Stagger className="grid gap-4 sm:grid-cols-2">
              {monitors.map((m) => (
                <StaggerItem key={m.id}>
                  <Card className={cn(!m.active && "opacity-60")}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.brandName} {m.modelName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conditionLabels[m.condition as Condition]} · alvo {formatBRL(m.targetPrice)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => toggleActive(m.id, m.active)}>
                              {m.active ? (
                                <>
                                  <Pause className="h-4 w-4" /> Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" /> Reativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => remove(m.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Último preço</p>
                          <PriceDisplay value={m.lastPrice} size="md" className="mt-0.5" />
                        </div>
                        <Sparkline data={m.sparkline} />
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-3">
                        <Badge variant={m.active ? "success" : "muted"}>
                          {m.active ? "Ativo" : "Pausado"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Verificado {formatRelative(m.lastCheckedAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>

        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Feed de alertas</CardTitle>
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Marcar tudo como lido
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {alertsLoading || !alerts ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState icon={Bell} title="Sem alertas" />
              ) : (
                alerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => !a.read && markAlertRead(a.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent",
                      !a.read && "bg-primary/5"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={alertVariants[a.type]}>{alertTypeLabels[a.type]}</Badge>
                        {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{a.modelName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(a.oldPrice)} → {formatBRL(a.newPrice)} · {formatRelative(a.createdAt)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

function CreateMonitorDialog({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [categoryId, setCategoryId] = useState<string>("");
  const { data: brands } = useBrands(categoryId);
  const [brandId, setBrandId] = useState<string>("");
  const { data: models } = useModels(brandId);
  const [modelId, setModelId] = useState<string>("");
  const [condition, setCondition] = useState<Condition>("GOOD");
  const [targetPrice, setTargetPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!modelId || !targetPrice) return;
    setSaving(true);
    try {
      await api.createMonitor({
        modelId,
        condition,
        targetPrice: Number(targetPrice),
        notifyOn: { rise: false, drop: true, opportunity: true, bigDiscount: true },
      });
      queryClient.invalidateQueries({ queryKey: ["monitors"] });
      toast.success("Monitor criado!");
      onCreated();
    } catch {
      toast.error("Não foi possível criar o monitor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo monitor de preço</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setBrandId("");
              setModelId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Marca</Label>
          <Select
            value={brandId}
            onValueChange={(v) => {
              setBrandId(v);
              setModelId("");
            }}
          >
            <SelectTrigger disabled={!categoryId}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {brands?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Modelo</Label>
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger disabled={!brandId}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {models?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Condição</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(conditionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Preço alvo (R$)</Label>
            <Input
              type="number"
              placeholder="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate} disabled={!modelId || !targetPrice || saving}>
          {saving ? "Criando…" : "Criar monitor"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
