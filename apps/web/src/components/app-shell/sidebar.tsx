"use client";

import {
  BarChart3,
  Bell as BellIcon,
  LayoutDashboard,
  PlusCircle,
  Radar,
  Settings,
  History,
  ChevronsLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo, LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluations/new", label: "Nova avaliação", icon: PlusCircle },
  { href: "/evaluations", label: "Histórico", icon: History },
  { href: "/monitors", label: "Monitores", icon: Radar },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {collapsed ? <LogoMark /> : <Logo />}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full justify-start gap-3 text-muted-foreground", collapsed && "justify-center px-0")}
          onClick={() => setCollapsed((c) => !c)}
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Recolher"}
        </Button>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const mobileItems = [
    { href: "/dashboard", label: "Início", icon: LayoutDashboard },
    { href: "/evaluations", label: "Histórico", icon: History },
    { href: "/evaluations/new", label: "Nova", icon: PlusCircle },
    { href: "/monitors", label: "Monitores", icon: Radar },
    { href: "/settings", label: "Ajustes", icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 backdrop-blur md:hidden">
      {mobileItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
              active && "text-primary"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { BarChart3, BellIcon };
