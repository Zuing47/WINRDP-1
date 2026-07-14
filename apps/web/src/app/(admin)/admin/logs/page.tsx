"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { useAdminLogs } from "@/hooks/use-admin-queries";
import { cn } from "@/lib/utils";

export default function AdminLogsPage() {
  const { data: logs, isLoading } = useAdminLogs();

  return (
    <div className="space-y-6">
      <PageHeader title="Logs de API" description="Requisições recentes registradas em api_usage_logs" />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Usuário</th>
                  <th className="px-6 py-3 font-medium">Método</th>
                  <th className="px-6 py-3 font-medium">Rota</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Latência</th>
                  <th className="px-6 py-3 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !logs
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-6 py-4" colSpan={6}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  : logs.map((log) => (
                      <tr key={log.id} className="border-b font-mono text-xs last:border-0 hover:bg-accent/40">
                        <td className="px-6 py-3 font-sans text-sm text-muted-foreground">{log.userEmail}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className="font-mono">
                            {log.method}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">{log.route}</td>
                        <td className="px-6 py-3">
                          <span
                            className={cn(
                              "font-sans font-medium",
                              log.status >= 500
                                ? "text-red-600 dark:text-red-400"
                                : log.status >= 400
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">{log.latencyMs} ms</td>
                        <td className="px-6 py-3 font-sans text-muted-foreground">{formatRelative(log.createdAt)}</td>
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
