"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, LayoutDashboard, Settings, Users } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { SidebarTeams } from "@/components/layout/SidebarTeams";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Navigation used both as the desktop sidebar and inside the mobile sheet. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Workspace</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("size-[18px] transition-transform group-hover:scale-110", active && "text-primary")} />
                {label}
              </Link>
            );
          })}
        </div>
        <SidebarTeams onNavigate={onNavigate} />
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
      <SidebarNav />
    </aside>
  );
}
