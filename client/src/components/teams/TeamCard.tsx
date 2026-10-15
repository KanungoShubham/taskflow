import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ProgressBar } from "@/components/teams/ProgressBar";
import type { Team } from "@/lib/types";

export function TeamCard({ team, meId }: { team: Team; meId?: string }) {
  const { total, done } = team.taskCounts ?? { total: 0, done: 0 };
  const pct = total ? (done / total) * 100 : 0;
  const isOwner = team.owner._id === meId;
  const shown = team.members.slice(0, 5);

  return (
    <Link
      href={`/teams/${team._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-lg font-bold text-white shadow-md shadow-primary/25">
          {team.name[0]?.toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <Crown className="size-3" /> Owner
            </span>
          )}
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
      </div>

      <h3 className="mt-4 truncate text-base font-semibold">{team.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{team.description || "No description"}</p>

      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {done} of {total} tasks done
          </span>
          <span className="font-semibold">{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={pct} size="sm" />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex -space-x-2">
          {shown.map((m) => (
            <UserAvatar key={m._id} name={m.name} size="sm" />
          ))}
          {team.members.length > shown.length && (
            <span className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background">
              +{team.members.length - shown.length}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {team.members.length} member{team.members.length === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
