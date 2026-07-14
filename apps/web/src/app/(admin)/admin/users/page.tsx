"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { planNames } from "@/lib/labels";
import { api } from "@/lib/api";
import { useAdminUsers } from "@/hooks/use-admin-queries";
import type { UserStatus } from "@/lib/types";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(search || undefined);
  const queryClient = useQueryClient();

  async function toggleStatus(id: string, status: UserStatus) {
    const next: UserStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await api.updateAdminUser(id, { status: next });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    toast.success(next === "ACTIVE" ? "Usuário reativado" : "Usuário suspenso");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" description={`${users?.length ?? 0} usuários cadastrados`} />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Usuário</th>
                  <th className="px-6 py-3 font-medium">Plano</th>
                  <th className="px-6 py-3 font-medium">Papel</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Avaliações</th>
                  <th className="px-6 py-3 font-medium">Desde</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {isLoading || !users
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-6 py-4" colSpan={7}>
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  : users.map((u) => (
                      <tr key={u.id} className="border-b transition-colors last:border-0 hover:bg-accent/40">
                        <td className="px-6 py-3.5">
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="outline">{planNames[u.planSlug]}</Badge>
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {u.role === "ADMIN" ? "Admin" : "Usuário"}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>
                            {u.status === "ACTIVE" ? "Ativo" : "Suspenso"}
                          </Badge>
                        </td>
                        <td className="money px-6 py-3.5">{u.evaluationsCount}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <Select
                            value=""
                            onValueChange={(v) => v === "toggle" && toggleStatus(u.id, u.status)}
                          >
                            <SelectTrigger className="h-8 w-8 justify-center border-none p-0 shadow-none [&>svg]:hidden">
                              <SelectValue placeholder="⋯" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="toggle">
                                {u.status === "ACTIVE" ? "Suspender" : "Reativar"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
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
