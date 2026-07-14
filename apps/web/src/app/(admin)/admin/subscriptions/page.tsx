"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRLCents, formatDate } from "@/lib/format";
import { planNames, subscriptionStatusLabels } from "@/lib/labels";
import { useAdminSubscriptions } from "@/hooks/use-admin-queries";
import type { SubscriptionStatus } from "@/lib/types";

const statusVariant: Record<SubscriptionStatus, "success" | "warning" | "danger" | "info"> = {
  ACTIVE: "success",
  PAST_DUE: "warning",
  CANCELED: "danger",
  TRIALING: "info",
};

export default function AdminSubscriptionsPage() {
  const { data: subscriptions, isLoading } = useAdminSubscriptions();
  const activeCount = subscriptions?.filter((s) => s.status === "ACTIVE").length ?? 0;
  const mrr = subscriptions
    ?.filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + s.amountCents, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Assinaturas" description={`${activeCount} assinaturas ativas${mrr ? ` · MRR ${formatBRLCents(mrr)}` : ""}`} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Plano</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Período</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !subscriptions
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-6 py-4" colSpan={5}>
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  : subscriptions.map((s) => (
                      <tr key={s.id} className="border-b transition-colors last:border-0 hover:bg-accent/40">
                        <td className="px-6 py-3.5">
                          <p className="font-medium">{s.userName}</p>
                          <p className="text-xs text-muted-foreground">{s.userEmail}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="outline">{planNames[s.planSlug]}</Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={statusVariant[s.status]}>{subscriptionStatusLabels[s.status]}</Badge>
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                        </td>
                        <td className="money px-6 py-3.5 font-medium">{formatBRLCents(s.amountCents)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
