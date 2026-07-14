"use client";

import { Bell, LogOut, Search, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { alertTypeLabels } from "@/lib/labels";
import { formatRelative } from "@/lib/format";
import { useAlerts, useNotifications } from "@/hooks/use-queries";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const { user, logout } = useAuth();
  const { data: alerts } = useAlerts();
  const { data: notifications } = useNotifications();
  const queryClient = useQueryClient();
  const router = useRouter();

  const unreadAlerts = alerts?.filter((a) => !a.read).length ?? 0;
  const unreadNotifications = notifications?.filter((n) => !n.readAt).length ?? 0;
  const unread = unreadAlerts + unreadNotifications;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar avaliações, modelos…" className="pl-8" />
      </div>
      <div className="flex flex-1 items-center justify-end gap-1.5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações
              {unread > 0 && <Badge variant="info">{unread} novas</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {alerts?.slice(0, 3).map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  className="flex-col items-start gap-0.5"
                  onSelect={async () => {
                    await api.markAlertRead(a.id);
                    queryClient.invalidateQueries({ queryKey: ["alerts"] });
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">{alertTypeLabels[a.type]}</span>
                    {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.modelName} · {formatRelative(a.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))}
              {notifications?.slice(0, 3).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex-col items-start gap-0.5"
                  onSelect={async () => {
                    await api.markNotificationRead(n.id);
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/monitors" className="justify-center text-sm text-primary">
                Ver todos os alertas
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <UserIcon className="h-4 w-4" /> Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" /> Configurações
              </Link>
            </DropdownMenuItem>
            {user?.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">Painel admin</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
                toast.success("Sessão encerrada");
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
