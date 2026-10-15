"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

const DOTS = ["bg-indigo-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-violet-500"];

/** "Your teams" list in the sidebar, linking to each team's board. */
export function SidebarTeams({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: teams, isPending } = useTeams();

  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Your teams</p>
      {isPending ? (
        <div className="space-y-2 px-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      ) : teams && teams.length > 0 ? (
        teams.map((team, i) => {
          const href = `/teams/${team._id}`;
          const active = pathname === href;
          return (
            <Link
              key={team._id}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn("size-2 rounded-full", DOTS[i % DOTS.length])} />
              <span className="truncate">{team.name}</span>
            </Link>
          );
        })
      ) : (
        <p className="px-3 text-xs text-muted-foreground">No teams yet</p>
      )}
    </div>
  );
}
