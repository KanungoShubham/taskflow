"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, CheckCheck, CircleCheckBig, UserPlus, ClipboardList } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkAllRead, useMarkRead, useNotifications } from "@/hooks/useNotifications";
import { getPermission, playChime, requestPermission, unlockAudio, type AlertPermission } from "@/lib/alerts";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  task_assigned: { icon: ClipboardList, className: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300" },
  team_added: { icon: UserPlus, className: "bg-pink-500/15 text-pink-600 dark:text-pink-300" },
  task_completed: { icon: CircleCheckBig, className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<AlertPermission>(getPermission);
  const { data, isPending } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const unread = data?.unreadCount ?? 0;

  const enableAlerts = async () => {
    unlockAudio();
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") playChime(true);
  };

  const openNotification = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    router.push(n.team ? `/teams/${n.team}` : "/tasks");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
      >
        <Bell className={cn("size-[18px]", unread > 0 && "animate-[wiggle_1s_ease-in-out]")} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread ? `${unread} unread` : "You're all caught up"}</p>
          </div>
          <Button variant="ghost" size="sm" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck /> Mark all read
          </Button>
        </div>

        {permission === "default" && (
          <div className="flex items-center justify-between gap-2 border-b bg-primary/[0.05] px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Get a sound + pop-up for new notifications</p>
            <Button size="xs" onClick={enableAlerts}>
              Enable
            </Button>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {isPending ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="grid size-11 place-items-center rounded-full bg-muted">
                <BellOff className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground">You&apos;ll hear about assignments and team updates here.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {data.items.map((n) => {
                const { icon: Icon, className } = ICONS[n.type];
                return (
                  <li key={n._id}>
                    <button
                      onClick={() => openNotification(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read && "bg-primary/[0.04]"
                      )}
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", className)}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[13px] leading-snug", !n.read ? "font-medium" : "text-muted-foreground")}>
                          {n.message}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </span>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
