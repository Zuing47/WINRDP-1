"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { FadeIn } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { usePlans, useUsage } from "@/hooks/use-queries";
import { formatBRLCents } from "@/lib/format";
import { planNames } from "@/lib/labels";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: plans } = usePlans();
  const { data: usage } = useUsage();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name ?? "");
  const [notifPrice, setNotifPrice] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifProduct, setNotifProduct] = useState(false);

  const currentPlan = plans?.find((p) => p.slug === user?.planSlug);
  const evalPct = currentPlan && usage
    ? Math.min(100, Math.round((usage.evaluationsUsed / currentPlan.limits.evaluationsPerMonth) * 100))
    : 0;
  const monitorPct = currentPlan && usage
    ? Math.min(100, Math.round((usage.monitorsUsed / currentPlan.limits.monitors) * 100))
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Configurações" description="Gerencie perfil, plano, aparência e notificações" />

      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
            <CardDescription>Suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-base">
                  {user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Alterar foto
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={user?.email ?? ""} disabled />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => toast.success("Perfil atualizado!")}
            >
              Salvar alterações
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plano atual</CardTitle>
            <CardDescription>Limites e uso do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{user ? planNames[user.planSlug] : "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan ? formatBRLCents(currentPlan.priceCents) : "R$ 0,00"}/mês
                </p>
              </div>
              <Button variant="outline" size="sm">
                Fazer upgrade
              </Button>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avaliações este mês</span>
                  <span className="money font-medium">
                    {usage?.evaluationsUsed ?? 0} / {currentPlan?.limits.evaluationsPerMonth ?? "—"}
                  </span>
                </div>
                <Progress value={evalPct} className="mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monitores ativos</span>
                  <span className="money font-medium">
                    {usage?.monitorsUsed ?? 0} / {currentPlan?.limits.monitors ?? "—"}
                  </span>
                </div>
                <Progress value={monitorPct} className="mt-2" />
              </div>
            </div>
            {currentPlan && (
              <ul className="grid gap-2 border-t pt-4 sm:grid-cols-2">
                {currentPlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aparência</CardTitle>
            <CardDescription>Escolha como o PriceAI aparece para você</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded-md border px-4 py-3 text-sm font-medium capitalize transition-colors hover:border-zinc-300 dark:hover:border-zinc-700",
                    theme === t && "border-primary ring-1 ring-primary"
                  )}
                >
                  {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Sistema"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificações</CardTitle>
            <CardDescription>Escolha o que você quer receber</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "Alertas de preço",
                description: "Quedas, altas e oportunidades dos seus monitores",
                checked: notifPrice,
                onChange: setNotifPrice,
              },
              {
                label: "Resumo semanal",
                description: "Um e-mail toda semana com sua atividade",
                checked: notifWeekly,
                onChange: setNotifWeekly,
              },
              {
                label: "Novidades de produto",
                description: "Lançamentos e melhorias do PriceAI",
                checked: notifProduct,
                onChange: setNotifProduct,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch checked={item.checked} onCheckedChange={item.onChange} />
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
